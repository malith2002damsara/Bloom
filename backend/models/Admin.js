const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    minlength: [10, 'Phone number must be at least 10 characters'],
    maxlength: [15, 'Phone number cannot exceed 15 characters']
  },
  // Unique Admin Code for customers to filter products
  adminCode: {
    type: String,
    unique: true,
    sparse: true, // Allow unique index with null/undefined values
    trim: true,
    minlength: [3, 'Admin code must be 3 digits'],
    maxlength: [3, 'Admin code must be 3 digits'],
    validate: {
      validator: function(v) {
        // Allow undefined/null (will be generated in pre-save), but if present must be 3 digits
        if (!v) return true;
        return /^\d{3}$/.test(v);
      },
      message: 'Admin code must be a 3-digit number'
    }
  },
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  accountStatus: {
    type: String,
    enum: ['active', 'deactivated', 'suspended'],
    default: 'active',
    index: true
  },
  // Shop Information
  shopName: {
    type: String,
    trim: true,
    default: ''
  },
  shopDescription: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  contactInfo: {
    type: String,
    trim: true,
    default: ''
  },
  // Commission & Transaction Tracking
  lifetimeSales: {
    type: Number,
    default: 0,
    index: true
  },
  earnings: {
    total: {
      type: Number,
      default: 0
    },
    thisMonth: {
      type: Number,
      default: 0
    },
    lastMonthPaid: {
      type: Number,
      default: 0
    }
  },
  commission: {
    threshold: {
      type: Number,
      default: 50000 // Rs. 50,000 threshold before commission applies
    },
    rate: {
      type: Number,
      default: 10 // 10% commission
    },
    totalDue: {
      type: Number,
      default: 0
    },
    lastPaidDate: {
      type: Date,
      default: null
    },
    nextDueDate: {
      type: Date,
      default: null
    }
  },
  // Deactivation tracking for overdue payments
  deactivationReason: {
    type: String,
    default: ''
  },
  deactivatedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  passwordChangedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Combined pre-save hook: Generate admin code and hash password
adminSchema.pre('save', async function(next) {
  try {
    // Generate admin code if it doesn't exist (for new admins or legacy admins)
    if (!this.adminCode) {
      // Generate a simple 3-digit numeric code (100-999)
      let randomCode = Math.floor(100 + Math.random() * 900); // 3-digit: 100-999
      this.adminCode = randomCode.toString();
      
      // Check if code already exists, regenerate if needed
      let codeExists = true;
      let attempts = 0;
      const maxAttempts = 50; // Prevent infinite loop
      
      while (codeExists && attempts < maxAttempts) {
        const existing = await this.constructor.findOne({ 
          adminCode: this.adminCode,
          _id: { $ne: this._id } // Exclude current document
        });
        if (!existing) {
          codeExists = false;
        } else {
          randomCode = Math.floor(100 + Math.random() * 900);
          this.adminCode = randomCode.toString();
          attempts++;
        }
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Unable to generate unique admin code. Please try again.');
      }
    }
    
    // Hash password if modified
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      
      // Set passwordChangedAt if password is being changed (not on creation)
      if (!this.isNew) {
        this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
adminSchema.methods.toJSON = function() {
  const adminObject = this.toObject();
  delete adminObject.password;
  return adminObject;
};

// Check if password was changed after JWT was issued
adminSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

module.exports = mongoose.model('Admin', adminSchema);
