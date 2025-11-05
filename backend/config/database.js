const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create a new Sequelize instance using the NeonDB connection string
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Required for NeonDB
    }
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL (NeonDB) connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to NeonDB:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };
