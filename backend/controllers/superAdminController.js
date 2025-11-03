const User = require('../models/User');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const CommissionInvoice = require('../models/CommissionInvoice');
const PlatformReport = require('../models/PlatformReport');
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

    const superAdmin = await User.findById(req.user._id).select('+password');
    
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
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and phone number'
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

    // Check if phone number is already used
    if (phone) {
      const phoneExistsInUser = await User.findOne({ phone });
      if (phoneExistsInUser) {
        return res.status(400).json({
          success: false,
          message: 'That number already exists, please use another number.'
        });
      }

      const phoneExistsInAdmin = await Admin.findOne({ phone });
      if (phoneExistsInAdmin) {
        return res.status(400).json({
          success: false,
          message: 'That number already exists, please use another number.'
        });
      }
    }

    // Create new admin
    const newAdmin = new Admin({
      name,
      email,
      password,
      phone,
      createdBy: req.user._id,
      isActive: true
      // adminCode will be auto-generated by the model pre-save hook
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
          adminCode: newAdmin.adminCode,
          isActive: newAdmin.isActive,
          createdAt: newAdmin.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while creating admin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
    admin.accountStatus = 'active';
    admin.deactivatedAt = null;
    admin.deactivationReason = '';
    
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
      message: 'Server error while activating admin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    admin.accountStatus = 'deactivated';
    admin.deactivatedAt = new Date();
    admin.deactivationReason = req.body.reason || 'Manually deactivated by super admin';
    
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
      message: 'Server error while deactivating admin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    let adminWiseStats = [];

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

    // Admin-wise statistics
    try {
      const admins = await Admin.find({ isActive: true }).select('_id name email');
      
      adminWiseStats = await Promise.all(admins.map(async (admin) => {
        // Get product counts by status for this admin
        const productStats = await Product.aggregate([
          { $match: { adminId: admin._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        const productCounts = {
          active: 0,
          inactive: 0,
          out_of_stock: 0,
          total: 0
        };

        productStats.forEach(stat => {
          productCounts[stat._id] = stat.count;
          productCounts.total += stat.count;
        });

        // Get order count for this admin
        const orderCount = await Order.countDocuments({
          'items.adminId': admin._id
        });

        // Get revenue for this admin
        const revenueData = await Order.aggregate([
          { 
            $match: { 
              'items.adminId': admin._id,
              orderStatus: { $in: ['delivered', 'completed'] }
            } 
          },
          { $unwind: '$items' },
          { $match: { 'items.adminId': admin._id } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }
          }
        ]);

        const revenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        return {
          adminId: admin._id,
          adminName: admin.name,
          adminEmail: admin.email,
          products: productCounts,
          orders: orderCount,
          revenue: Math.round(revenue * 100) / 100
        };
      }));
    } catch (error) {
      console.error('Error fetching admin-wise stats:', error.message);
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
        recentTransactions,
        adminWiseStats
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

// @desc    Get all commission invoices
// @route   GET /api/superadmin/invoices
// @access  Private/SuperAdmin
const getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, period, adminId } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (period) {
      query.period = period;
    }
    if (adminId) {
      query.adminId = adminId;
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      CommissionInvoice.find(query)
        .populate('adminId', 'name email shopName adminCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CommissionInvoice.countDocuments(query)
    ]);

    // Calculate summary statistics
    const summary = await CommissionInvoice.aggregate([
      ...(Object.keys(query).length > 0 ? [{ $match: query }] : []),
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        invoices,
        summary: {
          unpaid: summary.find(s => s._id === 'unpaid') || { count: 0, totalAmount: 0 },
          paid: summary.find(s => s._id === 'paid') || { count: 0, totalAmount: 0 },
          overdue: summary.find(s => s._id === 'overdue') || { count: 0, totalAmount: 0 }
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message
    });
  }
};

// @desc    Mark invoice as paid manually
// @route   PUT /api/superadmin/invoices/:id/mark-paid
// @access  Private/SuperAdmin
const markInvoicePaid = async (req, res) => {
  try {
    const { paymentMethod, notes } = req.body;

    const invoice = await CommissionInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid'
      });
    }

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    invoice.paymentMethod = paymentMethod || 'cash';
    if (notes) invoice.notes = notes;

    await invoice.save();

    // Reactivate admin if they were deactivated
    const admin = await Admin.findById(invoice.adminId);
    if (admin && admin.accountStatus === 'deactivated') {
      const otherUnpaidInvoices = await CommissionInvoice.countDocuments({
        adminId: invoice.adminId,
        _id: { $ne: invoice._id },
        status: { $in: ['unpaid', 'overdue'] }
      });

      if (otherUnpaidInvoices === 0) {
        admin.accountStatus = 'active';
        admin.isActive = true;
        admin.deactivationReason = '';
        admin.deactivatedAt = null;
        await admin.save();
      }
    }

    res.json({
      success: true,
      message: 'Invoice marked as paid successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Mark invoice paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark invoice as paid',
      error: error.message
    });
  }
};

// @desc    Get all platform reports
// @route   GET /api/superadmin/reports
// @access  Private/SuperAdmin
const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, reportType } = req.query;

    const query = {};
    if (reportType && reportType !== 'all') {
      query.reportType = reportType;
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      PlatformReport.find(query)
        .populate('generatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      PlatformReport.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

// @desc    Get single report details
// @route   GET /api/superadmin/reports/:id
// @access  Private/SuperAdmin
const getReportDetails = async (req, res) => {
  try {
    const report = await PlatformReport.findById(req.params.id)
      .populate('generatedBy', 'name email')
      .populate('adminBreakdown.adminId', 'name email shopName adminCode')
      .populate('adminBreakdown.invoiceId');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report details',
      error: error.message
    });
  }
};

