const mongoose = require('mongoose');
const Product = require('../models/Product');
const Admin = require('../models/Admin');
const Order = require('../models/Order');
const User = require('../models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloomgrad')
  .then(async () => {
    console.log('Connected to MongoDB\n');
    
    console.log('📊 Current Database Status:\n');
    
    // Check products
    const products = await Product.find().populate('adminId', 'name email');
    console.log('Products:', products.length);
    if (products.length > 0) {
      console.log('\nSample Products:');
      products.slice(0, 5).forEach(p => {
        console.log(`- ${p.name} | Price: $${p.price} | Admin: ${p.adminId?.name || 'No Admin'} | Category: ${p.category}`);
      });
    }
    
    // Check admins
    const admins = await Admin.find();
    console.log('\n\nAdmins:', admins.length);
    if (admins.length > 0) {
      admins.forEach(a => {
        console.log(`- ${a.name} (${a.email}) | Active: ${a.isActive}`);
      });
    }
    
    // Check users/customers
    const customers = await User.find({ role: 'user' });
    console.log('\n\nCustomers:', customers.length);
    
    // Check orders
    const orders = await Order.find();
    console.log('\nOrders:', orders.length);
    
    // Check super admin
    const superAdmin = await User.findOne({ role: 'superadmin' });
    console.log('\nSuper Admin:', superAdmin ? `${superAdmin.name} (${superAdmin.email})` : 'Not found');
    
    // Check if products have adminId
    const productsWithAdmin = await Product.countDocuments({ adminId: { $exists: true, $ne: null } });
    const productsWithoutAdmin = await Product.countDocuments({ adminId: { $exists: false } }) + 
                                  await Product.countDocuments({ adminId: null });
    console.log('\n\nProducts with adminId:', productsWithAdmin);
    console.log('Products without adminId:', productsWithoutAdmin);
    
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
