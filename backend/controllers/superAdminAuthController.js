const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');

// Generate JWT token
const generateToken = (superAdminId) => {
  return jwt.sign(
    { userId: superAdminId, role: 'superadmin', isSuperAdmin: true },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// @desc    Register super admin
// @route   POST /api/superadmin/auth/register
// @access  Public (should be protected in production)
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if super admin already exists with this email or phone
    const existingSuperAdmin = await SuperAdmin.findOne({
      where: {
        [require('sequelize').Op.or]: [{ email }, { phone }]
      }
    });

    if (existingSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: existingSuperAdmin.email === email
          ? 'Super admin with this email already exists'
          : 'Super admin with this phone number already exists'
      });
    }

    // Create super admin
    const superAdmin = await SuperAdmin.create({
      name,
      email,
      phone,
      password,
      role: 'superadmin'
    });

    // Generate token
    const token = generateToken(superAdmin.id);

    res.status(201).json({
      success: true,
      message: 'Super admin registered successfully',
      token,
      superAdmin: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        phone: superAdmin.phone,
        role: superAdmin.role,
        permissions: superAdmin.permissions
      }
    });
  } catch (error) {
    console.error('Super admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during super admin registration',
      error: error.message
    });
  }
};

// @desc    Login super admin
// @route   POST /api/superadmin/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find super admin by email
    const superAdmin = await SuperAdmin.findOne({
      where: { email },
      attributes: { include: ['password'] }
    });

    if (!superAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if super admin is active
    if (!superAdmin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await superAdmin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    superAdmin.lastLogin = new Date();
    await superAdmin.save();

    // Generate token
    const token = generateToken(superAdmin.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      superAdmin: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        phone: superAdmin.phone,
        role: superAdmin.role,
        permissions: superAdmin.permissions,
        lastLogin: superAdmin.lastLogin
      }
    });
  } catch (error) {
    console.error('Super admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get super admin profile
// @route   GET /api/superadmin/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const superAdmin = await SuperAdmin.findByPk(req.user.id);

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super admin not found'
      });
    }

    res.json({
      success: true,
      superAdmin: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        phone: superAdmin.phone,
        role: superAdmin.role,
        permissions: superAdmin.permissions,
        lastLogin: superAdmin.lastLogin,
        createdAt: superAdmin.createdAt
      }
    });
  } catch (error) {
    console.error('Get super admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: error.message
    });
  }
};

// @desc    Update super admin profile
// @route   PUT /api/superadmin/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const superAdmin = await SuperAdmin.findByPk(req.user.id);

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super admin not found'
      });
    }

    // Check if phone is being changed and already exists
    if (phone && phone !== superAdmin.phone) {
      const existingSuperAdmin = await SuperAdmin.findOne({
        where: { phone }
      });

      if (existingSuperAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already in use'
        });
      }
    }

    // Update fields
    if (name) superAdmin.name = name;
    if (phone) superAdmin.phone = phone;

    await superAdmin.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      superAdmin: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        phone: superAdmin.phone,
        role: superAdmin.role
      }
    });
  } catch (error) {
    console.error('Update super admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message
    });
  }
};

// @desc    Change super admin password
// @route   PUT /api/superadmin/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
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

    const superAdmin = await SuperAdmin.findByPk(req.user.id, {
      attributes: { include: ['password'] }
    });

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super admin not found'
      });
    }

    // Verify current password
    const isPasswordValid = await superAdmin.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    superAdmin.password = newPassword;
    await superAdmin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change super admin password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password',
      error: error.message
    });
  }
};
