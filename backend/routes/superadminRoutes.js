const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Middleware to check if user is superadmin
const requireSuperAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. SuperAdmin privileges required.' 
      });
    }
    req.superadmin = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// SuperAdmin login
router.post('/auth/superadmin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if user is superadmin
    if (user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. SuperAdmin privileges required.' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('SuperAdmin login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify superadmin token
router.get('/auth/verify-superadmin', auth, requireSuperAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.superadmin._id,
        name: req.superadmin.name,
        email: req.superadmin.email,
        role: req.superadmin.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Dashboard stats
router.get('/dashboard/stats', auth, requireSuperAdmin, async (req, res) => {
  try {
    // Get counts
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeAdmins = await User.countDocuments({ role: 'admin', status: { $ne: 'inactive' } });
    const totalProducts = await Product.countDocuments();
    const totalTransactions = await Order.countDocuments();

    // Calculate total revenue
    const revenueData = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // Get recent transactions
    const recentTransactions = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .select('_id totalAmount status createdAt user');

    // Get recent admins
    const recentAdmins = await User.find({ role: 'admin' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email status createdAt');

    res.json({
      success: true,
      data: {
        totalAdmins,
        activeAdmins,
        totalProducts,
        totalTransactions,
        totalRevenue,
        recentTransactions: recentTransactions.map(t => ({
          id: t._id,
          amount: t.totalAmount,
          customer: t.user?.name || 'Unknown',
          date: t.createdAt.toLocaleDateString()
        })),
        recentAdmins: recentAdmins.map(a => ({
          name: a.name,
          email: a.email,
          status: a.status || 'active',
          createdAt: a.createdAt.toLocaleDateString()
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all admin accounts
router.get('/admins', auth, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new admin account
router.post('/admins', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin with this email already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin
    const newAdmin = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });

    await newAdmin.save();

    // Return admin without password
    const adminData = await User.findById(newAdmin._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: adminData
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update admin account
router.put('/admins/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email } = req.body;
    const adminId = req.params.id;

    const updatedAdmin = await User.findByIdAndUpdate(
      adminId,
      { name, email },
      { new: true, select: '-password' }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Deactivate admin account
router.patch('/admins/:id/deactivate', auth, requireSuperAdmin, async (req, res) => {
  try {
    const adminId = req.params.id;

    const updatedAdmin = await User.findByIdAndUpdate(
      adminId,
      { status: 'inactive' },
      { new: true, select: '-password' }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    res.json({
      success: true,
      message: 'Admin deactivated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Deactivate admin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Activate admin account
router.patch('/admins/:id/activate', auth, requireSuperAdmin, async (req, res) => {
  try {
    const adminId = req.params.id;

    const updatedAdmin = await User.findByIdAndUpdate(
      adminId,
      { status: 'active' },
      { new: true, select: '-password' }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    res.json({
      success: true,
      message: 'Admin activated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Activate admin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete admin account
router.delete('/admins/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const adminId = req.params.id;

    const deletedAdmin = await User.findByIdAndDelete(adminId);

    if (!deletedAdmin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get analytics data
router.get('/analytics', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // This would typically contain complex analytics queries
    // For now, returning mock data structure
    res.json({
      success: true,
      data: {
        revenue: [],
        userGrowth: [],
        productPerformance: [],
        adminActivity: []
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all transactions
router.get('/transactions', auth, requireSuperAdmin, async (req, res) => {
  try {
    const transactions = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    const formattedTransactions = transactions.map(t => ({
      _id: t._id,
      orderId: t._id.toString().slice(-6),
      customerName: t.user?.name || 'Guest',
      customerEmail: t.user?.email || 'N/A',
      amount: t.totalAmount,
      status: t.status,
      createdAt: t.createdAt,
      items: t.items
    }));

    res.json({
      success: true,
      data: formattedTransactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update transaction status
router.patch('/transactions/:id/status', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const transactionId = req.params.id;

    const updatedTransaction = await Order.findByIdAndUpdate(
      transactionId,
      { status },
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    res.json({
      success: true,
      message: 'Transaction status updated successfully',
      data: updatedTransaction
    });
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all products
router.get('/products', auth, requireSuperAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update product status
router.patch('/products/:id/status', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const productId = req.params.id;

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { status },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      message: 'Product status updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete product
router.delete('/products/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const productId = req.params.id;

    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get system settings
router.get('/settings', auth, requireSuperAdmin, async (req, res) => {
  try {
    // In a real application, you would store these in a separate Settings model
    // For now, returning default settings
    const defaultSettings = {
      siteName: 'Bloom SuperAdmin',
      supportEmail: 'support@bloom.com',
      maxAdmins: 50,
      maintenanceMode: false,
      emailNotifications: true,
      autoBackup: true,
      sessionTimeout: 60,
      allowRegistration: false,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxLoginAttempts: 5,
      backupFrequency: 'daily'
    };

    res.json({
      success: true,
      data: defaultSettings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update system settings
router.put('/settings', auth, requireSuperAdmin, async (req, res) => {
  try {
    const settings = req.body;
    
    // In a real application, you would save these to a Settings model
    // For now, just returning success
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
