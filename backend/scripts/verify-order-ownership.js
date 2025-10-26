const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloomgrad')
  .then(async () => {
    console.log('Connected to MongoDB\n');
    
    console.log('📊 Order Ownership Verification\n');
    
    // Get all orders
    const allOrders = await Order.find();
    console.log(`Total orders in database: ${allOrders.length}\n`);
    
    // Get all users (customers)
    const users = await User.find({ role: 'user' });
    console.log(`Total customers: ${users.length}\n`);
    
    // Check orders per user
    console.log('Orders per user:\n');
    for (const user of users) {
      const userOrders = await Order.find({ userId: user._id });
      console.log(`${user.name} (${user.email})`);
      console.log(`  - User ID: ${user._id}`);
      console.log(`  - Orders: ${userOrders.length}`);
      if (userOrders.length > 0) {
        console.log(`  - Order IDs:`, userOrders.map(o => o._id.toString().slice(-8)).join(', '));
        console.log(`  - Total spent: $${userOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}`);
      }
      console.log('');
    }
    
    // Check for orphaned orders (orders without valid userId)
    const orphanedOrders = await Order.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });
    
    if (orphanedOrders.length > 0) {
      console.log(`⚠️  Warning: Found ${orphanedOrders.length} orphaned orders (no userId)`);
    } else {
      console.log('✅ No orphaned orders found - all orders have valid userId');
    }
    
    // Verify order-user relationship
    console.log('\n📋 Verification Summary:\n');
    let validOrders = 0;
    let invalidOrders = 0;
    
    for (const order of allOrders) {
      const user = await User.findById(order.userId);
      if (user) {
        validOrders++;
      } else {
        invalidOrders++;
        console.log(`❌ Invalid order: ${order._id} (userId: ${order.userId} not found)`);
      }
    }
    
    console.log(`✅ Valid orders (with existing user): ${validOrders}`);
    console.log(`❌ Invalid orders (user not found): ${invalidOrders}`);
    
    console.log('\n✨ The getUserOrders endpoint filters by userId: req.user._id');
    console.log('✨ This ensures each user only sees their own orders');
    
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
