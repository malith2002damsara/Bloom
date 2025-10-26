const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloom');
    console.log('✓ Connected to MongoDB\n');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('⚠️  A SuperAdmin account already exists!');
      console.log(`Email: ${existingSuperAdmin.email}`);
      console.log(`Name: ${existingSuperAdmin.name}\n`);
      
      const overwrite = await question('Do you want to create another SuperAdmin? (yes/no): ');
      if (overwrite.toLowerCase() !== 'yes' && overwrite.toLowerCase() !== 'y') {
        console.log('Operation cancelled.');
        process.exit(0);
      }
    }

    console.log('=== Create Super Admin Account ===\n');

    // Get user input
    const name = await question('Enter SuperAdmin Name: ');
    if (!name || name.trim() === '') {
      console.log('❌ Name is required!');
      process.exit(1);
    }

    const email = await question('Enter SuperAdmin Email: ');
    if (!email || !email.includes('@')) {
      console.log('❌ Valid email is required!');
      process.exit(1);
    }

    // Check if email is already taken
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.log('❌ This email is already registered!');
      process.exit(1);
    }

    const phone = await question('Enter SuperAdmin Phone (optional): ');

    const password = await question('Enter SuperAdmin Password (min 6 characters): ');
    if (!password || password.length < 6) {
      console.log('❌ Password must be at least 6 characters!');
      process.exit(1);
    }

    const confirmPassword = await question('Confirm Password: ');
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match!');
      process.exit(1);
    }

    console.log('\nCreating SuperAdmin account...');

    // Create superadmin
    const superAdmin = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      phone: phone.trim() || '',
      role: 'superadmin',
      isActive: true
    });

    await superAdmin.save();

    console.log('\n✅ SuperAdmin account created successfully!');
    console.log('\n=== Account Details ===');
    console.log(`Name: ${superAdmin.name}`);
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Phone: ${superAdmin.phone || 'Not provided'}`);
    console.log(`Role: ${superAdmin.role}`);
    console.log(`Status: ${superAdmin.isActive ? 'Active' : 'Inactive'}`);
    console.log(`Created: ${superAdmin.createdAt}`);
    console.log('\n✓ You can now login with these credentials!\n');

  } catch (error) {
    console.error('\n❌ Error creating SuperAdmin:', error.message);
    if (error.code === 11000) {
      console.error('Email address is already in use.');
    }
  } finally {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Run the script
createSuperAdmin();
