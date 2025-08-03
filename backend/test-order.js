const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloomgrad', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testOrder = async () => {
  try {
    console.log('Creating test order...');

    // Find or create a test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      await testUser.save();
      console.log('Created test user:', testUser._id);
    }

    // Create test order
    const orderData = {
      userId: testUser._id,
      items: [
        {
          productId: 'test-product-1',
          name: 'Test Graduation Cap',
          price: 25.99,
          quantity: 1,
          image: '/api/placeholder/100/100'
        },
        {
          productId: 'test-product-2',
          name: 'Test Graduation Gown',
          price: 45.99,
          quantity: 1,
          image: '/api/placeholder/100/100'
        }
      ],
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        address: '123 Main St',
        city: 'Anytown',
        zip: '12345'
      },
      paymentMethod: 'cod',
      total: 71.98
    };

    const order = new Order(orderData);
    await order.save();

    console.log('Test order created successfully!');
    console.log('Order ID:', order._id);
    console.log('Order Number:', order.orderNumber);

    // Fetch the order to verify
    const savedOrder = await Order.findById(order._id);
    console.log('Saved order:', JSON.stringify(savedOrder, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error creating test order:', error);
    process.exit(1);
  }
};

testOrder();
