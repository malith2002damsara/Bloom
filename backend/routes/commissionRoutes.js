const express = require('express');
const router = express.Router();
const {
  calculateMonthlyCommission,
  payCommission,
  getCommissionHistory,
  getPendingCommissions,
  generateMonthlyReport
} = require('../controllers/commissionController');
const { auth, adminOnly, superAdminOnly } = require('../middleware/auth');

// Admin routes
router.get('/history', auth, adminOnly, getCommissionHistory);

// SuperAdmin routes
router.post('/calculate/:adminId', auth, superAdminOnly, calculateMonthlyCommission);
router.get('/pending', auth, superAdminOnly, getPendingCommissions);
router.post('/generate-monthly-report', auth, superAdminOnly, generateMonthlyReport);

// Both Admin and SuperAdmin can record payment
router.post('/pay/:transactionId', auth, adminOnly, payCommission);

module.exports = router;
