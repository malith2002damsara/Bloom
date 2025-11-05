const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommissionPayment = sequelize.define('CommissionPayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Amount cannot be negative' }
    }
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'mastercard', 'visa', 'stripe'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending_verification', 'paid', 'verified', 'rejected'),
    defaultValue: 'pending_verification'
  },
  stripeTransactionId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  stripePaymentIntentId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  verifiedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  receiptUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'commission_payments',
  timestamps: true,
  indexes: [
    { fields: ['adminId', 'createdAt'] },
    { fields: ['status'] }
  ]
});

module.exports = CommissionPayment;
