const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const Admin = require('../models/Admin');

// Load environment variables
dotenv.config();

async function migrateProductsAdminId() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Count products without adminId
    const productsWithoutAdminId = await Product.countDocuments({
      $or: [
        { adminId: { $exists: false } },
        { adminId: null }
      ]
    });

    console.log(`\nFound ${productsWithoutAdminId} products without adminId`);

    if (productsWithoutAdminId === 0) {
      console.log('All products already have adminId. No migration needed.');
      process.exit(0);
    }

    // Get all admins
    const admins = await Admin.find({});
    console.log(`\nFound ${admins.length} admin(s) in the system`);

    if (admins.length === 0) {
      console.log('ERROR: No admins found in the system. Please create at least one admin first.');
      process.exit(1);
    }

    // Option 1: Assign all products without adminId to the first admin
    const defaultAdmin = admins[0];
    console.log(`\nAssigning all products without adminId to: ${defaultAdmin.name} (${defaultAdmin.email})`);
    console.log('Admin ID:', defaultAdmin._id);

    const result = await Product.updateMany(
      {
        $or: [
          { adminId: { $exists: false } },
          { adminId: null }
        ]
      },
      {
        $set: { adminId: defaultAdmin._id }
      }
    );

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`Updated ${result.modifiedCount} products`);
    console.log(`Matched ${result.matchedCount} products`);

    // Verify migration
    const remainingWithoutAdminId = await Product.countDocuments({
      $or: [
        { adminId: { $exists: false } },
        { adminId: null }
      ]
    });

    console.log(`\nVerification: ${remainingWithoutAdminId} products still without adminId`);

    // Show product distribution
    console.log('\n--- Product Distribution by Admin ---');
    const productsByAdmin = await Product.aggregate([
      {
        $group: {
          _id: '$adminId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'admins',
          localField: '_id',
          foreignField: '_id',
          as: 'admin'
        }
      }
    ]);

    for (const item of productsByAdmin) {
      if (item.admin && item.admin.length > 0) {
        console.log(`${item.admin[0].name} (${item.admin[0].email}): ${item.count} products`);
      } else {
        console.log(`Unknown admin (${item._id}): ${item.count} products`);
      }
    }

    console.log('\n✨ Migration script completed!');
    process.exit(0);

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run migration
console.log('=================================');
console.log('Product adminId Migration Script');
console.log('=================================\n');

migrateProductsAdminId();
