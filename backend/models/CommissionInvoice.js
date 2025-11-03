const mongoose = require('mongoose');

const commissionInvoiceSchema = new mongoose.Schema({
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
  period: {
    type: String, // Format: 'YYYY-MM' (e.g., '2024-01')
    required: true,
    index: true
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'overdue'],
    default: 'unpaid',
    index: true
  },
  paidAt: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'stripe', 'bank_transfer'],
  },
  stripeTransactionId: {
    type: String
  },
  notes: {
    type: String
  },
  // Sales breakdown for the period
  salesBreakdown: {
    totalSales: { type: Number, default: 0 },
    commissionableSales: { type: Number, default: 0 }, // Sales above threshold
    commissionRate: { type: Number, default: 10 }, // Percentage
    numberOfOrders: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
commissionInvoiceSchema.index({ adminId: 1, period: 1 }, { unique: true }); // One invoice per admin per period
commissionInvoiceSchema.index({ status: 1, dueDate: 1 }); // For overdue checks
commissionInvoiceSchema.index({ createdAt: -1 }); // For recent invoices

// Method to mark invoice as overdue
commissionInvoiceSchema.methods.markAsOverdue = async function() {
  if (this.status === 'unpaid' && new Date() > this.dueDate) {
    this.status = 'overdue';
    await this.save();
    return true;
  }
  return false;
};

// Static method to find overdue invoices
commissionInvoiceSchema.statics.findOverdueInvoices = function() {
  return this.find({
    status: 'unpaid',
    dueDate: { $lt: new Date() }
  }).populate('adminId', 'name email phone shopName');
};

// Static method to get unpaid invoices by admin
commissionInvoiceSchema.statics.getUnpaidByAdmin = function(adminId) {
  return this.find({
    adminId,
    status: { $in: ['unpaid', 'overdue'] }
  }).sort({ createdAt: -1 });
};

const CommissionInvoice = mongoose.model('CommissionInvoice', commissionInvoiceSchema);

module.exports = CommissionInvoice;
