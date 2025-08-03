const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, search, sortBy, page = 1, limit = 20 } = req.query;
    
    // Build query object
    let query = {};

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'seller.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    let sort = {};
    if (sortBy) {
      switch (sortBy) {
        case 'price-low':
          sort.price = 1;
          break;
        case 'price-high':
          sort.price = -1;
          break;
        case 'name-asc':
          sort.name = 1;
          break;
        case 'name-desc':
          sort.name = -1;
          break;
        default:
          sort.createdAt = -1; // Default: newest first
          break;
      }
    } else {
      sort.createdAt = -1; // Default: newest first
    }

    // Calculate pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Execute query with pagination
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNumber)
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Validate ObjectId format
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product retrieved successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    // Get category counts using aggregation
    const categoryCounts = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total count
    const totalCount = await Product.countDocuments();

    // Build categories array
    const categoryMap = categoryCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const categories = [
      { id: 'all', name: 'All Products', count: totalCount },
      { id: 'fresh', name: 'Fresh Flowers', count: categoryMap.fresh || 0 },
      { id: 'artificial', name: 'Artificial Flowers', count: categoryMap.artificial || 0 },
      { id: 'bears', name: 'Graduation Bears', count: categoryMap.bears || 0 },
      { id: 'mixed', name: 'Mixed Arrangements', count: categoryMap.mixed || 0 }
    ];

    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: {
        categories
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving categories',  
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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
      flowerSelections, // Legacy support
      sizes,
      dimensions,
      bearDetails,
      seller
    } = req.body;

    // Validate required fields (removed price from validation)
    if (!name || !category || !seller) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, category, and seller'
      });
    }

    // Parse JSON strings if they exist
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

    // Category-specific validation
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

      // Validate that all bear sizes have prices
      const invalidBearSize = parsedBearDetails.sizes.find(size => !size.price || size.price <= 0);
      if (invalidBearSize) {
        return res.status(400).json({
          success: false,
          message: `Please add a valid price for ${invalidBearSize.size} bear size`
        });
      }
    } else {
      // Validate flower bouquet data
      if (!parsedSizes || parsedSizes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one size is required for flower bouquets'
        });
      }

      // Validate that all sizes have prices
      const invalidSize = parsedSizes.find(size => !size.price || size.price <= 0);
      if (invalidSize) {
        return res.status(400).json({
          success: false,
          message: `Please add a valid price for ${invalidSize.size} size`
        });
      }

      // Category-specific flower validation
      if (category === 'fresh') {
        if (!parsedFreshFlowerSelections || parsedFreshFlowerSelections.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one fresh flower selection is required'
          });
        }
        
        // Validate that each flower selection has colors
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
        
        // Validate that each flower selection has colors
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
            message: 'At least one fresh or artificial flower selection is required for mixed arrangements'
          });
        }
        
        // Validate colors for both types
        const invalidFreshFlower = parsedFreshFlowerSelections.find(selection => 
          selection.colors && selection.colors.length === 0
        );
        const invalidArtificialFlower = parsedArtificialFlowerSelections.find(selection => 
          selection.colors && selection.colors.length === 0
        );
        
        if (invalidFreshFlower) {
          return res.status(400).json({
            success: false,
            message: `Please select colors for fresh ${invalidFreshFlower.flower}`
          });
        }
        
        if (invalidArtificialFlower) {
          return res.status(400).json({
            success: false,
            message: `Please select colors for artificial ${invalidArtificialFlower.flower}`
          });
        }
      }
    }

    // Handle uploaded images from Cloudinary
    const imagePaths = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.path) {
          // Cloudinary returns the full URL in file.path
          imagePaths.push(file.path);
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required'
      });
    }

    // Calculate base price from sizes (lowest price for display purposes)
    let basePrice = 0;
    if (category === 'bears' && parsedBearDetails.sizes && parsedBearDetails.sizes.length > 0) {
      basePrice = Math.min(...parsedBearDetails.sizes.map(size => parseFloat(size.price || 0)));
    } else if (parsedSizes && parsedSizes.length > 0) {
      basePrice = Math.min(...parsedSizes.map(size => parseFloat(size.price || 0)));
    }

    // Calculate total number of flowers for flower bouquets
    let totalFlowers = 0;
    if (category !== 'bears' && parsedSizes) {
      totalFlowers = parsedSizes.reduce((total, size) => {
        const flowerCount = parseInt(size.flowerCount || 0);
        return total + flowerCount;
      }, 0);
    }

    // Create new product
    const productData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: basePrice, // Base price for display/sorting purposes
      category,
      occasion: occasion || '',
      images: imagePaths,
      dimensions: {
        height: parsedDimensions.height ? parseFloat(parsedDimensions.height) : 0,
        width: parsedDimensions.width ? parseFloat(parsedDimensions.width) : 0,
        depth: parsedDimensions.depth ? parseFloat(parsedDimensions.depth) : 0
      },
      numberOfFlowers: totalFlowers,
      seller: {
        name: parsedSeller.name.trim(),
        contact: parsedSeller.contact.trim()
      },
      inStock: true,
      stock: 10
    };

    // Add category-specific data
    if (category === 'bears') {
      // Process bear details with proper price conversion
      const processedBearSizes = parsedBearDetails.sizes.map(size => ({
        ...size,
        price: parseFloat(size.price),
        dimensions: {
          height: size.dimensions?.height ? parseFloat(size.dimensions.height) : 0,
          width: size.dimensions?.width ? parseFloat(size.dimensions.width) : 0,
          depth: size.dimensions?.depth ? parseFloat(size.dimensions.depth) : 0
        }
      }));

      productData.bearDetails = {
        sizes: processedBearSizes,
        colors: parsedBearDetails.colors || []
      };
    } else {
      // Process flower bouquet sizes with proper price conversion
      const processedSizes = parsedSizes.map(size => ({
        ...size,
        price: parseFloat(size.price),
        dimensions: {
          height: size.dimensions?.height ? parseFloat(size.dimensions.height) : 0,
          width: size.dimensions?.width ? parseFloat(size.dimensions.width) : 0,
          depth: size.dimensions?.depth ? parseFloat(size.dimensions.depth) : 0
        }
      }));

      productData.sizes = processedSizes;
      productData.freshFlowerSelections = parsedFreshFlowerSelections || [];
      productData.artificialFlowerSelections = parsedArtificialFlowerSelections || [];
      
      // Legacy support
      if (parsedFlowerSelections.length > 0) {
        productData.flowerSelections = parsedFlowerSelections;
      }
    }

    const product = new Product(productData);
    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: `${category === 'bears' ? 'Bear product' : 'Flower bouquet'} created successfully`,
      data: {
        product: savedProduct
      }
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    // Clean up uploaded files on Cloudinary if product creation fails
    if (req.files && req.files.length > 0) {
      const { cloudinary } = require('../middleware/upload');
      req.files.forEach(async (file) => {
        try {
          // Extract public_id from the Cloudinary URL
          const publicId = file.filename || file.public_id;
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (deleteError) {
          console.error('Error deleting Cloudinary file:', deleteError);
        }
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
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
      numberOfFlowers,
      freshFlowerSelections,
      artificialFlowerSelections,
      flowerSelections, // Legacy support
      sizes,
      dimensions,
      bearDetails,
      seller
    } = req.body;

    // Check if product exists
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Parse JSON strings if they exist
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

    // Calculate base price from sizes/bearDetails if they are being updated
    let basePrice = null;
    if (parsedSizes && parsedSizes.length > 0) {
      const sizePrices = parsedSizes.map(size => parseFloat(size.price || 0)).filter(price => price > 0);
      if (sizePrices.length > 0) {
        basePrice = Math.min(...sizePrices);
      }
    } else if (parsedBearDetails && parsedBearDetails.sizes && parsedBearDetails.sizes.length > 0) {
      const bearPrices = parsedBearDetails.sizes.map(size => parseFloat(size.price || 0)).filter(price => price > 0);
      if (bearPrices.length > 0) {
        basePrice = Math.min(...bearPrices);
      }
    }

    if (basePrice !== null) {
      updateData.price = basePrice;
    }

    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      const imagePaths = [];
      req.files.forEach((file) => {
        if (file.path) {
          imagePaths.push(file.path);
        }
      });
      updateData.images = imagePaths;
    }

    // Update dimensions
    if (parsedDimensions && Object.keys(parsedDimensions).length > 0) {
      updateData.dimensions = {
        height: parsedDimensions.height ? parseFloat(parsedDimensions.height) : existingProduct.dimensions?.height || 0,
        width: parsedDimensions.width ? parseFloat(parsedDimensions.width) : existingProduct.dimensions?.width || 0,
        depth: parsedDimensions.depth ? parseFloat(parsedDimensions.depth) : existingProduct.dimensions?.depth || 0
      };
    }

    // Update seller
    if (parsedSeller && Object.keys(parsedSeller).length > 0) {
      updateData.seller = {
        name: parsedSeller.name ? parsedSeller.name.trim() : existingProduct.seller?.name,
        contact: parsedSeller.contact ? parsedSeller.contact.trim() : existingProduct.seller?.contact
      };
    }

    // Category-specific updates
    if (category === 'bears' || existingProduct.category === 'bears') {
      if (parsedBearDetails && Object.keys(parsedBearDetails).length > 0) {
        // Process bear details with proper price conversion
        const processedBearSizes = parsedBearDetails.sizes ? parsedBearDetails.sizes.map(size => ({
          ...size,
          price: parseFloat(size.price),
          dimensions: {
            height: size.dimensions?.height ? parseFloat(size.dimensions.height) : 0,
            width: size.dimensions?.width ? parseFloat(size.dimensions.width) : 0,
            depth: size.dimensions?.depth ? parseFloat(size.dimensions.depth) : 0
          }
        })) : existingProduct.bearDetails?.sizes || [];

        updateData.bearDetails = {
          sizes: processedBearSizes,
          colors: parsedBearDetails.colors || existingProduct.bearDetails?.colors || []
        };
      }
      
      // Clear flower-specific fields for bears
      if (category === 'bears') {
        updateData.freshFlowerSelections = [];
        updateData.artificialFlowerSelections = [];
        updateData.flowerSelections = [];
        updateData.sizes = [];
        updateData.numberOfFlowers = 0;
      }
    } else {
      // Flower bouquet updates
      if (parsedSizes.length > 0) {
        // Process flower bouquet sizes with proper price conversion
        const processedSizes = parsedSizes.map(size => ({
          ...size,
          price: parseFloat(size.price),
          dimensions: {
            height: size.dimensions?.height ? parseFloat(size.dimensions.height) : 0,
            width: size.dimensions?.width ? parseFloat(size.dimensions.width) : 0,
            depth: size.dimensions?.depth ? parseFloat(size.dimensions.depth) : 0
          }
        }));

        updateData.sizes = processedSizes;
        
        // Calculate total flowers from sizes
        const totalFlowers = parsedSizes.reduce((total, size) => {
          const flowerCount = parseInt(size.flowerCount || 0);
          return total + flowerCount;
        }, 0);
        updateData.numberOfFlowers = totalFlowers;
      }

      if (parsedFreshFlowerSelections.length > 0) {
        updateData.freshFlowerSelections = parsedFreshFlowerSelections;
      }

      if (parsedArtificialFlowerSelections.length > 0) {
        updateData.artificialFlowerSelections = parsedArtificialFlowerSelections;
      }

      // Legacy support
      if (parsedFlowerSelections.length > 0) {
        updateData.flowerSelections = parsedFlowerSelections;
      }

      // Clear bear-specific fields for flower bouquets
      if (category && category !== 'bears') {
        updateData.bearDetails = undefined;
      }
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: `${product.category === 'bears' ? 'Bear product' : 'Flower bouquet'} updated successfully`,
      data: { product }
    });

  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
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

// @desc    Delete product (Admin only)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct
};
