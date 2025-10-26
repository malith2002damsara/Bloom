const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const mongoose = require('mongoose');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }
    
    let user;
    
    // Check if it's an admin
    if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Admin account not found' 
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ 
          success: false, 
          message: 'Your admin account has been disabled',
          disabled: true
        });
      }

      // Check if password was changed after token was issued
      if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({ 
          success: false, 
          message: 'Password was changed. Please login again.' 
        });
      }
    }
    // Check if it's a superadmin
    else if (decoded.role === 'superadmin') {
      user = await User.findById(decoded.userId).select('-password');
      
      if (!user || user.role !== 'superadmin') {
        return res.status(401).json({ 
          success: false, 
          message: 'SuperAdmin account not found' 
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ 
          success: false, 
          message: 'Your account has been disabled',
          disabled: true
        });
      }

      // Check if password was changed after token was issued
      if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({ 
          success: false, 
          message: 'Password was changed. Please login again.' 
        });
      }
    }
    // Regular user
    else {
      user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: 'User account is deactivated' 
        });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
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
    if (error.name === 'CastError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error in authentication' 
    });
  }
};

const adminOnly = async (req, res, next) => {
  try {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
      next();
    } else {
      res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin or SuperAdmin role required.' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error in admin authentication' 
    });
  }
};

const superAdminOnly = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'superadmin') {
      next();
    } else {
      res.status(403).json({ 
        success: false, 
        message: 'Access denied. SuperAdmin role required.' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error in superadmin authentication' 
    });
  }
};

module.exports = { auth, protect: auth, adminOnly, superAdminOnly };
