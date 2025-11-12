const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Name is required' },
      len: {
        args: [2, 50],
        msg: 'Name must be between 2 and 50 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Email is required' },
      isEmail: { msg: 'Please enter a valid email' }
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Password is required' },
      len: {
        args: [6, 255],
        msg: 'Password must be at least 6 characters long'
      }
    }
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Phone number is required' },
      len: {
        args: [10, 15],
        msg: 'Phone number must be between 10 and 15 characters'
      }
    }
  },
  adminCode: {
    type: DataTypes.STRING(3),
    unique: true,
    allowNull: true,
    validate: {
      is: {
        args: /^\d{3}$/,
        msg: 'Admin code must be a 3-digit number'
      }
    }
  },
  role: {
    type: DataTypes.STRING(20),
    defaultValue: 'admin',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  accountStatus: {
    type: DataTypes.ENUM('active', 'deactivated', 'suspended'),
    defaultValue: 'active'
  },
  shopName: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  },
  shopDescription: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  address: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  contactInfo: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  },
  lifetimeSales: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  earningsTotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  earningsThisMonth: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  earningsLastMonthPaid: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  commissionThreshold: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 50000
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 10
  },
  commissionTotalDue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  commissionLastPaidDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  commissionNextDueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deactivationReason: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  deactivatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  passwordChangedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'admins',
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['phone'] },
    { fields: ['adminCode'] },
    { fields: ['accountStatus'] },
    { fields: ['lifetimeSales'] },
    { fields: ['createdBy'] }
  ],
  hooks: {
    beforeValidate: async (admin) => {
      // Generate admin code if it doesn't exist
      if (!admin.adminCode) {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
          const randomCode = Math.floor(100 + Math.random() * 900).toString();
          
          try {
            const existing = await Admin.findOne({
              where: { adminCode: randomCode }
            });
            
            if (!existing) {
              admin.adminCode = randomCode;
              break;
            }
          } catch (err) {
            console.error('Error checking admin code uniqueness:', err);
          }
          
          attempts++;
        }
        
        if (attempts >= maxAttempts) {
          throw new Error('Unable to generate unique admin code. Please try again.');
        }
      }
    },
    beforeSave: async (admin) => {
      // Hash password if it's modified
      if (admin.changed('password')) {
        try {
          const salt = await bcrypt.genSalt(10);
          admin.password = await bcrypt.hash(admin.password, salt);
          
          // Set passwordChangedAt if password is being changed (not on creation)
          if (!admin.isNewRecord) {
            admin.passwordChangedAt = new Date(Date.now() - 1000);
          }
        } catch (err) {
          console.error('Error hashing password:', err);
          throw new Error('Failed to process password');
        }
      }
    }
  }
});

// Instance method to compare passwords
Admin.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after JWT was issued
Admin.prototype.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Remove password from JSON output
Admin.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = Admin;
