const CommissionPayment = require('../models/CommissionPayment');
const Admin = require('../models/Admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Get pending commission amount for admin
// @route   GET /api/admin/commission/pending
// @access  Private (Admin only)
const getPendingCommission = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const pendingAmount = admin.commission?.totalDue || 0;
    const threshold = admin.commission?.threshold || 50000;
    const rate = admin.commission?.rate || 10;

    res.status(200).json({
      success: true,
      data: {
        pendingAmount,
        threshold,
        rate,
        isActive: admin.isActive,
        lastPaidDate: admin.earnings?.lastMonthPaid || null,
        thisMonthEarnings: admin.earnings?.thisMonth || 0
      }
    });
  } catch (error) {
    console.error('Error getting pending commission:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving pending commission',
      error: error.message
    });
  }
};

// @desc    Pay commission with cash (pending verification)
// @route   POST /api/admin/commission/pay-with-cash
// @access  Private (Admin only)
const payWithCash = async (req, res) => {
  try {
    const { amount, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if amount matches pending commission
    const pendingCommission = admin.commission?.totalDue || 0;
    
    if (amount > pendingCommission) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds pending commission. Pending: Rs. ${pendingCommission.toFixed(2)}`
      });
    }

    // Create payment record
    const payment = await CommissionPayment.create({
      adminId: req.user.id,
      amount,
      paymentMethod: 'cash',
      status: 'pending_verification',
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Cash payment submitted for verification',
      data: payment
    });
  } catch (error) {
    console.error('Error processing cash payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing cash payment',
      error: error.message
    });
  }
};

// @desc    Create Stripe payment intent for commission
// @route   POST /api/admin/commission/create-payment-intent
// @access  Private (Admin only)
const createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if amount matches pending commission
    const pendingCommission = admin.commission?.totalDue || 0;
    
    if (amount > pendingCommission) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds pending commission. Pending: Rs. ${pendingCommission.toFixed(2)}`
      });
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'lkr', // Sri Lankan Rupees
      metadata: {
        adminId: req.user.id.toString(),
        type: 'commission_payment',
        adminName: admin.name,
        adminCode: admin.adminCode
      },
      description: `Commission payment for ${admin.name} (${admin.adminCode})`
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
      error: error.message
    });
  }
};

// @desc    Confirm commission payment with Stripe
// @route   POST /api/admin/commission/confirm-stripe-payment
// @access  Private (Admin only)
const confirmStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID is required'
      });
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Create payment record
    const payment = await CommissionPayment.create({
      adminId: req.user.id,
      amount: amount || paymentIntent.amount / 100,
      paymentMethod: 'stripe',
      status: 'paid',
      stripeTransactionId: paymentIntent.id,
      stripePaymentIntentId: paymentIntent.id,
      receiptUrl: paymentIntent.charges.data[0]?.receipt_url || null
    });

    // Update admin commission
    if (admin.commission) {
      admin.commission.totalDue = Math.max(0, admin.commission.totalDue - payment.amount);
      admin.earnings.lastMonthPaid = new Date();
      
      // Reactivate admin if they were deactivated
      if (!admin.isActive) {
        admin.isActive = true;
      }
      
      await admin.save();
    }

    res.status(200).json({
      success: true,
      message: 'Commission payment successful',
      data: payment
    });
  } catch (error) {
    console.error('Error confirming Stripe payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message
    });
  }
};

// @desc    Get commission payment history
// @route   GET /api/admin/commission/history
// @access  Private (Admin only)
const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { adminId: req.user.id };
    
    if (status) {
      query.status = status;
    }

    const payments = await CommissionPayment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('verifiedBy', 'name email')
      .lean();

    const total = await CommissionPayment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payment history',
      error: error.message
    });
  }
};

// @desc    Get commission payment statistics
// @route   GET /api/admin/commission/stats
// @access  Private (Admin only)
const getCommissionStats = async (req, res) => {
  try {
    const payments = await CommissionPayment.find({ adminId: req.user.id });

    const stats = {
      totalPaid: 0,
      pendingVerification: 0,
      verified: 0,
      rejected: 0,
      paymentCount: payments.length,
      lastPaymentDate: null,
      averagePayment: 0
    };

    payments.forEach(payment => {
      if (payment.status === 'paid' || payment.status === 'verified') {
        stats.totalPaid += payment.amount;
      }
      if (payment.status === 'pending_verification') {
        stats.pendingVerification += payment.amount;
      }
      if (payment.status === 'verified') {
        stats.verified += payment.amount;
      }
      if (payment.status === 'rejected') {
        stats.rejected += payment.amount;
      }
    });

    if (payments.length > 0) {
      stats.averagePayment = stats.totalPaid / payments.filter(p => 
        p.status === 'paid' || p.status === 'verified'
      ).length || 0;
      
      const sortedPayments = payments.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      stats.lastPaymentDate = sortedPayments[0].createdAt;
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting commission stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving commission statistics',
      error: error.message
    });
  }
};

module.exports = {
  getPendingCommission,
  payWithCash,
  createPaymentIntent,
  confirmStripePayment,
  getPaymentHistory,
  getCommissionStats
};
