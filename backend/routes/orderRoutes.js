const express = require('express');
const { body } = require('express-validator');
const {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each item'),
  body('items.*.name')
    .notEmpty()
    .withMessage('Product name is required for each item'),
  body('items.*.price')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('customerInfo.name')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required'),
  body('customerInfo.email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('customerInfo.phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('customerInfo.address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('customerInfo.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('total')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Total must be a positive number')
];

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, createOrderValidation, createOrder);

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', auth, getUserOrders);

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', auth, getOrderById);

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', auth, cancelOrder);

// Admin routes
// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin only)
// @access  Private (Admin)
router.get('/admin/all', auth, adminOnly, getAllOrders);

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', auth, adminOnly, [
  body('orderStatus')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status')
], updateOrderStatus);

module.exports = router;
