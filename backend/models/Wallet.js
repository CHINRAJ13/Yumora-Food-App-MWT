import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ['restaurant', 'delivery'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    enum: ['RestaurantOwner', 'DeliveryPartner'],
    required: true
  },
  // In case of restaurant, we also keep restaurantId string for easy lookup
  restaurantId: {
    type: String,
    default: null
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  bankDetails: {
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    accountHolderName: { type: String, default: '' },
    bankName: { type: String, default: '' }
  }
}, { timestamps: true });

walletSchema.index({ userId: 1, userType: 1 }, { unique: true });
walletSchema.index({ restaurantId: 1 });

const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;
