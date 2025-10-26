const User = require('../models/User');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ userId: id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @desc    SuperAdmin Login
// @route   POST /api/superadmin/login
// @access  Public
const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find superadmin by email
    const superAdmin = await User.findOne({ email, role: 'superadmin' }).select('+password');

    if (!superAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!superAdmin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled',
        disabled: true
      });
    }

    // Compare password
    const isPasswordMatch = await superAdmin.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(superAdmin._id, 'superadmin');

    // Update last login
    superAdmin.lastLogin = new Date();
    await superAdmin.save();

    res.json({
      success: true,
      message: 'SuperAdmin login successful',
      data: {
        admin: {
          id: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          phone: superAdmin.phone,
          role: superAdmin.role,
          lastLogin: superAdmin.lastLogin
        },
        token
      }
    });

  } catch (error) {
    console.error('SuperAdmin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify SuperAdmin Token
// @route   GET /api/superadmin/verify
// @access  Private
const verifySuperAdmin = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SuperAdmin role required.'
      });
    }

    // Find superadmin
    const superAdmin = await User.findById(decoded.userId);

    if (!superAdmin || superAdmin.role !== 'superadmin') {
      return res.status(404).json({
        success: false,
        message: 'SuperAdmin account not found'
      });
    }

    // Check if account is active
    if (!superAdmin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled',
        disabled: true
      });
    }

    // Check if password was changed after token was issued
    if (superAdmin.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password was changed. Please login again.'
      });
    }

    res.json({
      success: true,
      data: {
        admin: {
          id: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          phone: superAdmin.phone,
          role: superAdmin.role
        }
      }
    });

  } catch (error) {
    console.error('SuperAdmin verification error:', error);
    
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

// @desc    Change SuperAdmin Password
// @route   PUT /api/superadmin/change-password
// @access  Private
const changeSuperAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const superAdmin = await User.findById(req.user.id).select('+password');
    
    if (!superAdmin || superAdmin.role !== 'superadmin') {
      return res.status(404).json({
        success: false,
        message: 'SuperAdmin not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await superAdmin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    superAdmin.password = newPassword;
    await superAdmin.save();

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again with your new password.'
    });

  } catch (error) {
    console.error('Change superadmin password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
};

// @desc    Create New Admin Account
// @route   POST /api/superadmin/admins
// @access  Private/SuperAdmin
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Check if email is used by a regular user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use'
      });
    }

    // Create new admin
    const newAdmin = new Admin({
      name,
      email,
      password,
      phone: phone || '',
      createdBy: req.user.id,
      isActive: true
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        admin: {
          id: newAdmin._id,
          name: newAdmin.name,
          email: newAdmin.email,
          phone: newAdmin.phone,
          isActive: newAdmin.isActive,
          createdAt: newAdmin.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating admin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get All Admins
// @route   GET /api/superadmin/admins
// @access  Private/SuperAdmin
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        admins,
        count: admins.length
      }
    });

  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admins'
    });
  }
};

// @desc    Get Single Admin
// @route   GET /api/superadmin/admins/:id
// @access  Private/SuperAdmin
const getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id)
      .populate('createdBy', 'name email phone');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: { admin }
    });

  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin'
    });
  }
};

// @desc    Update Admin
// @route   PUT /api/superadmin/admins/:id
// @access  Private/SuperAdmin
const updateAdmin = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email });
      const existingUser = await User.findOne({ email });
      
      if (existingAdmin || existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update fields
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (phone !== undefined) admin.phone = phone;

    await admin.save();

    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: { admin }
    });

  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating admin'
    });
  }
};

// @desc    Activate Admin Account
// @route   PATCH /api/superadmin/admins/:id/activate
// @access  Private/SuperAdmin
const activateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    admin.isActive = true;
    await admin.save();

    res.json({
      success: true,
      message: 'Admin account activated successfully',
      data: { admin }
    });

  } catch (error) {
    console.error('Activate admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while activating admin'
    });
  }
};

// @desc    Deactivate Admin Account
// @route   PATCH /api/superadmin/admins/:id/deactivate
// @access  Private/SuperAdmin
const deactivateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    admin.isActive = false;
    await admin.save();

    res.json({
      success: true,
      message: 'Admin account deactivated successfully',
      data: { admin }
    });

  } catch (error) {
    console.error('Deactivate admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating admin'
    });
  }
};

// @desc    Delete Admin Account
// @route   DELETE /api/superadmin/admins/:id
// @access  Private/SuperAdmin
const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Admin account deleted successfully'
    });

  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting admin'
    });
  }
};

