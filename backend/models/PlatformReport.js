const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlatformReport = sequelize.define('PlatformReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  period: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  reportType: {
    type: DataTypes.ENUM('monthly', 'custom'),
    defaultValue: 'monthly'
  },
  generatedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  deliveredOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  cancelledOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  pendingOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalRevenue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  totalCommission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  activeAdmins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  newCustomers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  adminBreakdown: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('generating', 'completed', 'failed'),
    defaultValue: 'generating'
  },
  fileUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'platform_reports',
  timestamps: true,
  indexes: [
    { fields: ['period'] },
    { fields: ['createdAt'] },
    { fields: ['status'] }
  ]
});

// Method to calculate total commission collected
PlatformReport.prototype.getTotalCommissionCollected = function() {
  if (!this.adminBreakdown || !Array.isArray(this.adminBreakdown)) {
    return 0;
  }
  return this.adminBreakdown
    .filter(admin => admin.paymentStatus === 'paid')
    .reduce((sum, admin) => sum + (parseFloat(admin.commissionDue) || 0), 0);
};

// Method to calculate pending commission
PlatformReport.prototype.getTotalCommissionPending = function() {
  if (!this.adminBreakdown || !Array.isArray(this.adminBreakdown)) {
    return 0;
  }
  return this.adminBreakdown
    .filter(admin => ['unpaid', 'overdue'].includes(admin.paymentStatus))
    .reduce((sum, admin) => sum + (parseFloat(admin.commissionDue) || 0), 0);
};

module.exports = PlatformReport;
