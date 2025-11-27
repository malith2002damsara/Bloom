import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, ShoppingBag, Calendar, ArrowUpRight, ArrowDownRight, CreditCard, Users, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'react-toastify';
import adminApi from '../utils/api';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const timeRanges = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' }
  ];

  const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await adminApi.get(`/admin/analytics/comprehensive?period=${timeRange}`);
      
      if (response.success) {
        setAnalyticsData(response.data);
      } else {
        console.warn('No analytics data available');
        setAnalyticsData(null);
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      
      if (error.message.includes('Invalid token') || error.message.includes('401')) {
        toast.error('Please login to access analytics data');
      } else {
        console.warn('Analytics data not available');
        setAnalyticsData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for charts
  const topProductsChart = analyticsData?.topProducts?.slice(0, 10).map(product => ({
    name: product.name?.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
    revenue: product.revenue,
    orders: product.orderCount,
    quantity: product.totalSold
  })) || [];

  const categoryChart = analyticsData?.categories?.map(cat => ({
    name: cat.name,
    value: cat.revenue
  })) || [];

  const salesTrendChart = analyticsData?.trends?.dailySales || [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-pink-600" />
                Sales Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive insights from real-time database</p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white"
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
            <span className="ml-3 text-gray-600">Loading analytics...</span>
          </div>
        ) : !analyticsData ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
            <p className="text-gray-500">No data available for the selected period.</p>
          </div>
        ) : (
          <>
            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Revenue Card */}
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 opacity-80" />
                  <span className="text-pink-100 text-sm font-medium">Revenue</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  LKR {analyticsData.summary.revenue.total.toLocaleString()}
                </h3>
                <p className="text-pink-100 text-sm">
                  {analyticsData.summary.revenue.orderCount} orders • Avg: LKR {analyticsData.summary.revenue.average.toFixed(0)}
                </p>
              </div>

              {/* Products Card */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Package className="w-8 h-8 opacity-80" />
                  <span className="text-purple-100 text-sm font-medium">Products</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {analyticsData.summary.products.total}
                </h3>
                <p className="text-purple-100 text-sm">
                  {analyticsData.summary.products.inStock} in stock • {analyticsData.summary.products.lowStock} low stock
                </p>
              </div>

              {/* Orders Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <ShoppingBag className="w-8 h-8 opacity-80" />
                  <span className="text-blue-100 text-sm font-medium">Orders</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {analyticsData.summary.orders.total}
                </h3>
                <p className="text-blue-100 text-sm">
                  {analyticsData.summary.orders.delivered} delivered • {analyticsData.summary.orders.pending} pending
                </p>
              </div>

              {/* Commissions Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <CreditCard className="w-8 h-8 opacity-80" />
                  <span className="text-green-100 text-sm font-medium">Commissions</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  LKR {analyticsData.summary.commissions.totalAmount.toLocaleString()}
                </h3>
                <p className="text-green-100 text-sm">
                  Paid: LKR {analyticsData.summary.commissions.paidAmount.toLocaleString()} • {analyticsData.summary.commissions.total} payments
                </p>
              </div>
            </div>

            {/* Sales Trend Line Chart */}
            {salesTrendChart.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-600" />
                  Sales Trend
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesTrendChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#ec4899" 
                      strokeWidth={3}
                      name="Revenue (LKR)"
                      dot={{ fill: '#ec4899', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Orders"
                      dot={{ fill: '#8b5cf6', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Products Bar Chart */}
              {topProductsChart.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Top 10 Products by Revenue</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topProductsChart} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                        formatter={(value, name) => {
                          if (name === 'revenue') return [`LKR ${value.toLocaleString()}`, 'Revenue'];
                          if (name === 'orders') return [value, 'Orders'];
                          if (name === 'quantity') return [value, 'Units Sold'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="revenue" 
                        fill="#ec4899" 
                        radius={[8, 8, 0, 0]}
                        name="Revenue"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Category Distribution Pie Chart */}
              {categoryChart.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Revenue by Category</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={categoryChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => `LKR ${value.toLocaleString()}`}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            {analyticsData.paymentMethods && analyticsData.paymentMethods.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Methods</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {analyticsData.paymentMethods.map((method, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5 text-pink-600" />
                        <span className="font-semibold text-gray-700 capitalize">{method.method}</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        LKR {method.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">{method.count} orders</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Products Detailed Cards */}
            {analyticsData.topProducts && analyticsData.topProducts.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performing Products (Detailed)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {analyticsData.topProducts.map((product, index) => (
                    <div 
                      key={product.productId} 
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Rank Badge */}
                      <div className="relative">
                        <img
                          src={product.image || '/placeholder-product.png'}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300?text=Product+Image';
                          }}
                        />
                        <div className={`absolute top-2 left-2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-amber-600' : 
                          'bg-pink-500'
                        }`}>
                          #{index + 1}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        
                        {/* Stats */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              Total Revenue
                            </span>
                            <span className="font-semibold text-green-600">
                              LKR {product.revenue.toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              Total Orders
                            </span>
                            <span className="font-semibold text-blue-600">
                              {product.orderCount}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Units Sold</span>
                            <span className="font-semibold text-purple-600">
                              {product.totalSold}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                            <span className="text-gray-500">Avg Order Value</span>
                            <span className="font-semibold text-gray-900">
                              LKR {(product.revenue / product.orderCount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
