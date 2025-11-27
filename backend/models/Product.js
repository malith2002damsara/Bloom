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
  // Base price (lowest price from all sizes)
  price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Price cannot be negative' }
    }
  },
  // Base old price (corresponding to the lowest price item)
  oldPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Old price cannot be negative' }
    }
  },
  // Base discount percentage
  discount: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Discount cannot be negative' },
      max: { args: [100], msg: 'Discount cannot exceed 100%' }
    }
  },
  // Discounted price (calculated from price and discount)
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
  // General dimensions (optional, for backward compatibility)
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
  // Sizes array with complete data: {size, flowerCount, price, oldPrice, discount, dimensions: {height, width, depth}}
  sizes: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  
  // ============================================
  // SEPARATE COLUMNS FOR EACH SIZE - SMALL
  // ============================================
  smallPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  smallOldPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  smallDiscount: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: null,
    allowNull: true
  },
  smallDiscountedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  smallFlowerCount: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  smallDimensionsHeight: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  smallDimensionsWidth: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  smallDimensionsDepth: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  
  // ============================================
  // SEPARATE COLUMNS FOR EACH SIZE - MEDIUM
  // ============================================
  mediumPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  mediumOldPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  mediumDiscount: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: null,
    allowNull: true
  },
  mediumDiscountedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  mediumFlowerCount: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  mediumDimensionsHeight: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  mediumDimensionsWidth: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  mediumDimensionsDepth: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  
  // ============================================
  // SEPARATE COLUMNS FOR EACH SIZE - LARGE
  // ============================================
  largePrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  largeOldPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  largeDiscount: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: null,
    allowNull: true
  },
  largeDiscountedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  largeFlowerCount: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  largeDimensionsHeight: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  largeDimensionsWidth: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  largeDimensionsDepth: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  
  // ============================================
  // SEPARATE COLUMNS FOR EACH SIZE - EXTRA LARGE
  // ============================================
  extraLargePrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  extraLargeOldPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  extraLargeDiscount: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: null,
    allowNull: true
  },
  extraLargeDiscountedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  extraLargeFlowerCount: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  extraLargeDimensionsHeight: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  extraLargeDimensionsWidth: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
  },
  extraLargeDimensionsDepth: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
    allowNull: true
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
  // Bear details with sizes: {sizes: [{size, price, oldPrice, discount, dimensions}], colors: []}
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
      console.log('\n🔧 === PRODUCT MODEL beforeSave HOOK ===');
      console.log('Product ID:', product.id || 'NEW PRODUCT');
      
      console.log('\n📊 VALIDATION & CALCULATIONS:');
      console.log('├─ Price Data:');
      console.log('│  ├─ price:', product.price);
      console.log('│  ├─ oldPrice:', product.oldPrice);
      console.log('│  ├─ discount:', product.discount + '%');
      console.log('│  └─ discountedPrice:', product.discountedPrice);
      
      console.log('├─ Dimensions:');
      console.log('│  ├─ height:', product.dimensionsHeight);
      console.log('│  ├─ width:', product.dimensionsWidth);
      console.log('│  └─ depth:', product.dimensionsDepth);
      
      console.log('├─ Size-specific data (JSONB):');
      if (product.category === 'bears' && product.bearDetails?.sizes) {
        console.log('│  └─ Bear sizes:', product.bearDetails.sizes.length, 'sizes with individual prices & dimensions');
        product.bearDetails.sizes.forEach(size => {
          console.log('│      ├─', size.size + ':', 'Rs.' + size.price, '(Old: Rs.' + size.oldPrice + ', Discount: ' + size.discount + '%)');
          console.log('│      └─  Dimensions:', size.dimensions);
        });
      } else if (product.sizes && Array.isArray(product.sizes)) {
        console.log('│  └─ Flower sizes:', product.sizes.length, 'sizes with individual prices & dimensions');
        product.sizes.forEach(size => {
          console.log('│      ├─', size.size + ':', size.flowerCount, 'flowers, Rs.' + size.price, '(Old: Rs.' + size.oldPrice + ', Discount: ' + size.discount + '%)');
          console.log('│      └─  Dimensions:', size.dimensions);
        });
      }
      
      console.log('└─ Flower selections:');
      console.log('   ├─ Fresh:', (product.freshFlowerSelections?.length || 0), 'types');
      console.log('   ├─ Artificial:', (product.artificialFlowerSelections?.length || 0), 'types');
      console.log('   └─ Total flowers:', product.numberOfFlowers);
      
      // Validate discount percentage
      if (product.discount < 0) {
        console.log('⚠️  Correcting negative discount to 0');
        product.discount = 0;
      }
      if (product.discount > 100) {
        console.log('⚠️  Correcting discount > 100% to 100');
        product.discount = 100;
      }
      
      // Calculate discounted price as savings amount (oldPrice - price)
      if (product.oldPrice > 0 && product.price > 0 && product.oldPrice > product.price) {
        product.discountedPrice = product.oldPrice - product.price;
        console.log('💰 Savings calculated: Rs.' + product.discountedPrice);
      } else {
        product.discountedPrice = 0;
      }
      
      // Update stock status
      if (product.stock === 0) {
        product.status = 'out_of_stock';
        product.inStock = false;
        console.log('📦 Stock Status: OUT OF STOCK');
      } else if (product.stock > 0 && product.status === 'out_of_stock') {
        product.status = 'active';
        product.inStock = true;
        console.log('📦 Stock Status: IN STOCK (' + product.stock + ' units)');
      } else {
        console.log('📦 Stock Status:', product.status.toUpperCase(), '(' + product.stock + ' units)');
      }
      
      console.log('\n✅ All validations passed. Ready to save to database.\n');
    }
  }
});

module.exports = Product;