const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const Admin = require('../models/Admin');

// Load environment variables
dotenv.config();

async function checkProductAdminId() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all products
    const totalProducts = await Product.countDocuments();
    console.log(`Total products in database: ${totalProducts}`);

    // Count products without adminId
    const productsWithoutAdminId = await Product.countDocuments({
      $or: [
        { adminId: { $exists: false } },
        { adminId: null }
      ]
    });

    console.log(`Products without adminId: ${productsWithoutAdminId}`);
    console.log(`Products with adminId: ${totalProducts - productsWithoutAdminId}\n`);

    if (productsWithoutAdminId > 0) {
      console.log('⚠️  WARNING: Some products are missing adminId!');
      console.log('Run the migration script: node scripts/migrate-products-adminId.js\n');
      
      // Show sample products without adminId
      const sampleProducts = await Product.find({
        $or: [
          { adminId: { $exists: false } },
          { adminId: null }
        ]
      }).limit(5).select('name seller');

      console.log('Sample products without adminId:');
      sampleProducts.forEach(product => {
        console.log(`  - ${product.name} (Seller: ${product.seller?.name || 'N/A'})`);
      });
    } else {
      console.log('✅ All products have adminId assigned!');
    }

    // Show product distribution by admin
    console.log('\n--- Product Distribution by Admin ---');
    const productsByAdmin = await Product.aggregate([
      {
        $group: {
          _id: '$adminId',
          count: { $sum: 1 },
          products: { $push: '$name' }
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

    if (productsByAdmin.length === 0) {
      console.log('No products found in the database.');
    }

    for (const item of productsByAdmin) {
      if (item._id) {
        if (item.admin && item.admin.length > 0) {
          console.log(`\n${item.admin[0].name} (${item.admin[0].email}):`);
          console.log(`  Total: ${item.count} products`);
          console.log(`  Products: ${item.products.slice(0, 3).join(', ')}${item.count > 3 ? '...' : ''}`);
        } else {
          console.log(`\nAdmin ID ${item._id}:`);
          console.log(`  Total: ${item.count} products`);
          console.log(`  ⚠️  Admin not found in database!`);
        }
      } else {
        console.log(`\nProducts without adminId: ${item.count}`);
      }
    }

    // Get all admins
    console.log('\n--- All Admins in System ---');
    const admins = await Admin.find({}).select('name email role isActive');
    
    if (admins.length === 0) {
      console.log('⚠️  No admins found in the system!');
    } else {
      admins.forEach(admin => {
        console.log(`${admin.name} (${admin.email}) - ${admin.role} - ${admin.isActive ? 'Active' : 'Inactive'}`);
      });
    }

    console.log('\n✅ Check completed!');
    process.exit(0);

  } catch (error) {
    console.error('Error during check:', error);
    process.exit(1);
  }
}

// Run check
console.log('=================================');
console.log('Product adminId Check Script');
console.log('=================================\n');

checkProductAdminId();
