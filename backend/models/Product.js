const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Product name is required' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Price cannot be negative' }
    }
  },
  oldPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Old price cannot be negative' }
    }
  },
  discount: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Discount cannot be negative' },
      max: { args: [100], msg: 'Discount cannot exceed 100%' }
    }
  },
  discountedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  category: {
    type: DataTypes.ENUM('fresh', 'artificial', 'bears', 'mixed'),
    defaultValue: 'fresh',
    allowNull: false
  },
  occasion: {
    type: DataTypes.STRING(100),
    defaultValue: ''
  },
  images: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  dimensionsHeight: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  dimensionsWidth: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  dimensionsDepth: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  numberOfFlowers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sizes: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  freshFlowerSelections: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  artificialFlowerSelections: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  flowerSelections: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  bearDetails: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  sellerName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  sellerContact: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  inStock: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Stock cannot be negative' }
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'out_of_stock'),
    defaultValue: 'active'
  },
  ratingsAverage: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Rating cannot be less than 0' },
      max: { args: [5], msg: 'Rating cannot be more than 5' }
    }
  },
  ratingsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  salesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  salesRevenue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  // Virtual field for dimensions (for backward compatibility)
  dimensions: {
    type: DataTypes.VIRTUAL,
    get() {
      return {
        height: this.dimensionsHeight || 0,
        width: this.dimensionsWidth || 0,
        depth: this.dimensionsDepth || 0
      };
    }
  },
  // Virtual field for seller (for backward compatibility)
  seller: {
    type: DataTypes.VIRTUAL,
    get() {
      return {
        name: this.sellerName || '',
        contact: this.sellerContact || ''
      };
    }
  }
}, {
  tableName: 'products',
  timestamps: true,
  indexes: [
    { fields: ['category', 'status'] },
    { fields: ['price'] },
    { fields: ['sellerName'] },
    { fields: ['adminId'] },
    { fields: ['adminId', 'category'] }
  ],
  hooks: {
    beforeSave: (product) => {
      // Auto-calculate discount percentage
      if (product.oldPrice > 0 && product.price > 0 && product.price < product.oldPrice) {
        product.discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100 * 100) / 100;
      } else {
        product.discount = 0;
      }
      
      // Calculate discounted price (same as price for now)
      product.discountedPrice = product.price;
      
      // Update stock status
      if (product.stock === 0) {
        product.status = 'out_of_stock';
        product.inStock = false;
      } else if (product.stock > 0 && product.status === 'out_of_stock') {
        product.status = 'active';
        product.inStock = true;
      }
    }
  }
});

module.exports = Product;
