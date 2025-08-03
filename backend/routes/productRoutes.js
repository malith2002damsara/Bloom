const express = require('express');
const {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { auth, adminOnly } = require('../middleware/auth');
const { uploadProductImages, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering, searching, and pagination
// @access  Public
router.get('/', getProducts);

// @route   POST /api/products
// @desc    Create new product (Admin only)
// @access  Private/Admin
router.post('/', auth, adminOnly, uploadProductImages, handleUploadError, createProduct);

// @route   GET /api/products/categories
// @desc    Get all product categories
// @access  Public
router.get('/categories', getCategories);

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', getProductById);

// @route   PUT /api/products/:id
// @desc    Update product (Admin only)
// @access  Private/Admin
router.put('/:id', auth, adminOnly, uploadProductImages, handleUploadError, updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, adminOnly, deleteProduct);

module.exports = router;
