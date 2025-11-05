const { Admin, Transaction, Order } = require('../models');
const { Op } = require('sequelize');

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

    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Get all delivered orders for this admin in the specified month - PostgreSQL/Sequelize
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Note: This needs proper implementation based on your Order-Items relationship
    const deliveredOrders = await Order.findAll({
      where: {
        orderStatus: 'delivered',
        updatedAt: { [Op.between]: [startDate, endDate] }
      }
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
    admin.earningsTotal += adminRevenue;
    admin.earningsThisMonth = adminRevenue;

    let commissionAmount = 0;
    let commissionApplies = false;

    // Check if commission threshold is reached
    if (admin.earningsTotal >= admin.commissionThreshold) {
      commissionApplies = true;
      commissionAmount = (adminRevenue * admin.commissionRate) / 100;
      admin.commissionTotalDue += commissionAmount;
      
      // Set next due date (end of month + 1 day)
      const nextDueDate = new Date(year, month, 1);
      admin.commissionNextDueDate = nextDueDate;
    }

    await admin.save();

    // Create transaction record - PostgreSQL/Sequelize
    // Note: Transaction model needs proper implementation
    console.log('Transaction model needs proper Sequelize implementation');
    const transaction = {
      type: 'commission',
      adminId,
      adminRevenue,
      commissionRate: admin.commissionRate,
      commissionAmount,
      totalAmount: commissionAmount,
      status: 'pending',
      paymentStatus: commissionApplies ? 'unpaid' : 'not_applicable',
      description: commissionApplies 
        ? `Monthly commission for ${month}/${year}` 
        : `Revenue below threshold (Rs. ${admin.commissionThreshold})`
    };

    console.log('✅ Commission calculated successfully');

    res.json({
      success: true,
      message: 'Monthly commission calculated successfully',
      data: {
        transaction,
        adminEarnings: admin.earnings,
        commissionApplies,
        threshold: admin.commissionThreshold
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

    const transaction = await Transaction.findByPk(transactionId);
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
    transaction.processedBy = req.user.id;
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
    const admin = await Admin.findByPk(transaction.adminId);
    if (admin) {
      admin.commissionTotalDue -= transaction.commissionAmount;
      admin.commissionLastPaidDate = new Date();
      admin.earningsLastMonthPaid = transaction.adminRevenue;
      
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
          remainingDue: admin.commissionTotalDue,
          lastPaidDate: admin.commissionLastPaidDate
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
    const adminId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    console.log('=== GET COMMISSION HISTORY ===');
    console.log('Admin ID:', adminId);

    // Note: Transaction model needs proper Sequelize implementation
    const [transactions, total, admin] = await Promise.all([
      Promise.resolve([]), // Transaction.findAll - needs implementation
      Promise.resolve(0),  // Transaction.count - needs implementation
      Admin.findByPk(adminId, {
        attributes: ['earningsTotal', 'commissionThreshold', 'commissionRate', 'adminCode', 'commissionTotalDue', 'commissionNextDueDate']
      })
    ]);

    console.log(`Retrieved ${transactions.length} transactions`);

    res.json({
      success: true,
      message: 'Commission history retrieved successfully',
      data: {
        transactions,
        admin: {
          adminCode: admin.adminCode,
          totalEarnings: admin.earningsTotal,
          currentDue: admin.commissionTotalDue,
          nextDueDate: admin.commissionNextDueDate,
          threshold: admin.commissionThreshold,
          rate: admin.commissionRate
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

    // PostgreSQL/Sequelize query with associations
    const pendingTransactions = await Transaction.findAll({
      where: {
        type: 'commission',
        paymentStatus: {
          [Op.in]: ['unpaid', 'overdue']
        }
      },
      include: [{
        model: Admin,
        as: 'admin',
        attributes: ['name', 'email', 'phone', 'adminCode', 'earningsTotal', 'commissionRate']
      }],
      order: [['dueDate', 'ASC']]
    });

    // Calculate total pending amount
    const totalPending = pendingTransactions.reduce((sum, t) => sum + parseFloat(t.commissionAmount), 0);

    // Check for overdue payments and update status
    const now = new Date();
    const updatePromises = [];

    pendingTransactions.forEach(transaction => {
      if (transaction.dueDate && now > new Date(transaction.dueDate)) {
        // Mark as overdue
        if (transaction.paymentStatus !== 'overdue') {
          updatePromises.push(
            transaction.update({
              paymentStatus: 'overdue'
            })
          );
        }

        // Check if grace period (14 days) has passed
        const gracePeriodEnd = new Date(transaction.dueDate);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 14);

        if (now > gracePeriodEnd && transaction.admin && transaction.admin.isActive) {
          // Auto-deactivate admin
          updatePromises.push(
            Admin.update({
              isActive: false,
              deactivationReason: 'Overdue commission payment - grace period expired',
              deactivatedAt: new Date()
            }, {
              where: { id: transaction.adminId }
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

    // Get all active admins - PostgreSQL/Sequelize
    const admins = await Admin.findAll({ 
      where: { isActive: true } 
    });
    
    console.log(`Processing ${admins.length} admins`);

    const reports = [];
    let totalCommission = 0;
    let totalRevenue = 0;

    for (const admin of admins) {
      // Get delivered orders for this admin in the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // PostgreSQL/Sequelize query with JSONB filtering
      const deliveredOrders = await Order.findAll({
        where: {
          orderStatus: 'delivered',
          updatedAt: {
            [Op.between]: [startDate, endDate]
          },
          items: {
            [Op.contains]: [{ adminId: admin.id }]
          }
        }
      });

      // Calculate revenue
      let adminRevenue = 0;
      deliveredOrders.forEach(order => {
        order.items.forEach(item => {
          if (item.adminId && item.adminId.toString() === admin.id.toString()) {
            adminRevenue += item.price * item.quantity;
          }
        });
      });

      // Calculate commission if threshold reached
      let commissionAmount = 0;
      let commissionApplies = false;

      if (admin.earningsTotal >= admin.commissionThreshold) {
        commissionApplies = true;
        commissionAmount = (adminRevenue * admin.commissionRate) / 100;
      }

      totalRevenue += adminRevenue;
      totalCommission += commissionAmount;

      reports.push({
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          adminCode: admin.adminCode
        },
        revenue: adminRevenue,
        commission: commissionAmount,
        commissionApplies,
        totalEarnings: admin.earningsTotal,
        threshold: admin.commissionThreshold,
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
