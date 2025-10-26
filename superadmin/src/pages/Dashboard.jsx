import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  ShoppingBag, 
  Package,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { superAdminAPI } from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    inactiveAdmins: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    recentAdmins: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setError(null);
      const response = await superAdminAPI.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard statistics');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError(error.message || 'Failed to load dashboard statistics');
      toast.error('Failed to load dashboard statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {loading ? (
              <div className="w-16 h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              value
            )}
          </p>
          {change && !loading && (
            <p className={`text-sm mt-2 flex items-center ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's an overview of your system.</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-medium">Failed to load dashboard data</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchDashboardStats}
              className="text-xs text-red-600 hover:text-red-800 font-medium mt-2 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Admins"
          value={stats.totalAdmins}
          icon={Users}
          color="bg-purple-500"
        />
        <StatCard
          title="Active Admins"
          value={stats.activeAdmins}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-blue-500"
          change={12.5}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          color="bg-orange-500"
          change={8.2}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {loading ? '...' : stats.totalProducts}
              </p>
            </div>
            <Package className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {loading ? '...' : stats.totalUsers}
              </p>
            </div>
            <Users className="w-8 h-8 text-cyan-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Admins</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {loading ? '...' : stats.inactiveAdmins}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Recent Admins and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admins */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Recent Admins</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : stats.recentAdmins && stats.recentAdmins.length > 0 ? (
              <div className="space-y-4">
                {stats.recentAdmins.map((admin, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-medium text-sm">
                          {admin.name?.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                        <p className="text-xs text-gray-500">{admin.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      admin.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No recent admins</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : stats.recentTransactions && stats.recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {stats.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        ${transaction.total || 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.userId?.name || transaction.customer || 'Customer'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        transaction.orderStatus === 'delivered' 
                          ? 'bg-green-100 text-green-800' 
                          : transaction.orderStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : transaction.orderStatus === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.orderStatus}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {transaction.date || new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No recent transactions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
