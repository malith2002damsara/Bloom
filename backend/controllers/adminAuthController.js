const Admin = require('../models/Admin');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ userId: id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if admin account is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Please contact the Super Administrator.',
        disabled: true
      });
    }

    // Compare password
    const isPasswordMatch = await admin.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get super admin contact for this admin
    const superAdmin = await User.findById(admin.createdBy).select('name email phone');

    // Generate token
    const token = generateToken(admin._id, 'admin');

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          adminCode: admin.adminCode, // Include admin code in login response
          role: admin.role,
          lastLogin: admin.lastLogin,
          superAdminContact: superAdmin ? {
            name: superAdmin.name,
            email: superAdmin.email,
            phone: superAdmin.phone
          } : null
        },
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

    // Find admin
    const admin = await Admin.findById(decoded.userId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found'
      });
    }

    // Check if admin account is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled',
        disabled: true
      });
    }

    // Check if password was changed after token was issued
    if (admin.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password was changed. Please login again.'
      });
    }

    // Get super admin contact
    const superAdmin = await User.findById(admin.createdBy).select('name email phone');

    res.json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          adminCode: admin.adminCode, // Include admin code in verify response
          role: admin.role,
          superAdminContact: superAdmin ? {
            name: superAdmin.name,
            email: superAdmin.email,
            phone: superAdmin.phone
          } : null
        }
      }
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

// @desc    Change Admin Password
// @route   PUT /api/admin/change-password
// @access  Private
const changeAdminPassword = async (req, res) => {
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

    const admin = await Admin.findById(req.user.id).select('+password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save hook)
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again with your new password.'
    });

  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get Admin Profile
// @route   GET /api/admin/profile
// @access  Private
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Get super admin contact
    const superAdmin = await User.findById(admin.createdBy).select('name email phone');

    res.json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          adminCode: admin.adminCode, // Include admin code in profile response
          role: admin.role,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt,
          superAdminContact: superAdmin ? {
            name: superAdmin.name,
            email: superAdmin.email,
            phone: superAdmin.phone
          } : null
        }
      }
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving profile'
    });
  }
};

// @desc    Update Admin Profile
// @route   PUT /api/admin/profile
// @access  Private
const updateAdminProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Update fields
    if (name) admin.name = name;
    if (phone) admin.phone = phone;

    await admin.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          adminCode: admin.adminCode, // Include admin code in update response
          role: admin.role
        }
      }
    });

  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

module.exports = {
  adminLogin,
  verifyAdmin,
  changeAdminPassword,
  getAdminProfile,
  updateAdminProfile
};
