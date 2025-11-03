const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  // User who submitted the feedback
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Order reference
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // Product reference
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // Admin (seller) reference
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  // Rating (1-5 stars)
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  
  // Comment/Review
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  
  // Feedback status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Auto-approve by default
  },
  
  // Flag for inappropriate content
  isFlagged: {
    type: Boolean,
    default: false
  },
  
  // Helpful votes (optional feature for later)
  helpfulCount: {
    type: Number,
    default: 0
  },
  
  // Metadata
  isVerifiedPurchase: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
feedbackSchema.index({ productId: 1, createdAt: -1 });
feedbackSchema.index({ adminId: 1 });
feedbackSchema.index({ orderId: 1 });
feedbackSchema.index({ userId: 1 });
feedbackSchema.index({ rating: -1 }); // For sorting by rating

// Ensure one feedback per user per product per order
feedbackSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });

// Update product rating after feedback is saved
feedbackSchema.post('save', async function() {
  try {
    const Product = mongoose.model('Product');
    const Feedback = mongoose.model('Feedback');
    
    // Calculate new average rating for this product
    const stats = await Feedback.aggregate([
      {
        $match: {
          productId: this.productId,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    if (stats.length > 0) {
      await Product.findByIdAndUpdate(this.productId, {
        'ratings.average': Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
        'ratings.count': stats[0].count
      });
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
});

// Update product rating after feedback is deleted
feedbackSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      const Product = mongoose.model('Product');
      const Feedback = mongoose.model('Feedback');
      
      const stats = await Feedback.aggregate([
        {
          $match: {
            productId: doc.productId,
            status: 'approved'
          }
        },
        {
          $group: {
            _id: '$productId',
            averageRating: { $avg: '$rating' },
            count: { $sum: 1 }
          }
        }
      ]);
      
      if (stats.length > 0) {
        await Product.findByIdAndUpdate(doc.productId, {
          'ratings.average': Math.round(stats[0].averageRating * 10) / 10,
          'ratings.count': stats[0].count
        });
      } else {
        // No more ratings
        await Product.findByIdAndUpdate(doc.productId, {
          'ratings.average': 0,
          'ratings.count': 0
        });
      }
    } catch (error) {
      console.error('Error updating product rating after deletion:', error);
    }
  }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
