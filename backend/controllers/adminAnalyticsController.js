const Product = require('../models/Product');
const Order = require('../models/Order');
const Admin = require('../models/Admin');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { fn, col, Op } = require('sequelize');
const { sequelize } = require('../config/database');

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin only)
const getAdminDashboardStats = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get product statistics for this admin using Sequelize
    const productStats = await Product.findAll({
      where: { adminId },
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Convert to object for easier access
    const productStatusCounts = {
      active: 0,
      inactive: 0,
      out_of_stock: 0,
      total: 0
    };

    productStats.forEach(stat => {
      productStatusCounts[stat.status] = parseInt(stat.count);
      productStatusCounts.total += parseInt(stat.count);
    });

    // Get order statistics - need to search in JSONB items array
    const orderStats = await sequelize.query(`
      SELECT 
        "orderStatus",
        COUNT(*) as count
      FROM orders
      WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(items) as item
        WHERE (item->>'adminId')::uuid = :adminId
      )
      GROUP BY "orderStatus"
    `, {
      replacements: { adminId },
      type: sequelize.QueryTypes.SELECT
    });

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
      orderStatusCounts[stat.orderStatus] = parseInt(stat.count);
      orderStatusCounts.total += parseInt(stat.count);
    });

    // Calculate revenue from delivered orders
    const revenueData = await sequelize.query(`
      SELECT 
        SUM((item->>'price')::numeric * (item->>'quantity')::numeric) as "totalRevenue",
        COUNT(DISTINCT o.id) as "totalOrders"
      FROM orders o,
      jsonb_array_elements(o.items) as item
      WHERE (item->>'adminId')::uuid = :adminId
        AND o."orderStatus" = 'delivered'
    `, {
      replacements: { adminId },
      type: sequelize.QueryTypes.SELECT
    });

    const revenue = revenueData[0] && revenueData[0].totalRevenue ? {
      total: Math.round(parseFloat(revenueData[0].totalRevenue) * 100) / 100,
      orderCount: parseInt(revenueData[0].totalOrders) || 0
    } : {
      total: 0,
      orderCount: 0
    };

    // Get pending orders (recent 5)
    const pendingOrders = await sequelize.query(`
      SELECT 
        o.id,
        o."orderNumber",
        o."orderStatus",
        o.total,
        o."createdAt",
        o."customerName" as "userName",
        o."customerEmail" as "userEmail"
      FROM orders o
      WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(o.items) as item
        WHERE (item->>'adminId')::uuid = :adminId
      )
      AND o."orderStatus" IN ('pending', 'confirmed', 'processing')
      ORDER BY o."createdAt" DESC
      LIMIT 5
    `, {
      replacements: { adminId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get recent products (last 5 added)
    const recentProducts = await Product.findAll({
      where: { adminId },
      attributes: ['id', 'name', 'category', 'price', 'images', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5,
      raw: true
    });

    res.json({
      success: true,
      data: {
        products: productStatusCounts,
        orders: orderStatusCounts,
        revenue,
        pendingOrders,
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
    const adminId = req.user.id;

    // Get by status
    const byStatus = await Product.findAll({
      where: { adminId },
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Get by category
    const byCategory = await Product.findAll({
      where: { adminId },
      attributes: [
        'category',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

    // Get stock info
    const stockInfo = await Product.findOne({
      where: { adminId },
      attributes: [
        [fn('SUM', col('stock')), 'totalStock'],
        [fn('AVG', col('stock')), 'avgStock']
      ],
      raw: true
    });

    // Get low stock and out of stock counts
    const lowStockCount = await Product.count({
      where: {
        adminId,
        stock: { [Op.lte]: 5, [Op.gt]: 0 }
      }
    });

    const outOfStockCount = await Product.count({
      where: {
        adminId,
        stock: 0
      }
    });

    // Get price info
    const priceInfo = await Product.findOne({
      where: { adminId },
      attributes: [
        [fn('AVG', col('price')), 'avgPrice'],
        [fn('MIN', col('price')), 'minPrice'],
        [fn('MAX', col('price')), 'maxPrice']
      ],
      raw: true
    });

    const totalProducts = await Product.count({ where: { adminId } });

    res.json({
      success: true,
      data: {
        total: totalProducts,
        byStatus,
        byCategory,
        stock: {
          ...stockInfo,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount
        },
        pricing: priceInfo || {}
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
    const adminId = req.user.id;
    const { startDate, endDate } = req.query;

    // Build date filter for SQL
    let dateFilter = '';
    let replacements = { adminId };

    if (startDate || endDate) {
      if (startDate) {
        dateFilter += ` AND o."createdAt" >= :startDate`;
        replacements.startDate = new Date(startDate);
      }
      if (endDate) {
        dateFilter += ` AND o."createdAt" <= :endDate`;
        replacements.endDate = new Date(endDate);
      }
    }

    // Get order statistics by status
    const stats = await sequelize.query(`
      SELECT 
        o."orderStatus",
        COUNT(DISTINCT o.id) as count,
        SUM((item->>'price')::numeric * (item->>'quantity')::numeric) as "totalRevenue",
        AVG((item->>'price')::numeric * (item->>'quantity')::numeric) as "avgOrderValue"
      FROM orders o,
      jsonb_array_elements(o.items) as item
      WHERE (item->>'adminId')::uuid = :adminId
        ${dateFilter}
      GROUP BY o."orderStatus"
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Get monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await sequelize.query(`
      SELECT 
        EXTRACT(YEAR FROM o."createdAt") as year,
        EXTRACT(MONTH FROM o."createdAt") as month,
        COUNT(DISTINCT o.id) as "orderCount",
        SUM((item->>'price')::numeric * (item->>'quantity')::numeric) as revenue
      FROM orders o,
      jsonb_array_elements(o.items) as item
      WHERE (item->>'adminId')::uuid = :adminId
        AND o."createdAt" >= :sixMonthsAgo
      GROUP BY year, month
      ORDER BY year, month
    `, {
      replacements: { adminId, sixMonthsAgo },
      type: sequelize.QueryTypes.SELECT
    });

    // Get top selling products
    const topProducts = await sequelize.query(`
      SELECT 
        (item->>'productId')::uuid as "productId",
        item->>'name' as "productName",
        SUM((item->>'quantity')::integer) as "totalSold",
        SUM((item->>'price')::numeric * (item->>'quantity')::numeric) as "totalRevenue"
      FROM orders o,
      jsonb_array_elements(o.items) as item
      WHERE (item->>'adminId')::uuid = :adminId
        AND o."orderStatus" = 'delivered'
      GROUP BY (item->>'productId'), (item->>'name')
      ORDER BY "totalSold" DESC
      LIMIT 10
    `, {
      replacements: { adminId },
      type: sequelize.QueryTypes.SELECT
    });

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
    const adminId = req.user.id;
    const { period = 'all' } = req.query;

    // Calculate date range based on period
    let dateFilter = '';
    let replacements = { adminId };
    const now = new Date();

    switch (period) {
      case 'today':
        const today = new Date(now.setHours(0, 0, 0, 0));
        dateFilter = ` AND o."createdAt" >= :dateFrom`;
        replacements.dateFrom = today;
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = ` AND o."createdAt" >= :dateFrom`;
        replacements.dateFrom = weekAgo;
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = ` AND o."createdAt" >= :dateFrom`;
        replacements.dateFrom = monthAgo;
        break;
      case 'year':
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        dateFilter = ` AND o."createdAt" >= :dateFrom`;
        replacements.dateFrom = yearAgo;
        break;
      default:
        // all time - no date filter
        break;
    }

    // Calculate revenue by order status
    const revenueByStatus = await sequelize.query(`
      SELECT 
        o."orderStatus",
        SUM((item->>'price')::numeric * (item->>'quantity')::numeric) as revenue,
        COUNT(*) as "orderCount"
      FROM orders o,
      jsonb_array_elements(o.items) as item
      WHERE (item->>'adminId')::uuid = :adminId
        ${dateFilter}
      GROUP BY o."orderStatus"
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Calculate totals
    const totalRevenue = revenueByStatus
      .filter(r => r.orderStatus === 'delivered')
      .reduce((sum, r) => sum + parseFloat(r.revenue || 0), 0);

    const pendingRevenue = revenueByStatus
      .filter(r => ['pending', 'confirmed', 'processing', 'shipped'].includes(r.orderStatus))
      .reduce((sum, r) => sum + parseFloat(r.revenue || 0), 0);

    const cancelledRevenue = revenueByStatus
      .filter(r => r.orderStatus === 'cancelled')
      .reduce((sum, r) => sum + parseFloat(r.revenue || 0), 0);

    // Get revenue by category
    const revenueByCategory = await sequelize.query(`
      SELECT 
        p.category,
        SUM((item->>'price')::numeric * (item->>'quantity')::numeric) as revenue,
        SUM((item->>'quantity')::integer) as "itemCount"
      FROM orders o,
      jsonb_array_elements(o.items) as item
      LEFT JOIN products p ON (item->>'productId')::uuid = p.id
      WHERE (item->>'adminId')::uuid = :adminId
        AND o."orderStatus" = 'delivered'
        ${dateFilter}
      GROUP BY p.category
      ORDER BY revenue DESC
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

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
          status: r.orderStatus,
          revenue: Math.round(parseFloat(r.revenue || 0) * 100) / 100,
          orderCount: parseInt(r.orderCount)
        })),
        byCategory: revenueByCategory.map(r => ({
          category: r.category || 'uncategorized',
          revenue: Math.round(parseFloat(r.revenue || 0) * 100) / 100,
          itemCount: parseInt(r.itemCount)
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

// @desc    Get Top Selling Products for Admin
// @route   GET /api/admin/analytics/top-products
// @access  Private (Admin only)
const getTopProducts = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { period = 'last_30_days', limit = 10 } = req.query;

    console.log('Getting top products for admin:', adminId);
    console.log('Period:', period, 'Limit:', limit);

    // Calculate date range based on period
    let dateFilter = '';
    const now = new Date();

    switch (period) {
      case '7':
      case 'last_7_days':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        dateFilter = `AND o."createdAt" >= '${sevenDaysAgo.toISOString()}'`;
        break;
      case '30':
      case 'last_30_days':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        dateFilter = `AND o."createdAt" >= '${thirtyDaysAgo.toISOString()}'`;
        break;
      case '90':
      case 'last_90_days':
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        dateFilter = `AND o."createdAt" >= '${ninetyDaysAgo.toISOString()}'`;
        break;
      case 'this_month':
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = `AND o."createdAt" >= '${thisMonthStart.toISOString()}'`;
        break;
      case 'this_year':
        const thisYearStart = new Date(now.getFullYear(), 0, 1);
        dateFilter = `AND o."createdAt" >= '${thisYearStart.toISOString()}'`;
        break;
      case 'all_time':
        // No date filter
        dateFilter = '';
        break;
      default:
        // Default to last 30 days
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() - 30);
        dateFilter = `AND o."createdAt" >= '${defaultDate.toISOString()}'`;
    }

    // First, check if orders table exists and has data
    const orderCount = await Order.count();
    console.log('Total orders in database:', orderCount);

    if (orderCount === 0) {
      console.log('No orders found in database - returning empty result');
      return res.json({
        success: true,
        data: {
          period,
          products: [],
          count: 0
        }
      });
    }

    // Get top products by quantity sold using raw SQL
    const topProducts = await sequelize.query(`
      SELECT 
        item->>'productId' AS "productId",
        item->>'name' AS "productName",
        item->>'image' AS "productImage",
        SUM((item->>'quantity')::integer) AS "totalQuantitySold",
        SUM((item->>'price')::numeric * (item->>'quantity')::numeric) AS "totalRevenue",
        COUNT(DISTINCT o.id) AS "orderCount"
      FROM orders o,
      jsonb_array_elements(o.items) AS item
      WHERE (item->>'adminId')::uuid = :adminId
        AND o."orderStatus" = 'delivered'
        ${dateFilter}
      GROUP BY item->>'productId', item->>'name', item->>'image'
      ORDER BY "totalQuantitySold" DESC
      LIMIT :limit
    `, {
      replacements: { adminId, limit: parseInt(limit) },
      type: sequelize.QueryTypes.SELECT
    });

    console.log('Found', topProducts.length, 'top products');

    // Enrich with product details (ratings, discount, stock)
    const enrichedProducts = await Promise.all(
      topProducts.map(async (item) => {
        const product = await Product.findByPk(item.productId, {
          attributes: ['ratingsAverage', 'ratingsCount', 'discount', 'stock', 'category']
        });
        
        return {
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          totalQuantity: parseInt(item.totalQuantitySold),
          totalOrders: parseInt(item.orderCount),
          totalRevenue: Math.round(parseFloat(item.totalRevenue) * 100) / 100,
          averageRating: product?.ratingsAverage || 0,
          reviewCount: product?.ratingsCount || 0,
          discount: product?.discount || 0,
          currentStock: product?.stock || 0,
          category: product?.category || 'uncategorized'
        };
      })
    );

    res.json({
      success: true,
      data: {
        period,
        products: enrichedProducts,
        count: enrichedProducts.length
      }
    });

  } catch (error) {
    console.error('Get top products error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching top products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get Recent Customer Reviews for Admin
// @route   GET /api/admin/recent-reviews
// @access  Private (Admin only)
const getRecentReviews = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { limit = 7 } = req.query;

    // Get products for this admin
    const adminProducts = await Product.findAll({
      where: { adminId },
      attributes: ['id']
    });
    
    const productIds = adminProducts.map(p => p.id);

    if (productIds.length === 0) {
      return res.json({
        success: true,
        data: {
          reviews: [],
          count: 0
        }
      });
    }

    // Get recent feedback for admin's products
    const reviews = await Feedback.findAll({
      where: {
        productId: productIds,
        status: 'approved'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'images', 'category']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    // Format reviews
    const formattedReviews = reviews.map(review => {
      const reviewData = review.get({ plain: true });
      return {
        id: reviewData.id,
        productName: reviewData.product?.name || 'Unknown Product',
        productImage: reviewData.product?.images?.[0] || null,
        productCategory: reviewData.product?.category || 'uncategorized',
        customerName: reviewData.user?.name || 'Anonymous',
        rating: reviewData.rating,
        comment: reviewData.comment,
        createdAt: reviewData.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        count: formattedReviews.length
      }
    });

  } catch (error) {
    console.error('Get recent reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get Simplified Dashboard Data
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getSimplifiedDashboard = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get admin details with promo code
    const admin = await Admin.findByPk(adminId, {
      attributes: ['name', 'email', 'adminCode', 'isActive', 'earningsTotal', 'commissionTotalDue']
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Get admin's products
    const adminProducts = await Product.findAll({
      where: { adminId },
      attributes: ['id', 'stock']
    });
    const productIds = adminProducts.map(p => p.id);

    // Get recent orders (simplified - only product info)
    let recentOrders = [];
    if (productIds.length > 0) {
      try {
        const orders = await sequelize.query(`
          SELECT 
            o.id AS "orderId",
            o."orderStatus",
            o."createdAt",
            item->>'name' AS "productName",
            item->>'image' AS "productImage",
            (item->>'quantity')::integer AS quantity,
            (item->>'price')::numeric AS price
          FROM orders o,
          jsonb_array_elements(o.items) AS item
          WHERE (item->>'productId')::text = ANY(ARRAY[:productIds])
          ORDER BY o."createdAt" DESC
          LIMIT 10
        `, {
          replacements: { productIds: productIds.map(id => id.toString()) },
          type: sequelize.QueryTypes.SELECT
        });

        recentOrders = orders;
      } catch (err) {
        console.error('Error fetching recent orders:', err);
        // Continue with empty orders
      }
    }

    // Format recent orders to show only relevant product data
    const formattedOrders = recentOrders.map(order => ({
      productName: order.productName || 'Unknown Product',
      productImage: order.productImage || null,
      quantity: order.quantity || 0,
      totalAmount: parseFloat(order.price || 0) * (order.quantity || 0),
      status: order.orderStatus || 'pending',
      orderDate: order.createdAt || new Date()
    }));

    // Get quick stats
    const totalProducts = await Product.count({ where: { adminId } });
    
    // Count total orders
    let totalOrders = 0;
    if (productIds.length > 0) {
      try {
        const orderCountResult = await sequelize.query(`
          SELECT COUNT(DISTINCT o.id) as count
          FROM orders o,
          jsonb_array_elements(o.items) AS item
          WHERE (item->>'productId')::text = ANY(ARRAY[:productIds])
        `, {
          replacements: { productIds: productIds.map(id => id.toString()) },
          type: sequelize.QueryTypes.SELECT
        });
        totalOrders = parseInt(orderCountResult[0]?.count || 0);
      } catch (err) {
        console.error('Error counting orders:', err);
      }
    }

    // Count pending orders
    let pendingOrders = 0;
    if (productIds.length > 0) {
      try {
        const pendingOrdersResult = await sequelize.query(`
          SELECT COUNT(DISTINCT o.id) as count
          FROM orders o,
          jsonb_array_elements(o.items) AS item
          WHERE (item->>'productId')::text = ANY(ARRAY[:productIds])
            AND o."orderStatus" IN ('pending', 'confirmed', 'processing')
        `, {
          replacements: { productIds: productIds.map(id => id.toString()) },
          type: sequelize.QueryTypes.SELECT
        });
        pendingOrders = parseInt(pendingOrdersResult[0]?.count || 0);
      } catch (err) {
        console.error('Error counting pending orders:', err);
      }
    }

    // Calculate total sales from delivered orders
    let totalSales = 0;
    if (productIds.length > 0) {
      try {
        const salesResult = await sequelize.query(`
          SELECT SUM((item->>'price')::numeric * (item->>'quantity')::numeric) as total
          FROM orders o,
          jsonb_array_elements(o.items) AS item
          WHERE (item->>'productId')::text = ANY(ARRAY[:productIds])
            AND o."orderStatus" = 'delivered'
        `, {
          replacements: { productIds: productIds.map(id => id.toString()) },
          type: sequelize.QueryTypes.SELECT
        });
        totalSales = parseFloat(salesResult[0]?.total || 0);
      } catch (err) {
        console.error('Error calculating sales:', err);
      }
    }

    // Count low stock products (stock <= 10)
    const lowStock = await Product.count({
      where: {
        adminId,
        stock: { [Op.lte]: 10, [Op.gt]: 0 }
      }
    });

    // Prepare sales and category data for charts
    const salesData = [];
    const categoryData = [];

    // Get sales data for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (productIds.length > 0) {
      try {
        const dailySales = await sequelize.query(`
          SELECT 
            DATE(o."createdAt") as date,
            SUM((item->>'price')::numeric * (item->>'quantity')::numeric) as sales
          FROM orders o,
          jsonb_array_elements(o.items) AS item
          WHERE (item->>'productId')::text = ANY(ARRAY[:productIds])
            AND o."createdAt" >= :sevenDaysAgo
            AND o."orderStatus" = 'delivered'
          GROUP BY DATE(o."createdAt")
          ORDER BY date ASC
        `, {
          replacements: { productIds: productIds.map(id => id.toString()), sevenDaysAgo },
          type: sequelize.QueryTypes.SELECT
        });

        // Format for chart
        dailySales.forEach(day => {
          salesData.push({
            date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sales: parseFloat(day.sales || 0)
          });
        });
      } catch (err) {
        console.error('Error fetching daily sales:', err);
      }
    }

    // Get category distribution
    const categoryStats = await Product.findAll({
      where: { adminId },
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

    categoryStats.forEach(stat => {
      categoryData.push({
        name: stat.category || 'Other',
        value: parseInt(stat.count || 0)
      });
    });

    // Get real commission payment data
    const CommissionPayment = require('../models/CommissionPayment');
    let commissionData = {
      pendingCommission: parseFloat(admin.commissionTotalDue || 0),
      totalPaid: 0,
      totalPayments: 0,
      pendingVerification: 0
    };

    try {
      const commissionStats = await CommissionPayment.findAll({
        where: { adminId },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalPayments'],
          [
            sequelize.fn('SUM', 
              sequelize.literal("CASE WHEN status IN ('paid', 'verified') THEN amount ELSE 0 END")
            ),
            'totalPaid'
          ],
          [
            sequelize.fn('SUM', 
              sequelize.literal("CASE WHEN status = 'pending_verification' THEN amount ELSE 0 END")
            ),
            'pendingVerification'
          ]
        ],
        raw: true
      });

      if (commissionStats[0]) {
        commissionData.totalPaid = parseFloat(commissionStats[0].totalPaid || 0);
        commissionData.totalPayments = parseInt(commissionStats[0].totalPayments || 0);
        commissionData.pendingVerification = parseFloat(commissionStats[0].pendingVerification || 0);
      }
    } catch (err) {
      console.error('Error fetching commission data:', err);
    }

    const stats = {
      totalSales: Math.round(totalSales * 100) / 100,
      totalOrders,
      totalProducts,
      pendingOrders,
      lowStock,
      pendingCommission: commissionData.pendingCommission,
      commissionPaid: commissionData.totalPaid,
      commissionPayments: commissionData.totalPayments,
      commissionPendingVerification: commissionData.pendingVerification
    };

    res.json({
      success: true,
      data: {
        admin: {
          name: admin.name,
          email: admin.email,
          promoCode: admin.adminCode,
          isActive: admin.isActive
        },
        stats,
        recentOrders: formattedOrders,
        salesData,
        categoryData
      }
    });

  } catch (error) {
    console.error('Get simplified dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get comprehensive analytics data
// @route   GET /api/admin/analytics/comprehensive
// @access  Private (Admin only)
const getComprehensiveAnalytics = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { period = '30' } = req.query;

    // Calculate date range
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const CommissionPayment = require('../models/CommissionPayment');

    // 1. Revenue Overview
    const revenueData = await sequelize.query(`
      SELECT 
        SUM((item->>'price')::numeric * (item->>'quantity')::numeric) as total,
        COUNT(DISTINCT o.id) as "orderCount",
        AVG((item->>'price')::numeric * (item->>'quantity')::numeric) as average
      FROM orders o,
      jsonb_array_elements(o.items) as item
      WHERE (item->>'adminId')::uuid = :adminId
        AND o."orderStatus" = 'delivered'
        AND o."createdAt" >= :startDate
    `, {
      replacements: { adminId, startDate },
      type: sequelize.QueryTypes.SELECT
    });

    const revenue = {
      total: parseFloat(revenueData[0]?.total || 0),
      orderCount: parseInt(revenueData[0]?.orderCount || 0),
      average: parseFloat(revenueData[0]?.average || 0)
    };

    // 2. Product Statistics
    const productStats = await Product.findAll({
      where: { adminId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN stock > 0 THEN 1 ELSE 0 END")), 'inStock'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN stock = 0 THEN 1 ELSE 0 END")), 'outOfStock'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN stock <= 10 AND stock > 0 THEN 1 ELSE 0 END")), 'lowStock']
      ],
      raw: true
    });

    const products = {
      total: parseInt(productStats[0]?.total || 0),
      inStock: parseInt(productStats[0]?.inStock || 0),
      outOfStock: parseInt(productStats[0]?.outOfStock || 0),
      lowStock: parseInt(productStats[0]?.lowStock || 0)
    };

    // 3. Order Statistics by Status
    const ordersByStatus = await sequelize.query(`
      SELECT 
        o."orderStatus",
        COUNT(DISTINCT o.id) as count,
        SUM((item->>'price')::numeric * (item->>'quantity')::numeric) as revenue
      FROM orders o,
      jsonb_array_elements(o.items) as item
      WHERE (item->>'adminId')::uuid = :adminId
        AND o."createdAt" >= :startDate
      GROUP BY o."orderStatus"
    `, {
      replacements: { adminId, startDate },
      type: sequelize.QueryTypes.SELECT
    });

    const orders = {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    ordersByStatus.forEach(stat => {
      const count = parseInt(stat.count);
      orders[stat.orderStatus] = count;
      orders.total += count;
    });

    // 4. Commission Payments
    const commissionStats = await CommissionPayment.findAll({
      where: { 
        adminId,
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'paid' OR status = 'verified' THEN amount ELSE 0 END")), 'paidAmount'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'pending_verification' THEN amount ELSE 0 END")), 'pendingAmount']
      ],
      raw: true
    });

    const commissions = {
      total: parseInt(commissionStats[0]?.total || 0),
      totalAmount: parseFloat(commissionStats[0]?.totalAmount || 0),
      paidAmount: parseFloat(commissionStats[0]?.paidAmount || 0),
      pendingAmount: parseFloat(commissionStats[0]?.pendingAmount || 0)
    };

    // 5. Daily Sales Trend (last 7-30 days)
    const dailySales = await sequelize.query(`
      SELECT 
        DATE(o."createdAt") as date,
        COUNT(DISTINCT o.id) as orders,
        SUM((item->>'price')::numeric * (item->>'quantity')::numeric) as revenue,
        SUM((item->>'quantity')::integer) as units
      FROM orders o,
      jsonb_array_elements(o.items) as item
      WHERE (item->>'adminId')::uuid = :adminId
        AND o."orderStatus" = 'delivered'
        AND o."createdAt" >= :startDate
      GROUP BY DATE(o."createdAt")
      ORDER BY date ASC
    `, {
      replacements: { adminId, startDate },
      type: sequelize.QueryTypes.SELECT
    });

    const salesTrend = dailySales.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      orders: parseInt(day.orders),
      revenue: parseFloat(day.revenue),
      units: parseInt(day.units)
    }));

    // 6. Top Products by Revenue
    const topProducts = await sequelize.query(`
      SELECT 
        item->>'productId' as "productId",
        item->>'name' as name,
        item->>'image' as image,
        SUM((item->>'quantity')::integer) as "totalSold",
        SUM((item->>'price')::numeric * (item->>'quantity')::numeric) as revenue,
        COUNT(DISTINCT o.id) as "orderCount"
      FROM orders o,
      jsonb_array_elements(o.items) as item
      WHERE (item->>'adminId')::uuid = :adminId
        AND o."orderStatus" = 'delivered'
        AND o."createdAt" >= :startDate
      GROUP BY item->>'productId', item->>'name', item->>'image'
      ORDER BY revenue DESC
      LIMIT 10
    `, {
      replacements: { adminId, startDate },
      type: sequelize.QueryTypes.SELECT
    });

    const topProductsData = topProducts.map(p => ({
      productId: p.productId,
      name: p.name,
      image: p.image,
      totalSold: parseInt(p.totalSold),
      revenue: parseFloat(p.revenue),
      orderCount: parseInt(p.orderCount)
    }));

    // 7. Category Distribution
    const categoryRevenue = await sequelize.query(`
      SELECT 
        p.category,
        COUNT(DISTINCT p.id) as "productCount",
        SUM((item->>'quantity')::integer) as "totalSold",
        SUM((item->>'price')::numeric * (item->>'quantity')::numeric) as revenue
      FROM orders o,
      jsonb_array_elements(o.items) as item
      LEFT JOIN products p ON (item->>'productId')::uuid = p.id
      WHERE (item->>'adminId')::uuid = :adminId
        AND o."orderStatus" = 'delivered'
        AND o."createdAt" >= :startDate
      GROUP BY p.category
      ORDER BY revenue DESC
    `, {
      replacements: { adminId, startDate },
      type: sequelize.QueryTypes.SELECT
    });

    const categories = categoryRevenue.map(c => ({
      name: c.category || 'Uncategorized',
      productCount: parseInt(c.productCount),
      totalSold: parseInt(c.totalSold || 0),
      revenue: parseFloat(c.revenue)
    }));

    // 8. Payment Methods Distribution
    const paymentMethods = await sequelize.query(`
      SELECT 
        o."paymentMethod",
        COUNT(*) as count,
        SUM(o.total) as amount
      FROM orders o
      WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(o.items) as item
        WHERE (item->>'adminId')::uuid = :adminId
      )
      AND o."createdAt" >= :startDate
      GROUP BY o."paymentMethod"
    `, {
      replacements: { adminId, startDate },
      type: sequelize.QueryTypes.SELECT
    });

    const payments = paymentMethods.map(p => ({
      method: p.paymentMethod,
      count: parseInt(p.count),
      amount: parseFloat(p.amount)
    }));

    res.json({
      success: true,
      data: {
        period: `${period} days`,
        summary: {
          revenue,
          products,
          orders,
          commissions
        },
        trends: {
          dailySales: salesTrend
        },
        topProducts: topProductsData,
        categories,
        paymentMethods: payments
      }
    });

  } catch (error) {
    console.error('Get comprehensive analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAdminDashboardStats,
  getAdminProductStats,
  getAdminOrderStats,
  getAdminRevenue,
  getTopProducts,
  getRecentReviews,
  getSimplifiedDashboard,
  getComprehensiveAnalytics
};
