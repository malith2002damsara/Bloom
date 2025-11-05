const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Admin = require('./Admin');
const SuperAdmin = require('./SuperAdmin');
const Product = require('./Product');
const Order = require('./Order');
const Feedback = require('./Feedback');
const Notification = require('./Notification');
const CommissionInvoice = require('./CommissionInvoice');
const CommissionPayment = require('./CommissionPayment');
const Transaction = require('./Transaction');
const PlatformReport = require('./PlatformReport');

// Define relationships

// Admin relationships
Admin.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(Admin, { as: 'createdAdmins', foreignKey: 'createdBy' });

Admin.hasMany(Product, { as: 'products', foreignKey: 'adminId', onDelete: 'CASCADE' });
Product.belongsTo(Admin, { as: 'admin', foreignKey: 'adminId' });

Admin.hasMany(Notification, { as: 'notifications', foreignKey: 'adminId', onDelete: 'CASCADE' });
Notification.belongsTo(Admin, { as: 'admin', foreignKey: 'adminId' });

Admin.hasMany(CommissionInvoice, { as: 'invoices', foreignKey: 'adminId', onDelete: 'CASCADE' });
CommissionInvoice.belongsTo(Admin, { as: 'admin', foreignKey: 'adminId' });

Admin.hasMany(CommissionPayment, { as: 'payments', foreignKey: 'adminId', onDelete: 'CASCADE' });
CommissionPayment.belongsTo(Admin, { as: 'admin', foreignKey: 'adminId' });

Admin.hasMany(Transaction, { as: 'transactions', foreignKey: 'adminId', onDelete: 'SET NULL' });
Transaction.belongsTo(Admin, { as: 'admin', foreignKey: 'adminId' });

Admin.hasMany(Feedback, { as: 'feedback', foreignKey: 'adminId', onDelete: 'CASCADE' });
Feedback.belongsTo(Admin, { as: 'admin', foreignKey: 'adminId' });

// User relationships
User.hasMany(Order, { as: 'orders', foreignKey: 'userId', onDelete: 'CASCADE' });
Order.belongsTo(User, { as: 'user', foreignKey: 'userId' });

User.hasMany(Feedback, { as: 'feedback', foreignKey: 'userId', onDelete: 'CASCADE' });
Feedback.belongsTo(User, { as: 'user', foreignKey: 'userId' });

User.hasMany(PlatformReport, { as: 'generatedReports', foreignKey: 'generatedBy', onDelete: 'SET NULL' });
PlatformReport.belongsTo(User, { as: 'generator', foreignKey: 'generatedBy' });

// Product relationships
Product.hasMany(Feedback, { as: 'feedback', foreignKey: 'productId', onDelete: 'CASCADE' });
Feedback.belongsTo(Product, { as: 'product', foreignKey: 'productId' });

Product.hasMany(Notification, { as: 'notifications', foreignKey: 'productId', onDelete: 'SET NULL' });
Notification.belongsTo(Product, { as: 'product', foreignKey: 'productId' });

// Order relationships
Order.hasMany(Feedback, { as: 'feedback', foreignKey: 'orderId', onDelete: 'CASCADE' });
Feedback.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });

Order.hasMany(Notification, { as: 'notifications', foreignKey: 'orderId', onDelete: 'SET NULL' });
Notification.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });

Order.hasMany(Transaction, { as: 'transactions', foreignKey: 'orderId', onDelete: 'SET NULL' });
Transaction.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });

// Commission Payment relationships
User.hasMany(CommissionPayment, { as: 'verifiedPayments', foreignKey: 'verifiedBy', onDelete: 'SET NULL' });
CommissionPayment.belongsTo(User, { as: 'verifier', foreignKey: 'verifiedBy' });

// Transaction relationships
User.hasMany(Transaction, { as: 'processedTransactions', foreignKey: 'processedBy', onDelete: 'SET NULL' });
Transaction.belongsTo(User, { as: 'processor', foreignKey: 'processedBy' });

// Export all models and sequelize instance
module.exports = {
  sequelize,
  User,
  Admin,
  SuperAdmin,
  Product,
  Order,
  Feedback,
  Notification,
  CommissionInvoice,
  CommissionPayment,
  Transaction,
  PlatformReport
};
