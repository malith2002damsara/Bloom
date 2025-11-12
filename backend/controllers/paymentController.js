const Stripe = require('stripe');
const { Order } = require('../models');

// Initialize Stripe with secret key
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// @desc    Create payment intent for Stripe payments
// @route   POST /api/payments/create-payment-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment system is not configured. Please contact support.'
      });
    }

    const { amount, currency = 'usd', paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Validate payment method
    const validMethods = ['card', 'mastercard', 'visa'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Supported methods: card, mastercard, visa'
      });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      payment_method_types: ['card'],
      metadata: {
        userId: req.user.id,
        paymentMethod: paymentMethod
      }
    });

    res.json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify payment status
// @route   POST /api/payments/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment system is not configured'
      });
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if payment was successful
    const isSuccessful = paymentIntent.status === 'succeeded';

    res.json({
      success: true,
      message: isSuccessful ? 'Payment verified successfully' : 'Payment verification failed',
      data: {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
        isSuccessful
      }
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create commission payment intent for admins
// @route   POST /api/payments/commission/create-intent
// @access  Private/Admin
const createCommissionPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment system is not configured'
      });
    }

    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Validate payment method
    const validMethods = ['card', 'mastercard', 'visa', 'cash'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    // For cash payments, skip Stripe
    if (paymentMethod === 'cash') {
      return res.json({
        success: true,
        message: 'Cash payment intent created',
        data: {
          paymentMethod: 'cash',
          amount: amount,
          requiresStripe: false
        }
      });
    }

    // Create a PaymentIntent for card payments
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        adminId: req.user.id,
        paymentType: 'commission',
        paymentMethod: paymentMethod
      }
    });

    res.json({
      success: true,
      message: 'Commission payment intent created successfully',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        requiresStripe: true
      }
    });

  } catch (error) {
    console.error('Create commission payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create commission payment intent',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createPaymentIntent,
  verifyPayment,
  createCommissionPaymentIntent
};
