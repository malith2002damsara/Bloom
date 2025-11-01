import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  FiRefreshCw,
  FiUser,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiArrowLeft,
  FiDownload,
  FiCamera,
  FiBox,
  FiShoppingBag,
  FiInfo
} from 'react-icons/fi';

const OrderDetails = () => {
  const { orderId } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, isAuthenticated]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching order details for:', orderId);
      
      const response = await apiService.getOrderById(orderId);
      
      if (response.success) {
        console.log('Order details loaded:', response.data.order);
        setOrder(response.data.order);
      } else {
        setError('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError(error.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <FiClock className="text-yellow-500" size={24} />;
      case 'confirmed':
      case 'processing':
        return <FiPackage className="text-blue-500" size={24} />;
      case 'shipped':
        return <FiTruck className="text-purple-500" size={24} />;
      case 'delivered':
        return <FiCheck className="text-green-500" size={24} />;
      case 'cancelled':
        return <FiX className="text-red-500" size={24} />;
      default:
        return <FiClock className="text-gray-500" size={24} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'processing':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-300';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border border-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'cod':
        return <FiDollarSign className="text-green-600" />;
      case 'card':
        return <FiCreditCard className="text-blue-600" />;
      default:
        return <FiDollarSign className="text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && imageModalOpen) {
        closeImageModal();
      }
    };

    if (imageModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [imageModalOpen]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 px-4 bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <FiRefreshCw size={64} className="mx-auto text-purple-300 mb-6 animate-spin" />
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Loading Order Details</h1>
            <p className="text-gray-600">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen pt-32 px-4 bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <FiX size={64} className="mx-auto text-red-300 mb-6" />
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Order Not Found</h1>
            <p className="text-gray-600 mb-8">{error || 'The order you are looking for does not exist.'}</p>
            <Link
              to="/myorders"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              <FiArrowLeft className="mr-2" />
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-12 bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/myorders')}
            className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium mb-4 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to My Orders
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Order #{order.orderNumber || order._id.slice(-8)}
                </h1>
                <p className="text-gray-600 flex items-center">
                  <FiCalendar className="mr-2" />
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.orderStatus)}`}>
                  {getStatusIcon(order.orderStatus)}
                  <span className="ml-2 capitalize">{order.orderStatus || 'pending'}</span>
                </span>
                
                <button
                  onClick={fetchOrderDetails}
                  className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                >
                  <FiRefreshCw className="mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FiBox className="mr-2 text-purple-600" />
                Order Items ({order.items?.length || 0})
              </h2>
              
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {/* Product Image */}
                    <div 
                      className="relative group cursor-pointer flex-shrink-0"
                      onClick={() => openImageModal(item.image || '/assets/images/placeholder.svg')}
                    >
                      <img
                        src={item.image || '/assets/images/placeholder.svg'}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.src = '/assets/images/placeholder.svg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white rounded-full p-2 shadow-lg">
                            <FiCamera className="text-purple-600" size={16} />
                          </div>
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-lg border-2 border-white">
                        {item.quantity}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {item.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center">
                          <FiShoppingBag className="mr-1 text-purple-600" />
                          Quantity: <strong className="ml-1">{item.quantity}</strong>
                        </span>
                        <span className="flex items-center">
                          <FiDollarSign className="mr-1 text-green-600" />
                          Unit Price: <strong className="ml-1">${item.price?.toFixed(2)}</strong>
                        </span>
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        Subtotal: ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Information */}
            {order.customerInfo && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <FiUser className="mr-2 text-purple-600" />
                  Customer Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FiUser className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Full Name</p>
                      <p className="font-semibold text-gray-800">{order.customerInfo.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FiMail className="text-red-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="font-semibold text-gray-800 break-all">{order.customerInfo.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FiPhone className="text-green-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone</p>
                      <p className="font-semibold text-gray-800">{order.customerInfo.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FiMapPin className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">City</p>
                      <p className="font-semibold text-gray-800">{order.customerInfo.city}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                    <FiMapPin className="text-orange-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
                      <p className="font-semibold text-gray-800">{order.customerInfo.address}</p>
                      {order.customerInfo.zip && (
                        <p className="text-sm text-gray-600 mt-1">ZIP: {order.customerInfo.zip}</p>
                      )}
                    </div>
                  </div>

                  {order.customerInfo.notes && (
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg md:col-span-2 border border-yellow-200">
                      <FiInfo className="text-yellow-600 mt-1 flex-shrink-0" size={20} />
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Order Notes</p>
                        <p className="text-gray-800">{order.customerInfo.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FiDollarSign className="mr-2 text-green-600" />
                Order Summary
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">${order.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                
                {order.tax > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span className="font-semibold">${order.tax?.toFixed(2)}</span>
                  </div>
                )}
                
                {order.shipping > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-semibold">${order.shipping?.toFixed(2)}</span>
                  </div>
                )}
                
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-${order.discount?.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Total</span>
                    <span className="text-2xl font-bold text-purple-600">
                      ${order.total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Delivery */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Payment & Delivery</h2>
              
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Payment Method</span>
                    {getPaymentMethodIcon(order.paymentMethod)}
                  </div>
                  <p className="font-semibold text-gray-800 capitalize">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod || 'Not specified'}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Payment Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    order.paymentStatus === 'paid' 
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {order.paymentStatus || 'pending'}
                  </span>
                </div>

                {order.estimatedDelivery && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center text-purple-600 mb-2">
                      <FiTruck className="mr-2" />
                      <span className="text-sm font-medium">Estimated Delivery</span>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {order.trackingNumber && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-2">Tracking Number</p>
                    <p className="font-mono font-bold text-blue-800 break-all">
                      {order.trackingNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
              <h3 className="font-bold text-lg mb-3">Need Help?</h3>
              <p className="text-sm mb-4 opacity-90">
                Contact our support team for any questions about your order.
              </p>
              <Link
                to="/contact"
                className="block w-full text-center bg-white text-purple-600 font-semibold py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeImageModal();
            }
          }}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
            >
              <FiX size={24} className="text-gray-800" />
            </button>
            
            <img
              src={selectedImage}
              alt="Product"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                e.target.src = '/assets/images/placeholder.svg';
              }}
            />
            
            <button
              onClick={() => window.open(selectedImage, '_blank')}
              className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors"
              title="Download Image"
            >
              <FiDownload size={20} className="text-gray-800" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
