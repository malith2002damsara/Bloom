const express = require('express');
const { Op } = require('sequelize');
const {
  adminLogin,
  verifyAdmin,
  changeAdminPassword,
  getAdminProfile,
  updateAdminProfile
} = require('../controllers/adminAuthController');
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} = require('../controllers/notificationController');
const {
  getAdminDashboardStats,
  getAdminProductStats,
  getAdminOrderStats,
  getAdminRevenue,
  getTopProducts,
  getRecentReviews,
  getSimplifiedDashboard
} = require('../controllers/adminAnalyticsController');
const {
  getAdminProfile: getProfile,
  updateAdminProfile: updateProfile,
  getShopInfo,
  updateAdminPassword: updatePassword
} = require('../controllers/adminProfileController');
const {
  getPendingCommission,
  payWithCash,
  createPaymentIntent,
  confirmStripePayment,
  getPaymentHistory,
  getCommissionStats
} = require('../controllers/adminCommissionController');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @desc    Get Dashboard Statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const adminId = req.user.id;
    const isSuperAdmin = req.user.role === 'superadmin';

    console.log('Dashboard Stats - Admin ID:', adminId);
    console.log('Dashboard Stats - Is SuperAdmin:', isSuperAdmin);

    // Build where clause for admin's products
    const productWhere = isSuperAdmin ? {} : { adminId: adminId };
    
    console.log('Dashboard Stats - Product Where:', productWhere);
    
    // Get admin's products
    const adminProducts = await Product.findAll({ 
      where: productWhere,
      attributes: ['id']
    });
    const productIds = adminProducts.map(p => p.id);
    
    console.log('Dashboard Stats - Found Products:', adminProducts.length);
    console.log('Dashboard Stats - Product IDs:', productIds);
    
    // Count products
    const totalProducts = adminProducts.length;
    
    // Get orders containing admin's products using Sequelize
    const adminOrders = await Order.findAll({
      where: {
        items: {
          [Op.contains]: productIds.map(id => ({ productId: id }))
        }
      }
    });
    
    console.log('Dashboard Stats - Found Orders:', adminOrders.length);
    
    const totalOrders = adminOrders.length;
    
    // Calculate total sales from completed orders
    const completedOrders = adminOrders.filter(order => 
      order.orderStatus === 'delivered' || order.orderStatus === 'completed'
    );
    const totalSales = completedOrders.reduce((sum, order) => {
      const adminItemsTotal = order.items
        .filter(item => productIds.includes(item.productId))
        .reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
      return sum + adminItemsTotal;
    }, 0);
    
    // Get pending orders
    const pendingOrders = adminOrders.filter(order => order.orderStatus === 'pending').length;
    
    // Get low stock products (stock <= 10)
    const lowStockWhere = { ...productWhere, stock: { [Op.lte]: 10 }, inStock: true };
    const lowStock = await Product.count({ where: lowStockWhere });

    console.log('Dashboard Stats - Final Stats:', {
      totalSales: Math.round(totalSales * 100) / 100,
      totalOrders,
      totalProducts,
      pendingOrders,
      lowStock
    });

    res.json({
      success: true,
      data: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalOrders,
        totalProducts,
        pendingOrders,
        lowStock
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard statistics'
    });
  }
};

// @desc    Get Analytics Data
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    const adminId = req.user.id;
    const isSuperAdmin = req.user.role === 'superadmin';
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build where clause for admin's products
    const productWhere = isSuperAdmin ? {} : { adminId: adminId };
    
    // Get admin's products
    const adminProducts = await Product.findAll({ 
      where: productWhere,
      attributes: ['id']
    });
    const productIds = adminProducts.map(p => p.id);
    
    // Get orders in range containing admin's products
    const ordersInRange = await Order.findAll({
      where: {
        createdAt: { [Op.between]: [startDate, now] },
        items: {
          [Op.contains]: productIds.map(id => ({ productId: id }))
        }
      }
    });

    // Calculate revenue from completed orders
    const completedOrders = ordersInRange.filter(order => 
      order.orderStatus === 'delivered' || order.orderStatus === 'completed'
    );
    const revenue = completedOrders.reduce((sum, order) => {
      const adminItemsTotal = order.items
        .filter(item => productIds.includes(item.productId))
        .reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
      return sum + adminItemsTotal;
    }, 0);

    res.json({
      success: true,
      data: {
        revenue: {
          value: Math.round(revenue * 100) / 100,
          change: 12.5,
          positive: true
        },
        orders: {
          value: ordersInRange.length,
          change: 8.2,
          positive: true
        },
        products: {
          value: adminProducts.length,
          change: 4.3,
          positive: true
        }
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics data'
    });
  }
};

