const express = require('express');
const {
  superAdminLogin,
  verifySuperAdmin,
  changeSuperAdminPassword,
  createAdmin,
  getAllAdmins,
  getAdmin,
  updateAdmin,
  activateAdmin,
  deactivateAdmin,
  deleteAdmin,
  getDashboardStats,
  getTransactions,
  generateMonthlyCommissions,
  getTransactionDetails,
  updateTransactionStatus,
  updateTransactionPayment,
  getAdminCommissionReport
} = require('../controllers/superAdminController');
const { auth, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

// Authentication routes
router.post('/login', superAdminLogin);
router.get('/verify', verifySuperAdmin);
router.put('/change-password', auth, superAdminOnly, changeSuperAdminPassword);

// Admin management routes
router.post('/admins', auth, superAdminOnly, createAdmin);
router.get('/admins', auth, superAdminOnly, getAllAdmins);
router.get('/admins/:id', auth, superAdminOnly, getAdmin);
router.put('/admins/:id', auth, superAdminOnly, updateAdmin);
router.patch('/admins/:id/activate', auth, superAdminOnly, activateAdmin);
router.patch('/admins/:id/deactivate', auth, superAdminOnly, deactivateAdmin);
router.delete('/admins/:id', auth, superAdminOnly, deleteAdmin);

// Dashboard and data routes
router.get('/dashboard/stats', auth, superAdminOnly, getDashboardStats);

// Transaction routes
router.get('/transactions', auth, superAdminOnly, getTransactions);
router.post('/transactions/generate-monthly', auth, superAdminOnly, generateMonthlyCommissions);
router.get('/transactions/:id', auth, superAdminOnly, getTransactionDetails);
router.put('/transactions/:id/status', auth, superAdminOnly, updateTransactionStatus);
router.put('/transactions/:id/payment', auth, superAdminOnly, updateTransactionPayment);

// Commission reports
router.get('/admins/:id/commission-report', auth, superAdminOnly, getAdminCommissionReport);

module.exports = router;
