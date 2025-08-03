import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUser, FiMapPin, FiCreditCard, FiTruck } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    notes: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if cart is empty
  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add some items to your cart first.</p>
          <button
            onClick={() => navigate('/collection')}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Please Login</h1>
          <p className="text-gray-600 mb-8">You need to be logged in to checkout.</p>
          <button
            onClick={() => navigate('/login', { state: { from: { pathname: '/checkout' } } })}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address || !customerInfo.city) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    try {
      // Import API service
      const apiService = (await import('../services/api.js')).default;

      // Prepare order data for backend
      const orderData = {
        items: cart.map(item => ({
          productId: item.id || item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || '/api/placeholder/100/100'
        })),
        customerInfo: {
          name: customerInfo.name.trim(),
          email: customerInfo.email.trim(),
          phone: customerInfo.phone.trim(),
          address: customerInfo.address.trim(),
          city: customerInfo.city.trim(),
          zip: customerInfo.zip?.trim() || '',
          notes: customerInfo.notes?.trim() || ''
        },
        paymentMethod,
        subtotal: cartTotal,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: cartTotal
      };

      // Create order via API
      const response = await apiService.createOrder(orderData);
      
      if (response.success) {
        // Clear cart
        clearCart();

        // Navigate to My Orders page instead of order confirmation
        navigate('/my-orders');
      } else {
        throw new Error(response.message || 'Failed to create order');
      }

    } catch (error) {
      console.error('Order creation error:', error);
      setError(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center text-purple-600 mr-4 hover:text-purple-700 mb-4 sm:mb-0 transition-colors"
          >
            <FiArrowLeft className="mr-2" /> Back to Cart
          </button>
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-6 drop-shadow-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            Checkout
          </motion.h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="xl:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                  {error}
                </div>
              )}

              {/* Customer Information */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-6 flex items-center text-gray-800">
                  <FiUser className="mr-3 text-purple-600" />
                  Customer Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={customerInfo.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={customerInfo.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-6 flex items-center text-gray-800">
                  <FiMapPin className="mr-3 text-purple-600" />
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={customerInfo.address}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter your street address"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={customerInfo.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Enter your city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        name="zip"
                        value={customerInfo.zip}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Enter ZIP code"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Delivery Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={customerInfo.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Any special delivery instructions..."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-6 flex items-center text-gray-800">
                  <FiCreditCard className="mr-3 text-purple-600" />
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-green-200 bg-green-50 rounded-xl cursor-pointer hover:bg-green-100 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-4 w-5 h-5 text-green-600"
                    />
                    <FiTruck className="mr-4 text-green-600 text-xl" />
                    <div>
                      <div className="font-bold text-gray-800">Cash on Delivery</div>
                      <div className="text-sm text-gray-600">Pay when you receive your order</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
              >
                {isLoading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6 text-gray-800">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shadow-sm">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{item.name}</p>
                      <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-purple-600">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              
              <hr className="my-4" />
              
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-gray-800">Total</span>
                <span className="text-purple-600">${cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
