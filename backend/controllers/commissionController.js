const Admin = require('../models/Admin');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const mongoose = require('mongoose');

/**
 * Commission System Business Logic:
 * 1. Super Admin gets 10% of each delivered order
 * 2. Commission applies only AFTER admin earns first Rs. 50,000
 * 3. Admin must pay monthly
 * 4. Admin has 14 days after due date to pay
 * 5. Auto-deactivate admin if payment not received within grace period
 */

// @desc    Calculate monthly commission for an admin
// @route   POST /api/commission/calculate/:adminId
// @access  Private (SuperAdmin)
const calculateMonthlyCommission = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { month, year } = req.body;

    console.log('=== CALCULATE MONTHLY COMMISSION ===');
    console.log('Admin ID:', adminId);
    console.log('Period:', { month, year });

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Get all delivered orders for this admin in the specified month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const deliveredOrders = await Order.find({
      'items.adminId': adminId,
      orderStatus: 'delivered',
      updatedAt: { $gte: startDate, $lte: endDate }
    });

    console.log(`Found ${deliveredOrders.length} delivered orders`);

    // Calculate admin's revenue from these orders
    let adminRevenue = 0;
    let orderCount = 0;

    deliveredOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.adminId.toString() === adminId) {
          adminRevenue += item.price * item.quantity;
          orderCount++;
        }
      });
    });

    console.log(`Admin Revenue: Rs. ${adminRevenue}`);

    // Update admin's total earnings
    admin.earnings.total += adminRevenue;
    admin.earnings.thisMonth = adminRevenue;

    let commissionAmount = 0;
    let commissionApplies = false;

    // Check if commission threshold is reached
    if (admin.earnings.total >= admin.commission.threshold) {
      commissionApplies = true;
      commissionAmount = (adminRevenue * admin.commission.rate) / 100;
      admin.commission.totalDue += commissionAmount;
      
      // Set next due date (end of month + 1 day)
      const nextDueDate = new Date(year, month, 1);
      admin.commission.nextDueDate = nextDueDate;
    }

    await admin.save();

    // Create transaction record
    const transaction = new Transaction({
      type: 'commission',
      adminId,
      adminRevenue,
      commissionRate: admin.commission.rate,
      commissionAmount,
      totalAmount: commissionAmount,
      period: { month, year },
      status: 'pending',
      paymentStatus: commissionApplies ? 'unpaid' : 'not_applicable',
      dueDate: admin.commission.nextDueDate,
      orderStats: {
        totalOrders: deliveredOrders.length,
        completedOrders: deliveredOrders.length
      },
      description: commissionApplies 
        ? `Monthly commission for ${month}/${year}` 
        : `Revenue below threshold (Rs. ${admin.commission.threshold})`
    });

    await transaction.save();

    console.log('✅ Commission calculated successfully');

    res.json({
      success: true,
      message: 'Monthly commission calculated successfully',
      data: {
        transaction,
        adminEarnings: admin.earnings,
        commissionApplies,
        threshold: admin.commission.threshold
      }
    });

  } catch (error) {
    console.error('Calculate commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating commission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Record commission payment
// @route   POST /api/commission/pay/:transactionId
// @access  Private (Admin or SuperAdmin)
const payCommission = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { paymentMethod, paymentReference, cardLastFour, cardType } = req.body;

    console.log('=== PAY COMMISSION ===');
    console.log('Transaction ID:', transactionId);
    console.log('Payment Method:', paymentMethod);

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This commission has already been paid'
      });
    }

    // Validate payment method
    const validMethods = ['cash', 'mastercard', 'visa', 'bank_transfer', 'digital_wallet'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    // Update transaction
    transaction.paymentMethod = paymentMethod;
    transaction.paymentStatus = 'paid';
    transaction.status = 'completed';
    transaction.paidAt = new Date();
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();

    if (paymentReference) {
      transaction.paymentReference = paymentReference;
    }

    // Add card payment details if applicable
    if (paymentMethod === 'mastercard' || paymentMethod === 'visa') {
      transaction.paymentTransaction = {
        cardLastFour: cardLastFour || '',
        cardType: cardType || paymentMethod
      };
    }

    await transaction.save();

    // Update admin commission status
    const admin = await Admin.findById(transaction.adminId);
    if (admin) {
      admin.commission.totalDue -= transaction.commissionAmount;
      admin.commission.lastPaidDate = new Date();
      admin.earnings.lastMonthPaid = transaction.adminRevenue;
      
      // Reactivate admin if they were deactivated for non-payment
      if (!admin.isActive && admin.deactivationReason.includes('commission')) {
        admin.isActive = true;
        admin.deactivationReason = '';
        admin.deactivatedAt = null;
      }
      
      await admin.save();
    }

    console.log('✅ Commission payment recorded successfully');

    res.json({
      success: true,
      message: 'Commission payment recorded successfully',
      data: {
        transaction,
        admin: {
          remainingDue: admin.commission.totalDue,
          lastPaidDate: admin.commission.lastPaidDate
        }
      }
    });

  } catch (error) {
    console.error('Pay commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get admin's commission history
// @route   GET /api/commission/history
// @access  Private (Admin)
const getCommissionHistory = async (req, res) => {
  try {
    const adminId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    console.log('=== GET COMMISSION HISTORY ===');
    console.log('Admin ID:', adminId);

    const [transactions, total, admin] = await Promise.all([
      Transaction.find({ adminId, type: 'commission' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments({ adminId, type: 'commission' }),
      Admin.findById(adminId).select('earnings commission adminCode')
    ]);

    console.log(`Retrieved ${transactions.length} transactions`);

    res.json({
      success: true,
      message: 'Commission history retrieved successfully',
      data: {
        transactions,
        admin: {
          adminCode: admin.adminCode,
          totalEarnings: admin.earnings.total,
          currentDue: admin.commission.totalDue,
          nextDueDate: admin.commission.nextDueDate,
          threshold: admin.commission.threshold,
          rate: admin.commission.rate
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
    console.error('Get commission history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving commission history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all pending commissions (SuperAdmin)
// @route   GET /api/commission/pending
// @access  Private (SuperAdmin)
const getPendingCommissions = async (req, res) => {
  try {
    console.log('=== GET PENDING COMMISSIONS ===');

    const pendingTransactions = await Transaction.find({
      type: 'commission',
      paymentStatus: { $in: ['unpaid', 'overdue'] }
    })
      .populate('adminId', 'name email phone adminCode earnings commission')
      .sort({ dueDate: 1 })
      .lean();

    // Calculate total pending amount
    const totalPending = pendingTransactions.reduce((sum, t) => sum + t.commissionAmount, 0);

    // Check for overdue payments and update status
    const now = new Date();
    const updatePromises = [];

    pendingTransactions.forEach(transaction => {
      if (transaction.dueDate && now > new Date(transaction.dueDate)) {
        // Mark as overdue
        if (transaction.paymentStatus !== 'overdue') {
          updatePromises.push(
            Transaction.findByIdAndUpdate(transaction._id, {
              paymentStatus: 'overdue'
            })
          );
        }

        // Check if grace period (14 days) has passed
        const gracePeriodEnd = new Date(transaction.dueDate);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 14);

        if (now > gracePeriodEnd && transaction.adminId.isActive) {
          // Auto-deactivate admin
          updatePromises.push(
            Admin.findByIdAndUpdate(transaction.adminId._id, {
              isActive: false,
              deactivationReason: 'Overdue commission payment - grace period expired',
              deactivatedAt: new Date()
            })
          );
        }
      }
    });

    await Promise.all(updatePromises);

    console.log(`Found ${pendingTransactions.length} pending commissions`);

    res.json({
      success: true,
      message: 'Pending commissions retrieved successfully',
      data: {
        transactions: pendingTransactions,
        summary: {
          totalPending,
          count: pendingTransactions.length
        }
      }
    });

  } catch (error) {
    console.error('Get pending commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving pending commissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Generate monthly report for all admins
// @route   POST /api/commission/generate-monthly-report
// @access  Private (SuperAdmin)
const generateMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.body;

    console.log('=== GENERATE MONTHLY REPORT ===');
    console.log('Period:', { month, year });

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide month and year'
      });
    }

    // Get all active admins
    const admins = await Admin.find({ isActive: true });
    
    console.log(`Processing ${admins.length} admins`);

    const reports = [];
    let totalCommission = 0;
    let totalRevenue = 0;

    for (const admin of admins) {
      // Get delivered orders for this admin in the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const deliveredOrders = await Order.find({
        'items.adminId': admin._id,
        orderStatus: 'delivered',
        updatedAt: { $gte: startDate, $lte: endDate }
      });

      // Calculate revenue
      let adminRevenue = 0;
      deliveredOrders.forEach(order => {
        order.items.forEach(item => {
          if (item.adminId.toString() === admin._id.toString()) {
            adminRevenue += item.price * item.quantity;
          }
        });
      });

      // Calculate commission if threshold reached
      let commissionAmount = 0;
      let commissionApplies = false;

      if (admin.earnings.total >= admin.commission.threshold) {
        commissionApplies = true;
        commissionAmount = (adminRevenue * admin.commission.rate) / 100;
      }

      totalRevenue += adminRevenue;
      totalCommission += commissionAmount;

      reports.push({
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          adminCode: admin.adminCode
        },
        revenue: adminRevenue,
        commission: commissionAmount,
        commissionApplies,
        totalEarnings: admin.earnings.total,
        threshold: admin.commission.threshold,
        orderCount: deliveredOrders.length
      });
    }

    console.log('✅ Monthly report generated successfully');

    res.json({
      success: true,
      message: 'Monthly report generated successfully',
      data: {
        period: { month, year },
        summary: {
          totalRevenue,
          totalCommission,
          adminsCount: admins.length
        },
        reports
      }
    });

  } catch (error) {
    console.error('Generate monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating monthly report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  calculateMonthlyCommission,
  payCommission,
  getCommissionHistory,
  getPendingCommissions,
  generateMonthlyReport
};
