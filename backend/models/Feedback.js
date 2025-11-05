const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Rating must be at least 1' },
      max: { args: [5], msg: 'Rating cannot exceed 5' }
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Comment is required' },
      len: {
        args: [1, 500],
        msg: 'Comment cannot exceed 500 characters'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'approved'
  },
  isFlagged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isVerifiedPurchase: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'feedback',
  timestamps: true,
  indexes: [
    { fields: ['productId', 'createdAt'] },
    { fields: ['adminId'] },
    { fields: ['orderId'] },
    { fields: ['userId'] },
    { fields: ['rating'] },
    { fields: ['userId', 'productId', 'orderId'], unique: true }
  ]
});

// After create/update feedback, update product ratings
Feedback.addHook('afterSave', async (feedback) => {
  const Product = require('./Product');
  const { fn, col } = require('sequelize');
  
  try {
    const stats = await Feedback.findOne({
      where: {
        productId: feedback.productId,
        status: 'approved'
      },
      attributes: [
        [fn('AVG', col('rating')), 'averageRating'],
        [fn('COUNT', col('id')), 'count']
      ],
      raw: true
    });
    
    if (stats && stats.count > 0) {
      await Product.update(
        {
          ratingsAverage: Math.round(parseFloat(stats.averageRating) * 10) / 10,
          ratingsCount: parseInt(stats.count)
        },
        { where: { id: feedback.productId } }
      );
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
});

// After delete feedback, update product ratings
Feedback.addHook('afterDestroy', async (feedback) => {
  const Product = require('./Product');
  const { fn, col } = require('sequelize');
  
  try {
    const stats = await Feedback.findOne({
      where: {
        productId: feedback.productId,
        status: 'approved'
      },
      attributes: [
        [fn('AVG', col('rating')), 'averageRating'],
        [fn('COUNT', col('id')), 'count']
      ],
      raw: true
    });
    
    if (stats && stats.count > 0) {
      await Product.update(
        {
          ratingsAverage: Math.round(parseFloat(stats.averageRating) * 10) / 10,
          ratingsCount: parseInt(stats.count)
        },
        { where: { id: feedback.productId } }
      );
    } else {
      await Product.update(
        { ratingsAverage: 0, ratingsCount: 0 },
        { where: { id: feedback.productId } }
      );
    }
  } catch (error) {
    console.error('Error updating product rating after deletion:', error);
  }
});

module.exports = Feedback;
