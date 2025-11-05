const cron = require('node-cron');
const { Admin, Order, User, CommissionInvoice, PlatformReport } = require('../models');
const { Op } = require('sequelize');

// Helper function to get last month's date range
function getLastMonthRange() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  
  return {
    start: lastMonth,
    end: lastMonthEnd,
    period: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
  };
}

// @desc    Generate monthly commission invoices
// @cron    Runs at midnight on the last day of each month
// @schedule 0 0 28-31 * *
async function generateMonthlyInvoices() {
  try {
    console.log('🕐 Starting monthly invoice generation...');

    const { start, end, period } = getLastMonthRange();

    // Get all active admins - PostgreSQL/Sequelize
    const admins = await Admin.findAll({ 
      where: { 
        accountStatus: { [Op.in]: ['active', 'suspended'] } 
      } 
    });

    console.log(`📋 Processing ${admins.length} admins for period ${period}`);

    let invoicesCreated = 0;
    let invoicesSkipped = 0;

    for (const admin of admins) {
      try {
        // Check if invoice already exists for this period - PostgreSQL/Sequelize
        const existingInvoice = await CommissionInvoice.findOne({
          where: {
            adminId: admin.id,
            period
          }
        });

        if (existingInvoice) {
          console.log(`⏭️  Invoice already exists for admin ${admin.name} (${period})`);
          invoicesSkipped++;
          continue;
        }

        // Note: Order-items relationship needs to be properly implemented in models
        // For now, skip if no proper relationship exists
        console.log(`� Skipping invoice generation for admin ${admin.name} - Order items relationship needs implementation`);
        invoicesSkipped++;
        continue;

      } catch (error) {
        console.error(`❌ Error creating invoice for admin ${admin.name}:`, error.message);
      }
    }

    console.log(`\n📊 Invoice Generation Summary:`);
    console.log(`   ✅ Created: ${invoicesCreated}`);
    console.log(`   ⏭️  Skipped: ${invoicesSkipped}`);
    console.log(`   📅 Period: ${period}\n`);

  } catch (error) {
    console.error('❌ Monthly invoice generation error:', error);
  }
}

