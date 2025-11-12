const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');
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

    // Find superadmin by email using Sequelize
    const superAdmin = await SuperAdmin.findOne({ 
      where: { email: email.toLowerCase().trim() }
    });

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
    const token = generateToken(superAdmin.id, 'superadmin');

    // Update last login
    superAdmin.lastLogin = new Date();
    await superAdmin.save();

    res.json({
      success: true,
      message: 'SuperAdmin login successful',
      data: {
        admin: {
          id: superAdmin.id,
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

    // Find superadmin using Sequelize
    const superAdmin = await SuperAdmin.findByPk(decoded.userId);

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
          id: superAdmin.id,
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

    // Find superadmin using Sequelize
    const superAdmin = await SuperAdmin.findByPk(req.user.id);
    
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
    let { name, email, password, phone } = req.body;

    console.log('=== Creating Admin ===');
    console.log('Request body:', { name, email, phone, passwordLength: password?.length });

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Normalize email
    email = email.toLowerCase().trim();
    console.log('Normalized email:', email);

    // Check if admin already exists - Sequelize syntax
    console.log('Checking for existing admin with email:', email);
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      console.log('Admin already exists with this email');
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Check if email is used by a regular user - Sequelize syntax
    console.log('Checking if email is used by a user');
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('Email is already used by a user');
      return res.status(400).json({
        success: false,
        message: 'Email is already in use'
      });
    }

    // Check if phone number is already used - Sequelize syntax
    if (phone && phone.trim()) {
      phone = phone.trim();
      console.log('Checking if phone is already used:', phone);
      const phoneExistsInUser = await User.findOne({ where: { phone } });
      if (phoneExistsInUser) {
        console.log('Phone number exists in User table');
        return res.status(400).json({
          success: false,
          message: 'That number already exists, please use another number.'
        });
      }

      const phoneExistsInAdmin = await Admin.findOne({ where: { phone } });
      if (phoneExistsInAdmin) {
        console.log('Phone number exists in Admin table');
        return res.status(400).json({
          success: false,
          message: 'That number already exists, please use another number.'
        });
      }
      const SuperAdmin = require('../models/SuperAdmin');
      const phoneExistsInSuperAdmin = await SuperAdmin.findOne({ where: { phone } });
      if (phoneExistsInSuperAdmin) {
        console.log('Phone number exists in SuperAdmin table');
        return res.status(400).json({
          success: false,
          message: 'That number already exists, please use another number.'
        });
      }
    } else {
      phone = null;
    }

    console.log('Creating new admin record...');
    console.log('Admin data:', { name: name.trim(), email, phone, isActive: true });
    
    // Create new admin - Sequelize syntax
    const newAdmin = await Admin.create({
      name: name.trim(),
      email,
      password,
      phone,
      createdBy: null, // SuperAdmin creating admin, so no user reference
      isActive: true
      // adminCode will be auto-generated by the model pre-save hook
    });

    console.log('Admin created successfully:', newAdmin.id);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        admin: {
          id: newAdmin.id,
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
    console.error('=== Create admin error ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(e => e.message).join(', ');
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: `Validation error: ${validationErrors}`,
        errors: error.errors
      });
    }
    
    // Handle Sequelize unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('Unique constraint error:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    // Handle any other database errors
    if (error.name && error.name.includes('Sequelize')) {
      console.error('Sequelize error type:', error.name);
      console.error('Error original:', error.original);
      return res.status(400).json({
        success: false,
        message: 'Database error: ' + (error.original?.message || error.message)
      });
    }
    
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
    // Sequelize syntax - simplified without the creator relationship
    const admins = await Admin.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        admins,
        count: admins.length
      }
    });

  } catch (error) {
    console.error('Get admins error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admins',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get Single Admin
// @route   GET /api/superadmin/admins/:id
// @access  Private/SuperAdmin
const getAdmin = async (req, res) => {
  try {
    // Sequelize syntax - simplified without the creator relationship
    const admin = await Admin.findByPk(req.params.id);

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
      message: 'Server error while fetching admin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update Admin
// @route   PUT /api/superadmin/admins/:id
// @access  Private/SuperAdmin
const updateAdmin = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    // Sequelize syntax
    const admin = await Admin.findByPk(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if email is being changed and if it's already taken - Sequelize syntax
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ where: { email } });
      const existingUser = await User.findOne({ where: { email } });
      
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
    // Sequelize syntax
    const admin = await Admin.findByPk(req.params.id);

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
    // Sequelize syntax
    const admin = await Admin.findByPk(req.params.id);

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
    // Sequelize syntax
    const admin = await Admin.findByPk(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    await admin.destroy();

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
    const { Op } = require('sequelize');
    
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

    // Admin counts - Sequelize
    try {
      totalAdmins = await Admin.count();
      activeAdmins = await Admin.count({ where: { isActive: true } });
      inactiveAdmins = await Admin.count({ where: { isActive: false } });
    } catch (error) {
      console.error('Error fetching admin counts:', error.message);
    }

    // Product count - Sequelize
    try {
      totalProducts = await Product.count();
    } catch (error) {
      console.error('Error fetching product count:', error.message);
    }

    // Order counts and revenue - Sequelize
    try {
      totalOrders = await Order.count();
      
      const revenueResult = await Order.sum('totalAmount', {
        where: { 
          orderStatus: 'delivered',
          paymentStatus: 'paid'
        }
      });
      totalRevenue = revenueResult || 0;

      pendingOrders = await Order.count({ 
        where: { 
          orderStatus: { [Op.in]: ['pending', 'processing'] }
        }
      });
    } catch (error) {
      console.error('Error fetching order data:', error.message);
    }

    // User count - Sequelize
    try {
      totalUsers = await User.count({ where: { role: 'user' } });
    } catch (error) {
      console.error('Error fetching user count:', error.message);
    }

    // Recent admins - Sequelize
    try {
      recentAdmins = await Admin.findAll({
        attributes: ['id', 'name', 'email', 'isActive', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 5
      });
    } catch (error) {
      console.error('Error fetching recent admins:', error.message);
    }

    // Recent transactions - Sequelize
    try {
      recentTransactions = await Order.findAll({
        attributes: ['id', 'totalAmount', 'orderStatus', 'createdAt'],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }],
        order: [['createdAt', 'DESC']],
        limit: 5
      });
    } catch (error) {
      console.error('Error fetching recent transactions:', error.message);
    }

    // Admin-wise statistics - Sequelize
    try {
      const admins = await Admin.findAll({ 
        where: { isActive: true },
        attributes: ['id', 'name', 'email']
      });
      
      adminWiseStats = await Promise.all(admins.map(async (admin) => {
        try {
          // Get product counts by status for this admin
          const activeProducts = await Product.count({ 
            where: { adminId: admin.id, status: 'active' }
          });
          const inactiveProducts = await Product.count({ 
            where: { adminId: admin.id, status: 'inactive' }
          });
          const outOfStockProducts = await Product.count({ 
            where: { adminId: admin.id, status: 'out_of_stock' }
          });
          const totalProductsForAdmin = await Product.count({ 
            where: { adminId: admin.id }
          });

          const productCounts = {
            active: activeProducts,
            inactive: inactiveProducts,
            out_of_stock: outOfStockProducts,
            total: totalProductsForAdmin
          };

          // Get order count for this admin
          const orderCount = await Order.count({
            where: {
              '$items.adminId$': admin.id
            },
            include: [{
              model: Product,
              as: 'items',
              attributes: []
            }]
          });

          // Simple revenue calculation
          const revenue = 0; // Can be enhanced later with proper order-items relationship

          return {
            adminId: admin.id,
            adminName: admin.name,
            adminEmail: admin.email,
            products: productCounts,
            orders: orderCount,
            revenue: Math.round(revenue * 100) / 100
          };
        } catch (error) {
          console.error(`Error fetching stats for admin ${admin.id}:`, error.message);
          return {
            adminId: admin.id,
            adminName: admin.name,
            adminEmail: admin.email,
            products: { active: 0, inactive: 0, out_of_stock: 0, total: 0 },
            orders: 0,
            revenue: 0
          };
        }
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
      
      const { Op } = require('sequelize');
      const where = {};
      
      // Filter by status
      if (status) {
        where.status = status;
      }
      
      // Filter by payment status
      if (paymentStatus) {
        where.paymentStatus = paymentStatus;
      }
      
      // Filter by type
      if (type) {
        where.type = type;
      }
      
      // Filter by admin
      if (adminId) {
        where.adminId = adminId;
      }
      
      // Filter by period
      if (month) {
        where.periodMonth = parseInt(month);
      }
      if (year) {
        where.periodYear = parseInt(year);
      }
      
      // Filter by date range
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
      }

      const transactions = await Transaction.findAll({
        where,
        include: [
          {
            model: Admin,
            as: 'admin',
            attributes: ['id', 'name', 'email', 'phone']
          },
          {
            model: User,
            as: 'processor',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (page - 1) * limit
      });

      const count = await Transaction.count({ where });

      // Calculate summary statistics with raw query for better performance
      const summaryResult = await sequelize.query(`
        SELECT 
          SUM(CASE WHEN type = 'commission' THEN "commissionAmount" ELSE 0 END) as "totalCommission",
          SUM(CASE WHEN "paymentStatus" = 'paid' THEN "totalAmount" ELSE 0 END) as "totalPaid",
          SUM(CASE WHEN "paymentStatus" = 'unpaid' THEN "totalAmount" ELSE 0 END) as "totalPending",
          SUM(CASE WHEN "paymentStatus" = 'overdue' THEN "totalAmount" ELSE 0 END) as "totalOverdue"
        FROM transactions
        WHERE ${Object.keys(where).length > 0 ? '1=1' : 'TRUE'}
      `, { type: sequelize.QueryTypes.SELECT });

      const summary = summaryResult[0] || {
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
  };// @desc    Generate Monthly Commission Transactions for All Admins
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

    // Get all active admins - PostgreSQL/Sequelize
    const { Op } = require('sequelize');
    const admins = await Admin.findAll({ where: { isActive: true } });
    
    const commissionTransactions = [];
    const errors = [];

    for (const admin of admins) {
      try {
        // Check if commission already exists for this period - PostgreSQL/Sequelize
        // Note: This is simplified - proper Transaction model implementation needed
        console.log(`Skipping commission for admin ${admin.name} - Transaction model needs proper Sequelize implementation`);
        errors.push({
          adminId: admin.id,
          adminName: admin.name,
          error: 'Transaction model needs Sequelize implementation'
        });
        continue;

      } catch (error) {
        console.error(`Error generating commission for admin ${admin.id}:`, error);
        errors.push({
          adminId: admin.id,
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
    const transaction = await Transaction.findByPk(req.params.id)
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

    const transaction = await Transaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    transaction.status = status;
    transaction.processedBy = req.user.id;
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

    const transaction = await Transaction.findByPk(req.params.id);

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

    transaction.processedBy = req.user.id;
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

    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Note: This is a simplified version. Transaction model needs proper Sequelize implementation
    res.json({
      success: true,
      data: {
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email
        },
        commissions: [],
        summary: {
          totalCommissions: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalPending: 0,
          totalOverdue: 0,
          totalRevenue: 0
        },
        message: 'Transaction model needs proper Sequelize implementation for commission reports'
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

    // Note: CommissionInvoice model needs proper Sequelize implementation
    res.json({
      success: true,
      data: {
        invoices: [],
        summary: {
          unpaid: { count: 0, totalAmount: 0 },
          paid: { count: 0, totalAmount: 0 },
          overdue: { count: 0, totalAmount: 0 }
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      },
      message: 'CommissionInvoice model needs proper Sequelize implementation'
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

    // Note: CommissionInvoice model needs proper Sequelize implementation
    res.status(501).json({
      success: false,
      message: 'CommissionInvoice model needs proper Sequelize implementation'
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

    // Note: PlatformReport model needs proper Sequelize implementation
    res.json({
      success: true,
      data: {
        reports: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      },
      message: 'PlatformReport model needs proper Sequelize implementation'
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
    // Note: PlatformReport model needs proper Sequelize implementation
    res.status(501).json({
      success: false,
      message: 'PlatformReport model needs proper Sequelize implementation'
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

    // Note: PlatformReport model needs proper Sequelize implementation
    res.status(501).json({
      success: false,
      message: 'PlatformReport model needs proper Sequelize implementation'
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

    // PostgreSQL/Sequelize
    const [userExists, adminExists] = await Promise.all([
      User.findOne({ where: { phone } }),
      Admin.findOne({ where: { phone } })
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

// @desc    Get all commission payments
// @route   GET /api/superadmin/commission-payments
// @access  SuperAdmin
const getAllCommissionPayments = async (req, res) => {
  try {
    const CommissionPayment = require('../models/CommissionPayment');
    
    const payments = await CommissionPayment.findAll({
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get commission payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission payments',
      error: error.message
    });
  }
};

// @desc    Get commission payment by ID
// @route   GET /api/superadmin/commission-payments/:id
// @access  SuperAdmin
const getCommissionPaymentById = async (req, res) => {
  try {
    const CommissionPayment = require('../models/CommissionPayment');
    const { id } = req.params;

    const payment = await CommissionPayment.findByPk(id, {
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Commission payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get commission payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission payment',
      error: error.message
    });
  }
};

// @desc    Verify/Update commission payment status
// @route   PUT /api/superadmin/commission-payments/:id/verify
// @access  SuperAdmin
const verifyCommissionPayment = async (req, res) => {
  try {
    const CommissionPayment = require('../models/CommissionPayment');
    const { id } = req.params;
    const { status, notes } = req.body;

    const payment = await CommissionPayment.findByPk(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Commission payment not found'
      });
    }

    // Update payment status
    payment.status = status;
    if (notes) payment.notes = notes;
    
    if (status === 'verified' || status === 'paid') {
      payment.verifiedBy = req.user.userId;
      payment.verifiedAt = new Date();
    }

    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Verify commission payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify commission payment',
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
  checkPhoneAvailability,
  getAllCommissionPayments,
  getCommissionPaymentById,
  verifyCommissionPayment
};
