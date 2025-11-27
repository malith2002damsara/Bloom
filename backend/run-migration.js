/**
 * DATABASE MIGRATION SCRIPT
 * ==========================
 * Adds separate columns for each size's pricing and details
 * Run with: node run-migration.js
 */

require('dotenv').config();
const { sequelize } = require('./config/database');

async function runMigration() {
  try {
    console.log('\n🔧 === DATABASE MIGRATION START ===\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    console.log('📝 Adding columns for SMALL size...');
    await sequelize.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallPrice" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallOldPrice" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallDiscount" NUMERIC(5, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallDiscountedPrice" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallFlowerCount" INTEGER DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallDimensionsHeight" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallDimensionsWidth" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "smallDimensionsDepth" NUMERIC(10, 2) DEFAULT NULL;
    `);
    console.log('✅ Small size columns added');
    
    console.log('📝 Adding columns for MEDIUM size...');
    await sequelize.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumPrice" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumOldPrice" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumDiscount" NUMERIC(5, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumDiscountedPrice" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumFlowerCount" INTEGER DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumDimensionsHeight" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumDimensionsWidth" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "mediumDimensionsDepth" NUMERIC(10, 2) DEFAULT NULL;
    `);
    console.log('✅ Medium size columns added');
    
    console.log('📝 Adding columns for LARGE size...');
    await sequelize.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "largePrice" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "largeOldPrice" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "largeDiscount" NUMERIC(5, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "largeDiscountedPrice" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "largeFlowerCount" INTEGER DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "largeDimensionsHeight" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "largeDimensionsWidth" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "largeDimensionsDepth" NUMERIC(10, 2) DEFAULT NULL;
    `);
    console.log('✅ Large size columns added');
    
    console.log('📝 Adding columns for EXTRA LARGE size...');
    await sequelize.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargePrice" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargeOldPrice" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargeDiscount" NUMERIC(5, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargeDiscountedPrice" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargeFlowerCount" INTEGER DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargeDimensionsHeight" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargeDimensionsWidth" NUMERIC(10, 2) DEFAULT NULL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "extraLargeDimensionsDepth" NUMERIC(10, 2) DEFAULT NULL;
    `);
    console.log('✅ Extra Large size columns added');
    
    console.log('\n📊 Creating indexes for better performance...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_products_small_price ON products ("smallPrice");
      CREATE INDEX IF NOT EXISTS idx_products_medium_price ON products ("mediumPrice");
      CREATE INDEX IF NOT EXISTS idx_products_large_price ON products ("largePrice");
      CREATE INDEX IF NOT EXISTS idx_products_extralarge_price ON products ("extraLargePrice");
    `);
    console.log('✅ Indexes created');
    
    console.log('\n🔍 Verifying columns...');
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
        AND (
          column_name LIKE '%small%' 
          OR column_name LIKE '%medium%' 
          OR column_name LIKE '%large%'
          OR column_name LIKE '%Price%'
          OR column_name LIKE '%Discount%'
          OR column_name LIKE '%FlowerCount%'
          OR column_name LIKE '%Dimensions%'
        )
      ORDER BY column_name;
    `);
    
    console.log('\n📋 New columns added:');
    const sizeColumns = results.filter(col => 
      col.column_name.startsWith('small') || 
      col.column_name.startsWith('medium') || 
      col.column_name.startsWith('large') || 
      col.column_name.startsWith('extraLarge')
    );
    
    console.log('\n✅ SMALL SIZE COLUMNS (' + sizeColumns.filter(c => c.column_name.startsWith('small')).length + '):');
    sizeColumns.filter(c => c.column_name.startsWith('small')).forEach(col => {
      console.log(`   ├─ ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('\n✅ MEDIUM SIZE COLUMNS (' + sizeColumns.filter(c => c.column_name.startsWith('medium')).length + '):');
    sizeColumns.filter(c => c.column_name.startsWith('medium')).forEach(col => {
      console.log(`   ├─ ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('\n✅ LARGE SIZE COLUMNS (' + sizeColumns.filter(c => c.column_name.startsWith('large')).length + '):');
    sizeColumns.filter(c => c.column_name.startsWith('large')).forEach(col => {
      console.log(`   ├─ ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('\n✅ EXTRA LARGE SIZE COLUMNS (' + sizeColumns.filter(c => c.column_name.startsWith('extraLarge')).length + '):');
    sizeColumns.filter(c => c.column_name.startsWith('extraLarge')).forEach(col => {
      console.log(`   ├─ ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('\n🎉 === MIGRATION COMPLETED SUCCESSFULLY ===\n');
    console.log('✅ Added 32 new columns (8 per size × 4 sizes)');
    console.log('✅ Each size now has: price, oldPrice, discount, discountedPrice, flowerCount, height, width, depth');
    console.log('✅ Indexes created for better query performance');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Create a new product through admin panel');
    console.log('   3. Run: node verify-product-storage.js');
    console.log('   4. Check that size-specific columns are populated\n');
    
    await sequelize.close();
    console.log('✅ Database connection closed\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