// @desc    Get Dashboard Statistics
// @route   GET /api/superadmin/dashboard/stats
// @access  Private/SuperAdmin
const getDashboardStats = async (req, res) => {
  try {
    // Get counts with individual error handling
    let totalAdmins = 0;
    let activeAdmins = 0;
    let inactiveAdmins = 0;
    let totalProducts = 0;
    let totalOrders = 0;
    let totalUsers = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;
    let recentAdmins = [];
    let recentTransactions = [];

    // Admin counts
    try {
      totalAdmins = await Admin.countDocuments();
      activeAdmins = await Admin.countDocuments({ isActive: true });
      inactiveAdmins = await Admin.countDocuments({ isActive: false });
    } catch (error) {
      console.error('Error fetching admin counts:', error.message);
    }

    // Product count
    try {
      totalProducts = await Product.countDocuments();
    } catch (error) {
      console.error('Error fetching product count:', error.message);
    }

    // Order counts and revenue
    try {
      totalOrders = await Order.countDocuments();
      
      const revenueData = await Order.aggregate([
        { $match: { orderStatus: 'delivered', paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);
      totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

      pendingOrders = await Order.countDocuments({ 
        orderStatus: { $in: ['pending', 'processing'] } 
      });
    } catch (error) {
      console.error('Error fetching order data:', error.message);
    }

    // User count
    try {
      totalUsers = await User.countDocuments({ role: 'user' });
    } catch (error) {
      console.error('Error fetching user count:', error.message);
    }

    // Recent admins
    try {
      recentAdmins = await Admin.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email isActive createdAt');
    } catch (error) {
      console.error('Error fetching recent admins:', error.message);
    }

    // Recent transactions
    try {
      recentTransactions = await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email')
        .select('_id total orderStatus createdAt');
    } catch (error) {
      console.error('Error fetching recent transactions:', error.message);
    }

    res.json({
      success: true,
      data: {
        totalAdmins,
        activeAdmins,
        inactiveAdmins,
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        pendingOrders,
        recentAdmins,
        recentTransactions
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get All Transactions
// @route   GET /api/superadmin/transactions
// @access  Private/SuperAdmin
const getTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      paymentStatus,
      type,
      adminId,
      month,
      year,
      startDate,
      endDate
    } = req.query;
    
    const query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    // Filter by admin
    if (adminId) {
      query.adminId = adminId;
    }
    
    // Filter by period
    if (month) {
      query['period.month'] = parseInt(month);
    }
    if (year) {
      query['period.year'] = parseInt(year);
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('adminId', 'name email phone')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Transaction.countDocuments(query);

    // Calculate summary statistics
    const stats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCommission: { 
            $sum: { $cond: [{ $eq: ['$type', 'commission'] }, '$commissionAmount', 0] }
          },
          totalPaid: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] }
          },
          totalPending: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'unpaid'] }, '$totalAmount', 0] }
          },
          totalOverdue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'overdue'] }, '$totalAmount', 0] }
          }
        }
      }
    ]);

    const summary = stats.length > 0 ? stats[0] : {
      totalCommission: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0
    };

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      },
      summary
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
};

