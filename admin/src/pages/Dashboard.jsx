import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign,
  ShoppingBag,
  Eye,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import adminApi from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    pendingOrders: 0,
    lowStock: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
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
      const ordersResponse = await adminApi.getOrders({ limit: 5, sort: '-createdAt' });
      if (ordersResponse.success) {
        setRecentOrders(ordersResponse.data.orders || []);
      }

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('Invalid token') || error.message.includes('401')) {
        toast.error('Please login to access dashboard data');
      } else {
        // Fallback to demo data when API is not available
        const demoStats = {
          totalSales: 15420,
          totalOrders: 342,
          totalProducts: 48,
          totalUsers: 1256,
          pendingOrders: 23,
          lowStock: 8
        };

        const demoOrders = [
          { _id: '#12345', user: { name: 'John Doe' }, totalAmount: 89.99, status: 'completed', createdAt: '2025-07-31T00:00:00.000Z' },
          { _id: '#12346', user: { name: 'Jane Smith' }, totalAmount: 156.50, status: 'pending', createdAt: '2025-07-31T00:00:00.000Z' },
          { _id: '#12347', user: { name: 'Mike Johnson' }, totalAmount: 75.25, status: 'processing', createdAt: '2025-07-30T00:00:00.000Z' },
          { _id: '#12348', user: { name: 'Sarah Wilson' }, totalAmount: 234.00, status: 'completed', createdAt: '2025-07-30T00:00:00.000Z' },
          { _id: '#12349', user: { name: 'Tom Brown' }, totalAmount: 98.75, status: 'pending', createdAt: '2025-07-29T00:00:00.000Z' },
        ];

        setStats(demoStats);
        setRecentOrders(demoOrders);
        
        toast.warning('Using demo data - Please check your connection');
      }
    } finally {
      setLoading(false);
    }
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your store.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading dashboard data...</span>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
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
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              color="bg-orange-500"
              change={{ positive: true, value: 5.1 }}
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
                        ${order.totalAmount || order.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
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