// @desc    Generate custom report
// @route   POST /api/superadmin/reports/generate
// @access  Private/SuperAdmin
const generateCustomReport = async (req, res) => {
  try {
    const { startDate, endDate, notes } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    const period = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}_to_${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;

    const report = new PlatformReport({
      period,
      startDate: start,
      endDate: end,
      reportType: 'custom',
      generatedBy: req.user._id,
      status: 'generating',
      notes: notes || ''
    });

    await report.save();

    // Generate report data
    await generateReportData(report);

    res.json({
      success: true,
      message: 'Report generated successfully',
      data: { reportId: report._id }
    });
  } catch (error) {
    console.error('Generate custom report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
};

// Helper function to generate report data
async function generateReportData(report) {
  try {
    const orders = await Order.find({
      createdAt: { $gte: report.startDate, $lte: report.endDate }
    });

    const platformMetrics = {
      totalOrders: orders.length,
      deliveredOrders: orders.filter(o => o.orderStatus === 'delivered').length,
      cancelledOrders: orders.filter(o => o.orderStatus === 'cancelled').length,
      pendingOrders: orders.filter(o => o.orderStatus === 'pending').length,
      totalRevenue: orders
        .filter(o => o.orderStatus === 'delivered')
        .reduce((sum, o) => sum + o.totalAmount, 0),
      totalCommission: 0,
      activeAdmins: await Admin.countDocuments({ accountStatus: 'active' }),
      newCustomers: await User.countDocuments({
        role: 'user',
        createdAt: { $gte: report.startDate, $lte: report.endDate }
      })
    };

    const admins = await Admin.find();
    const adminBreakdown = [];

    for (const admin of admins) {
      const adminOrders = orders.filter(order =>
        order.items.some(item => item.adminId && item.adminId.toString() === admin._id.toString())
      );

      const deliveredOrders = adminOrders.filter(o => o.orderStatus === 'delivered');
      const totalSales = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      let commissionableSales = 0;
      let commissionDue = 0;

      if (admin.lifetimeSales > admin.commission.threshold) {
        commissionableSales = totalSales;
        commissionDue = (commissionableSales * admin.commission.rate) / 100;
      }

      const invoice = await CommissionInvoice.findOne({
        adminId: admin._id,
        period: report.period
      });

      adminBreakdown.push({
        adminId: admin._id,
        adminName: admin.name,
        shopName: admin.shopName || 'N/A',
        totalSales,
        lifetimeSales: admin.lifetimeSales,
        commissionableSales,
        commissionDue,
        numberOfOrders: deliveredOrders.length,
        paymentStatus: invoice ? invoice.status : 'not_applicable',
        invoiceId: invoice ? invoice._id : null
      });

      if (commissionDue > 0) {
        platformMetrics.totalCommission += commissionDue;
      }
    }

    report.platformMetrics = platformMetrics;
    report.adminBreakdown = adminBreakdown;
    report.status = 'completed';
    await report.save();

    return report;
  } catch (error) {
    console.error('Generate report data error:', error);
    report.status = 'failed';
    await report.save();
    throw error;
  }
}

// @desc    Check if phone number is available
// @route   GET /api/auth/check-phone
// @access  Public
const checkPhoneAvailability = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const [userExists, adminExists] = await Promise.all([
      User.findOne({ phone }),
      Admin.findOne({ phone })
    ]);

    const isAvailable = !userExists && !adminExists;

    res.json({
      success: true,
      data: {
        phone,
        available: isAvailable,
        message: isAvailable 
          ? 'Phone number is available' 
          : 'Phone number is already registered'
      }
    });
  } catch (error) {
    console.error('Check phone availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check phone availability',
      error: error.message
    });
  }
};

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
  getAdminCommissionReport,
  getAllInvoices,
  markInvoicePaid,
  getAllReports,
  getReportDetails,
  generateCustomReport,
  checkPhoneAvailability
};
