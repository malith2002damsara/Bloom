import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, ShoppingBag, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';
import adminApi from '../utils/api';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const timeRanges = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' }
  ];

  useEffect(() => {
    fetchTopProducts();
  }, [timeRange]);

  const fetchTopProducts = async () => {
    try {
      setLoading(true);
      const response = await adminApi.get(`/admin/analytics/top-products?period=${timeRange}`);
      
      if (response.success) {
        setTopProducts(response.data.products || []);
      } else {
        console.warn('No analytics data available');
        setTopProducts([]);
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      
      if (error.message.includes('Invalid token') || error.message.includes('401')) {
        toast.error('Please login to access analytics data');
      } else {
        // Don't show error toast for empty data
        console.warn('Analytics data not available');
        setTopProducts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for Recharts bar chart
  const chartData = topProducts.slice(0, 10).map(product => ({
    name: product.productName.length > 15 
      ? product.productName.substring(0, 15) + '...' 
      : product.productName,
    revenue: product.totalRevenue,
    orders: product.totalOrders,
    quantity: product.totalQuantity
  }));

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-pink-600" />
                Sales Analytics
              </h1>
              <p className="text-gray-600 mt-2">Track your top-selling products and performance</p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
        ) : topProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sales Data</h3>
            <p className="text-gray-500">No product sales found for the selected period.</p>
          </div>
        ) : (
          <>
            {/* Revenue Bar Chart with Recharts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Top 10 Products by Revenue</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    label={{ value: 'Revenue (LKR)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name) => {
                      if (name === 'revenue') return [`LKR ${value.toLocaleString()}`, 'Revenue'];
                      if (name === 'orders') return [value, 'Orders'];
                      if (name === 'quantity') return [value, 'Units Sold'];
                      return [value, name];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => {
                      if (value === 'revenue') return 'Revenue (LKR)';
                      if (value === 'orders') return 'Total Orders';
                      if (value === 'quantity') return 'Units Sold';
                      return value;
                    }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#ec4899" 
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar 
                    dataKey="orders" 
                    fill="#8b5cf6"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Product Cards Grid */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performing Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topProducts.map((product, index) => (
                  <div 
                    key={product.productId} 
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Rank Badge */}
                    <div className="relative">
                      <img
                        src={product.productImage || '/placeholder-product.png'}
                        alt={product.productName}
                        className="w-full h-48 object-cover"
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
                        {product.productName}
                      </h3>
                      
                      {/* Stats */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            Total Revenue
                          </span>
                          <span className="font-semibold text-green-600">
                            LKR {product.totalRevenue.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            Total Orders
                          </span>
                          <span className="font-semibold text-blue-600">
                            {product.totalOrders}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Units Sold</span>
                          <span className="font-semibold text-purple-600">
                            {product.totalQuantity}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                          <span className="text-gray-500">Avg Order Value</span>
                          <span className="font-semibold text-gray-900">
                            LKR {(product.totalRevenue / product.totalOrders).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
