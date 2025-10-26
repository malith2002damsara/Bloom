import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  DollarSign,
  ShoppingBag,
  Eye,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import adminApi from '../utils/api';
import DashboardCharts from '../components/DashboardCharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    lowStock: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await adminApi.getDashboardStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Fetch recent orders
      const ordersResponse = await adminApi.getOrders({ limit: 10 });
      if (ordersResponse.success) {
        const orders = ordersResponse.data.orders || [];
        setRecentOrders(orders);
        
        // Generate sales data for last 7 days
        const last7Days = generateLast7DaysData(orders);
        setSalesData(last7Days);
      }

      // Fetch products for category distribution
      const productsResponse = await adminApi.getAdminProducts();
      if (productsResponse.success) {
        const products = productsResponse.data.products || [];
        const catData = generateCategoryData(products);
        setCategoryData(catData);
      }

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      
      if (error.message.includes('Invalid token') || error.message.includes('401')) {
        toast.error('Please login to access dashboard data');
      } else {
        toast.error('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    toast.success('Dashboard refreshed!');
  };

  const generateLast7DaysData = (orders) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === date.toDateString();
      });

      const sales = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      
      data.push({
        day: dayName,
        sales: Math.round(sales * 100) / 100,
        orders: dayOrders.length
      });
    }

    return data;
  };

  const generateCategoryData = (products) => {
    const categories = {
      fresh: 0,
      artificial: 0,
      mixed: 0,
      bears: 0,
      other: 0
    };

    products.forEach(product => {
      const cat = product.category?.toLowerCase() || 'other';
      if (categories.hasOwnProperty(cat)) {
        categories[cat]++;
      } else {
        categories.other++;
      }
    });

    const total = Object.values(categories).reduce((a, b) => a + b, 0);

    return [
      { name: 'Fresh Flowers', value: categories.fresh, total },
      { name: 'Artificial', value: categories.artificial, total },
      { name: 'Mixed', value: categories.mixed, total },
      { name: 'Bears', value: categories.bears, total },
      { name: 'Other', value: categories.other, total },
    ].filter(item => item.value > 0);
  };

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${change.positive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-4 h-4 inline mr-1" />
              {change.value}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header with Refresh Button */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your store.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading dashboard data...</span>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Sales"
              value={`$${stats.totalSales.toLocaleString()}`}
              icon={DollarSign}
              color="bg-green-500"
              change={{ positive: true, value: 12.5 }}
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingBag}
              color="bg-blue-500"
              change={{ positive: true, value: 8.2 }}
            />
            <StatCard
              title="Total Products"
              value={stats.totalProducts}
              icon={Package}
              color="bg-purple-500"
            />
          </div>

          {/* Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Pending Orders</h3>
                  <p className="text-yellow-700">You have {stats.pendingOrders} orders waiting for processing</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <Package className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800">Low Stock Alert</h3>
                  <p className="text-red-700">{stats.lowStock} products are running low on stock</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Charts */}
          <DashboardCharts 
            salesData={salesData}
            categoryData={categoryData}
            recentOrders={recentOrders}
          />

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
                <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>View All</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order._id || order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order._id || order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.user?.name || order.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${order.total || order.totalAmount || order.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus || order.status)}`}>
                          {order.orderStatus || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : order.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;