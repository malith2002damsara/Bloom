const cron = require('node-cron');
const Admin = require('../models/Admin');
const Order = require('../models/Order');
const User = require('../models/User');
const CommissionInvoice = require('../models/CommissionInvoice');
const PlatformReport = require('../models/PlatformReport');

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

    // Get all active admins
    const admins = await Admin.find({ accountStatus: { $in: ['active', 'suspended'] } });

    console.log(`📋 Processing ${admins.length} admins for period ${period}`);

    let invoicesCreated = 0;
    let invoicesSkipped = 0;

    for (const admin of admins) {
      try {
        // Check if invoice already exists for this period
        const existingInvoice = await CommissionInvoice.findOne({
          adminId: admin._id,
          period
        });

        if (existingInvoice) {
          console.log(`⏭️  Invoice already exists for admin ${admin.name} (${period})`);
          invoicesSkipped++;
          continue;
        }

        // Get all delivered orders for this admin in the period
        const orders = await Order.find({
          'items.adminId': admin._id,
          orderStatus: 'delivered',
          createdAt: { $gte: start, $lte: end }
        });

        if (orders.length === 0) {
          console.log(`📭 No orders for admin ${admin.name} in ${period}`);
          invoicesSkipped++;
          continue;
        }

        // Calculate total sales for the period
        const totalSales = orders.reduce((sum, order) => {
          const adminItems = order.items.filter(item => 
            item.adminId && item.adminId.toString() === admin._id.toString()
          );
          return sum + adminItems.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0);
        }, 0);

        // Update admin's lifetime sales
        admin.lifetimeSales = (admin.lifetimeSales || 0) + totalSales;
        await admin.save();

        // Check if admin exceeds threshold
        if (admin.lifetimeSales <= admin.commission.threshold) {
          console.log(`💰 Admin ${admin.name} below threshold (${admin.lifetimeSales}/${admin.commission.threshold})`);
          invoicesSkipped++;
          continue;
        }

        // Calculate commission (only on sales above threshold)
        const commissionableSales = totalSales;
        const commissionAmount = (commissionableSales * admin.commission.rate) / 100;

        if (commissionAmount <= 0) {
          console.log(`💸 No commission due for admin ${admin.name}`);
          invoicesSkipped++;
          continue;
        }

        // Create invoice
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14); // 14 days from now

        const invoice = new CommissionInvoice({
          adminId: admin._id,
          amount: commissionAmount,
          period,
          dueDate,
          status: 'unpaid',
          salesBreakdown: {
            totalSales,
            commissionableSales,
            commissionRate: admin.commission.rate,
            numberOfOrders: orders.length
          }
        });

        await invoice.save();

        console.log(`✅ Invoice created for admin ${admin.name}: LKR ${commissionAmount.toFixed(2)}`);
        invoicesCreated++;

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

    // Find all unpaid invoices past due date
    const overdueInvoices = await CommissionInvoice.find({
      status: 'unpaid',
      dueDate: { $lt: now }
    }).populate('adminId', 'name email accountStatus');

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
        const admin = invoice.adminId;
        if (admin && admin.accountStatus !== 'deactivated') {
          admin.accountStatus = 'deactivated';
          admin.isActive = false;
          admin.deactivationReason = `Commission payment overdue for period ${invoice.period}`;
          admin.deactivatedAt = new Date();
          await admin.save();

          console.log(`🚫 Deactivated admin: ${admin.name} (Invoice: ${invoice._id})`);
          deactivatedCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing invoice ${invoice._id}:`, error.message);
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

    // Check if report already exists
    const existingReport = await PlatformReport.findOne({ period });
    if (existingReport) {
      console.log(`⏭️  Report already exists for period ${period}`);
      return;
    }

    // Get super admin (first user with superadmin role)
    const superAdmin = await User.findOne({ role: 'superadmin' });
    if (!superAdmin) {
      console.error('❌ No super admin found to generate report');
      return;
    }

    // Create report
    const report = new PlatformReport({
      period,
      startDate: start,
      endDate: end,
      reportType: 'monthly',
      generatedBy: superAdmin._id,
      status: 'generating'
    });

    await report.save();

    // Get all orders in the period
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end }
    });

    // Calculate platform metrics
    const platformMetrics = {
      totalOrders: orders.length,
      deliveredOrders: orders.filter(o => o.orderStatus === 'delivered').length,
      cancelledOrders: orders.filter(o => o.orderStatus === 'cancelled').length,
      pendingOrders: orders.filter(o => o.orderStatus === 'pending').length,
      totalRevenue: orders
        .filter(o => o.orderStatus === 'delivered')
        .reduce((sum, o) => sum + o.totalAmount, 0),
      totalCommission: 0,
      activeAdmins: await Admin.countDocuments({ accountStatus: 'active' }),
      newCustomers: await User.countDocuments({
        role: 'user',
        createdAt: { $gte: start, $lte: end }
      })
    };

    // Get all admins
    const admins = await Admin.find();
    const adminBreakdown = [];

    for (const admin of admins) {
      const adminOrders = orders.filter(order =>
        order.items.some(item => item.adminId && item.adminId.toString() === admin._id.toString())
      );

      const deliveredOrders = adminOrders.filter(o => o.orderStatus === 'delivered');
      const totalSales = deliveredOrders.reduce((sum, order) => {
        const adminItems = order.items.filter(item => 
          item.adminId && item.adminId.toString() === admin._id.toString()
        );
        return sum + adminItems.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0);
      }, 0);

      let commissionableSales = 0;
      let commissionDue = 0;

      if (admin.lifetimeSales > admin.commission.threshold) {
        commissionableSales = totalSales;
        commissionDue = (commissionableSales * admin.commission.rate) / 100;
      }

      // Get invoice for this period
      const invoice = await CommissionInvoice.findOne({
        adminId: admin._id,
        period
      });

      adminBreakdown.push({
        adminId: admin._id,
        adminName: admin.name,
        shopName: admin.shopName || 'N/A',
        totalSales,
        lifetimeSales: admin.lifetimeSales,
        commissionableSales,
        commissionDue,
        numberOfOrders: deliveredOrders.length,
        paymentStatus: invoice ? invoice.status : 'not_applicable',
        invoiceId: invoice ? invoice._id : null
      });

      if (commissionDue > 0) {
        platformMetrics.totalCommission += commissionDue;
      }
    }

    // Update report
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
