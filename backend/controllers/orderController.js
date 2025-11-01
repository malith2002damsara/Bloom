const Order = require('../models/Order');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const { createOrderNotification } = require('./notificationController');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    console.log('=== CREATE ORDER REQUEST ===');
    console.log('User ID:', req.user?._id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { items, customerInfo, paymentMethod, subtotal, tax, shipping, discount, total } = req.body;

    // Fetch product details to get adminId for each item
    const enrichedItems = await Promise.all(items.map(async (item) => {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      
      // Verify the product's admin is active
      const Admin = require('../models/Admin');
      const admin = await Admin.findById(product.adminId);
      
      if (!admin || !admin.isActive) {
        throw new Error(`Product ${item.productId} is no longer available`);
      }
      
      return {
        ...item,
        adminId: product.adminId,
        image: item.image || '/api/placeholder/100/100'
      };
    }));

    // Calculate estimated delivery (7 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    const order = new Order({
      userId: req.user._id,
      items: enrichedItems,
      customerInfo,
      paymentMethod: paymentMethod || 'cod',
      subtotal: subtotal || total,
      tax: tax || 0,
      shipping: shipping || 0,
      discount: discount || 0,
      total,
      estimatedDelivery
    });

    console.log('Order object before save:', JSON.stringify(order, null, 2));
    await order.save();
    console.log('Order saved successfully:', order._id);

    // Create notifications for admins whose products are in this order
    await createOrderNotification(order);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user orders (OPTIMIZED)
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    console.log('=== GET USER ORDERS REQUEST (OPTIMIZED) ===');
    console.log('Authenticated User ID:', req.user?._id);
    
    // Security check: Ensure user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Parse pagination parameters with sensible defaults
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20)); // Max 50 items per page
    const skip = (page - 1) * limit;
    
    // Parse filter parameters
    const status = req.query.status;
    const sortBy = req.query.sortBy || 'newest'; // newest, oldest, amount-high, amount-low
    const search = req.query.search ? req.query.search.trim() : '';

    // Build optimized query
    const query = { userId: req.user._id };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.orderStatus = status;
    }
    
    // Add search filter (search in order number or customer name)
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerInfo.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('Optimized query:', JSON.stringify(query));

    // Determine sort order
    let sortOrder = { createdAt: -1 }; // Default: newest first
    switch (sortBy) {
      case 'oldest':
        sortOrder = { createdAt: 1 };
        break;
      case 'amount-high':
        sortOrder = { total: -1, createdAt: -1 };
        break;
      case 'amount-low':
        sortOrder = { total: 1, createdAt: -1 };
        break;
      default:
        sortOrder = { createdAt: -1 };
    }

    // Execute optimized query with parallel execution
    // Using lean() for 2-3x faster queries
    // Selecting only essential fields to reduce data transfer by ~60%
    const [orders, total] = await Promise.all([
      Order.find(query)
        .select('orderNumber items.productId items.name items.price items.quantity items.image customerInfo.name customerInfo.address customerInfo.city orderStatus paymentMethod paymentStatus total createdAt estimatedDelivery trackingNumber')
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean() // Returns plain JS objects - much faster than Mongoose documents
        .exec(),
      Order.countDocuments(query).exec()
    ]);

    console.log(`✅ Retrieved ${orders.length} orders in optimized query`);

    res.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single order (OPTIMIZED)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    console.log('=== GET ORDER BY ID REQUEST (OPTIMIZED) ===');
    console.log('User ID:', req.user?._id);
    console.log('Order ID:', req.params.id);
    
    // Optimized query with only necessary fields
    // IMPORTANT: Only allow users to view their own orders
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id
    })
    .select('orderNumber items customerInfo orderStatus paymentMethod paymentStatus subtotal tax shipping discount total createdAt estimatedDelivery trackingNumber notes')
    .lean() // Use lean() for 2-3x faster queries
    .exec();

    if (!order) {
      console.log('Order not found or unauthorized access attempt');
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('✅ Order retrieved successfully');

    res.json({
      success: true,
      message: 'Order retrieved successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.orderStatus}`
      });
    }

    order.orderStatus = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin/all
// @access  Private (Admin)
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const adminId = req.user._id;
    const isSuperAdmin = req.user.role === 'superadmin';

    // Build query
    let query = {};
    
    if (status) {
      query.orderStatus = status;
    }

    // If admin (not superadmin), filter to show only orders containing their products
    if (!isSuperAdmin) {
      query['items.adminId'] = adminId;
    }

    console.log('getAllOrders query:', JSON.stringify(query));

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    // If admin, filter items in each order to show only their products
    const filteredOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      if (!isSuperAdmin) {
        // Filter items to show only this admin's products
        orderObj.items = orderObj.items.filter(item => 
          item.adminId.toString() === adminId.toString()
        );
        
        // Recalculate order total based on filtered items
        const adminItemsTotal = orderObj.items.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );
        orderObj.adminTotal = adminItemsTotal;
      }
      
      return orderObj;
    });

    res.json({
      success: true,
      message: 'All orders retrieved successfully',
      data: {
        orders: filteredOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving all orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, trackingNumber } = req.body;
    const adminId = req.user._id;
    const isSuperAdmin = req.user.role === 'superadmin';

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify admin has permission to update this order (unless superadmin)
    if (!isSuperAdmin) {
      // Check if order contains at least one of admin's products
      const hasAdminProduct = order.items.some(item => 
        item.adminId && item.adminId.toString() === adminId.toString()
      );
      
      if (!hasAdminProduct) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this order'
        });
      }
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
};
