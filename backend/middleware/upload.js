const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
  return process.env.CLOUDINARY_CLOUD_NAME && 
         process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name_here' &&
         process.env.CLOUDINARY_API_KEY && 
         process.env.CLOUDINARY_API_KEY !== 'your_api_key_here' &&
         process.env.CLOUDINARY_API_SECRET && 
         process.env.CLOUDINARY_API_SECRET !== 'your_api_secret_here';
};

// Configure multer to use Cloudinary for file uploads or local storage as fallback
let storage;

if (isCloudinaryConfigured()) {
  console.log('Using Cloudinary storage for image uploads');
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'bloomgrad-products',
      allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto:good' }
      ]
    }
  });
} else {
  console.log('Cloudinary not configured, using memory storage as fallback');
  // Fallback to memory storage for development
  storage = multer.memoryStorage();
}

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 4 // Maximum 4 files
  },
  fileFilter: fileFilter
});

// Middleware for uploading multiple images
const uploadProductImages = upload.array('images', 4);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB per file.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 4 images allowed.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.'
      });
    }
  }
  
  if (err.message.includes('Only image files are allowed')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next(err);
};

module.exports = {
  uploadProductImages,
  handleUploadError,
  cloudinary,
  isCloudinaryConfigured
};
