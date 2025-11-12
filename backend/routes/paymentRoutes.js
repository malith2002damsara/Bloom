const express = require('express');
const {
  createPaymentIntent,
  verifyPayment,
  createCommissionPaymentIntent
} = require('../controllers/paymentController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create payment intent for customer orders
// @access  Private
router.post('/create-payment-intent', auth, createPaymentIntent);

// @route   POST /api/payments/verify-payment
// @desc    Verify payment status
// @access  Private
router.post('/verify-payment', auth, verifyPayment);

// @route   POST /api/payments/commission/create-intent
// @desc    Create commission payment intent for admins
// @access  Private/Admin
router.post('/commission/create-intent', auth, adminOnly, createCommissionPaymentIntent);

module.exports = router;
