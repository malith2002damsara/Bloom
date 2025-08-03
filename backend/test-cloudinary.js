// Test Cloudinary configuration
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary configuration test:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set');

// Test connection
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error('Cloudinary connection failed:', error);
  } else {
    console.log('Cloudinary connection successful:', result);
  }
});
