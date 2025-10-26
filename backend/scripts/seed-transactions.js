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

async function seedTransactions() {
  try {
    console.log('Starting to seed transactions...');

    // 1. Check if super admin exists
    let superAdmin = await User.findOne({ role: 'superadmin' });
    if (!superAdmin) {
      console.log('Creating super admin...');
      superAdmin = await User.create({
        name: 'Super Admin',
        email: 'superadmin@bloom.com',
        password: 'admin123',
        role: 'superadmin',
        phone: '1234567890'
      });
      console.log('Super admin created');
    }

    // 2. Check for existing admins or create sample ones
    let admins = await Admin.find({ isActive: true });
    
    if (admins.length === 0) {
      console.log('Creating sample admins...');
      
      const adminData = [
        {
          name: 'John Smith',
          email: 'john@bloom.com',
          password: 'admin123',
          phone: '0771234567',
          createdBy: superAdmin._id,
          isActive: true
        },
        {
          name: 'Sarah Johnson',
          email: 'sarah@bloom.com',
          password: 'admin123',
          phone: '0772345678',
          createdBy: superAdmin._id,
          isActive: true
        },
        {
          name: 'Mike Williams',
          email: 'mike@bloom.com',
          password: 'admin123',
          phone: '0773456789',
          createdBy: superAdmin._id,
          isActive: true
        }
      ];

      admins = await Admin.create(adminData);
      console.log(`Created ${admins.length} sample admins`);
    } else {
      console.log(`Found ${admins.length} existing admins`);
    }

    // 3. Check for products or create sample ones for each admin
    for (const admin of admins) {
      let adminProducts = await Product.find({ adminId: admin._id });
      
      if (adminProducts.length === 0) {
        console.log(`Creating products for ${admin.name}...`);
        
        const productData = [
          {
            name: `${admin.name}'s Graduation Bouquet`,
            description: 'Beautiful graduation bouquet',
            price: 89.99,
            category: 'fresh',
            stock: 50,
            inStock: true,
            adminId: admin._id,
            images: ['https://via.placeholder.com/300'],
            seller: {
              name: admin.name,
              contact: admin.phone || '0771234567'
            }
          },
          {
            name: `${admin.name}'s Premium Roses`,
            description: 'Premium rose arrangement',
            price: 129.99,
            category: 'fresh',
            stock: 30,
            inStock: true,
            adminId: admin._id,
            images: ['https://via.placeholder.com/300'],
            seller: {
              name: admin.name,
              contact: admin.phone || '0771234567'
            }
          }
        ];

        adminProducts = await Product.create(productData);
        console.log(`Created ${adminProducts.length} products for ${admin.name}`);
      }
    }

    // 4. Create sample customers if needed
    let customers = await User.find({ role: 'user' }).limit(5);
    
    if (customers.length === 0) {
      console.log('Creating sample customers...');
      
      const customerData = [
        {
          name: 'Customer One',
          email: 'customer1@example.com',
          password: 'customer123',
          role: 'user',
          phone: '0751234567'
        },
        {
          name: 'Customer Two',
          email: 'customer2@example.com',
          password: 'customer123',
          role: 'user',
          phone: '0752345678'
        },
        {
          name: 'Customer Three',
          email: 'customer3@example.com',
          password: 'customer123',
          role: 'user',
          phone: '0753456789'
        }
      ];

      customers = await User.create(customerData);
      console.log(`Created ${customers.length} sample customers`);
    }

    // 5. Create sample orders for the last few months
    console.log('Creating sample orders...');
    const months = [
      { month: 8, year: 2025, name: 'August' },
      { month: 9, year: 2025, name: 'September' },
      { month: 10, year: 2025, name: 'October' }
    ];

    for (const admin of admins) {
      const adminProducts = await Product.find({ adminId: admin._id });
      
      if (adminProducts.length === 0) continue;

      for (const period of months) {
        const ordersToCreate = Math.floor(Math.random() * 5) + 3; // 3-7 orders per month
        
        for (let i = 0; i < ordersToCreate; i++) {
          const customer = customers[Math.floor(Math.random() * customers.length)];
          const product = adminProducts[Math.floor(Math.random() * adminProducts.length)];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
          const itemPrice = product.price;
          const itemTotal = itemPrice * quantity;

          // Create order date within the month
          const day = Math.floor(Math.random() * 28) + 1;
          const orderDate = new Date(period.year, period.month - 1, day);
          
          // Calculate estimated delivery (5-7 days after order)
          const deliveryDate = new Date(orderDate);
          deliveryDate.setDate(deliveryDate.getDate() + 5 + Math.floor(Math.random() * 3));

          const order = await Order.create({
            userId: customer._id,
            items: [{
              productId: product._id.toString(),
              name: product.name,
              price: itemPrice,
              quantity: quantity,
              image: product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/300'
            }],
            subtotal: itemTotal,
            total: itemTotal,
            orderStatus: 'delivered',
            paymentStatus: 'paid',
            paymentMethod: 'card',
            estimatedDelivery: deliveryDate,
            customerInfo: {
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              address: '123 Main St',
              city: 'Colombo',
              zip: '10000'
            },
            createdAt: orderDate,
            updatedAt: orderDate
          });

          // Update product sold count
          await Product.findByIdAndUpdate(product._id, {
            $inc: { 'sales.count': quantity, 'sales.revenue': itemTotal }
          });
        }
      }
    }

    console.log('Sample orders created');

    // 6. Generate commission transactions for past months
    console.log('Generating commission transactions...');

    for (const period of months.slice(0, 2)) { // Generate for August and September only
      for (const admin of admins) {
        // Get admin's products
        const adminProducts = await Product.find({ adminId: admin._id }).select('_id');
        const productIds = adminProducts.map(p => p._id.toString());

        if (productIds.length === 0) continue;

        // Calculate date range for the month
        const startDate = new Date(period.year, period.month - 1, 1);
        const endDate = new Date(period.year, period.month, 0, 23, 59, 59, 999);

        // Get completed orders
        const orders = await Order.find({
          createdAt: { $gte: startDate, $lte: endDate },
          orderStatus: { $in: ['delivered', 'completed'] },
          'items.productId': { $in: productIds }
        });

        // Calculate admin revenue
        let adminRevenue = 0;
        let completedOrders = 0;

        orders.forEach(order => {
          if (order.orderStatus === 'delivered' || order.orderStatus === 'completed') {
            completedOrders++;
            const adminItems = order.items.filter(item => 
              productIds.includes(item.productId)
            );
            const orderAdminRevenue = adminItems.reduce((sum, item) => 
              sum + (item.price * item.quantity), 0
            );
            adminRevenue += orderAdminRevenue;
          }
        });

        if (adminRevenue > 0) {
          // Calculate commission
          const commissionAmount = Math.round(adminRevenue * 10) / 100; // 10% commission
          
          // Calculate due date (end of next month)
          const dueDate = new Date(period.year, period.month, 0);
          dueDate.setDate(dueDate.getDate() + 30);

          // Create commission transaction
          const transaction = await Transaction.create({
            type: 'commission',
            adminId: admin._id,
            adminRevenue: Math.round(adminRevenue * 100) / 100,
            commissionRate: 10,
            commissionAmount: commissionAmount,
            totalAmount: commissionAmount,
            period: {
              month: period.month,
              year: period.year
            },
            status: 'completed',
            paymentStatus: period.month === 8 ? 'paid' : 'unpaid',
            dueDate,
            orderStats: {
              totalOrders: orders.length,
              completedOrders,
              cancelledOrders: 0
            },
            description: `Commission for ${period.name} ${period.year}`,
            processedBy: superAdmin._id,
            paidAt: period.month === 8 ? new Date(period.year, period.month, 5) : null,
            paymentMethod: 'bank_transfer',
            paymentReference: period.month === 8 ? `TXN-${Date.now()}` : null
          });

          console.log(`Created commission for ${admin.name} - ${period.name}: $${transaction.commissionAmount.toFixed(2)}`);
        }
      }
    }

    console.log('\n✅ Transaction seeding completed successfully!');
    console.log('\nSummary:');
    console.log('- Admins:', await Admin.countDocuments());
    console.log('- Products:', await Product.countDocuments());
    console.log('- Orders:', await Order.countDocuments());
    console.log('- Transactions:', await Transaction.countDocuments());
    console.log('\nYou can now view the transactions in the Super Admin dashboard!');

  } catch (error) {
    console.error('Error seeding transactions:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedTransactions();
