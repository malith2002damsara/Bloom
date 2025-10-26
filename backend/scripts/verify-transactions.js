const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Admin = require('../models/Admin');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloomgrad')
  .then(async () => {
    console.log('Connected to MongoDB\n');
    
    const transactions = await Transaction.find()
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 });
    
    console.log('📊 Transaction Summary:\n');
    console.log('Total Transactions:', transactions.length, '\n');
    
    transactions.forEach((t, i) => {
      console.log(`${i + 1}. ${t.description}`);
      console.log(`   Admin: ${t.adminId?.name || 'N/A'}`);
      console.log(`   Revenue: $${t.adminRevenue.toFixed(2)}`);
      console.log(`   Commission: $${t.commissionAmount.toFixed(2)} (${t.commissionRate}%)`);
      console.log(`   Status: ${t.status} | Payment: ${t.paymentStatus}`);
      console.log(`   Period: ${t.period.month}/${t.period.year}\n`);
    });
    
    // Summary by status
    const pending = transactions.filter(t => t.paymentStatus === 'unpaid').length;
    const paid = transactions.filter(t => t.paymentStatus === 'paid').length;
    const totalCommission = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);
    
    console.log('Summary:');
    console.log(`- Paid: ${paid}`);
    console.log(`- Unpaid: ${pending}`);
    console.log(`- Total Commission: $${totalCommission.toFixed(2)}`);
    
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
