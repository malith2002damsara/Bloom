import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  DollarSign,
  ShoppingBag,
  Eye,
  AlertCircle,
  RefreshCw,
  Copy,
  CheckCircle,
  Star,
  MessageCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import adminApi from '../utils/api';
import DashboardCharts from '../components/DashboardCharts';
import CommissionPaymentModal from '../components/CommissionPaymentModal';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    lowStock: 0,
    pendingCommission: 0,
    commissionPaid: 0,
    commissionPayments: 0,
    commissionPendingVerification: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch simplified dashboard data (includes stats, recent orders, promo code)
      const dashboardResponse = await adminApi.get('/admin/dashboard');
      if (dashboardResponse.success) {
        const { stats, recentOrders, admin, salesData, categoryData } = dashboardResponse.data;
        // Ensure all stats have default values
        setStats({
          totalSales: stats?.totalSales || 0,
          totalOrders: stats?.totalOrders || 0,
          totalProducts: stats?.totalProducts || 0,
          pendingOrders: stats?.pendingOrders || 0,
          lowStock: stats?.lowStock || 0,
          pendingCommission: stats?.pendingCommission || 0,
          commissionPaid: stats?.commissionPaid || 0,
          commissionPayments: stats?.commissionPayments || 0,
          commissionPendingVerification: stats?.commissionPendingVerification || 0
        });
        setRecentOrders(recentOrders || []);
        setPromoCode(admin?.promoCode || '');
        setSalesData(salesData || []);
        setCategoryData(categoryData || []);
      }

      // Fetch recent reviews
      const reviewsResponse = await adminApi.get('/admin/recent-reviews?limit=5');
      if (reviewsResponse.success) {
        setRecentReviews(reviewsResponse.data.reviews || []);
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

  const handleCopyPromoCode = () => {
    navigator.clipboard.writeText(promoCode);
    setCopiedPromo(true);
    toast.success('Promo code copied to clipboard!');
    setTimeout(() => setCopiedPromo(false), 2000);
  };

  const handleCommissionPaymentSuccess = () => {
    setShowCommissionModal(false);
    fetchDashboardData(); // Refresh to get updated commission
    toast.success('Commission payment processed successfully!');
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Sales"
              value={`$${(stats.totalSales || 0).toLocaleString()}`}
              icon={DollarSign}
              color="bg-green-500"
              change={{ positive: true, value: 12.5 }}
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders || 0}
              icon={ShoppingBag}
              color="bg-blue-500"
              change={{ positive: true, value: 8.2 }}
            />
            <StatCard
              title="Total Products"
              value={stats.totalProducts || 0}
              icon={Package}
              color="bg-purple-500"
            />
            <StatCard
              title="Pending Commission"
              value={`$${(stats.pendingCommission || 0).toLocaleString()}`}
              icon={TrendingUp}
              color="bg-orange-500"
            />
          </div>

          {/* Promo Code & Commission Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Seller Code Card */}
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Your Seller Code</h3>
              <p className="text-sm text-pink-100 mb-4">Share this code so customers can view only your products</p>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
                <span className="text-2xl font-bold tracking-wider">{promoCode || 'N/A'}</span>
                <button
                  onClick={handleCopyPromoCode}
                  className="bg-white text-pink-600 px-4 py-2 rounded-lg hover:bg-pink-50 transition-colors flex items-center space-x-2"
                  disabled={!promoCode}
                >
                  {copiedPromo ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span className="font-medium">{copiedPromo ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Commission Payment Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Commission Payments</h3>
              <p className="text-sm text-blue-100 mb-4">Real-time commission data from database</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-100">Pending Due:</span>
                  <span className="text-2xl font-bold">${(stats.pendingCommission || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-100">Total Paid:</span>
                  <span className="font-semibold">${(stats.commissionPaid || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-100">Pending Verification:</span>
                  <span className="font-semibold">${(stats.commissionPendingVerification || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-blue-400/30">
                  <span className="text-blue-100">Total Payments:</span>
                  <span className="font-semibold">{stats.commissionPayments || 0} transactions</span>
                </div>
                {(stats.pendingCommission || 0) > 0 && (
                  <button
                    onClick={() => setShowCommissionModal(true)}
                    className="w-full mt-3 bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
                  >
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div key="pending-orders-alert" className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Pending Orders</h3>
                  <p className="text-yellow-700">You have {stats.pendingOrders || 0} orders waiting for processing</p>
                </div>
              </div>
            </div>
            
            <div key="low-stock-alert" className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <Package className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800">Low Stock Alert</h3>
                  <p className="text-red-700">{stats.lowStock || 0} products are running low on stock</p>
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

          {/* Recent Orders & Reviews Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
                <p className="text-sm text-gray-500 mt-1">Latest product orders from your store</p>
              </div>
              
              <div className="p-6 space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <img
                        src={order.productImage || '/placeholder-product.png'}
                        alt={order.productName}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{order.productName}</h4>
                        <p className="text-sm text-gray-500">Qty: {order.quantity} • ${order.totalAmount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(order.orderDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent orders</p>
                )}
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-pink-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Customer Reviews</h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">Recent feedback from your customers</p>
              </div>
              
              <div className="p-6 space-y-4">
                {recentReviews.length > 0 ? (
                  recentReviews.map((review) => (
                    <div key={review._id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start space-x-3 mb-2">
                        <img
                          src={review.productImage || '/placeholder-product.png'}
                          alt={review.productName}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{review.productName}</h4>
                          <p className="text-xs text-gray-500">{review.customerName}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No reviews yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Commission Payment Modal */}
      {showCommissionModal && (
        <CommissionPaymentModal
          isOpen={showCommissionModal}
          onClose={() => setShowCommissionModal(false)}
          pendingCommission={stats.pendingCommission || 0}
          onSuccess={handleCommissionPaymentSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;