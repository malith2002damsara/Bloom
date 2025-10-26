const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const seedSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloom');
    console.log('✓ Connected to MongoDB\n');

    // Check if this specific superadmin already exists
    const existingSuperAdmin = await User.findOne({ email: 'superadmin@gmail.com' });
    
    if (existingSuperAdmin) {
      console.log('⚠️  SuperAdmin with email "superadmin@gmail.com" already exists!');
      console.log(`Name: ${existingSuperAdmin.name}`);
      console.log(`Email: ${existingSuperAdmin.email}`);
      console.log(`Role: ${existingSuperAdmin.role}`);
      console.log(`Status: ${existingSuperAdmin.isActive ? 'Active' : 'Inactive'}`);
      console.log('\n✓ No action needed.\n');
      process.exit(0);
    }

    console.log('Creating default SuperAdmin account...\n');

    // Create superadmin with specified credentials
    const superAdmin = new User({
      name: 'Super Administrator',
      email: 'superadmin@gmail.com',
      password: 'superadmin', // Will be hashed by the pre-save hook
      phone: '0000000000', // Default phone number
      role: 'superadmin',
      isActive: true
    });

    await superAdmin.save();

    console.log('✅ Default SuperAdmin account created successfully!\n');
    console.log('=== Account Details ===');
    console.log('Name: Super Administrator');
    console.log('Email: superadmin@gmail.com');
    console.log('Password: superadmin');
    console.log('Phone: 0000000000');
    console.log('Role: superadmin');
    console.log('Status: Active');
    console.log(`Created: ${superAdmin.createdAt}`);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');

  } catch (error) {
    console.error('\n❌ Error creating SuperAdmin:', error.message);
    if (error.code === 11000) {
      console.error('Email address is already in use.');
    }
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Run the script
seedSuperAdmin();