// @desc    Check overdue invoices and deactivate admins
// @cron    Runs daily at 1:00 AM
// @schedule 0 1 * * *
async function checkOverdueInvoices() {
  try {
    console.log('🔍 Checking for overdue invoices...');

    const now = new Date();

    // Find all unpaid invoices past due date - PostgreSQL/Sequelize
    const overdueInvoices = await CommissionInvoice.findAll({
      where: {
        status: 'unpaid',
        dueDate: { [Op.lt]: now }
      },
      include: [{
        model: Admin,
        as: 'admin',
        attributes: ['id', 'name', 'email', 'accountStatus']
      }]
    });

    console.log(`⚠️  Found ${overdueInvoices.length} overdue invoices`);

    let deactivatedCount = 0;
    let alreadyOverdueCount = 0;

    for (const invoice of overdueInvoices) {
      try {
        // Mark invoice as overdue
        if (invoice.status !== 'overdue') {
          invoice.status = 'overdue';
          await invoice.save();
        } else {
          alreadyOverdueCount++;
        }

        // Deactivate admin if not already deactivated
        const admin = invoice.admin;
        if (admin && admin.accountStatus !== 'deactivated') {
          admin.accountStatus = 'deactivated';
          admin.isActive = false;
          admin.deactivationReason = `Commission payment overdue for period ${invoice.period}`;
          admin.deactivatedAt = new Date();
          await admin.save();

          console.log(`🚫 Deactivated admin: ${admin.name} (Invoice: ${invoice.id})`);
          deactivatedCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing invoice ${invoice.id}:`, error.message);
      }
    }

    console.log(`\n📊 Overdue Check Summary:`);
    console.log(`   🚫 Admins Deactivated: ${deactivatedCount}`);
    console.log(`   ⚠️  Already Overdue: ${alreadyOverdueCount}\n`);

  } catch (error) {
    console.error('❌ Overdue invoice check error:', error);
  }
}

// @desc    Generate monthly platform report
// @cron    Runs at 00:00:01 on the 1st of every month
// @schedule 1 0 1 * *
async function generateMonthlyReport() {
  try {
    console.log('📈 Starting monthly report generation...');

    const { start, end, period } = getLastMonthRange();

    // Check if report already exists - PostgreSQL/Sequelize
    const existingReport = await PlatformReport.findOne({ where: { period } });
    if (existingReport) {
      console.log(`⏭️  Report already exists for period ${period}`);
      return;
    }

    // Get super admin (first user with superadmin role) - PostgreSQL/Sequelize
    const superAdmin = await User.findOne({ where: { role: 'superadmin' } });
    if (!superAdmin) {
      console.error('❌ No super admin found to generate report');
      return;
    }

    // Create report - PostgreSQL/Sequelize
    const report = await PlatformReport.create({
      period,
      startDate: start,
      endDate: end,
      reportType: 'monthly',
      generatedBy: superAdmin.id,
      status: 'generating'
    });

    // Get all orders in the period - PostgreSQL/Sequelize
    const orders = await Order.findAll({
      where: {
        createdAt: { [Op.between]: [start, end] }
      }
    });

    // Calculate platform metrics
    const platformMetrics = {
      totalOrders: orders.length,
      deliveredOrders: orders.filter(o => o.orderStatus === 'delivered').length,
      cancelledOrders: orders.filter(o => o.orderStatus === 'cancelled').length,
      pendingOrders: orders.filter(o => o.orderStatus === 'pending').length,
      totalRevenue: orders
        .filter(o => o.orderStatus === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0),
      totalCommission: 0,
      activeAdmins: await Admin.count({ where: { accountStatus: 'active' } }),
      newCustomers: await User.count({
        where: {
          role: 'user',
          createdAt: { [Op.between]: [start, end] }
        }
      })
    };

    // Get all admins - PostgreSQL/Sequelize
    const admins = await Admin.findAll();
    const adminBreakdown = [];

    for (const admin of admins) {
      // Note: Simplified version without order items relationship
      // This needs proper implementation based on your Order-Product-Admin relationship
      
      adminBreakdown.push({
        adminId: admin.id,
        adminName: admin.name,
        shopName: admin.shopName || 'N/A',
        totalSales: 0,
        lifetimeSales: parseFloat(admin.lifetimeSales || 0),
        commissionableSales: 0,
        commissionDue: 0,
        numberOfOrders: 0,
        paymentStatus: 'not_applicable',
        invoiceId: null
      });
    }

    // Update report - PostgreSQL/Sequelize
    report.platformMetrics = platformMetrics;
    report.adminBreakdown = adminBreakdown;
    report.status = 'completed';
    await report.save();

    console.log(`✅ Monthly report generated for period ${period}`);
    console.log(`📊 Total Revenue: LKR ${platformMetrics.totalRevenue.toFixed(2)}`);
    console.log(`💰 Total Commission: LKR ${platformMetrics.totalCommission.toFixed(2)}`);
    console.log(`📦 Total Orders: ${platformMetrics.totalOrders}\n`);

  } catch (error) {
    console.error('❌ Monthly report generation error:', error);
  }
}

// Initialize cron jobs
function initializeCronJobs() {
  console.log('⏰ Initializing cron jobs...\n');

  // Run at midnight on the last day of each month (28-31)
  // This ensures it runs on the actual last day regardless of month length
  cron.schedule('0 0 28-31 * *', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if tomorrow is the 1st (meaning today is the last day)
    if (tomorrow.getDate() === 1) {
      console.log(`\n🗓️  Last day of month detected - Running monthly invoice generation\n`);
      generateMonthlyInvoices();
    }
  }, {
    timezone: 'Asia/Colombo' // Sri Lanka timezone
  });

  // Run daily at 1:00 AM to check overdue invoices
  cron.schedule('0 1 * * *', () => {
    console.log(`\n🕐 ${new Date().toISOString()} - Running daily overdue check\n`);
    checkOverdueInvoices();
  }, {
    timezone: 'Asia/Colombo'
  });

  // Run at 00:00:01 on the 1st of every month
  cron.schedule('1 0 1 * *', () => {
    console.log(`\n📅 ${new Date().toISOString()} - Running monthly report generation\n`);
    generateMonthlyReport();
  }, {
    timezone: 'Asia/Colombo'
  });

  console.log('✅ Cron jobs initialized:');
  console.log('   📅 Monthly Invoice Generation: Midnight on last day of month');
  console.log('   🔍 Overdue Invoice Check: Daily at 1:00 AM');
  console.log('   📈 Monthly Report Generation: 00:00:01 on 1st of month\n');
}

// Manual trigger functions (for testing)
module.exports = {
  initializeCronJobs,
  generateMonthlyInvoices,
  checkOverdueInvoices,
  generateMonthlyReport
};
