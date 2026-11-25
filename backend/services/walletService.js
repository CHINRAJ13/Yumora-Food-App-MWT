import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import RestaurantOwner from '../models/RestaurantOwner.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import PayoutRequest from '../models/PayoutRequest.js';
import AppError from '../utils/AppError.js';

/**
 * Get or create wallet for a user (restaurant owner or delivery partner)
 */
export const getOrCreateWallet = async (userId, userType) => {
  let wallet = await Wallet.findOne({ userId, userType });
  if (wallet) return wallet;

  let bankDetails = {};
  let restaurantId = null;

  if (userType === 'delivery') {
    const partner = await DeliveryPartner.findById(userId);
    if (partner) {
      bankDetails = {
        accountNumber: partner.accountNumber || '',
        ifscCode: partner.ifscCode || '',
        accountHolderName: partner.name || '',
        bankName: ''
      };
    }
  } else if (userType === 'restaurant') {
    const owner = await RestaurantOwner.findById(userId);
    const restaurant = await Restaurant.findOne({ ownerId: userId });
    if (restaurant) {
      restaurantId = restaurant.id;
    }
    if (owner) {
      bankDetails = {
        accountNumber: '',
        ifscCode: '',
        accountHolderName: owner.name || '',
        bankName: ''
      };
    }
  }

  wallet = await Wallet.create({
    userId,
    userType,
    userModel: userType === 'restaurant' ? 'RestaurantOwner' : 'DeliveryPartner',
    restaurantId,
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    bankDetails
  });

  return wallet;
};

/**
 * Perform automatic split settlement when an order is completed/delivered
 */
export const settleOrderSplits = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found for settlement', 404);
  }

  // Ensure only delivered & unsettled orders are settled once
  if (order.status !== 'Delivered') {
    return order;
  }
  if (order.settlement?.isSettled) {
    return order;
  }

  // Calculate settlement amounts if not already set
  const foodSubtotal = order.pricing?.foodSubtotal || (order.items || []).reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const packagingFee = order.pricing?.packagingFee !== undefined ? order.pricing.packagingFee : 20;
  const deliveryFee = order.pricing?.deliveryFee !== undefined ? order.pricing.deliveryFee : 30;
  const baseDeliveryFee = order.pricing?.baseDeliveryFee || (deliveryFee > 0 ? deliveryFee : 30);
  const commissionRate = order.settlement?.commissionRate || 10;
  const platformCommission = Math.round((foodSubtotal * commissionRate) / 100);
  const restaurantAmount = foodSubtotal + packagingFee - platformCommission;
  const deliveryPartnerAmount = (order.settlement?.deliveryPartnerAmount && order.settlement.deliveryPartnerAmount > 0)
    ? order.settlement.deliveryPartnerAmount
    : baseDeliveryFee;
  const platformFee = order.pricing?.platformFee !== undefined ? order.pricing.platformFee : 5;
  const platformProfit = platformFee + platformCommission;

  // 1. Settle Restaurant Wallet
  if (order.restaurantId) {
    const restaurant = await Restaurant.findOne({ id: order.restaurantId });
    if (restaurant && restaurant.ownerId) {
      const restWallet = await getOrCreateWallet(restaurant.ownerId, 'restaurant');
      const newRestBal = restWallet.balance + restaurantAmount;

      restWallet.balance = newRestBal;
      restWallet.totalEarned += restaurantAmount;
      await restWallet.save();

      await WalletTransaction.create({
        walletId: restWallet._id,
        userId: restaurant.ownerId,
        userType: 'restaurant',
        orderId: order._id,
        amount: restaurantAmount,
        type: 'credit',
        category: 'order_earning',
        description: `Earnings for Order #${order._id.toString().substring(order._id.toString().length - 6).toUpperCase()} (Subtotal: ₹${foodSubtotal} + Packing: ₹${packagingFee} - 10% Comm: ₹${platformCommission})`,
        balanceAfter: newRestBal
      });
    }
  }

  // 2. Settle Delivery Partner Wallet
  if (order.deliveryPersonId) {
    const riderWallet = await getOrCreateWallet(order.deliveryPersonId, 'delivery');
    const newRiderBal = riderWallet.balance + deliveryPartnerAmount;

    riderWallet.balance = newRiderBal;
    riderWallet.totalEarned += deliveryPartnerAmount;
    await riderWallet.save();

    await WalletTransaction.create({
      walletId: riderWallet._id,
      userId: order.deliveryPersonId,
      userType: 'delivery',
      orderId: order._id,
      amount: deliveryPartnerAmount,
      type: 'credit',
      category: 'order_earning',
      description: `Delivery payout for Order #${order._id.toString().substring(order._id.toString().length - 6).toUpperCase()}`,
      balanceAfter: newRiderBal
    });
  }

  // 3. Mark order as settled
  order.settlement = {
    commissionRate,
    platformCommission,
    restaurantAmount,
    deliveryPartnerAmount,
    platformProfit,
    isSettled: true,
    settledAt: new Date()
  };

  await order.save();
  return order;
};

