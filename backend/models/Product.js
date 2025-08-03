const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: ['fresh', 'artificial', 'bears', 'mixed'],
    default: 'fresh'
  },
  occasion: {
    type: String,
    trim: true,
    default: ''
  },
  images: [{
    type: String,
    required: true
  }],
  dimensions: {
    height: {
      type: Number,
      min: [0, 'Height cannot be negative'],
      default: 0
    },
    width: {
      type: Number,
      min: [0, 'Width cannot be negative'],
      default: 0
    },
    depth: {
      type: Number,
      min: [0, 'Depth cannot be negative'],
      default: 0
    }
  },
  
  // Flower bouquet specific fields
  numberOfFlowers: {
    type: Number,
    min: [0, 'Number of flowers cannot be negative'],
    default: 0
  },
  sizes: [{
    size: {
      type: String,
      required: true,
      trim: true
    },
    flowerCount: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    dimensions: {
      height: {
        type: Number,
        min: [0, 'Height cannot be negative'],
        default: 0
      },
      width: {
        type: Number,
        min: [0, 'Width cannot be negative'],
        default: 0
      },
      depth: {
        type: Number,
        min: [0, 'Depth cannot be negative'],
        default: 0
      }
    }
  }],
  
  // Fresh flower selections
  freshFlowerSelections: [{
    flower: {
      type: String,
      required: true,
      trim: true
    },
    colors: [{
      type: String,
      required: true,
      trim: true
    }],
    count: {
      type: String,
      default: ''
    }
  }],
  
  // Artificial flower selections  
  artificialFlowerSelections: [{
    flower: {
      type: String,
      required: true,
      trim: true
    },
    colors: [{
      type: String,
      required: true,
      trim: true
    }],
    count: {
      type: String,
      default: ''
    }
  }],
  
  // Legacy flower selections (for backward compatibility)
  flowerSelections: [{
    flower: {
      type: String,
      required: true,
      trim: true
    },
    colors: [{
      type: String,
      required: true,
      trim: true
    }]
  }],
  
  // Bear specific fields
  bearDetails: {
    sizes: [{
      size: {
        type: String,
        required: true,
        trim: true
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
      },
      dimensions: {
        height: {
          type: Number,
          min: [0, 'Height cannot be negative'],
          default: 0
        },
        width: {
          type: Number,
          min: [0, 'Width cannot be negative'],
          default: 0
        },
        depth: {
          type: Number,
          min: [0, 'Depth cannot be negative'],
          default: 0
        }
      }
    }],
    colors: [{
      type: String,
      trim: true
    }]
  },
  
  seller: {
    name: {
      type: String,
      required: [true, 'Seller name is required'],
      trim: true
    },
    contact: {
      type: String,
      required: [true, 'Seller contact is required'],
      trim: true
    }
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active'
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    count: {
      type: Number,
      default: 0
    }
  },
  sales: {
    count: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
productSchema.index({ category: 1, status: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ 'seller.name': 1 });

// Update status based on stock
productSchema.pre('save', function(next) {
  if (this.stock === 0) {
    this.status = 'out_of_stock';
    this.inStock = false;
  } else if (this.stock > 0 && this.status === 'out_of_stock') {
    this.status = 'active';
    this.inStock = true;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
