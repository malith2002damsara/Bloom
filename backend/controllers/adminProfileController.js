const Admin = require('../models/Admin');

// @desc    Get Admin Profile
// @route   GET /api/admin/profile
// @access  Private (Admin only)
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Error getting admin profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving admin profile',
      error: error.message
    });
  }
};

// @desc    Update Admin Profile
// @route   PUT /api/admin/profile
// @access  Private (Admin only)
const updateAdminProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      shopName,
      shopDescription,
      contactInfo,
      address
    } = req.body;

    const admin = await Admin.findByPk(req.user.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if email is being changed and if it's already taken (Sequelize)
    if (email && email !== admin.email) {
      const { Op } = require('sequelize');
      const emailExists = await Admin.findOne({ 
        where: { 
          email, 
          id: { [Op.ne]: req.user.id } 
        } 
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      admin.email = email;
    }

    // Check if phone is being changed and if it's already taken (Sequelize)
    if (phone && phone !== admin.phone) {
      const { Op } = require('sequelize');
      const phoneExists = await Admin.findOne({ 
        where: { 
          phone, 
          id: { [Op.ne]: req.user.id } 
        } 
      });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already in use'
        });
      }
      admin.phone = phone;
    }

    // Update fields
    if (name) admin.name = name;
    if (shopName) admin.shopName = shopName;
    if (shopDescription) admin.shopDescription = shopDescription;
    if (contactInfo) admin.contactInfo = contactInfo;
    if (address) admin.address = address;

    await admin.save();

    // Return admin without password (Sequelize - use attributes)
    const updatedAdmin = await Admin.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating admin profile',
      error: error.message
    });
  }
};

// @desc    Get Admin Shop Info
// @route   GET /api/admin/shop-info
// @access  Private (Admin only)
const getShopInfo = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.user.id, {
      attributes: ['id', 'name', 'shopName', 'shopDescription', 'adminCode', 'contactInfo', 'address', 'isActive']
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        sellerName: admin.name,
        shopName: admin.shopName || admin.name + "'s Shop",
        shopDescription: admin.shopDescription || 'Welcome to our shop!',
        promoCode: admin.adminCode,
        contactInfo: admin.contactInfo,
        address: admin.address,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    console.error('Error getting shop info:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving shop information',
      error: error.message
    });
  }
};

// @desc    Update Admin Password
// @route   PUT /api/admin/profile/password
// @access  Private (Admin only)
const updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const admin = await Admin.findByPk(req.user.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save hook)
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
};

module.exports = {
  getAdminProfile,
  updateAdminProfile,
  getShopInfo,
  updateAdminPassword
};
