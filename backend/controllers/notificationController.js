const Notification = require('../models/Notification');
const Product = require('../models/Product');
const { Op } = require('sequelize');

// @desc    Get admin notifications
// @route   GET /api/admin/notifications
// @access  Private/Admin
const getNotifications = async (req, res) => {
  try {
    const adminId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    // Sequelize query
    const notifications = await Notification.findAll({
      where: { adminId },
      order: [['createdAt', 'DESC']],
      limit,
      raw: true
    });

    const unreadCount = await Notification.count({ 
      where: {
        adminId, 
        read: false
      }
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/admin/notifications/:id/read
// @access  Private/Admin
const markNotificationRead = async (req, res) => {
  try {
    const adminId = req.user.id;
    const notificationId = req.params.id;

    const notification = await Notification.findOne({
      where: { id: notificationId, adminId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/admin/notifications/read-all
// @access  Private/Admin
const markAllNotificationsRead = async (req, res) => {
  try {
    const adminId = req.user.id;

    const [affectedCount] = await Notification.update(
      { read: true },
      { 
        where: { 
          adminId, 
          read: false 
        }
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { 
        modifiedCount: affectedCount
      }
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/admin/notifications/:id
// @access  Private/Admin
const deleteNotification = async (req, res) => {
  try {
    const adminId = req.user.id;
    const notificationId = req.params.id;

    const deletedCount = await Notification.destroy({
      where: {
        id: notificationId,
        adminId
      }
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create notification (helper function)
// @access  Internal
const createNotification = async (adminId, type, title, message, orderId = null, productId = null) => {
  try {
    const notification = await Notification.create({
      adminId,
      type,
      title,
      message,
      orderId,
      productId
    });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

// @desc    Create notifications for order (helper function)
// @access  Internal
const createOrderNotification = async (order) => {
  try {
    // Get unique admin IDs from order items
    const productIds = order.items.map(item => item.productId);
    const products = await Product.findAll({ 
      where: { id: { [Op.in]: productIds } },
      attributes: ['adminId', 'name']
    });
    
    // Group products by admin
    const adminProducts = {};
    products.forEach(product => {
      const adminId = product.adminId.toString();
      if (!adminProducts[adminId]) {
        adminProducts[adminId] = [];
      }
      adminProducts[adminId].push(product.name);
    });

    // Create notification for each admin
    const notifications = [];
    for (const [adminId, productNames] of Object.entries(adminProducts)) {
      const notification = await createNotification(
        adminId,
        'new_order',
        'New Order Received! 🎉',
        `You have a new order (#${order.orderNumber || order.id.toString().slice(-6)}) for ${productNames.length} product(s): ${productNames.slice(0, 2).join(', ')}${productNames.length > 2 ? '...' : ''}`,
        order.id
      );
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  } catch (error) {
    console.error('Create order notification error:', error);
    return [];
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  createNotification,
  createOrderNotification
};
