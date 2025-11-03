const mongoose = require('mongoose');

const commissionPaymentSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mastercard', 'visa', 'stripe'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending_verification', 'paid', 'verified', 'rejected'],
    default: 'pending_verification'
  },
  stripeTransactionId: {
    type: String,
    default: null
  },
  stripePaymentIntentId: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  receiptUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for querying payments by admin
commissionPaymentSchema.index({ adminId: 1, createdAt: -1 });

// Index for filtering by status
commissionPaymentSchema.index({ status: 1 });

// Virtual for payment display name
commissionPaymentSchema.virtual('paymentMethodDisplay').get(function() {
  const methods = {
    'cash': 'Cash Payment',
    'mastercard': 'Mastercard',
    'visa': 'Visa',
    'stripe': 'Credit Card (Stripe)'
  };
  return methods[this.paymentMethod] || this.paymentMethod;
});

// Virtual for status display
commissionPaymentSchema.virtual('statusDisplay').get(function() {
  const statuses = {
    'pending_verification': 'Pending Verification',
    'paid': 'Paid',
    'verified': 'Verified',
    'rejected': 'Rejected'
  };
  return statuses[this.status] || this.status;
});

// Ensure virtuals are included in JSON
commissionPaymentSchema.set('toJSON', { virtuals: true });
commissionPaymentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CommissionPayment', commissionPaymentSchema);