// Authentication routes
router.post('/login', adminLogin);
router.get('/verify', verifyAdmin);
router.put('/change-password', auth, adminOnly, changeAdminPassword);

// Profile routes
router.get('/profile', auth, adminOnly, getProfile);
router.put('/profile', auth, adminOnly, updateProfile);
router.get('/shop-info', auth, adminOnly, getShopInfo);
router.put('/profile/password', auth, adminOnly, updatePassword);

// Dashboard routes
router.get('/dashboard', auth, adminOnly, getSimplifiedDashboard);
router.get('/stats', auth, adminOnly, getDashboardStats);
router.get('/analytics', auth, adminOnly, getAnalytics);

// Analytics routes
router.get('/dashboard/stats', auth, adminOnly, getAdminDashboardStats);
router.get('/products/stats', auth, adminOnly, getAdminProductStats);
router.get('/orders/stats', auth, adminOnly, getAdminOrderStats);
router.get('/revenue', auth, adminOnly, getAdminRevenue);
router.get('/analytics/top-products', auth, adminOnly, getTopProducts);
router.get('/recent-reviews', auth, adminOnly, getRecentReviews);

// Commission payment routes
router.get('/commission/pending', auth, adminOnly, getPendingCommission);
router.post('/commission/pay-with-cash', auth, adminOnly, payWithCash);
router.post('/commission/create-payment-intent', auth, adminOnly, createPaymentIntent);
router.post('/commission/confirm-stripe-payment', auth, adminOnly, confirmStripePayment);
router.get('/commission/history', auth, adminOnly, getPaymentHistory);
router.get('/commission/stats', auth, adminOnly, getCommissionStats);

// New payment gateway routes for commission payments
router.get('/commission-status', auth, adminOnly, async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const admin = await Admin.findByPk(req.user.id);
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.json({
      success: true,
      data: {
        totalDue: admin.commissionTotalDue || 0,
        nextDueDate: admin.commissionNextDueDate,
        lifetimeSales: admin.lifetimeSales || 0,
        commissionRate: 10
      }
    });
  } catch (error) {
    console.error('Commission status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get commission status' });
  }
});

router.post('/commission-payments/create-intent', auth, adminOnly, async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { amount, paymentMethod } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        adminId: req.user.id,
        type: 'commission_payment',
        paymentMethod: paymentMethod
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment intent' });
  }
});

router.post('/commission-payments', auth, adminOnly, async (req, res) => {
  try {
    const CommissionPayment = require('../models/CommissionPayment');
    const Admin = require('../models/Admin');
    const { amount, paymentMethod, stripePaymentIntentId, stripeTransactionId, notes } = req.body;

    // Create payment record
    const payment = await CommissionPayment.create({
      adminId: req.user.id,
      amount: amount,
      paymentMethod: paymentMethod,
      status: paymentMethod === 'cash' ? 'pending_verification' : 'paid',
      stripePaymentIntentId: stripePaymentIntentId,
      stripeTransactionId: stripeTransactionId,
      notes: notes || ''
    });

    // Update admin's commission balance if payment is successful
    if (paymentMethod !== 'cash' && paymentMethod !== 'paypal') {
      const admin = await Admin.findByPk(req.user.id);
      if (admin) {
        admin.commissionTotalDue = Math.max(0, (admin.commissionTotalDue || 0) - amount);
        await admin.save();
      }
    }

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
});

router.get('/commission-payments/history', auth, adminOnly, async (req, res) => {
  try {
    const CommissionPayment = require('../models/CommissionPayment');
    
    const payments = await CommissionPayment.findAll({
      where: { adminId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payment history' });
  }
});

// Notification routes
router.get('/notifications', auth, adminOnly, getNotifications);
router.put('/notifications/:id/read', auth, adminOnly, markNotificationRead);
router.put('/notifications/read-all', auth, adminOnly, markAllNotificationsRead);
router.delete('/notifications/:id', auth, adminOnly, deleteNotification);

module.exports = router;
