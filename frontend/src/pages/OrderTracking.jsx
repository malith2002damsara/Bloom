import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiPackage, FiTruck, FiCheckCircle, FiHome, FiClock, FiX, FiRefreshCw, FiCalendar, FiUser, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const OrderTracking = () => {
  const { orderId } = useParams();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getOrderById(orderId);
      
      if (response.success) {
        setOrder(response.data.order);
      } else {
        setError('Order not found');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError(error.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isAuthenticated && orderId) {
      fetchOrder();
    }
  }, [isAuthenticated, orderId, fetchOrder]);

  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: FiCheckCircle, description: 'Your order has been received' },
      { key: 'confirmed', label: 'Order Confirmed', icon: FiPackage, description: 'Order has been confirmed' },
      { key: 'processing', label: 'Processing', icon: FiPackage, description: 'Your order is being prepared' },
      { key: 'shipped', label: 'Shipped', icon: FiTruck, description: 'Your order is on the way' },
      { key: 'delivered', label: 'Delivered', icon: FiHome, description: 'Order has been delivered' }
    ];

    const currentStatus = order?.orderStatus?.toLowerCase();
    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex && currentStatus !== 'cancelled',
      active: index === currentIndex && currentStatus !== 'cancelled',
      cancelled: currentStatus === 'cancelled'
    }));
  };

  const getStatusIcon = (step) => {
    if (step.cancelled) {
      return <FiX className="text-red-500 w-6 h-6" />;
    }
    
    if (step.completed) {
      return <FiCheckCircle className="text-green-500 w-6 h-6" />;
    } else if (step.active) {
      return <div className="w-6 h-6 rounded-full bg-purple-500 animate-pulse flex items-center justify-center">
        <FiClock className="w-4 h-4 text-white" />
      </div>;
    } else {
      return <div className="w-6 h-6 rounded-full bg-gray-300" />;
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-32 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <FiRefreshCw size={64} className="mx-auto text-purple-300 mb-6 animate-spin" />
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Loading Order Details</h1>
            <p className="text-gray-600">Please wait while we fetch your order information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen pt-32 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <FiX size={64} className="mx-auto text-red-300 mb-6" />
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Order Not Found</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link
              to="/my-orders"
              className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-32 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <FiPackage size={64} className="mx-auto text-purple-300 mb-6" />
            <h1 className="text-3xl font-bold mb-4">Please Login</h1>
            <p className="text-gray-600 mb-8">You need to be logged in to track your orders.</p>
            <Link
              to="/login"
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors"
            >
              Login Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-32 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <FiPackage size={64} className="mx-auto text-gray-300 mb-6" />
            <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
            <Link
              to="/my-orders"
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors"
            >
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="min-h-screen pt-32 px-4 pb-12 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/my-orders" className="text-purple-600 hover:text-purple-700 mb-4 inline-block">
            ← Back to My Orders
          </Link>
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-gray-600">Order #{order.orderNumber}</p>
        </div>

        <div className="space-y-8">
          {/* Order Status Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Order Status</h2>
            
            {order.orderStatus === 'cancelled' ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <FiX className="text-red-500 w-6 h-6 mr-3" />
                  <div>
                    <h3 className="font-semibold text-red-800">Order Cancelled</h3>
                    <p className="text-red-600 text-sm">This order has been cancelled</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {statusSteps.map((step, index) => (
                  <div key={step.key} className="flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      {getStatusIcon(step)}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${step.completed || step.active ? 'text-gray-800' : 'text-gray-400'}`}>
                        {step.label}
                      </h3>
                      <p className={`text-sm ${step.completed || step.active ? 'text-gray-600' : 'text-gray-400'}`}>
                        {step.description}
                      </p>
                      {step.completed && (
                        <p className="text-xs text-green-600 mt-1">
                          <FiCheckCircle className="inline w-3 h-3 mr-1" />
                          Completed
                        </p>
                      )}
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`w-px h-8 ml-3 ${step.completed ? 'bg-green-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <FiUser className="mr-2 text-purple-600" />
                  Customer Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {order.customerInfo?.name}</p>
                  <p><span className="font-medium">Email:</span> {order.customerInfo?.email}</p>
                  <p><span className="font-medium">Phone:</span> {order.customerInfo?.phone}</p>
                </div>
              </div>

              {/* Shipping Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <FiMapPin className="mr-2 text-blue-600" />
                  Shipping Address
                </h3>
                <div className="space-y-1 text-sm">
                  <p>{order.customerInfo?.address}</p>
                  <p>{order.customerInfo?.city} {order.customerInfo?.zip}</p>
                  {order.trackingNumber && (
                    <p className="mt-2">
                      <span className="font-medium">Tracking Number:</span> 
                      <span className="text-purple-600"> {order.trackingNumber}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3 flex items-center">
                <FiPackage className="mr-2 text-green-600" />
                Items ({order.items?.length || 0})
              </h3>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                        <p className="text-gray-600 text-sm">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-800">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${order.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                )}
                {order.shipping > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>${order.shipping.toFixed(2)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-purple-600">${order.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Dates */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold mb-3 flex items-center">
                <FiCalendar className="mr-2 text-orange-600" />
                Important Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Order Placed:</span>
                  <p className="text-gray-600">{formatDate(order.createdAt)}</p>
                </div>
                {order.estimatedDelivery && (
                  <div>
                    <span className="font-medium">Estimated Delivery:</span>
                    <p className="text-gray-600">{formatDate(order.estimatedDelivery)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;