const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Submit feedback for a delivered order
// @route   POST /api/feedback
// @access  Private (Customer)
const submitFeedback = async (req, res) => {
  try {
    const { orderId, productId, rating, comment } = req.body;
    const userId = req.user._id;

    console.log('=== SUBMIT FEEDBACK ===');
    console.log('User ID:', userId);
    console.log('Order ID:', orderId);
    console.log('Product ID:', productId);
    console.log('Rating:', rating);

    // Validate required fields
    if (!orderId || !productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: orderId, productId, rating, and comment'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if order exists and belongs to user
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is delivered
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for delivered orders'
      });
    }

    // Check if product is in the order
    const orderItem = order.items.find(item => item.productId.toString() === productId);
    if (!orderItem) {
      return res.status(400).json({
        success: false,
        message: 'Product not found in this order'
      });
    }

    // Get product to retrieve adminId
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({ userId, productId, orderId });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this product'
      });
    }

    // Create feedback
    const feedback = new Feedback({
      userId,
      orderId,
      productId,
      adminId: product.adminId,
      rating,
      comment: comment.trim(),
      status: 'approved', // Auto-approve
      isVerifiedPurchase: true
    });

    await feedback.save();

    // Mark order as feedback submitted
    order.feedbackSubmitted = true;
    await order.save();

    console.log('✅ Feedback submitted successfully');

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback!',
      data: { feedback }
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this product'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while submitting feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get feedback for a specific product
// @route   GET /api/feedback/product/:productId
// @access  Public
const getProductFeedback = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    console.log('=== GET PRODUCT FEEDBACK ===');
    console.log('Product ID:', productId);

    // Get latest 10 approved feedbacks with highest ratings first
    const feedbacks = await Feedback.find({
      productId,
      status: 'approved'
    })
      .populate('userId', 'name')
      .select('rating comment createdAt userId isVerifiedPurchase helpfulCount')
      .sort({ rating: -1, createdAt: -1 }) // Sort by rating (highest first), then newest
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Feedback.countDocuments({
      productId,
      status: 'approved'
    });

    // Calculate rating distribution
    const ratingStats = await Feedback.aggregate([
      {
        $match: {
          productId: require('mongoose').Types.ObjectId(productId),
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    const ratingDistribution = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };
    ratingStats.forEach(stat => {
      ratingDistribution[stat._id] = stat.count;
    });

    console.log(`✅ Retrieved ${feedbacks.length} feedbacks`);

    res.json({
      success: true,
      message: 'Feedback retrieved successfully',
      data: {
        feedbacks,
        ratingDistribution,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get product feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get top 10 latest comments across all products
// @route   GET /api/feedback/top-comments
// @access  Public
const getTopComments = async (req, res) => {
  try {
    console.log('=== GET TOP 10 COMMENTS ===');

    const topComments = await Feedback.find({
      status: 'approved'
    })
      .populate('userId', 'name')
      .populate('productId', 'name images')
      .select('rating comment createdAt userId productId isVerifiedPurchase')
      .sort({ rating: -1, createdAt: -1 })
      .limit(10)
      .lean();

    console.log(`✅ Retrieved ${topComments.length} top comments`);

    res.json({
      success: true,
      message: 'Top comments retrieved successfully',
      data: {
        comments: topComments
      }
    });

  } catch (error) {
    console.error('Get top comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving top comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get feedback for admin's products
// @route   GET /api/feedback/admin
// @access  Private (Admin)
const getAdminFeedback = async (req, res) => {
  try {
    const adminId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const productId = req.query.productId;

    console.log('=== GET ADMIN FEEDBACK ===');
    console.log('Admin ID:', adminId);

    const query = { adminId, status: 'approved' };
    if (productId) {
      query.productId = productId;
    }

    const feedbacks = await Feedback.find(query)
      .populate('userId', 'name')
      .populate('productId', 'name images')
      .populate('orderId', 'orderNumber')
      .select('rating comment createdAt userId productId orderId isVerifiedPurchase')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Feedback.countDocuments(query);

    // Calculate average rating for admin's products
    const avgRating = await Feedback.aggregate([
      {
        $match: {
          adminId: require('mongoose').Types.ObjectId(adminId),
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalFeedbacks: { $sum: 1 }
        }
      }
    ]);

    console.log(`✅ Retrieved ${feedbacks.length} feedbacks for admin`);

    res.json({
      success: true,
      message: 'Admin feedback retrieved successfully',
      data: {
        feedbacks,
        statistics: avgRating.length > 0 ? {
          averageRating: Math.round(avgRating[0].averageRating * 10) / 10,
          totalFeedbacks: avgRating[0].totalFeedbacks
        } : {
          averageRating: 0,
          totalFeedbacks: 0
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get admin feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving admin feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Check if user can submit feedback for an order
// @route   GET /api/feedback/check/:orderId
// @access  Private (Customer)
const checkFeedbackEligibility = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: orderId, userId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const eligibility = {
      canSubmit: order.orderStatus === 'delivered' && !order.feedbackSubmitted,
      orderStatus: order.orderStatus,
      feedbackSubmitted: order.feedbackSubmitted,
      products: []
    };

    // Check which products need feedback
    if (eligibility.canSubmit) {
      for (const item of order.items) {
        const existingFeedback = await Feedback.findOne({
          userId,
          productId: item.productId,
          orderId
        });

        eligibility.products.push({
          productId: item.productId,
          productName: item.name,
          hasFeedback: !!existingFeedback
        });
      }
    }

    res.json({
      success: true,
      data: eligibility
    });

  } catch (error) {
    console.error('Check feedback eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking feedback eligibility',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  submitFeedback,
  getProductFeedback,
  getTopComments,
  getAdminFeedback,
  checkFeedbackEligibility
};
