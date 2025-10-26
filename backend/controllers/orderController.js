const Order = require('../models/Order');
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

    // Calculate estimated delivery (7 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    const order = new Order({
      userId: req.user._id,
      items: items.map(item => ({
        ...item,
        image: item.image || '/api/placeholder/100/100'
      })),
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
      message: 'Server error while creating order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    console.log('=== GET USER ORDERS REQUEST ===');
    console.log('Authenticated User ID:', req.user?._id);
    console.log('User Role:', req.user?.role);
    console.log('User Email:', req.user?.email);
    
    // Security check: Ensure user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // IMPORTANT: Only fetch orders belonging to the authenticated user
    const query = { userId: req.user._id };
    console.log('Fetching orders with query:', query);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    console.log(`Found ${orders.length} orders for user ${req.user._id}`);
    console.log(`Total orders for this user: ${total}`);

    res.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    console.log('=== GET ORDER BY ID REQUEST ===');
    console.log('Authenticated User ID:', req.user?._id);
    console.log('Requested Order ID:', req.params.id);
    
    // IMPORTANT: Only allow users to view their own orders
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id  // This ensures users can only see their own orders
    });

    if (!order) {
      console.log('Order not found or user does not have access');
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('Order found for user:', order._id);

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

    // If admin, get only orders containing their products
    let orders;
    let total;

    if (isSuperAdmin) {
      // SuperAdmin sees all orders
      let query = {};
      if (status) {
        query.orderStatus = status;
      }

      orders = await Order.find(query)
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      total = await Order.countDocuments(query);
    } else {
      // Admin sees only orders with their products
      const Product = require('../models/Product');
      const adminProducts = await Product.find({ adminId: adminId }).select('_id');
      const productIds = adminProducts.map(p => p._id.toString());

      let query = {
        'items.productId': { $in: productIds }
      };
      
      if (status) {
        query.orderStatus = status;
      }

      orders = await Order.find(query)
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      total = await Order.countDocuments(query);
    }

    res.json({
      success: true,
      message: 'All orders retrieved successfully',
      data: {
        orders,
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
      const Product = require('../models/Product');
      const adminProducts = await Product.find({ adminId: adminId }).select('_id');
      const productIds = adminProducts.map(p => p._id.toString());
      
      // Check if order contains at least one of admin's products
      const hasAdminProduct = order.items.some(item => 
        productIds.includes(item.productId)
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
