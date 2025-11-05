const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    unique: true
  },
  items: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false
  },
  customerName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  customerEmail: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  customerPhone: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  customerAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  customerCity: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  customerZip: {
    type: DataTypes.STRING(20),
    defaultValue: ''
  },
  customerNotes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  paymentMethod: {
    type: DataTypes.ENUM('cod', 'card', 'paypal'),
    defaultValue: 'cod'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  orderStatus: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Subtotal cannot be negative' }
    }
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  shipping: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Total cannot be negative' }
    }
  },
  estimatedDelivery: {
    type: DataTypes.DATE,
    allowNull: false
  },
  trackingNumber: {
    type: DataTypes.STRING(100),
    defaultValue: ''
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  feedbackSubmitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  feedbackRequestedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'createdAt'], name: 'user_orders_by_date' },
    { fields: ['userId', 'orderStatus', 'createdAt'], name: 'user_orders_by_status' },
    { fields: ['userId', 'total'], name: 'user_orders_by_amount' },
    { fields: ['orderNumber'], unique: true },
    { fields: ['orderStatus'] },
    { fields: ['createdAt'] }
  ],
  hooks: {
    beforeValidate: (order) => {
      // Generate order number if not exists
      if (!order.orderNumber) {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        order.orderNumber = `BG-${timestamp.slice(-6)}${random}`;
      }
    }
  }
});

module.exports = Order;
