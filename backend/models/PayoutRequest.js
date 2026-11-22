import mongoose from 'mongoose';

const payoutRequestSchema = new mongoose.Schema({
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userType: {
    type: String,
    enum: ['restaurant', 'delivery'],
    required: true
  },
  userName: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminComment: {
    type: String,
    default: null
  },
  transactionReference: {
    type: String,
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

payoutRequestSchema.index({ status: 1, createdAt: -1 });
payoutRequestSchema.index({ userId: 1 });

const PayoutRequest = mongoose.model('PayoutRequest', payoutRequestSchema);
export default PayoutRequest;
