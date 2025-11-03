const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getProductFeedback,
  getTopComments,
  getAdminFeedback,
  checkFeedbackEligibility
} = require('../controllers/feedbackController');
const { auth, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/product/:productId', getProductFeedback);
router.get('/top-comments', getTopComments);

// Customer routes (protected) - regular users only
router.post('/', auth, submitFeedback);
router.get('/check/:orderId', auth, checkFeedbackEligibility);

// Admin routes (protected) - admin or superadmin
router.get('/admin', auth, adminOnly, getAdminFeedback);

module.exports = router;
