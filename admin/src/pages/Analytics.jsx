import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, ShoppingBag, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'react-toastify';
import adminApi from '../utils/api';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const timeRanges = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  useEffect(() => {
    fetchAnalytics();
    fetchTopProducts();
    fetchSalesData();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAnalytics(timeRange);
      
      if (response.success) {
        setAnalyticsData(response.data);
      } else {
        toast.error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('Invalid token') || error.message.includes('401')) {
        toast.error('Please login to access analytics data');
      } else {
        toast.error('Failed to load analytics data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const response = await adminApi.getAdminProducts();
      if (response.success && response.data.products) {
        // Sort products by soldCount or calculate from orders
        const sorted = response.data.products
          .filter(p => p.soldCount && p.soldCount > 0)
          .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
          .slice(0, 5)
          .map(product => ({
            name: product.name,
            sales: product.soldCount || 0,
            revenue: (product.soldCount || 0) * (product.price || 0)
          }));
        
        setTopProducts(sorted);
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
    }
  };

  const fetchSalesData = async () => {
    try {
      const response = await adminApi.getOrders({ limit: 100 });
      if (response.success && response.data.orders) {
        const orders = response.data.orders;
        
        // Generate sales data based on time range
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const data = generateSalesDataForRange(orders, days);
        setSalesData(data);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  const generateSalesDataForRange = (orders, days) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const data = [];

    // For 7 days, show daily data
    if (days === 7) {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = dayNames[date.getDay()];
        
        const dayOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.toDateString() === date.toDateString();
        });

        const sales = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        data.push({
          day: dayName,
          sales: Math.round(sales * 100) / 100
        });
      }
    } else {
      // For longer ranges, group by weeks
      const weeks = Math.ceil(days / 7);
      for (let i = weeks - 1; i >= 0; i--) {
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() - (i * 7));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);

        const weekOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= startDate && orderDate <= endDate;
        });

        const sales = weekOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        data.push({
          day: `Week ${weeks - i}`,
          sales: Math.round(sales * 100) / 100
        });
      }
    }

    return data;
  };

  const currentStats = analyticsData || {
    revenue: { value: 0, change: 0, positive: true },
    orders: { value: 0, change: 0, positive: true },
    products: { value: 0, change: 0, positive: true }
  };

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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading analytics data...</span>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
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
          title="Total Products"
          value={currentStats.products.value}
          change={currentStats.products.change}
          positive={currentStats.products.positive}
          icon={Package}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <BarChart3 className="w-4 h-4" />
              <span>{timeRange === '7d' ? 'Daily' : 'Weekly'} Sales</span>
            </div>
          </div>
          
          {/* Simple Bar Chart */}
          {salesData.length > 0 ? (
            <div className="space-y-4">
              {salesData.map((item, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-16 text-sm text-gray-600">{item.day}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${salesData.length > 0 ? (item.sales / Math.max(...salesData.map(d => d.sales), 1)) * 100 : 0}%` }}
                    >
                      {item.sales > 0 && (
                        <span className="text-white text-xs font-medium">${item.sales}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No sales data available for this period
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
        </div>
        
        {topProducts.length > 0 ? (
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
                {topProducts.map((product, index) => {
                  const maxSales = Math.max(...topProducts.map(p => p.sales), 1);
                  return (
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
                              style={{ width: `${(product.sales / maxSales) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {Math.round((product.sales / maxSales) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No product sales data available
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
