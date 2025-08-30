const jwt = require('jsonwebtoken');
const User = require('../models/User');
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
    
    // Handle admin and superadmin users (with string IDs like 'admin_1' or 'superadmin_1')
    if ((decoded.role === 'admin' || decoded.role === 'superadmin') && typeof decoded.userId === 'string' && !mongoose.Types.ObjectId.isValid(decoded.userId)) {
      // Handle hardcoded admin user
      if (decoded.userId === 'admin_1' && decoded.role === 'admin') {
        const adminUser = {
          _id: 'admin_1',
          id: 'admin_1',
          email: process.env.ADMIN_EMAIL,
          name: 'Admin User',
          role: 'admin',
          isActive: true
        };
        req.user = adminUser;
        return next();
      } 
      // Handle hardcoded superadmin user
      else if (decoded.userId === 'superadmin_1' && decoded.role === 'superadmin') {
        const superAdminUser = {
          _id: 'superadmin_1',
          id: 'superadmin_1',
          email: process.env.SUPERADMIN_EMAIL,
          name: 'Super Administrator',
          role: 'superadmin',
          isActive: true
        };
        req.user = superAdminUser;
        return next();
      } else {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid admin/superadmin token' 
        });
      }
    }
    
    // Handle regular users with MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid user token format' 
      });
    }
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid, user not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'User account is deactivated' 
      });
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
