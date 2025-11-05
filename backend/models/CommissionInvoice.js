const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommissionInvoice = sequelize.define('CommissionInvoice', {
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
  period: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('unpaid', 'paid', 'overdue'),
    defaultValue: 'unpaid'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'stripe', 'bank_transfer'),
    allowNull: true
  },
  stripeTransactionId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  totalSales: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  commissionableSales: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 10
  },
  numberOfOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'commission_invoices',
  timestamps: true,
  indexes: [
    { fields: ['adminId'] },
    { fields: ['period'] },
    { fields: ['dueDate'] },
    { fields: ['status'] },
    { fields: ['adminId', 'period'], unique: true },
    { fields: ['status', 'dueDate'] },
    { fields: ['createdAt'] }
  ]
});

// Instance method to mark invoice as overdue
CommissionInvoice.prototype.markAsOverdue = async function() {
  if (this.status === 'unpaid' && new Date() > this.dueDate) {
    this.status = 'overdue';
    await this.save();
    return true;
  }
  return false;
};

// Static method to find overdue invoices
CommissionInvoice.findOverdueInvoices = function() {
  const { Op } = require('sequelize');
  const Admin = require('./Admin');
  
  return this.findAll({
    where: {
      status: 'unpaid',
      dueDate: { [Op.lt]: new Date() }
    },
    include: [{
      model: Admin,
      attributes: ['name', 'email', 'phone', 'shopName']
    }]
  });
};

// Static method to get unpaid invoices by admin
CommissionInvoice.getUnpaidByAdmin = function(adminId) {
  const { Op } = require('sequelize');
  
  return this.findAll({
    where: {
      adminId,
      status: { [Op.in]: ['unpaid', 'overdue'] }
    },
    order: [['createdAt', 'DESC']]
  });
};

module.exports = CommissionInvoice;
