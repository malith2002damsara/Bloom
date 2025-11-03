const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: {
    type: String,
    default: '/api/placeholder/100/100'
  }
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String
  },
  items: [orderItemSchema],
  customerInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    zip: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    }
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'card', 'paypal'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedDelivery: {
    type: Date,
    required: true
  },
  trackingNumber: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  // Feedback tracking
  feedbackSubmitted: {
    type: Boolean,
    default: false
  },
  feedbackRequestedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `BG-${timestamp.slice(-6)}${random}`;
  }
  next();
});

// Indexes for performance optimization
// CRITICAL: Compound index for user orders with sorting - provides 10-50x speedup
orderSchema.index({ userId: 1, createdAt: -1 }, { name: 'user_orders_by_date' });
orderSchema.index({ userId: 1, orderStatus: 1, createdAt: -1 }, { name: 'user_orders_by_status' });
orderSchema.index({ userId: 1, total: -1 }, { name: 'user_orders_by_amount' });
orderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true }); // Unique order number lookup
orderSchema.index({ orderStatus: 1 }); // Filter by status
orderSchema.index({ 'items.adminId': 1, createdAt: -1 }); // Admin order filtering
orderSchema.index({ 'items.productId': 1 }); // Product lookup in orders
orderSchema.index({ createdAt: -1 }); // Time-based queries

module.exports = mongoose.model('Order', orderSchema);
