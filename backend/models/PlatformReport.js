const mongoose = require('mongoose');

const platformReportSchema = new mongoose.Schema({
  period: {
    type: String, // Format: 'YYYY-MM' (e.g., '2024-01')
    required: true,
    unique: true,
    index: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reportType: {
    type: String,
    enum: ['monthly', 'custom'],
    default: 'monthly'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin', // Super admin who generated it
    required: true
  },
  
  // Platform-wide metrics
  platformMetrics: {
    totalOrders: { type: Number, default: 0 },
    deliveredOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    pendingOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 },
    activeAdmins: { type: Number, default: 0 },
    newCustomers: { type: Number, default: 0 }
  },
  
  // Admin-wise breakdown
  adminBreakdown: [{
    adminId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Admin' 
    },
    adminName: String,
    shopName: String,
    totalSales: { type: Number, default: 0 },
    lifetimeSales: { type: Number, default: 0 },
    commissionableSales: { type: Number, default: 0 },
    commissionDue: { type: Number, default: 0 },
    numberOfOrders: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['paid', 'unpaid', 'overdue', 'not_applicable'],
      default: 'not_applicable'
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommissionInvoice'
    }
  }],
  
  // Report metadata
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },
  fileUrl: {
    type: String // URL to PDF file if stored
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
platformReportSchema.index({ period: -1 });
platformReportSchema.index({ createdAt: -1 });
platformReportSchema.index({ status: 1 });

// Method to calculate total commission collected
platformReportSchema.methods.getTotalCommissionCollected = function() {
  return this.adminBreakdown
    .filter(admin => admin.paymentStatus === 'paid')
    .reduce((sum, admin) => sum + admin.commissionDue, 0);
};

// Method to calculate pending commission
platformReportSchema.methods.getTotalCommissionPending = function() {
  return this.adminBreakdown
    .filter(admin => ['unpaid', 'overdue'].includes(admin.paymentStatus))
    .reduce((sum, admin) => sum + admin.commissionDue, 0);
};

const PlatformReport = mongoose.model('PlatformReport', platformReportSchema);

module.exports = PlatformReport;
