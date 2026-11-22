import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../src/store/useCartStore';
import { useAuthStore } from '../src/store/useAuthStore';
import {
  createOrderApi,
  createRazorpayOrderApi,
  verifyRazorpayPaymentApi,
} from '../src/api';
import { getCurrentAddressFromGPS } from '../src/services/locationService';
import { RazorpayCheckoutModal } from '../src/components/RazorpayCheckoutModal';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, restaurantId, restaurantName, clearCart, getTotalPrice } = useCartStore();
  const { user } = useAuthStore();

  const [address, setAddress] = useState(user?.address || '123, Avinashi Road, Peelamedu, Coimbatore');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [phone, setPhone] = useState(user?.phone || '9876543210');
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Razorpay Checkout Modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState<{
    orderId: string;
    keyId: string;
    amount: number;
  } | null>(null);

  const handleFetchLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await getCurrentAddressFromGPS();
      setAddress(loc.address);
      setCoords({ lat: loc.latitude, lng: loc.longitude });
      Alert.alert('📍 Location Detected', `Address auto-filled:\n${loc.address}`);
    } catch (err: any) {
      Alert.alert(
        'Location Access',
        err.message || 'Unable to fetch current GPS location. Please check location permissions.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  const foodSubtotal = getTotalPrice();
  const packagingFee = items.length > 0 ? 20 : 0;
  const deliveryFee = foodSubtotal > 199 || items.length === 0 ? 0 : 30;
  const platformFee = items.length > 0 ? 5 : 0;
  const tax = Math.round((foodSubtotal + packagingFee) * 0.05);
  const totalAmount = foodSubtotal + packagingFee + deliveryFee + platformFee + tax;

  // Step 1: Initiate Razorpay payment by creating server order
  const handleInitiatePayment = async () => {
    if (!address.trim()) {
      Alert.alert('Delivery Address Required', 'Please enter your delivery address');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Contact Phone Required', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const res: any = await createRazorpayOrderApi(totalAmount);
      if (res?.data?.id && res?.data?.keyId) {
        setRazorpayOrderData({
          orderId: res.data.id,
          keyId: res.data.keyId,
          amount: totalAmount,
        });
        setPaymentModalVisible(true);
      } else {
        throw new Error('Failed to initialize payment gateway session');
      }
    } catch (err: any) {
      Alert.alert(
        'Payment Initialization Failed',
        err?.message || 'Could not connect to payment gateway. Please check your network and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle successful payment from Razorpay modal
  const handlePaymentSuccess = async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    setPaymentModalVisible(false);
    setLoading(true);

    try {
      // Step 2a: Verify HMAC-SHA256 signature on backend
      await verifyRazorpayPaymentApi(paymentData);

      // Step 2b: Create order in database with verified paymentId
      const orderPayload = {
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          restaurantId: i.restaurantId,
          restaurantName: i.restaurantName,
          isVeg: i.isVeg,
          image: i.image,
        })),
        restaurantId,
        restaurantName,
        address,
        phone,
        location: coords || { lat: 11.0168, lng: 76.9558 },
        paymentMethod: 'online',
        paymentStatus: 'Success',
        paymentId: paymentData.razorpay_payment_id,
        totalAmount,
        pricing: {
          foodSubtotal,
          packagingFee,
          deliveryFee,
          platformFee,
          tax,
          discount: 0,
          totalAmount,
        },
      };

      const res: any = await createOrderApi(orderPayload);
      if (res?.data) {
        clearCart();
        Alert.alert(
          '🎉 Payment & Order Confirmed!',
          `Payment ID: ${paymentData.razorpay_payment_id}\nYour food is now being prepared!`,
          [
            {
              text: 'Track Live Order',
              onPress: () => router.replace(`/tracking/${res.data._id || res.data.id}`),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Order Creation Error',
        err?.message || 'Payment was processed but order creation encountered an issue. Please contact support.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Handle payment dismissal / cancellation
  const handlePaymentDismiss = () => {
    setPaymentModalVisible(false);
    Alert.alert('Payment Cancelled', 'You have not been charged. Your basket is still saved.');
  };

  // Step 4: Handle payment failure
  const handlePaymentError = (errorMsg: string) => {
    setPaymentModalVisible(false);
    Alert.alert('Payment Failed', errorMsg || 'Payment could not be completed. Please try again.');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Header */}
      <View className="px-5 py-3.5 bg-white border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-black text-gray-900">Checkout & Payment</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4 bg-white">
        {/* Delivery Address Card */}
        <View className="bg-white rounded-3xl p-4 mb-4 border border-gray-100 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name="location-sharp" size={16} color="#ea580c" />
              <Text className="text-xs font-black uppercase text-gray-400">Delivery Address</Text>
            </View>
            <TouchableOpacity
              disabled={isLocating}
              onPress={handleFetchLocation}
              activeOpacity={0.7}
              className="flex-row items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200"
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#ea580c" />
              ) : (
                <Ionicons name="navigate-circle-outline" size={13} color="#ea580c" />
              )}
              <Text className="text-[10px] font-black text-primary">
                {isLocating ? 'Locating...' : 'Use Current GPS'}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            multiline
            numberOfLines={2}
            value={address}
            onChangeText={setAddress}
            className="bg-gray-50 p-3 rounded-2xl text-xs font-semibold text-gray-800 border border-gray-100"
          />

          <View className="mt-3">
            <Text className="text-xs font-bold text-gray-400 mb-1">Contact Phone</Text>
            <TextInput
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              className="bg-gray-50 p-3 rounded-2xl text-xs font-semibold text-gray-800 border border-gray-100"
            />
          </View>
        </View>

        {/* Payment Method Badge */}
        <View className="bg-white rounded-3xl p-4 mb-4 border border-gray-100 shadow-sm">
          <Text className="text-xs font-black uppercase text-gray-400 mb-3">Payment Mode</Text>
          <View className="bg-orange-50/70 border border-orange-200 p-3.5 rounded-2xl flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-orange-100 items-center justify-center">
                <Ionicons name="card" size={20} color="#ea580c" />
              </View>
              <View>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-sm font-black text-gray-900">Razorpay Gateway</Text>
                  <View className="bg-emerald-100 px-1.5 py-0.5 rounded-md">
                    <Text className="text-[9px] font-black text-emerald-800 uppercase">Verified</Text>
                  </View>
                </View>
                <Text className="text-[11px] text-gray-500 font-semibold mt-0.5">
                  UPI (GPay, PhonePe, Paytm), Cards, NetBanking
                </Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={20} color="#ea580c" />
          </View>

          <View className="flex-row items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-100">
            <Ionicons name="shield-checkmark-outline" size={14} color="#059669" />
            <Text className="text-[10px] font-bold text-gray-400">
              Secured with 256-Bit SSL encryption by Razorpay
            </Text>
          </View>
        </View>

        {/* Bill Summary Preview */}
        <View className="bg-white rounded-3xl p-4 mb-28 border border-gray-100 shadow-sm">
          <Text className="text-xs font-black uppercase text-gray-400 mb-2.5">Bill Summary</Text>
          <View className="flex-row justify-between py-1">
            <Text className="text-xs font-semibold text-gray-500">Item Subtotal</Text>
            <Text className="text-xs font-bold text-gray-800">₹{foodSubtotal}</Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-xs font-semibold text-gray-500">Packaging Fee</Text>
            <Text className="text-xs font-bold text-gray-800">₹{packagingFee}</Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-xs font-semibold text-gray-500">Delivery Fee</Text>
            <Text className="text-xs font-bold text-gray-800">
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-xs font-semibold text-gray-500">Platform Fee</Text>
            <Text className="text-xs font-bold text-gray-800">₹{platformFee}</Text>
          </View>
          <View className="flex-row justify-between py-1 border-b border-gray-100 pb-2">
            <Text className="text-xs font-semibold text-gray-500">Taxes & GST (5%)</Text>
            <Text className="text-xs font-bold text-gray-800">₹{tax}</Text>
          </View>
          <View className="flex-row justify-between pt-2.5">
            <Text className="text-sm font-black text-gray-900">Grand Total</Text>
            <Text className="text-base font-black text-primary">₹{totalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100">
        <TouchableOpacity
          disabled={loading}
          activeOpacity={0.9}
          onPress={handleInitiatePayment}
          className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2 shadow-lg"
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={17} color="#ffffff" />
              <Text className="text-white text-base font-black">
                Pay with Razorpay (₹{totalAmount})
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Razorpay In-App Standard Checkout Modal */}
      {razorpayOrderData && (
        <RazorpayCheckoutModal
          visible={paymentModalVisible}
          orderId={razorpayOrderData.orderId}
          keyId={razorpayOrderData.keyId}
          amount={razorpayOrderData.amount}
          restaurantName={restaurantName || 'Yumora Food'}
          customerName={user?.name || 'Customer'}
          customerEmail={user?.email || 'customer@yumora.com'}
          customerPhone={phone}
          onSuccess={handlePaymentSuccess}
          onDismiss={handlePaymentDismiss}
          onError={handlePaymentError}
        />
      )}
    </SafeAreaView>
  );
}