// @desc    Generate Monthly Commission Transactions for All Admins
// @route   POST /api/superadmin/transactions/generate-monthly
// @access  Private/SuperAdmin
const generateMonthlyCommissions = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    // Get all active admins
    const admins = await Admin.find({ isActive: true });
    
    const commissionTransactions = [];
    const errors = [];

    for (const admin of admins) {
      try {
        // Check if commission already exists for this period
        const existingTransaction = await Transaction.findOne({
          adminId: admin._id,
          type: 'commission',
          'period.month': month,
          'period.year': year
        });

        if (existingTransaction) {
          errors.push({
            adminId: admin._id,
            adminName: admin.name,
            error: 'Commission already generated for this period'
          });
          continue;
        }

        // Get admin's products
        const adminProducts = await Product.find({ adminId: admin._id }).select('_id');
        const productIds = adminProducts.map(p => p._id.toString());

        // Calculate date range for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // Get all completed orders in this period containing admin's products
        const orders = await Order.find({
          createdAt: { $gte: startDate, $lte: endDate },
          orderStatus: { $in: ['delivered', 'completed'] },
          'items.productId': { $in: productIds }
        });

        // Calculate admin's revenue
        let adminRevenue = 0;
        let totalOrders = orders.length;
        let completedOrders = 0;

        orders.forEach(order => {
          if (order.orderStatus === 'delivered' || order.orderStatus === 'completed') {
            completedOrders++;
            const adminItems = order.items.filter(item => 
              productIds.includes(item.productId)
            );
            const orderAdminRevenue = adminItems.reduce((sum, item) => 
              sum + (item.price * item.quantity), 0
            );
            adminRevenue += orderAdminRevenue;
          }
        });

        // Calculate due date (end of next month)
        const dueDate = new Date(year, month, 0); // Last day of the month
        dueDate.setDate(dueDate.getDate() + 30); // 30 days from end of month

        // Create commission transaction
        const transaction = new Transaction({
          type: 'commission',
          adminId: admin._id,
          adminRevenue: Math.round(adminRevenue * 100) / 100,
          commissionRate: 10,
          period: {
            month: parseInt(month),
            year: parseInt(year)
          },
          status: 'pending',
          paymentStatus: 'unpaid',
          dueDate,
          orderStats: {
            totalOrders,
            completedOrders,
            cancelledOrders: 0
          },
          description: `Commission for ${getMonthName(month)} ${year}`,
          processedBy: req.user._id
        });

        await transaction.save();
        commissionTransactions.push(transaction);

      } catch (error) {
        console.error(`Error generating commission for admin ${admin._id}:`, error);
        errors.push({
          adminId: admin._id,
          adminName: admin.name,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Generated ${commissionTransactions.length} commission transactions`,
      data: {
        transactions: commissionTransactions,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Generate monthly commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating commissions'
    });
  }
};

// @desc    Get Transaction Details
// @route   GET /api/superadmin/transactions/:id
// @access  Private/SuperAdmin
const getTransactionDetails = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('adminId', 'name email phone')
      .populate('processedBy', 'name email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Get transaction details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction details'
    });
  }
};

// @desc    Update Transaction Status
// @route   PUT /api/superadmin/transactions/:id/status
// @access  Private/SuperAdmin
const updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    transaction.status = status;
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();

    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction status updated',
      data: transaction
    });

  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating transaction status'
    });
  }
};

// @desc    Update Transaction Payment
// @route   PUT /api/superadmin/transactions/:id/payment
// @access  Private/SuperAdmin
const updateTransactionPayment = async (req, res) => {
  try {
    const { 
      paymentStatus, 
      paymentMethod, 
      paymentReference, 
      notes 
    } = req.body;

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (paymentStatus) {
      transaction.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        transaction.paidAt = new Date();
        transaction.status = 'completed';
      }
    }

    if (paymentMethod) transaction.paymentMethod = paymentMethod;
    if (paymentReference) transaction.paymentReference = paymentReference;
    if (notes) transaction.notes = notes;

    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();

    await transaction.save();

    res.json({
      success: true,
      message: 'Payment information updated',
      data: transaction
    });

  } catch (error) {
    console.error('Update transaction payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment information'
    });
  }
};

// @desc    Get Admin Commission Report
// @route   GET /api/superadmin/admins/:id/commission-report
// @access  Private/SuperAdmin
const getAdminCommissionReport = async (req, res) => {
  try {
    const { startMonth, startYear, endMonth, endYear } = req.query;
    const adminId = req.params.id;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const query = {
      adminId,
      type: 'commission'
    };

    // Get all commissions for this admin
    const commissions = await Transaction.find(query)
      .sort({ 'period.year': -1, 'period.month': -1 });

    // Calculate summary
    const summary = {
      totalCommissions: commissions.length,
      totalAmount: commissions.reduce((sum, t) => sum + t.commissionAmount, 0),
      totalPaid: commissions
        .filter(t => t.paymentStatus === 'paid')
        .reduce((sum, t) => sum + t.commissionAmount, 0),
      totalPending: commissions
        .filter(t => t.paymentStatus === 'unpaid')
        .reduce((sum, t) => sum + t.commissionAmount, 0),
      totalOverdue: commissions
        .filter(t => t.paymentStatus === 'overdue')
        .reduce((sum, t) => sum + t.commissionAmount, 0),
      totalRevenue: commissions.reduce((sum, t) => sum + (t.adminRevenue || 0), 0)
    };

    res.json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email
        },
        commissions,
        summary
      }
    });

  } catch (error) {
    console.error('Get admin commission report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching commission report'
    });
  }
};

// Helper function to get month name
function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
}

module.exports = {
  superAdminLogin,
  verifySuperAdmin,
  changeSuperAdminPassword,
  createAdmin,
  getAllAdmins,
  getAdmin,
  updateAdmin,
  activateAdmin,
  deactivateAdmin,
  deleteAdmin,
  getDashboardStats,
  getTransactions,
  generateMonthlyCommissions,
  getTransactionDetails,
  updateTransactionStatus,
  updateTransactionPayment,
  getAdminCommissionReport
};
