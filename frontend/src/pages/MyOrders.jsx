import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { 
  FiPackage, 
  FiCalendar, 
  FiDollarSign, 
  FiTruck, 
  FiCheck, 
  FiClock,
  FiX,
  FiShoppingBag,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiUser,
  FiMapPin
} from 'react-icons/fi';

const MyOrders = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching orders...');
      const response = await apiService.getUserOrders();
      console.log('API Response:', response);
      
      if (response.success) {
        setOrders(response.data.orders);
        console.log('Orders loaded:', response.data.orders);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <FiClock className="text-yellow-500" />;
      case 'confirmed':
      case 'processing':
        return <FiPackage className="text-blue-500" />;
      case 'shipped':
        return <FiTruck className="text-purple-500" />;
      case 'delivered':
        return <FiCheck className="text-green-500" />;
      case 'cancelled':
        return <FiX className="text-red-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'processing':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter and search orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.orderStatus?.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'amount-high':
        return (b.total || 0) - (a.total || 0);
      case 'amount-low':
        return (a.total || 0) - (b.total || 0);
      default:
        return 0;
    }
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-32 px-4 bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12">
            <FiRefreshCw size={64} className="mx-auto text-purple-300 mb-6 animate-spin" />
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">Loading Your Orders</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Please wait while we fetch your order history...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen pt-32 px-4 bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12">
            <FiX size={64} className="mx-auto text-red-300 mb-6" />
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">Error Loading Orders</h1>
            <p className="text-gray-600 mb-8 text-sm sm:text-base">
              {error}
            </p>
            <button
              onClick={fetchOrders}
              className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-32 px-4 bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12">
            <FiPackage size={64} className="mx-auto text-purple-300 mb-6" />
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">Please Login</h1>
            <p className="text-gray-600 mb-8 text-sm sm:text-base">
              You need to be logged in to view your orders.
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              Login Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty orders state
  if (orders.length === 0) {
    return (
      <div className="min-h-screen pt-32 px-4 bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12">
            <FiShoppingBag size={64} className="mx-auto text-purple-300 mb-6" />
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">No Orders Yet</h1>
            <p className="text-gray-600 mb-8 text-sm sm:text-base">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Link
              to="/collection"
              className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
        <motion.h1
                            className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-6 drop-shadow-sm"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          >
            My Orders
          </motion.h1>
          
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders by order number or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Amount: High to Low</option>
              <option value="amount-low">Amount: Low to High</option>
            </select>
          </div>
        </div>
        
        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedOrders.map((order, index) => (
            <div
              key={order._id || index}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Order Header */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <FiCalendar className="mr-1" />
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.orderStatus)}`}>
                    {getStatusIcon(order.orderStatus)}
                    <span className="ml-1 capitalize">{order.orderStatus || 'pending'}</span>
                  </span>
                </div>
              </div>

              {/* Order Content */}
              <div className="p-4">
                {/* Total Amount */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 text-sm">Total Amount</span>
                  <div className="flex items-center text-lg font-bold text-gray-800">
                    <FiDollarSign className="text-green-600" />
                    {order.total?.toFixed(2) || '0.00'}
                  </div>
                </div>

                {/* Items Preview with Names */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span className="font-medium">Items ({order.items?.length || 0})</span>
                  </div>
                  <div className="space-y-2">
                    {order.items?.slice(0, 2).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center space-x-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.src = '/api/placeholder/40/40';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>Qty: {item.quantity}</span>
                            <span className="font-medium">${item.price?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 2 && (
                      <div className="text-center text-xs text-gray-500 py-1 bg-gray-50 rounded">
                        +{order.items.length - 2} more items
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer & Shipping Details */}
                {order.customerInfo && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <FiUser className="mr-2 text-blue-500 flex-shrink-0" />
                        <span className="truncate font-medium">{order.customerInfo.name}</span>
                      </div>
                      <div className="flex items-center">
                        <FiMapPin className="mr-2 text-green-500 flex-shrink-0" />
                        <span className="truncate">{order.customerInfo.address}, {order.customerInfo.city}</span>
                      </div>
                      <div className="flex items-center">
                        <FiTruck className="mr-2 text-purple-500 flex-shrink-0" />
                        <span className="truncate">
                          {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                        </span>
                      </div>
                      {order.trackingNumber && (
                        <div className="text-xs text-purple-600 font-medium mt-2 p-2 bg-purple-50 rounded">
                          <strong>Tracking:</strong> {order.trackingNumber}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* No results message */}
        {sortedOrders.length === 0 && orders.length > 0 && (
          <div className="text-center py-12">
            <FiSearch size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No orders found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
