const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('commission', 'order', 'refund', 'adjustment'),
    allowNull: false,
    defaultValue: 'commission'
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  adminRevenue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 10,
    validate: {
      min: { args: [0], msg: 'Commission rate cannot be negative' },
      max: { args: [100], msg: 'Commission rate cannot exceed 100%' }
    }
  },
  commissionAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  periodMonth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Month must be between 1 and 12' },
      max: { args: [12], msg: 'Month must be between 1 and 12' }
    }
  },
  periodYear: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'paid', 'partially_paid', 'overdue'),
    defaultValue: 'unpaid'
  },
  paymentMethod: {
    type: DataTypes.ENUM('bank_transfer', 'cash', 'mastercard', 'visa', 'check', 'digital_wallet', 'other'),
    defaultValue: 'bank_transfer'
  },
  paymentTransactionId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  paymentCardLastFour: {
    type: DataTypes.STRING(4),
    allowNull: true
  },
  paymentCardType: {
    type: DataTypes.ENUM('mastercard', 'visa', 'other'),
    allowNull: true
  },
  paymentReference: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completedOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  cancelledOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: true
  },
  invoiceUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  processedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  indexes: [
    { fields: ['adminId', 'periodYear', 'periodMonth'] },
    { fields: ['status', 'paymentStatus'] },
    { fields: ['createdAt'] }
  ],
  hooks: {
    beforeValidate: async (transaction) => {
      // Generate invoice number if not exists
      if (!transaction.invoiceNumber && transaction.type === 'commission') {
        const count = await Transaction.count();
        const year = transaction.periodYear;
        const month = String(transaction.periodMonth).padStart(2, '0');
        transaction.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(6, '0')}`;
      }
    },
    beforeSave: (transaction) => {
      // Calculate commission automatically
      if (transaction.type === 'commission' && transaction.adminRevenue) {
        transaction.commissionAmount = (transaction.adminRevenue * transaction.commissionRate) / 100;
        transaction.totalAmount = transaction.commissionAmount;
      }
    }
  }
});

module.exports = Transaction;
