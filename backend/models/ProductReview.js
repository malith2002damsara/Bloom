const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductReview = sequelize.define('ProductReview', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
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
        args: [10, 1000],
        msg: 'Comment must be between 10 and 1000 characters'
      }
    }
  },
  isVerifiedPurchase: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'approved'
  }
}, {
  tableName: 'product_reviews',
  timestamps: true,
  indexes: [
    { fields: ['productId', 'createdAt'] },
    { fields: ['userId', 'productId', 'orderId'], unique: true },
    { fields: ['rating'] },
    { fields: ['status'] }
  ]
});

// After creating/updating a review, update product ratings
ProductReview.addHook('afterSave', async (review) => {
  const Product = require('./Product');
  const { fn, col } = require('sequelize');
  
  try {
    const stats = await ProductReview.findOne({
      where: {
        productId: review.productId,
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
        { where: { id: review.productId } }
      );
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
});

// After deleting a review, update product ratings
ProductReview.addHook('afterDestroy', async (review) => {
  const Product = require('./Product');
  const { fn, col } = require('sequelize');
  
  try {
    const stats = await ProductReview.findOne({
      where: {
        productId: review.productId,
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
        { where: { id: review.productId } }
      );
    } else {
      await Product.update(
        { ratingsAverage: 0, ratingsCount: 0 },
        { where: { id: review.productId } }
      );
    }
  } catch (error) {
    console.error('Error updating product rating after deletion:', error);
  }
});

module.exports = ProductReview;
