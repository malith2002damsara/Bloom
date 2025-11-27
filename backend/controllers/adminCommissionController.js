const CommissionPayment = require('../models/CommissionPayment');
const Admin = require('../models/Admin');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Get pending commission amount for admin
// @route   GET /api/admin/commission/pending
// @access  Private (Admin only)
const getPendingCommission = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.user.id);
    
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

    const admin = await Admin.findByPk(req.user.id);
    
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

    const admin = await Admin.findByPk(req.user.id);
    
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

    const admin = await Admin.findByPk(req.user.id);
    
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
      admin.commissionTotalDue = Math.max(0, admin.commissionTotalDue - payment.amount);
      admin.earningsLastMonthPaid = new Date();
      
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

    const whereClause = { adminId: req.user.id };
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows: payments } = await CommissionPayment.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
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
    const { Op } = require('sequelize');
    const sequelize = CommissionPayment.sequelize;

    // Get aggregated stats using Sequelize
    const [allStats] = await CommissionPayment.findAll({
      where: { adminId: req.user.id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'paymentCount'],
        [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastPaymentDate'],
        [
          sequelize.fn('SUM', 
            sequelize.literal(`CASE WHEN status IN ('paid', 'verified') THEN amount ELSE 0 END`)
          ),
          'totalPaid'
        ],
        [
          sequelize.fn('SUM', 
            sequelize.literal(`CASE WHEN status = 'pending_verification' THEN amount ELSE 0 END`)
          ),
          'pendingVerification'
        ],
        [
          sequelize.fn('SUM', 
            sequelize.literal(`CASE WHEN status = 'verified' THEN amount ELSE 0 END`)
          ),
          'verified'
        ],
        [
          sequelize.fn('SUM', 
            sequelize.literal(`CASE WHEN status = 'rejected' THEN amount ELSE 0 END`)
          ),
          'rejected'
        ],
        [
          sequelize.fn('COUNT', 
            sequelize.literal(`CASE WHEN status IN ('paid', 'verified') THEN 1 END`)
          ),
          'paidCount'
        ]
      ],
      raw: true
    });

    const stats = {
      totalPaid: parseFloat(allStats.totalPaid || 0),
      pendingVerification: parseFloat(allStats.pendingVerification || 0),
      verified: parseFloat(allStats.verified || 0),
      rejected: parseFloat(allStats.rejected || 0),
      paymentCount: parseInt(allStats.paymentCount || 0),
      lastPaymentDate: allStats.lastPaymentDate,
      averagePayment: allStats.paidCount > 0 
        ? parseFloat(allStats.totalPaid || 0) / parseInt(allStats.paidCount)
        : 0
    };

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
