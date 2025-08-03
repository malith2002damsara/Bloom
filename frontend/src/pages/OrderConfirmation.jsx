import React from 'react';
import { FiCheckCircle, FiHome, FiPackage, FiEye } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';

const OrderConfirmation = () => {
  const location = useLocation();
  const { order, customerInfo, total } = location.state || {};

  if (!order) {
    return (
      <div className="min-h-screen pt-32 px-4 pb-12 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center bg-white rounded-lg shadow p-8">
          <FiPackage size={64} className="mx-auto text-gray-300 mb-6" />
          <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find your order details. Please try placing your order again.
          </p>
          <Link
            to="/"
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg"
          >
            <FiHome className="inline mr-2" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-4 pb-12 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        <div className="text-center bg-white rounded-lg shadow p-8 mb-6">
          <FiCheckCircle size={64} className="mx-auto text-green-500 mb-6" />
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Order Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been placed successfully and is being processed.
          </p>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <FiPackage className="text-purple-500" />
              <span className="font-bold text-lg">Order #{order.orderNumber}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Order Date: {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-sm text-gray-600">
              Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-3">Order Summary</h3>
            <div className="space-y-2">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name} x {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-purple-600">${order.total?.toFixed(2) || total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          {(order.customerInfo || customerInfo) && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-2">Shipping Information</h3>
              <p className="text-sm text-gray-600">
                {(order.customerInfo || customerInfo).name}<br />
                {(order.customerInfo || customerInfo).address}<br />
                {(order.customerInfo || customerInfo).city}
                {(order.customerInfo || customerInfo).zip && ` ${(order.customerInfo || customerInfo).zip}`}
              </p>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
            <p className="text-sm text-green-700">
              <FiCheckCircle className="inline mr-2" />
              We've sent a confirmation email to {(order.customerInfo || customerInfo)?.email} with all the order details.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/"
            className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            <FiHome className="mr-2" /> Continue Shopping
          </Link>
          <Link
            to={`/order-tracking/${order._id}`}
            className="flex-1 flex items-center justify-center px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-all"
          >
            <FiEye className="mr-2" /> Track Order
          </Link>
          <Link
            to="/my-orders"
            className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
          >
            <FiPackage className="mr-2" /> View All Orders
          </Link>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="font-semibold text-gray-800 mb-4">What's Next?</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>Your order is being processed and will be confirmed within 24 hours.</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>You'll receive tracking information once your order ships.</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>Questions? Contact our support team anytime for assistance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;