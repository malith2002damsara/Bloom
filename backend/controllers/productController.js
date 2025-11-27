const { Product, Admin } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Helper function to process sizes with all data
const processSizes = (sizes) => {
  return sizes.map(size => {
    const price = parseFloat(size.price || 0);
    const oldPrice = parseFloat(size.oldPrice || 0);
    let discount = 0;
    
    // Calculate discount percentage
    if (oldPrice > 0 && price > 0 && price < oldPrice) {
      discount = Math.round(((oldPrice - price) / oldPrice) * 100 * 100) / 100;
    }
    
    return {
      size: size.size,
      flowerCount: size.flowerCount ? parseInt(size.flowerCount) : undefined,
      price: price,
      oldPrice: oldPrice,
      discount: discount,
      dimensions: {
        height: size.dimensions?.height ? parseFloat(size.dimensions.height) : 0,
        width: size.dimensions?.width ? parseFloat(size.dimensions.width) : 0,
        depth: size.dimensions?.depth ? parseFloat(size.dimensions.depth) : 0
      }
    };
  });
};

// Helper function to process bear sizes
const processBearSizes = (sizes) => {
  return sizes.map(size => {
    const price = parseFloat(size.price || 0);
    const oldPrice = parseFloat(size.oldPrice || 0);
    let discount = 0;
    
    // Calculate discount percentage
    if (oldPrice > 0 && price > 0 && price < oldPrice) {
      discount = Math.round(((oldPrice - price) / oldPrice) * 100 * 100) / 100;
    }
    
    return {
      size: size.size,
      price: price,
      oldPrice: oldPrice,
      discount: discount,
      dimensions: {
        height: size.dimensions?.height ? parseFloat(size.dimensions.height) : 0,
        width: size.dimensions?.width ? parseFloat(size.dimensions.width) : 0,
        depth: size.dimensions?.depth ? parseFloat(size.dimensions.depth) : 0
      }
    };
  });
};

