const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction Type
  type: {
    type: String,
    enum: ['commission', 'order', 'refund', 'adjustment'],
    required: true,
    default: 'commission'
  },

  // Reference to Admin (for commission transactions)
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: function() {
      return this.type === 'commission';
    }
  },

  // Reference to Order (if applicable)
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },

  // Financial Details
  adminRevenue: {
    type: Number,
    required: function() {
      return this.type === 'commission';
    },
    default: 0
  },

  commissionRate: {
    type: Number,
    default: 10, // 10% commission
    min: 0,
    max: 100
  },

  commissionAmount: {
    type: Number,
    required: true,
    default: 0
  },

  totalAmount: {
    type: Number,
    required: true
  },

  // Period Information
  period: {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    }
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },

  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'partially_paid', 'overdue'],
    default: 'unpaid'
  },

  // Payment Details
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'mastercard', 'visa', 'check', 'digital_wallet', 'other'],
    default: 'bank_transfer'
  },
  
  // Payment transaction details (for card payments)
  paymentTransaction: {
    transactionId: String,
    cardLastFour: String,
    cardType: {
      type: String,
      enum: ['mastercard', 'visa', 'other']
    }
  },

  paymentReference: {
    type: String
  },

  paidAt: {
    type: Date
  },

  dueDate: {
    type: Date
  },

  // Order Statistics (for commission period)
  orderStats: {
    totalOrders: {
      type: Number,
      default: 0
    },
    completedOrders: {
      type: Number,
      default: 0
    },
    cancelledOrders: {
      type: Number,
      default: 0
    }
  },

  // Notes and Description
  description: {
    type: String
  },

  notes: {
    type: String
  },

  // Invoice Details
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  invoiceUrl: {
    type: String
  },

  // Metadata
  metadata: {
    type: Map,
    of: String
  },

  // Processing Info
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  processedAt: {
    type: Date
  }

}, {
  timestamps: true
});

// Generate invoice number
transactionSchema.pre('save', async function(next) {
  if (!this.invoiceNumber && this.type === 'commission') {
    const count = await this.constructor.countDocuments();
    const year = this.period.year;
    const month = String(this.period.month).padStart(2, '0');
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Calculate commission automatically
transactionSchema.pre('save', function(next) {
  if (this.type === 'commission' && this.adminRevenue) {
    this.commissionAmount = (this.adminRevenue * this.commissionRate) / 100;
    this.totalAmount = this.commissionAmount;
  }
  next();
});

// Index for efficient queries
transactionSchema.index({ adminId: 1, 'period.year': 1, 'period.month': 1 });
transactionSchema.index({ status: 1, paymentStatus: 1 });
// Note: createdAt index is automatically created by timestamps: true

module.exports = mongoose.model('Transaction', transactionSchema);
