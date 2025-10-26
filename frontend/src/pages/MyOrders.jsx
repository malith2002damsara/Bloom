import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  FiMapPin,
  FiEye,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiStar,
  FiHeart,
  FiCamera
} from 'react-icons/fi';

const MyOrders = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoadingProductDetails, setIsLoadingProductDetails] = useState(false);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('=== FETCHING USER ORDERS ===');
      console.log('User authenticated:', isAuthenticated);
      console.log('Auth token present:', !!localStorage.getItem('token'));
      console.log('Current user:', localStorage.getItem('user'));
      
      const response = await apiService.getUserOrders();
      console.log('API Response:', response);
      
      if (response.success) {
        console.log(`✅ Loaded ${response.data.orders.length} orders for current user`);
        setOrders(response.data.orders);
        
        // Log order IDs to verify they belong to current user
        if (response.data.orders.length > 0) {
          console.log('Order IDs:', response.data.orders.map(o => o._id));
          console.log('First order userId:', response.data.orders[0].userId);
        }
      } else {
        setError('Failed to fetch orders');
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setError(error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };
  const handleProductClick = async (item, order) => {
    try {
      // First set basic product info to show modal immediately
      setSelectedProduct({
        ...item,
        orderInfo: {
          orderDate: order.createdAt,
          orderNumber: order.orderNumber || order._id,
          orderStatus: order.orderStatus
        }
      });
      setIsModalOpen(true);

      // Then fetch full product details if productId is available
      if (item.productId) {
        setIsLoadingProductDetails(true);
        console.log('Fetching full product details for:', item.productId);
        const response = await apiService.getProductById(item.productId);
        
        if (response.success && response.data) {
          setSelectedProduct(prev => ({
            ...prev,
            ...response.data,
            // Keep the order-specific info (quantity, price from order)
            quantity: item.quantity,
            price: item.price,
            orderInfo: prev.orderInfo
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      // Modal is already open with basic info, so just log the error
    } finally {
      setIsLoadingProductDetails(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setSelectedImageIndex(0);
    setIsLoadingProductDetails(false);
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
            <motion.div
              key={order._id || index}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
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

                {/* Items Preview with Enhanced Images */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span className="font-medium">Items ({order.items?.length || 0})</span>
                    {order.items?.length > 2 && (
                      <button
                        onClick={() => toggleOrderExpansion(order._id)}
                        className="flex items-center text-purple-600 hover:text-purple-800 transition-colors text-xs font-medium"
                      >
                        <FiEye className="mr-1" />
                        {expandedOrders.has(order._id) ? 'Show Less' : 'View All'}
                        {expandedOrders.has(order._id) ? 
                          <FiChevronUp className="ml-1" /> : 
                          <FiChevronDown className="ml-1" />
                        }
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {(expandedOrders.has(order._id) ? order.items : order.items?.slice(0, 2))?.map((item, itemIndex) => (
                      <motion.div 
                        key={itemIndex} 
                        className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: itemIndex * 0.1 }}
                      >
                        <div className="relative group cursor-pointer" onClick={() => handleProductClick(item, order)} title="Click to view product details">
                          <img
                            src={item.image || (item.images && item.images.length > 0 ? item.images[0] : null) || '/assets/images/placeholder.svg'}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg border-2 border-white shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300"
                            onError={(e) => {
                              e.target.src = '/assets/images/placeholder.svg';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white rounded-full p-1 shadow-lg">
                              <FiCamera className="text-purple-600" size={14} />
                            </div>
                          </div>
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg border-2 border-white">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                          <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                            <span className="text-purple-600 font-medium">Qty: {item.quantity}</span>
                            <span className="font-bold text-green-600">${item.price?.toFixed(2)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {!expandedOrders.has(order._id) && order.items?.length > 2 && (
                      <div className="text-center text-xs text-gray-500 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                        <FiPackage className="inline mr-1" />
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
            </motion.div>
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

        {/* Product Detail Modal */}
        {isModalOpen && selectedProduct && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal();
              }
            }}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center">
                  <h2 className="text-xl font-bold text-gray-800">Product Details</h2>
                  {isLoadingProductDetails && (
                    <div className="ml-3 flex items-center text-purple-600">
                      <FiRefreshCw className="animate-spin mr-1" size={16} />
                      <span className="text-sm">Loading details...</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Product Image Gallery */}
                <div className="mb-6">
                  <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden mb-4 group cursor-pointer">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <img
                        src={selectedProduct.images[selectedImageIndex]}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onClick={() => window.open(selectedProduct.images[selectedImageIndex], '_blank')}
                        onError={(e) => {
                          e.target.src = '/assets/images/placeholder.svg';
                        }}
                      />
                    ) : (
                      <img
                        src={selectedProduct.image || '/assets/images/placeholder.svg'}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onClick={() => selectedProduct.image && window.open(selectedProduct.image, '_blank')}
                        onError={(e) => {
                          e.target.src = '/assets/images/placeholder.svg';
                        }}
                      />
                    )}
                    <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 shadow-lg">
                      <span className="text-sm font-semibold text-purple-600">
                        Qty: {selectedProduct.quantity}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white rounded-full p-3 shadow-lg">
                        <FiCamera className="text-purple-600" size={20} />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                        Click to view full size
                      </span>
                    </div>
                  </div>
                  
                  {/* Image Thumbnails */}
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto">
                      {selectedProduct.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImageIndex === index 
                              ? 'border-purple-500 scale-105' 
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${selectedProduct.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/assets/images/placeholder.svg';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-4">
                  {/* Name and Price */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {selectedProduct.name}
                    </h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl font-bold text-green-600">
                        ${selectedProduct.price?.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">
                        per item
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Description</h4>
                      <p className="text-gray-600 leading-relaxed">
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}

                  {/* Product Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProduct.category && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-800 mb-1 flex items-center">
                          <FiPackage className="mr-2 text-purple-600" size={16} />
                          Category
                        </h5>
                        <p className="text-gray-600 capitalize">{selectedProduct.category}</p>
                      </div>
                    )}
                    
                    {selectedProduct.occasion && (
                      <div className="bg-pink-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-800 mb-1 flex items-center">
                          <FiHeart className="mr-2 text-pink-600" size={16} />
                          Occasion
                        </h5>
                        <p className="text-gray-600 capitalize">{selectedProduct.occasion}</p>
                      </div>
                    )}

                    {selectedProduct.dimensions && (selectedProduct.dimensions.height || selectedProduct.dimensions.width || selectedProduct.dimensions.depth) && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-800 mb-1">Dimensions</h5>
                        <p className="text-gray-600">
                          {selectedProduct.dimensions.height || 0}H x {selectedProduct.dimensions.width || 0}W x {selectedProduct.dimensions.depth || 0}D cm
                        </p>
                      </div>
                    )}

                    <div className="bg-green-50 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-800 mb-1 flex items-center">
                        <FiDollarSign className="mr-2 text-green-600" size={16} />
                        Total Price
                      </h5>
                      <p className="text-gray-600 font-bold text-lg">
                        ${(selectedProduct.price * selectedProduct.quantity).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${selectedProduct.price?.toFixed(2)} × {selectedProduct.quantity}
                      </p>
                    </div>

                    {selectedProduct.rating && (
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-800 mb-1 flex items-center">
                          <FiStar className="mr-2 text-yellow-500" size={16} />
                          Rating
                        </h5>
                        <div className="flex items-center">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} className={i < Math.floor(selectedProduct.rating) ? 'fill-current' : ''} size={14} />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">({selectedProduct.rating}/5)</span>
                        </div>
                      </div>
                    )}

                    {selectedProduct.stock !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-800 mb-1">Stock Status</h5>
                        <p className={`text-sm font-medium ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedProduct.stock > 0 ? `${selectedProduct.stock} in stock` : 'Out of stock'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Order Information */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Order Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-center text-purple-600 mb-1">
                          <FiCalendar className="mr-2" size={16} />
                          <span className="font-medium">Order Date</span>
                        </div>
                        <p className="text-gray-700 text-sm">
                          {new Date(selectedProduct.orderInfo?.orderDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center text-blue-600 mb-1">
                          <FiPackage className="mr-2" size={16} />
                          <span className="font-medium">Order ID</span>
                        </div>
                        <p className="text-gray-700 text-sm font-mono">
                          {selectedProduct.orderInfo?.orderNumber?.slice(-8) || 'N/A'}
                        </p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center text-green-600 mb-1">
                          <FiCheck className="mr-2" size={16} />
                          <span className="font-medium">Status</span>
                        </div>
                        <p className="text-gray-700 text-sm capitalize">
                          {selectedProduct.orderInfo?.orderStatus || 'pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Close
                  </button>
                  <Link
                    to="/collection"
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                    onClick={closeModal}
                  >
                    Shop Similar Items
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
