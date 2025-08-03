const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check hardcoded admin credentials
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'malithdamsara87@gmail.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'malith123';

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Create admin user object
    const adminUser = {
      id: 'admin_1',
      email: ADMIN_EMAIL,
      name: 'Admin User',
      role: 'admin'
    };

    // Generate JWT token
    const token = jwt.sign(
      { userId: adminUser.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: adminUser,
        token
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify Admin Token
// @route   GET /api/admin/verify
// @access  Private
const verifyAdmin = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const adminUser = {
      id: decoded.userId,
      email: process.env.ADMIN_EMAIL || 'malithdamsara87@gmail.com',
      name: 'Admin User',
      role: 'admin'
    };

    res.json({
      success: true,
      data: { admin: adminUser }
    });

  } catch (error) {
    console.error('Admin verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
};

// @desc    Get Dashboard Statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOrders = await Order.countDocuments();
    
    // Get total sales
    const salesAggregation = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
    ]);
    const totalSales = salesAggregation.length > 0 ? salesAggregation[0].totalSales : 0;
    
    // Get pending orders
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    
    // Get low stock products (stock <= 10)
    const lowStock = await Product.countDocuments({ stock: { $lte: 10 }, inStock: true });

    res.json({
      success: true,
      data: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalOrders,
        totalProducts,
        totalUsers,
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

    // Get analytics data for the range
    const ordersInRange = await Order.find({
      createdAt: { $gte: startDate, $lte: now }
    });

    const completedOrders = ordersInRange.filter(order => order.status === 'completed');
    const revenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    const uniqueCustomers = new Set(ordersInRange.map(order => order.user.toString())).size;

    res.json({
      success: true,
      data: {
        revenue: {
          value: Math.round(revenue * 100) / 100,
          change: 12.5, // This would be calculated based on previous period
          positive: true
        },
        orders: {
          value: ordersInRange.length,
          change: 8.2,
          positive: true
        },
        customers: {
          value: uniqueCustomers,
          change: -2.1,
          positive: false
        },
        products: {
          value: await Product.countDocuments(),
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

// @desc    Get Sellers Data
// @route   GET /api/admin/sellers
// @access  Private/Admin
const getSellers = async (req, res) => {
  try {
    // Get all products with seller information
    const products = await Product.find().populate('seller', 'name email phone');
    
    // Group by seller and calculate stats
    const sellerStats = {};
    
    products.forEach(product => {
      const sellerId = product.seller?._id?.toString() || 'unknown';
      const sellerName = product.seller?.name || product.seller?.name || 'Unknown Seller';
      
      if (!sellerStats[sellerId]) {
        sellerStats[sellerId] = {
          id: sellerId,
          name: sellerName,
          contact: product.seller?.contact || 'N/A',
          address: 'N/A',
          rating: 4.5 + Math.random() * 0.5, // Demo rating
          totalProducts: 0,
          totalSales: 0,
          joinDate: product.createdAt || new Date(),
          status: 'active'
        };
      }
      
      sellerStats[sellerId].totalProducts++;
      sellerStats[sellerId].totalSales += product.price * Math.floor(Math.random() * 10 + 1); // Demo sales
    });

    const sellers = Object.values(sellerStats);

    res.json({
      success: true,
      data: { sellers }
    });

  } catch (error) {
    console.error('Sellers fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching sellers data'
    });
  }
};

router.post('/login', adminLogin);
router.get('/verify', verifyAdmin);
router.get('/stats', auth, adminOnly, getDashboardStats);
router.get('/analytics', auth, adminOnly, getAnalytics);
router.get('/sellers', auth, adminOnly, getSellers);

module.exports = router;