/**
 * Request payout from wallet balance
 */
export const requestPayoutService = async (userId, userType, amount, bankDetails) => {
  const wallet = await getOrCreateWallet(userId, userType);

  if (amount <= 0) {
    throw new AppError('Amount must be greater than zero', 400);
  }
  if (wallet.balance < amount) {
    throw new AppError(`Insufficient balance. Current balance is ₹${wallet.balance}`, 400);
  }

  // Find user name for reporting
  let userName = 'Partner';
  if (userType === 'delivery') {
    const partner = await DeliveryPartner.findById(userId);
    if (partner) userName = partner.name;
  } else if (userType === 'restaurant') {
    const owner = await RestaurantOwner.findById(userId);
    if (owner) userName = owner.name;
  }

  // Use provided bankDetails or fallback to wallet saved bankDetails
  const finalBankDetails = {
    accountNumber: bankDetails?.accountNumber || wallet.bankDetails?.accountNumber || '',
    ifscCode: bankDetails?.ifscCode || wallet.bankDetails?.ifscCode || '',
    accountHolderName: bankDetails?.accountHolderName || wallet.bankDetails?.accountHolderName || userName,
    bankName: bankDetails?.bankName || wallet.bankDetails?.bankName || ''
  };

  if (!finalBankDetails.accountNumber || !finalBankDetails.ifscCode) {
    throw new AppError('Bank account number and IFSC code are required for payout', 400);
  }

  // Update saved bank details if changed
  wallet.bankDetails = finalBankDetails;
  // Deduct from wallet balance immediately (locked in pending payout)
  wallet.balance -= amount;
  wallet.totalWithdrawn += amount;
  await wallet.save();

  // Create Payout Request
  const payout = await PayoutRequest.create({
    walletId: wallet._id,
    userId,
    userType,
    userName,
    amount,
    bankDetails: finalBankDetails,
    status: 'pending'
  });

  // Record Debit Transaction
  await WalletTransaction.create({
    walletId: wallet._id,
    userId,
    userType,
    amount,
    type: 'debit',
    category: 'withdrawal',
    description: `Payout withdrawal request #${payout._id.toString().substring(payout._id.toString().length - 6).toUpperCase()} to A/C ending in ${finalBankDetails.accountNumber.slice(-4)}`,
    balanceAfter: wallet.balance
  });

  return payout;
};

/**
 * Admin processes payout request (Approve or Reject)
 */
export const processPayoutService = async (payoutId, status, adminComment, transactionReference) => {
  const payout = await PayoutRequest.findById(payoutId);
  if (!payout) {
    throw new AppError('Payout request not found', 404);
  }

  if (payout.status !== 'pending') {
    throw new AppError(`Payout request is already ${payout.status}`, 400);
  }

  payout.status = status;
  payout.adminComment = adminComment || null;
  payout.transactionReference = transactionReference || null;
  payout.processedAt = new Date();

  // If rejected, refund the amount back to user's wallet
  if (status === 'rejected') {
    const wallet = await Wallet.findById(payout.walletId);
    if (wallet) {
      wallet.balance += payout.amount;
      wallet.totalWithdrawn = Math.max(0, wallet.totalWithdrawn - payout.amount);
      await wallet.save();

      await WalletTransaction.create({
        walletId: wallet._id,
        userId: payout.userId,
        userType: payout.userType,
        amount: payout.amount,
        type: 'credit',
        category: 'adjustment',
        description: `Refund for rejected payout #${payout._id.toString().substring(payout._id.toString().length - 6).toUpperCase()}: ${adminComment || 'Administrative reversal'}`,
        balanceAfter: wallet.balance
      });
    }
  }

  await payout.save();
  return payout;
};
