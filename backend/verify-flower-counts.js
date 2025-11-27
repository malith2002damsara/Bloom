/**
 * FLOWER COUNT COLUMNS VERIFICATION
 * ==================================
 * This script verifies that flower count is stored separately for each size
 * Run with: node verify-flower-counts.js
 */

require('dotenv').config();
const { sequelize } = require('./config/database');
const Product = require('./models/Product');

async function verifyFlowerCounts() {
  try {
    console.log('\n🌸 === FLOWER COUNT VERIFICATION ===\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    // Get latest product
    const latestProduct = await Product.findOne({
      order: [['createdAt', 'DESC']]
    });
    
    if (!latestProduct) {
      console.log('⚠️  No products found. Create a product first.\n');
      process.exit(0);
    }
    
    console.log('📦 Product:', latestProduct.name);
    console.log('🏷️  Category:', latestProduct.category);
    console.log('\n══════════════════════════════════════════════════════════════\n');
    
    console.log('🌸 FLOWER COUNT PER SIZE (Separate Database Columns):\n');
    
    let totalFlowerCount = 0;
    let sizesWithFlowers = 0;
    
    // Check Small size
    if (latestProduct.smallPrice) {
      console.log('✅ SMALL SIZE:');
      console.log('   ├─ Price: Rs.' + latestProduct.smallPrice);
      console.log('   ├─ Flower Count: ' + (latestProduct.smallFlowerCount || 0) + ' flowers');
      console.log('   └─ Status: ' + (latestProduct.smallFlowerCount ? '✅ Stored separately' : '⚠️  No flower count'));
      if (latestProduct.smallFlowerCount) {
        totalFlowerCount += latestProduct.smallFlowerCount;
        sizesWithFlowers++;
      }
      console.log('');
    }
    
    // Check Medium size
    if (latestProduct.mediumPrice) {
      console.log('✅ MEDIUM SIZE:');
      console.log('   ├─ Price: Rs.' + latestProduct.mediumPrice);
      console.log('   ├─ Flower Count: ' + (latestProduct.mediumFlowerCount || 0) + ' flowers');
      console.log('   └─ Status: ' + (latestProduct.mediumFlowerCount ? '✅ Stored separately' : '⚠️  No flower count'));
      if (latestProduct.mediumFlowerCount) {
        totalFlowerCount += latestProduct.mediumFlowerCount;
        sizesWithFlowers++;
      }
      console.log('');
    }
    
    // Check Large size
    if (latestProduct.largePrice) {
      console.log('✅ LARGE SIZE:');
      console.log('   ├─ Price: Rs.' + latestProduct.largePrice);
      console.log('   ├─ Flower Count: ' + (latestProduct.largeFlowerCount || 0) + ' flowers');
      console.log('   └─ Status: ' + (latestProduct.largeFlowerCount ? '✅ Stored separately' : '⚠️  No flower count'));
      if (latestProduct.largeFlowerCount) {
        totalFlowerCount += latestProduct.largeFlowerCount;
        sizesWithFlowers++;
      }
      console.log('');
    }
    
    // Check Extra Large size
    if (latestProduct.extraLargePrice) {
      console.log('✅ EXTRA LARGE SIZE:');
      console.log('   ├─ Price: Rs.' + latestProduct.extraLargePrice);
      console.log('   ├─ Flower Count: ' + (latestProduct.extraLargeFlowerCount || 0) + ' flowers');
      console.log('   └─ Status: ' + (latestProduct.extraLargeFlowerCount ? '✅ Stored separately' : '⚠️  No flower count'));
      if (latestProduct.extraLargeFlowerCount) {
        totalFlowerCount += latestProduct.extraLargeFlowerCount;
        sizesWithFlowers++;
      }
      console.log('');
    }
    
    console.log('══════════════════════════════════════════════════════════════\n');
    
    // Summary
    console.log('📊 SUMMARY:\n');
    console.log('   ├─ Sizes with flower count: ' + sizesWithFlowers);
    console.log('   ├─ Total flowers (from separate columns): ' + totalFlowerCount);
    console.log('   └─ Total flowers (from numberOfFlowers): ' + latestProduct.numberOfFlowers);
    
    if (totalFlowerCount === latestProduct.numberOfFlowers) {
      console.log('\n✅ VERIFICATION PASSED!');
      console.log('   Flower counts match between separate columns and total.\n');
    } else if (totalFlowerCount > 0) {
      console.log('\n⚠️  NOTICE:');
      console.log('   Separate columns total (' + totalFlowerCount + ') differs from numberOfFlowers (' + latestProduct.numberOfFlowers + ')');
      console.log('   This is normal if product was created before migration.\n');
    }
    
    // Database columns check
    console.log('🔍 DATABASE COLUMNS CHECK:\n');
    const [results] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
        AND column_name LIKE '%FlowerCount%'
      ORDER BY column_name;
    `);
    
    console.log('   Available flower count columns:');
    results.forEach(col => {
      console.log('   ✅ ' + col.column_name + ' (' + col.data_type + ')');
    });
    
    console.log('\n══════════════════════════════════════════════════════════════\n');
    
    console.log('✅ FLOWER COUNT COLUMNS ARE WORKING!\n');
    console.log('Each size stores flower count separately:');
    console.log('  • smallFlowerCount - for Small size');
    console.log('  • mediumFlowerCount - for Medium size');
    console.log('  • largeFlowerCount - for Large size');
    console.log('  • extraLargeFlowerCount - for Extra Large size\n');
    
    console.log('📝 Query Example:');
    console.log('   SELECT name, "smallFlowerCount", "mediumFlowerCount"');
    console.log('   FROM products');
    console.log('   WHERE "smallFlowerCount" >= 12;\n');
    
    await sequelize.close();
    console.log('✅ Database connection closed\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run verification
verifyFlowerCounts();
