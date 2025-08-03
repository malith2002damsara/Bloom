import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Package, ShoppingBag, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'react-toastify';
import adminApi from '../utils/api';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const timeRanges = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAnalytics(timeRange);
      
      if (response.success) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('Invalid token') || error.message.includes('401')) {
        toast.error('Please login to access analytics data');
        // You could redirect to login here if needed
        // window.location.href = '/login';
      } else {
        // Fallback to demo data for other errors
        const demoData = {
          revenue: { value: 12450, change: 12.5, positive: true },
          orders: { value: 156, change: 8.2, positive: true },
          customers: { value: 124, change: -2.1, positive: false },
          products: { value: 48, change: 4.3, positive: true }
        };
        
        setAnalyticsData(demoData);
        toast.warning('Using demo data - Please check your connection');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStats = analyticsData || {
    revenue: { value: 0, change: 0, positive: true },
    orders: { value: 0, change: 0, positive: true },
    customers: { value: 0, change: 0, positive: true },
    products: { value: 0, change: 0, positive: true }
  };

  const topProducts = [
    { name: 'Classic Graduation Bouquet', sales: 45, revenue: 2249.55 },
    { name: 'Eternal Memories Bouquet', sales: 38, revenue: 2279.62 },
    { name: 'Scholar Bear with Bouquet', sales: 32, revenue: 2239.68 },
    { name: 'Personalized Graduation Package', sales: 28, revenue: 2519.72 },
    { name: 'Deluxe Rose Arrangement', sales: 25, revenue: 1999.75 }
  ];

  const recentActivity = [
    { type: 'order', message: 'New order #12345 placed', time: '2 minutes ago', icon: ShoppingBag },
    { type: 'product', message: 'Product "Summer Roses" updated', time: '15 minutes ago', icon: Package },
    { type: 'user', message: 'New customer registered', time: '1 hour ago', icon: Users },
    { type: 'order', message: 'Order #12340 delivered', time: '2 hours ago', icon: ShoppingBag },
    { type: 'product', message: 'Low stock alert for "Graduate Bear"', time: '3 hours ago', icon: Package }
  ];

  const salesData = [
    { day: 'Mon', sales: 2400 },
    { day: 'Tue', sales: 1398 },
    { day: 'Wed', sales: 9800 },
    { day: 'Thu', sales: 3908 },
    { day: 'Fri', sales: 4800 },
    { day: 'Sat', sales: 3800 },
    { day: 'Sun', sales: 4300 }
  ];

  const StatCard = ({ title, value, change, positive, icon: Icon, prefix = '' }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <div className={`flex items-center mt-2 text-sm ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span className="ml-1">{Math.abs(change)}% from last period</span>
          </div>
        </div>
        <div className="p-3 rounded-full bg-blue-50">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your business performance and insights</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={currentStats.revenue.value}
          change={currentStats.revenue.change}
          positive={currentStats.revenue.positive}
          icon={DollarSign}
          prefix="$"
        />
        <StatCard
          title="Total Orders"
          value={currentStats.orders.value}
          change={currentStats.orders.change}
          positive={currentStats.orders.positive}
          icon={ShoppingBag}
        />
        <StatCard
          title="New Customers"
          value={currentStats.customers.value}
          change={currentStats.customers.change}
          positive={currentStats.customers.positive}
          icon={Users}
        />
        <StatCard
          title="Total Products"
          value={currentStats.products.value}
          change={currentStats.products.change}
          positive={currentStats.products.positive}
          icon={Package}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <BarChart3 className="w-4 h-4" />
              <span>Weekly Sales</span>
            </div>
          </div>
          
          {/* Simple Bar Chart */}
          <div className="space-y-4">
            {salesData.map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-8 text-sm text-gray-600">{item.day}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(item.sales / Math.max(...salesData.map(d => d.sales))) * 100}%` }}
                  >
                    <span className="text-white text-xs font-medium">${item.sales}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <activity.icon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Sales</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Performance</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">#{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{product.sales} units</td>
                  <td className="py-3 px-4 text-gray-700">${product.revenue.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(product.sales / Math.max(...topProducts.map(p => p.sales))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round((product.sales / Math.max(...topProducts.map(p => p.sales))) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
