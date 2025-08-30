const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// User model (simplified for this script)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    default: '1234567890'
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('SuperAdmin already exists:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Create superadmin with environment variables
    const superAdminEmail = process.env.SUPERADMIN_EMAIL;
    const superAdminPassword = process.env.SUPERADMIN_PASSWORD;

    if (!superAdminEmail || !superAdminPassword) {
      console.error('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in environment variables');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(superAdminPassword, salt);

    const superAdmin = new User({
      name: 'Super Administrator',
      email: superAdminEmail,
      phone: '1234567890',
      password: hashedPassword,
      role: 'superadmin'
    });

    await superAdmin.save();
    console.log('SuperAdmin created successfully!');
    console.log('Email:', superAdminEmail);
    console.log('Password: superadmin123');
    console.log('Please change this password after first login!');
    
  } catch (error) {
    console.error('Error creating SuperAdmin:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSuperAdmin();
