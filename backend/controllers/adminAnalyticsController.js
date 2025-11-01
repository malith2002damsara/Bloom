const Product = require('../models/Product');
const Order = require('../models/Order');
const Admin = require('../models/Admin');

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin only)
const getAdminDashboardStats = async (req, res) => {
  try {
    const adminId = req.user._id;

    // Get product statistics for this admin
    const productStats = await Product.aggregate([
      { $match: { adminId: adminId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object for easier access
    const productStatusCounts = {
      active: 0,
      inactive: 0,
      out_of_stock: 0,
      total: 0
    };

    productStats.forEach(stat => {
      productStatusCounts[stat._id] = stat.count;
      productStatusCounts.total += stat.count;
    });

    // Get order statistics for orders containing this admin's products
    const orderStats = await Order.aggregate([
      { $match: { 'items.adminId': adminId } },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const orderStatusCounts = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      total: 0
    };

    orderStats.forEach(stat => {
      orderStatusCounts[stat._id] = stat.count;
      orderStatusCounts.total += stat.count;
    });

    // Calculate revenue from completed orders
    const revenueData = await Order.aggregate([
      { $match: { 'items.adminId': adminId, orderStatus: { $in: ['delivered', 'completed'] } } },
      { $unwind: '$items' },
      { $match: { 'items.adminId': adminId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          totalOrders: { $addToSet: '$_id' }
        }
      }
    ]);

    const revenue = revenueData.length > 0 ? {
      total: Math.round(revenueData[0].totalRevenue * 100) / 100,
      orderCount: revenueData[0].totalOrders.length
    } : {
      total: 0,
      orderCount: 0
    };

    // Get pending orders (recent 5)
    const pendingOrders = await Order.find({
      'items.adminId': adminId,
      orderStatus: { $in: ['pending', 'confirmed', 'processing'] }
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber orderStatus total createdAt userId');

    // Filter items to show only admin's products in pending orders
    const filteredPendingOrders = pendingOrders.map(order => {
      const orderObj = order.toObject();
      if (orderObj.items) {
        orderObj.items = orderObj.items.filter(item => 
          item.adminId.toString() === adminId.toString()
        );
      }
      return orderObj;
    });

    // Get recent products (last 5 added)
    const recentProducts = await Product.find({ adminId: adminId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name category price images status createdAt');

    res.json({
      success: true,
      data: {
        products: productStatusCounts,
        orders: orderStatusCounts,
        revenue,
        pendingOrders: filteredPendingOrders,
        recentProducts
      }
    });

  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get Admin Product Statistics
// @route   GET /api/admin/products/stats
// @access  Private (Admin only)
const getAdminProductStats = async (req, res) => {
  try {
    const adminId = req.user._id;

    // Get detailed product statistics
    const stats = await Product.aggregate([
      { $match: { adminId: adminId } },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byCategory: [
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ],
          stockInfo: [
            {
              $group: {
                _id: null,
                totalStock: { $sum: '$stock' },
                avgStock: { $avg: '$stock' },
                lowStock: {
                  $sum: { $cond: [{ $lte: ['$stock', 5] }, 1, 0] }
                },
                outOfStock: {
                  $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
                }
              }
            }
          ],
          priceInfo: [
            {
              $group: {
                _id: null,
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
              }
            }
          ]
        }
      }
    ]);

    const totalProducts = await Product.countDocuments({ adminId: adminId });

    res.json({
      success: true,
      data: {
        total: totalProducts,
        byStatus: stats[0].byStatus,
        byCategory: stats[0].byCategory,
        stock: stats[0].stockInfo[0] || {},
        pricing: stats[0].priceInfo[0] || {}
      }
    });

  } catch (error) {
    console.error('Get admin product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get Admin Order Statistics
// @route   GET /api/admin/orders/stats
// @access  Private (Admin only)
const getAdminOrderStats = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get order statistics
    const stats = await Order.aggregate([
      { 
        $match: { 
          'items.adminId': adminId,
          ...dateFilter
        } 
      },
      { $unwind: '$items' },
      { $match: { 'items.adminId': adminId } },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          avgOrderValue: { $avg: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      }
    ]);

    // Get monthly order trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Order.aggregate([
      { 
        $match: { 
          'items.adminId': adminId,
          createdAt: { $gte: sixMonthsAgo }
        } 
      },
      { $unwind: '$items' },
      { $match: { 'items.adminId': adminId } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          orderCount: { $sum: 1 },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top selling products
    const topProducts = await Order.aggregate([
      { $match: { 'items.adminId': adminId, orderStatus: { $in: ['delivered', 'completed'] } } },
      { $unwind: '$items' },
      { $match: { 'items.adminId': adminId } },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: stats,
        monthlyTrends,
        topProducts
      }
    });

  } catch (error) {
    console.error('Get admin order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get Admin Revenue Statistics
// @route   GET /api/admin/revenue
// @access  Private (Admin only)
const getAdminRevenue = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { period = 'all' } = req.query; // all, today, week, month, year

    // Calculate date range based on period
    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'today':
        dateFilter.createdAt = {
          $gte: new Date(now.setHours(0, 0, 0, 0))
        };
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter.createdAt = { $gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter.createdAt = { $gte: monthAgo };
        break;
      case 'year':
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        dateFilter.createdAt = { $gte: yearAgo };
        break;
      default:
        // all time - no date filter
        break;
    }

    // Calculate revenue by order status
    const revenueByStatus = await Order.aggregate([
      { 
        $match: { 
          'items.adminId': adminId,
          ...dateFilter
        } 
      },
      { $unwind: '$items' },
      { $match: { 'items.adminId': adminId } },
      {
        $group: {
          _id: '$orderStatus',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // Calculate total revenue and pending revenue
    const totalRevenue = revenueByStatus
      .filter(r => ['delivered', 'completed'].includes(r._id))
      .reduce((sum, r) => sum + r.revenue, 0);

    const pendingRevenue = revenueByStatus
      .filter(r => ['pending', 'confirmed', 'processing', 'shipped'].includes(r._id))
      .reduce((sum, r) => sum + r.revenue, 0);

    const cancelledRevenue = revenueByStatus
      .filter(r => r._id === 'cancelled')
      .reduce((sum, r) => sum + r.revenue, 0);

    // Get revenue by category
    const revenueByCategory = await Order.aggregate([
      { 
        $match: { 
          'items.adminId': adminId,
          orderStatus: { $in: ['delivered', 'completed'] },
          ...dateFilter
        } 
      },
      { $unwind: '$items' },
      { $match: { 'items.adminId': adminId } },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$product.category',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          itemCount: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          pendingRevenue: Math.round(pendingRevenue * 100) / 100,
          cancelledRevenue: Math.round(cancelledRevenue * 100) / 100
        },
        byStatus: revenueByStatus.map(r => ({
          status: r._id,
          revenue: Math.round(r.revenue * 100) / 100,
          orderCount: r.orderCount
        })),
        byCategory: revenueByCategory.map(r => ({
          category: r._id || 'uncategorized',
          revenue: Math.round(r.revenue * 100) / 100,
          itemCount: r.itemCount
        }))
      }
    });

  } catch (error) {
    console.error('Get admin revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching revenue data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAdminDashboardStats,
  getAdminProductStats,
  getAdminOrderStats,
  getAdminRevenue
};
