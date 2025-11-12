const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, testConnection } = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://localhost:3003',
    'https://bloom-f4qt.vercel.app',
    'https://bloom-beta-mauve.vercel.app',
    'https://bloomsuper.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database connection
let dbInitialized = false;

const initializeDatabase = async () => {
  if (dbInitialized) return true;
  
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      // Initialize all models and relationships
      require('./models');
      
      // Sync database (creates tables if they don't exist)
      await sequelize.sync({ alter: false }); // Set to false for production
      console.log('✅ Database tables synchronized');
      
      dbInitialized = true;
      return true;
    } else {
      console.error('❌ Failed to establish database connection');
      return false;
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return false;
  }
};

// Middleware to ensure database is initialized
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    await initializeDatabase();
  }
  next();
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'BloomGrad API is running!' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/superadmin', require('./routes/superadminRoutes'));
app.use('/api/superadmin/auth', require('./routes/superAdminAuth'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/commission', require('./routes/commissionRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// For Vercel serverless deployment
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // For local development
  const PORT = process.env.PORT || 5000;
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please free up the port or use a different one.`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });
}
