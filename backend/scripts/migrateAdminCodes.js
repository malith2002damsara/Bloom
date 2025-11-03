const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const migrateAdminCodes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all admins
    const admins = await Admin.find({});
    console.log(`Found ${admins.length} admins`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const admin of admins) {
      // Check if admin already has a valid 3-digit code
      const hasValidCode = /^\d{3}$/.test(admin.adminCode);
      
      if (hasValidCode) {
        console.log(`✓ Admin ${admin.name} (${admin._id}) already has valid 3-digit code: ${admin.adminCode}`);
        skippedCount++;
        continue;
      }

      console.log(`❌ Admin ${admin.name} (${admin._id}) has invalid code: "${admin.adminCode}"`);

      // Generate new 3-digit code
      let newCode = Math.floor(100 + Math.random() * 900).toString();
      let codeExists = true;
      let attempts = 0;
      const maxAttempts = 50;

      while (codeExists && attempts < maxAttempts) {
        const existing = await Admin.findOne({ 
          adminCode: newCode,
          _id: { $ne: admin._id }
        });
        
        if (!existing) {
          codeExists = false;
        } else {
          newCode = Math.floor(100 + Math.random() * 900).toString();
          attempts++;
        }
      }

      if (attempts >= maxAttempts) {
        console.log(`❌ Failed to generate unique code for admin ${admin.name} (${admin._id})`);
        continue;
      }

      // Update admin code
      await Admin.updateOne(
        { _id: admin._id },
        { $set: { adminCode: newCode } }
      );

      console.log(`✅ Updated admin ${admin.name} (${admin._id}): "${admin.adminCode}" -> "${newCode}"`);
      updatedCount++;
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total admins: ${admins.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped (already valid): ${skippedCount}`);
    console.log('✅ Migration completed successfully!');

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run migration
migrateAdminCodes();
