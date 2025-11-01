/**
 * Migration Script: Add adminId to Order Items
 * 
 * This script updates existing orders to add adminId to each order item
 * by looking up the product's admin.
 * 
 * Run this ONCE after deploying the multi-admin system changes.
 * 
 * Usage:
 *   node backend/migrations/addAdminIdToOrderItems.js
 */

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  gray: (msg) => console.log(`${colors.gray}${msg}${colors.reset}`)
};

async function migrateOrders() {
  try {
    // Connect to MongoDB
    log.info('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloom', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log.success('Connected to MongoDB');

    // Get all orders
    log.info('Fetching all orders...');
    const orders = await Order.find({});
    log.info(`Found ${orders.length} orders to process`);

    if (orders.length === 0) {
      log.warning('No orders found. Migration not needed.');
      await mongoose.connection.close();
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];

    log.info('Starting migration...\n');

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const orderProgress = `[${i + 1}/${orders.length}]`;
      
      try {
        let needsUpdate = false;
        let itemsUpdated = 0;

        // Check each item in the order
        for (const item of order.items) {
          // Skip if adminId already exists
          if (item.adminId) {
            continue;
          }

          // Look up the product to get adminId
          const product = await Product.findById(item.productId);

          if (!product) {
            log.warning(`${orderProgress} Product ${item.productId} not found for order ${order.orderNumber}`);
            errors.push({
              order: order.orderNumber,
              productId: item.productId,
              productName: item.name,
              error: 'Product not found'
            });
            continue;
          }

          if (!product.adminId) {
            log.warning(`${orderProgress} Product ${item.productId} has no adminId for order ${order.orderNumber}`);
            errors.push({
              order: order.orderNumber,
              productId: item.productId,
              productName: item.name,
              error: 'Product has no adminId'
            });
            continue;
          }

          // Add adminId to item
          item.adminId = product.adminId;
          needsUpdate = true;
          itemsUpdated++;
        }

        if (needsUpdate) {
          // Save the updated order
          await order.save();
          updatedCount++;
          log.success(`${orderProgress} Updated order ${order.orderNumber} (${itemsUpdated} items)`);
        } else {
          skippedCount++;
          log.gray(`${orderProgress} Skipped order ${order.orderNumber} (already has adminId)`);
        }

      } catch (error) {
        errorCount++;
        log.error(`${orderProgress} Error updating order ${order.orderNumber}: ${error.message}`);
        errors.push({
          order: order.orderNumber,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    log.info('Migration Summary:');
    console.log('='.repeat(60));
    log.success(`Orders updated: ${updatedCount}`);
    log.gray(`Orders skipped (already migrated): ${skippedCount}`);
    
    if (errorCount > 0) {
      log.error(`Orders with errors: ${errorCount}`);
    }
    
    console.log('='.repeat(60) + '\n');

    // Show errors if any
    if (errors.length > 0) {
      log.warning(`Found ${errors.length} issues during migration:`);
      errors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. Order: ${err.order}`);
        if (err.productId) console.log(`   Product: ${err.productId} (${err.productName})`);
        console.log(`   Error: ${err.error}`);
      });
      console.log('');
    }

    // Close connection
    await mongoose.connection.close();
    log.success('Migration completed successfully!');

    if (errorCount > 0 || errors.length > 0) {
      log.warning('Some orders had issues. Please review the errors above.');
      process.exit(1);
    }

  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run migration
log.info('Starting Order Items Migration Script\n');
migrateOrders();
