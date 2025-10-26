const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloomgrad')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function generateTransactionsFromRealData() {
  try {
    console.log('Starting to generate commission transactions from REAL data...\n');

    // 1. Get super admin
    let superAdmin = await User.findOne({ role: 'superadmin' });
    if (!superAdmin) {
      console.log('❌ No super admin found. Please create one first.');
      process.exit(1);
    }
    console.log('✓ Found super admin:', superAdmin.name);

    // 2. Get all real admins
    const admins = await Admin.find({ isActive: true });
    if (admins.length === 0) {
      console.log('❌ No active admins found.');
      process.exit(1);
    }
    console.log('✓ Found', admins.length, 'active admins');

    // 3. Check existing transactions to avoid duplicates
    const existingTransactions = await Transaction.find();
    console.log('✓ Found', existingTransactions.length, 'existing transactions\n');

    // 4. Get all real orders with their dates
    const allOrders = await Order.find().populate('items.productId');
    console.log('✓ Found', allOrders.length, 'total orders\n');

    if (allOrders.length === 0) {
      console.log('❌ No orders found in database. Cannot generate commissions.');
      process.exit(1);
    }

    // 5. Group orders by month/year
    const ordersByPeriod = {};
    
    allOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const month = orderDate.getMonth() + 1; // 1-12
      const year = orderDate.getFullYear();
      const key = `${year}-${month}`;
      
      if (!ordersByPeriod[key]) {
        ordersByPeriod[key] = {
          month,
          year,
          orders: []
        };
      }
      ordersByPeriod[key].orders.push(order);
    });

    console.log('📅 Orders found in these periods:');
    Object.keys(ordersByPeriod).forEach(key => {
      const period = ordersByPeriod[key];
      console.log(`   ${getMonthName(period.month)} ${period.year}: ${period.orders.length} orders`);
    });
    console.log('');

    // 6. Generate commission transactions for each period and admin
    let transactionsCreated = 0;
    let transactionsSkipped = 0;

    for (const key in ordersByPeriod) {
      const period = ordersByPeriod[key];
      const { month, year, orders } = period;

      console.log(`\n📊 Processing ${getMonthName(month)} ${year}...`);

      for (const admin of admins) {
        // Check if transaction already exists for this admin and period
        const existingTx = await Transaction.findOne({
          adminId: admin._id,
          'period.month': month,
          'period.year': year,
          type: 'commission'
        });

        if (existingTx) {
          console.log(`   ⏭️  Skipped ${admin.name} - transaction already exists`);
          transactionsSkipped++;
          continue;
        }

        // Get admin's products
        const adminProducts = await Product.find({ adminId: admin._id });
        const productIds = adminProducts.map(p => p._id.toString());

        if (productIds.length === 0) {
          console.log(`   ⏭️  Skipped ${admin.name} - no products assigned`);
          continue;
        }

        // Calculate admin revenue from orders in this period
        let adminRevenue = 0;
        let completedOrders = 0;
        let adminOrderCount = 0;

        orders.forEach(order => {
          // Check if order has products from this admin
          const hasAdminProducts = order.items.some(item => 
            productIds.includes(item.productId.toString())
          );

          if (hasAdminProducts) {
            adminOrderCount++;
            
            if (order.orderStatus === 'delivered' || order.orderStatus === 'completed') {
              completedOrders++;
              
              // Calculate revenue only from this admin's products
              const adminItems = order.items.filter(item => 
                productIds.includes(item.productId.toString())
              );
              
              const orderAdminRevenue = adminItems.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0
              );
              
              adminRevenue += orderAdminRevenue;
            }
          }
        });

        // Only create transaction if there's revenue
        if (adminRevenue > 0) {
          const commissionAmount = Math.round(adminRevenue * 10) / 100; // 10% commission
          
          // Calculate due date (end of next month)
          const dueDate = new Date(year, month, 0); // Last day of current month
          dueDate.setMonth(dueDate.getMonth() + 1); // Add one month
          
          // Determine if paid (only if period is more than 1 month ago)
          const now = new Date();
          const isPastPeriod = (year < now.getFullYear()) || 
                              (year === now.getFullYear() && month < now.getMonth());

          const transaction = await Transaction.create({
            type: 'commission',
            adminId: admin._id,
            adminRevenue: Math.round(adminRevenue * 100) / 100,
            commissionRate: 10,
            commissionAmount: commissionAmount,
            totalAmount: commissionAmount,
            period: {
              month: month,
              year: year
            },
            status: 'completed',
            paymentStatus: isPastPeriod ? 'paid' : 'unpaid',
            dueDate,
            orderStats: {
              totalOrders: adminOrderCount,
              completedOrders: completedOrders,
              cancelledOrders: 0
            },
            description: `Commission for ${getMonthName(month)} ${year}`,
            processedBy: superAdmin._id,
            paidAt: isPastPeriod ? new Date(year, month, 5) : null,
            paymentMethod: 'bank_transfer',
            paymentReference: isPastPeriod ? `TXN-${year}${String(month).padStart(2, '0')}-${admin._id.toString().slice(-6).toUpperCase()}` : null
          });

          console.log(`   ✓ Created commission for ${admin.name}: $${commissionAmount.toFixed(2)} (from $${adminRevenue.toFixed(2)} revenue)`);
          transactionsCreated++;
        } else {
          console.log(`   ⏭️  Skipped ${admin.name} - no completed orders with revenue`);
        }
      }
    }

    console.log('\n\n✅ Commission generation completed!\n');
    console.log('Summary:');
    console.log('- Transactions created:', transactionsCreated);
    console.log('- Transactions skipped (already exist):', transactionsSkipped);
    console.log('- Total transactions now:', existingTransactions.length + transactionsCreated);

    // Show final summary
    const allTransactions = await Transaction.find().populate('adminId', 'name');
    const totalCommission = allTransactions.reduce((sum, t) => sum + t.commissionAmount, 0);
    const paidCommission = allTransactions.filter(t => t.paymentStatus === 'paid')
                                          .reduce((sum, t) => sum + t.commissionAmount, 0);
    const unpaidCommission = allTransactions.filter(t => t.paymentStatus === 'unpaid')
                                            .reduce((sum, t) => sum + t.commissionAmount, 0);

    console.log('\n💰 Financial Summary:');
    console.log(`- Total Commission: $${totalCommission.toFixed(2)}`);
    console.log(`- Paid: $${paidCommission.toFixed(2)}`);
    console.log(`- Unpaid: $${unpaidCommission.toFixed(2)}`);

  } catch (error) {
    console.error('\n❌ Error generating transactions:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
}

generateTransactionsFromRealData();