// @desc    Create new product (Admin only)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      occasion,
      numberOfFlowers,
      freshFlowerSelections,
      artificialFlowerSelections,
      flowerSelections,
      sizes,
      dimensions,
      bearDetails,
      seller
    } = req.body;

    console.log('📥 === CREATE PRODUCT REQUEST ===');
    console.log('Category:', category);

    // Validate required fields
    if (!name || !category || !seller) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, category, and seller'
      });
    }

    // Parse JSON strings
    let parsedFreshFlowerSelections = [];
    let parsedArtificialFlowerSelections = [];
    let parsedFlowerSelections = [];
    let parsedSizes = [];
    let parsedDimensions = {};
    let parsedBearDetails = {};
    let parsedSeller = {};

    try {
      if (freshFlowerSelections) {
        parsedFreshFlowerSelections = typeof freshFlowerSelections === 'string' 
          ? JSON.parse(freshFlowerSelections) 
          : freshFlowerSelections;
      }
      
      if (artificialFlowerSelections) {
        parsedArtificialFlowerSelections = typeof artificialFlowerSelections === 'string' 
          ? JSON.parse(artificialFlowerSelections) 
          : artificialFlowerSelections;
      }
      
      if (flowerSelections) {
        parsedFlowerSelections = typeof flowerSelections === 'string' 
          ? JSON.parse(flowerSelections) 
          : flowerSelections;
      }
      
      if (sizes) {
        parsedSizes = typeof sizes === 'string' 
          ? JSON.parse(sizes) 
          : sizes;
      }
      
      if (dimensions) {
        parsedDimensions = typeof dimensions === 'string' 
          ? JSON.parse(dimensions) 
          : dimensions;
      }
      
      if (bearDetails) {
        parsedBearDetails = typeof bearDetails === 'string' 
          ? JSON.parse(bearDetails) 
          : bearDetails;
      }
      
      if (seller) {
        parsedSeller = typeof seller === 'string' 
          ? JSON.parse(seller) 
          : seller;
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON format in request data'
      });
    }

    // Validate seller data
    if (!parsedSeller.name || !parsedSeller.contact) {
      return res.status(400).json({
        success: false,
        message: 'Seller must have name and contact'
      });
    }

    // Handle uploaded images from Cloudinary
    const imagePaths = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.path) {
          imagePaths.push(file.path);
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required'
      });
    }

    let basePrice = 0;
    let baseOldPrice = 0;
    let baseDiscount = 0;
    let processedSizes = [];
    let processedBearDetails = {};
    let totalFlowers = 0;

    // Category-specific processing
    if (category === 'bears') {
      // Validate bear details
      if (!parsedBearDetails.sizes || parsedBearDetails.sizes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one bear size is required'
        });
      }
      
      if (!parsedBearDetails.colors || parsedBearDetails.colors.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one bear color is required'
        });
      }

      // Process bear sizes with all data
      const bearSizes = processBearSizes(parsedBearDetails.sizes);
      
      // Validate prices
      const invalidBearSize = bearSizes.find(size => !size.price || size.price <= 0);
      if (invalidBearSize) {
        return res.status(400).json({
          success: false,
          message: `Please add a valid price for ${invalidBearSize.size} bear size`
        });
      }

      // Find lowest price for base price
      basePrice = Math.min(...bearSizes.map(s => s.price));
      const lowestPriceItem = bearSizes.find(s => s.price === basePrice);
      baseOldPrice = lowestPriceItem.oldPrice;
      baseDiscount = lowestPriceItem.discount;

      processedBearDetails = {
        sizes: bearSizes,
        colors: parsedBearDetails.colors
      };

      console.log('🐻 Processed Bear Details:', JSON.stringify(processedBearDetails, null, 2));

    } else {
      // Validate flower bouquet data
      if (!parsedSizes || parsedSizes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one size is required for flower bouquets'
        });
      }

      // Process sizes with all data
      processedSizes = processSizes(parsedSizes);
      
      // Validate prices
      const invalidSize = processedSizes.find(size => !size.price || size.price <= 0);
      if (invalidSize) {
        return res.status(400).json({
          success: false,
          message: `Please add a valid price for ${invalidSize.size} size`
        });
      }

      // Find lowest price for base price
      basePrice = Math.min(...processedSizes.map(s => s.price));
      const lowestPriceItem = processedSizes.find(s => s.price === basePrice);
      baseOldPrice = lowestPriceItem.oldPrice;
      baseDiscount = lowestPriceItem.discount;

      // Calculate total flowers
      totalFlowers = processedSizes.reduce((total, size) => {
        return total + (parseInt(size.flowerCount) || 0);
      }, 0);

      // Category-specific flower validation
      if (category === 'fresh') {
        if (!parsedFreshFlowerSelections || parsedFreshFlowerSelections.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one fresh flower selection is required'
          });
        }
        
        const invalidFlower = parsedFreshFlowerSelections.find(selection => 
          !selection.colors || selection.colors.length === 0
        );
        if (invalidFlower) {
          return res.status(400).json({
            success: false,
            message: `Please select colors for ${invalidFlower.flower}`
          });
        }
      } else if (category === 'artificial') {
        if (!parsedArtificialFlowerSelections || parsedArtificialFlowerSelections.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one artificial flower selection is required'
          });
        }
        
        const invalidFlower = parsedArtificialFlowerSelections.find(selection => 
          !selection.colors || selection.colors.length === 0
        );
        if (invalidFlower) {
          return res.status(400).json({
            success: false,
            message: `Please select colors for ${invalidFlower.flower}`
          });
        }
      } else if (category === 'mixed') {
        if ((!parsedFreshFlowerSelections || parsedFreshFlowerSelections.length === 0) && 
            (!parsedArtificialFlowerSelections || parsedArtificialFlowerSelections.length === 0)) {
          return res.status(400).json({
            success: false,
            message: 'At least one fresh or artificial flower selection is required'
          });
        }
      }

      console.log('💐 Processed Sizes:', JSON.stringify(processedSizes, null, 2));
    }

    // Get admin ID from request
    const adminId = req.user.id;

    // Helper function to populate size-specific columns
    const populateSizeColumns = (sizes, sizeName) => {
      // Normalize both for comparison (remove spaces, lowercase)
      const normalizedSizeName = sizeName.toLowerCase().replace(/\s+/g, '');
      const sizeData = sizes.find(s => s.size.toLowerCase().replace(/\s+/g, '') === normalizedSizeName);
      if (!sizeData) return {};
      
      // Keep camelCase for column names (e.g., 'extraLarge' not 'extralarge')
      const prefix = sizeName.charAt(0).toLowerCase() + sizeName.slice(1).replace(/\s+/g, '');
      const savings = sizeData.oldPrice > sizeData.price ? sizeData.oldPrice - sizeData.price : 0;
      
      return {
        [`${prefix}Price`]: sizeData.price,
        [`${prefix}OldPrice`]: sizeData.oldPrice,
        [`${prefix}Discount`]: sizeData.discount,
        [`${prefix}DiscountedPrice`]: savings, // Savings amount (oldPrice - price)
        [`${prefix}FlowerCount`]: sizeData.flowerCount || null,
        [`${prefix}DimensionsHeight`]: sizeData.dimensions?.height || null,
        [`${prefix}DimensionsWidth`]: sizeData.dimensions?.width || null,
        [`${prefix}DimensionsDepth`]: sizeData.dimensions?.depth || null,
      };
    };

    // Populate individual size columns for flower bouquets
    let sizeSpecificColumns = {};
    if (category !== 'bears' && processedSizes.length > 0) {
      // Small size columns
      sizeSpecificColumns = {
        ...sizeSpecificColumns,
        ...populateSizeColumns(processedSizes, 'small')
      };
      
      // Medium size columns
      sizeSpecificColumns = {
        ...sizeSpecificColumns,
        ...populateSizeColumns(processedSizes, 'medium')
      };
      
      // Large size columns
      sizeSpecificColumns = {
        ...sizeSpecificColumns,
        ...populateSizeColumns(processedSizes, 'large')
      };
      
      // Extra Large size columns
      sizeSpecificColumns = {
        ...sizeSpecificColumns,
        ...populateSizeColumns(processedSizes, 'extraLarge')
      };
    } else if (category === 'bears' && processedBearDetails.sizes?.length > 0) {
      // For bears, use their size data
      sizeSpecificColumns = {
        ...sizeSpecificColumns,
        ...populateSizeColumns(processedBearDetails.sizes, 'small')
      };
      
      sizeSpecificColumns = {
        ...sizeSpecificColumns,
        ...populateSizeColumns(processedBearDetails.sizes, 'medium')
      };
      
      sizeSpecificColumns = {
        ...sizeSpecificColumns,
        ...populateSizeColumns(processedBearDetails.sizes, 'large')
      };
    }

    // Prepare complete product data object
    const productData = {
      // Basic Info (Columns 1-4)
      name: name.trim(),
      description: description ? description.trim() : '',
      
      // Pricing Info - Base prices from lowest-priced size (Columns 5-8)
      price: basePrice,
      oldPrice: baseOldPrice,
      discount: baseDiscount,
      discountedPrice: baseOldPrice > basePrice ? baseOldPrice - basePrice : 0,
      
      // Category & Occasion (Columns 9-10)
      category,
      occasion: occasion || '',
      
      // Media (Column 11)
      images: imagePaths,
      
      // Dimensions - General product dimensions (Columns 12-14)
      dimensionsHeight: parsedDimensions.height ? parseFloat(parsedDimensions.height) : 0,
      dimensionsWidth: parsedDimensions.width ? parseFloat(parsedDimensions.width) : 0,
      dimensionsDepth: parsedDimensions.depth ? parseFloat(parsedDimensions.depth) : 0,
      
      // Flower Count (Column 15)
      numberOfFlowers: totalFlowers,
      
      // Size-specific data with individual prices & dimensions (Column 16)
      sizes: category === 'bears' ? [] : processedSizes,
      
      // SEPARATE SIZE COLUMNS - Individual columns for each size
      ...sizeSpecificColumns,
      
      // Flower Selections (Columns 17-19)
      freshFlowerSelections: category !== 'bears' ? (parsedFreshFlowerSelections || []) : [],
      artificialFlowerSelections: category !== 'bears' ? (parsedArtificialFlowerSelections || []) : [],
      flowerSelections: category !== 'bears' && parsedFlowerSelections.length > 0 ? parsedFlowerSelections : [],
      
      // Bear-specific data with sizes & colors (Column 20)
      bearDetails: category === 'bears' ? processedBearDetails : {},
      
      // Seller Info (Columns 21-23)
      sellerName: parsedSeller.name.trim(),
      sellerContact: parsedSeller.contact.trim(),
      adminId: adminId,
      
      // Stock Management (Columns 24-26)
      inStock: true,
      stock: 10,
      status: 'active',
      
      // Sales & Ratings - Auto-initialized (Columns 27-30)
      // ratingsAverage: 0 (default),
      // ratingsCount: 0 (default),
      // salesCount: 0 (default),
      // salesRevenue: 0 (default)
      
      // Timestamps: createdAt, updatedAt (Columns 31-32) - Auto-generated by Sequelize
    };

    console.log('💾 === SAVING PRODUCT TO DATABASE ===');
    console.log('📋 Complete Product Data Structure:');
    console.log('  ├─ Basic: name, description, category, occasion');
    console.log('  ├─ Pricing: price=' + basePrice + ', oldPrice=' + baseOldPrice + ', discount=' + baseDiscount + '%');
    console.log('  ├─ Dimensions: H=' + productData.dimensionsHeight + ', W=' + productData.dimensionsWidth + ', D=' + productData.dimensionsDepth);
    console.log('  ├─ Images: ' + imagePaths.length + ' files');
    console.log('  ├─ Sizes: ' + (category === 'bears' ? processedBearDetails.sizes?.length : processedSizes.length) + ' sizes with individual prices & dimensions');
    console.log('  ├─ Size-specific columns populated: Small=' + !!productData.smallPrice + ', Medium=' + !!productData.mediumPrice + ', Large=' + !!productData.largePrice + ', XL=' + !!productData.extralargePrice);
    console.log('  ├─ Flowers: Fresh=' + (parsedFreshFlowerSelections?.length || 0) + ', Artificial=' + (parsedArtificialFlowerSelections?.length || 0));
    console.log('  ├─ Seller: ' + parsedSeller.name + ' (' + parsedSeller.contact + ')');
    console.log('  └─ Stock: ' + productData.stock + ' units, status=' + productData.status);

    // Create product in database
    const product = await Product.create(productData);

    console.log('✅ === PRODUCT SUCCESSFULLY CREATED ===');
    console.log('📦 Product ID:', product.id);
    console.log('💰 Base Pricing:', {
      price: product.price,
      oldPrice: product.oldPrice,
      discount: product.discount + '%',
      discountedPrice: product.discountedPrice
    });
    console.log('📐 General Dimensions:', {
      height: product.dimensionsHeight,
      width: product.dimensionsWidth,
      depth: product.dimensionsDepth
    });
    
    // Log separate size columns
    console.log('📊 SEPARATE SIZE COLUMNS (Individual Database Columns):');
    if (product.smallPrice) {
      console.log('  ├─ SMALL:', {
        price: product.smallPrice,
        oldPrice: product.smallOldPrice,
        discount: product.smallDiscount + '%',
        discountedPrice: product.smallDiscountedPrice,
        flowerCount: product.smallFlowerCount,
        dimensions: {
          height: product.smallDimensionsHeight,
          width: product.smallDimensionsWidth,
          depth: product.smallDimensionsDepth
        }
      });
    }
    if (product.mediumPrice) {
      console.log('  ├─ MEDIUM:', {
        price: product.mediumPrice,
        oldPrice: product.mediumOldPrice,
        discount: product.mediumDiscount + '%',
        discountedPrice: product.mediumDiscountedPrice,
        flowerCount: product.mediumFlowerCount,
        dimensions: {
          height: product.mediumDimensionsHeight,
          width: product.mediumDimensionsWidth,
          depth: product.mediumDimensionsDepth
        }
      });
    }
    if (product.largePrice) {
      console.log('  ├─ LARGE:', {
        price: product.largePrice,
        oldPrice: product.largeOldPrice,
        discount: product.largeDiscount + '%',
        discountedPrice: product.largeDiscountedPrice,
        flowerCount: product.largeFlowerCount,
        dimensions: {
          height: product.largeDimensionsHeight,
          width: product.largeDimensionsWidth,
          depth: product.largeDimensionsDepth
        }
      });
    }
    if (product.extraLargePrice) {
      console.log('  └─ EXTRA LARGE:', {
        price: product.extraLargePrice,
        oldPrice: product.extraLargeOldPrice,
        discount: product.extraLargeDiscount + '%',
        discountedPrice: product.extraLargeDiscountedPrice,
        flowerCount: product.extraLargeFlowerCount,
        dimensions: {
          height: product.extraLargeDimensionsHeight,
          width: product.extraLargeDimensionsWidth,
          depth: product.extraLargeDimensionsDepth
        }
      });
    }
    
    console.log('📋 JSONB Sizes Array:', category === 'bears' 
      ? product.bearDetails.sizes 
      : product.sizes.map(s => ({
          size: s.size,
          price: s.price,
          oldPrice: s.oldPrice,
          discount: s.discount + '%',
          dimensions: s.dimensions
        }))
    );
    console.log('🎯 All database columns populated successfully!');
    console.log('✅ Both JSONB array AND separate columns stored!');

    res.status(201).json({
      success: true,
      message: `${category === 'bears' ? 'Bear product' : 'Flower bouquet'} created successfully`,
      data: { product }
    });

  } catch (error) {
    console.error('❌ Create product error:', error);
    
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      const { cloudinary } = require('../middleware/upload');
      req.files.forEach(async (file) => {
        try {
          const publicId = file.filename || file.public_id;
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (deleteError) {
          console.error('Error deleting file:', deleteError);
        }
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update product (Admin only)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      name,
      description,
      category,
      occasion,
      freshFlowerSelections,
      artificialFlowerSelections,
      flowerSelections,
      sizes,
      dimensions,
      bearDetails,
      seller
    } = req.body;

    console.log('📝 === UPDATE PRODUCT REQUEST ===');
    console.log('Product ID:', productId);

    // Check if product exists
    const existingProduct = await Product.findByPk(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Verify permissions
    if (req.user.role !== 'superadmin' && existingProduct.adminId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this product'
      });
    }

    // Parse JSON strings
    let parsedFreshFlowerSelections, parsedArtificialFlowerSelections;
    let parsedFlowerSelections, parsedSizes, parsedDimensions;
    let parsedBearDetails, parsedSeller;

    try {
      if (freshFlowerSelections) {
        parsedFreshFlowerSelections = typeof freshFlowerSelections === 'string' 
          ? JSON.parse(freshFlowerSelections) : freshFlowerSelections;
      }
      if (artificialFlowerSelections) {
        parsedArtificialFlowerSelections = typeof artificialFlowerSelections === 'string' 
          ? JSON.parse(artificialFlowerSelections) : artificialFlowerSelections;
      }
      if (flowerSelections) {
        parsedFlowerSelections = typeof flowerSelections === 'string' 
          ? JSON.parse(flowerSelections) : flowerSelections;
      }
      if (sizes) {
        parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      }
      if (dimensions) {
        parsedDimensions = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
      }
      if (bearDetails) {
        parsedBearDetails = typeof bearDetails === 'string' ? JSON.parse(bearDetails) : bearDetails;
      }
      if (seller) {
        parsedSeller = typeof seller === 'string' ? JSON.parse(seller) : seller;
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON format in request data'
      });
    }

    const updateData = {};

    // Update basic fields
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category;
    if (occasion !== undefined) updateData.occasion = occasion;

    // Handle new images
    if (req.files && req.files.length > 0) {
      const imagePaths = [];
      req.files.forEach((file) => {
        if (file.path) imagePaths.push(file.path);
      });
      updateData.images = imagePaths;
    }

    // Update dimensions
    if (parsedDimensions && Object.keys(parsedDimensions).length > 0) {
      updateData.dimensionsHeight = parsedDimensions.height ? parseFloat(parsedDimensions.height) : existingProduct.dimensionsHeight;
      updateData.dimensionsWidth = parsedDimensions.width ? parseFloat(parsedDimensions.width) : existingProduct.dimensionsWidth;
      updateData.dimensionsDepth = parsedDimensions.depth ? parseFloat(parsedDimensions.depth) : existingProduct.dimensionsDepth;
    }

    // Update seller
    if (parsedSeller && Object.keys(parsedSeller).length > 0) {
      updateData.sellerName = parsedSeller.name ? parsedSeller.name.trim() : existingProduct.sellerName;
      updateData.sellerContact = parsedSeller.contact ? parsedSeller.contact.trim() : existingProduct.sellerContact;
    }

    // Process category-specific updates
    const updateCategory = category || existingProduct.category;

    if (updateCategory === 'bears') {
      if (parsedBearDetails && parsedBearDetails.sizes && parsedBearDetails.sizes.length > 0) {
        const processedBearSizes = processBearSizes(parsedBearDetails.sizes);
        
        // Calculate base price from bear sizes
        const basePrice = Math.min(...processedBearSizes.map(s => s.price));
        const lowestPriceItem = processedBearSizes.find(s => s.price === basePrice);
        
        updateData.price = basePrice;
        updateData.oldPrice = lowestPriceItem.oldPrice;
        updateData.discount = lowestPriceItem.discount;
        updateData.discountedPrice = lowestPriceItem.oldPrice > basePrice ? lowestPriceItem.oldPrice - basePrice : 0;
        
        updateData.bearDetails = {
          sizes: processedBearSizes,
          colors: parsedBearDetails.colors || existingProduct.bearDetails?.colors || []
        };

        // Clear flower fields
        updateData.sizes = [];
        updateData.freshFlowerSelections = [];
        updateData.artificialFlowerSelections = [];
        updateData.flowerSelections = [];
        updateData.numberOfFlowers = 0;
      }
    } else {
      // Flower bouquet updates
      if (parsedSizes && parsedSizes.length > 0) {
        const processedSizes = processSizes(parsedSizes);
        
        // Calculate base price from sizes
        const basePrice = Math.min(...processedSizes.map(s => s.price));
        const lowestPriceItem = processedSizes.find(s => s.price === basePrice);
        
        updateData.price = basePrice;
        updateData.oldPrice = lowestPriceItem.oldPrice;
        updateData.discount = lowestPriceItem.discount;
        updateData.discountedPrice = lowestPriceItem.oldPrice > basePrice ? lowestPriceItem.oldPrice - basePrice : 0;
        
        updateData.sizes = processedSizes;
        
        // Calculate total flowers
        updateData.numberOfFlowers = processedSizes.reduce((total, size) => {
          return total + (parseInt(size.flowerCount) || 0);
        }, 0);
        
        // Populate individual size columns
        const populateSizeColumns = (sizes, sizeName) => {
          // Normalize both for comparison (remove spaces, lowercase)
          const normalizedSizeName = sizeName.toLowerCase().replace(/\s+/g, '');
          const sizeData = sizes.find(s => s.size.toLowerCase().replace(/\s+/g, '') === normalizedSizeName);
          if (!sizeData) return {};
          
          // Keep camelCase for column names (e.g., 'extraLarge' not 'extralarge')
          const prefix = sizeName.charAt(0).toLowerCase() + sizeName.slice(1).replace(/\s+/g, '');
          const savings = sizeData.oldPrice > sizeData.price ? sizeData.oldPrice - sizeData.price : 0;
          
          return {
            [`${prefix}Price`]: sizeData.price,
            [`${prefix}OldPrice`]: sizeData.oldPrice,
            [`${prefix}Discount`]: sizeData.discount,
            [`${prefix}DiscountedPrice`]: savings,
            [`${prefix}FlowerCount`]: sizeData.flowerCount || null,
            [`${prefix}DimensionsHeight`]: sizeData.dimensions?.height || null,
            [`${prefix}DimensionsWidth`]: sizeData.dimensions?.width || null,
            [`${prefix}DimensionsDepth`]: sizeData.dimensions?.depth || null,
          };
        };
        
        // Update all size-specific columns
        Object.assign(updateData, {
          ...populateSizeColumns(processedSizes, 'small'),
          ...populateSizeColumns(processedSizes, 'medium'),
          ...populateSizeColumns(processedSizes, 'large'),
          ...populateSizeColumns(processedSizes, 'extraLarge')
        });
      }

      if (parsedFreshFlowerSelections && parsedFreshFlowerSelections.length > 0) {
        updateData.freshFlowerSelections = parsedFreshFlowerSelections;
      }

      if (parsedArtificialFlowerSelections && parsedArtificialFlowerSelections.length > 0) {
        updateData.artificialFlowerSelections = parsedArtificialFlowerSelections;
      }

      if (parsedFlowerSelections && parsedFlowerSelections.length > 0) {
        updateData.flowerSelections = parsedFlowerSelections;
      }

      // Clear bear fields
      if (category && category !== 'bears') {
        updateData.bearDetails = {};
      }
    }

    console.log('📊 Update Data:', JSON.stringify(updateData, null, 2));

    // Perform update
    const [affectedRows, updatedProducts] = await Product.update(
      updateData,
      {
        where: { id: productId },
        returning: true
      }
    );

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('✅ === PRODUCT UPDATED ===');

    res.json({
      success: true,
      message: `${updatedProducts[0].category === 'bears' ? 'Bear product' : 'Flower bouquet'} updated successfully`,
      data: { product: updatedProducts[0] }
    });

  } catch (error) {
    console.error('❌ Update product error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all products with filtering, searching, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, occasion, minPrice, maxPrice, search, adminId, adminCode, page = 1, limit = 12 } = req.query;
    
    const where = { status: 'active' };
    const includeOptions = [];
    
    if (category) where.category = category;
    if (occasion) where.occasion = occasion;
    if (adminId) where.adminId = adminId;
    
    // Build Admin include
    const adminInclude = {
      model: Admin,
      as: 'admin',
      attributes: ['id', 'name', 'adminCode', 'shopName', 'address'],
      required: false
    };

    // If adminCode is provided, filter by it
    if (adminCode) {
      adminInclude.where = { adminCode: adminCode };
      adminInclude.required = true;
    }

    includeOptions.push(adminInclude);
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    // Handle search - use raw SQL for searching across product and admin fields
    if (search) {
      const searchTerm = `%${search}%`;
      
      // Use Sequelize's literal to search across joined tables
      const products = await sequelize.query(`
        SELECT DISTINCT p.* 
        FROM products p
        LEFT JOIN admins a ON p."adminId" = a.id
        WHERE p.status = 'active'
        ${category ? `AND p.category = :category` : ''}
        ${occasion ? `AND p.occasion = :occasion` : ''}
        ${adminId ? `AND p."adminId" = :adminId` : ''}
        ${adminCode ? `AND a."adminCode" = :adminCode` : ''}
        ${minPrice ? `AND p.price >= :minPrice` : ''}
        ${maxPrice ? `AND p.price <= :maxPrice` : ''}
        AND (
          p.name ILIKE :search 
          OR p.description ILIKE :search
          OR a."shopName" ILIKE :search
          OR a.address ILIKE :search
          OR a.name ILIKE :search
        )
        ORDER BY p."createdAt" DESC
        LIMIT :limit OFFSET :offset
      `, {
        replacements: {
          search: searchTerm,
          category,
          occasion,
          adminId,
          adminCode,
          minPrice: minPrice ? parseFloat(minPrice) : null,
          maxPrice: maxPrice ? parseFloat(maxPrice) : null,
          limit: parseInt(limit),
          offset: (parseInt(page) - 1) * parseInt(limit)
        },
        type: sequelize.QueryTypes.SELECT
      });

      // Get total count for pagination
      const countResult = await sequelize.query(`
        SELECT COUNT(DISTINCT p.id) as count
        FROM products p
        LEFT JOIN admins a ON p."adminId" = a.id
        WHERE p.status = 'active'
        ${category ? `AND p.category = :category` : ''}
        ${occasion ? `AND p.occasion = :occasion` : ''}
        ${adminId ? `AND p."adminId" = :adminId` : ''}
        ${adminCode ? `AND a."adminCode" = :adminCode` : ''}
        ${minPrice ? `AND p.price >= :minPrice` : ''}
        ${maxPrice ? `AND p.price <= :maxPrice` : ''}
        AND (
          p.name ILIKE :search 
          OR p.description ILIKE :search
          OR a."shopName" ILIKE :search
          OR a.address ILIKE :search
          OR a.name ILIKE :search
        )
      `, {
        replacements: {
          search: searchTerm,
          category,
          occasion,
          adminId,
          adminCode,
          minPrice: minPrice ? parseFloat(minPrice) : null,
          maxPrice: maxPrice ? parseFloat(maxPrice) : null
        },
        type: sequelize.QueryTypes.SELECT
      });

      const count = parseInt(countResult[0].count);

      return res.json({
        success: true,
        data: {
          products,
          pagination: {
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / parseInt(limit))
          }
        }
      });
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await Product.findAndCountAll({
      where,
      include: includeOptions,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true
    });
    
    res.json({
      success: true,
      data: {
        products: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, data: { product } });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all product categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = ['fresh', 'artificial', 'bears', 'mixed'];
    res.json({ success: true, data: { categories } });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete product (Admin only)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (req.user.role !== 'superadmin' && product.adminId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await product.destroy();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get 10 newest products from different admins for home page
// @route   GET /api/products/home
// @access  Public
const getHomePageProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { status: 'active' },
      limit: 10,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ success: true, data: { products } });
  } catch (error) {
    console.error('Get home products error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Export all controller functions
module.exports = {
  createProduct,
  updateProduct,
  getProducts,
  getProductById,
  getCategories,
  deleteProduct,
  getHomePageProducts
};