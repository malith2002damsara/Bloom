import React from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiShoppingBag } from 'react-icons/fi';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();

  // Empty cart state
  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-32 px-4 bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12">
            <FiShoppingBag size={64} className="mx-auto text-purple-300 mb-6" />
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-6 drop-shadow-sm"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              Your Cart is Empty
            </motion.h1>
            <p className="text-gray-600 mb-8 text-sm sm:text-base">
              Looks like you haven't added anything to your cart yet.
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
        <div className="flex flex-col sm:flex-row sm:items-center mb-8">
          <button
            onClick={() => navigate('/collection')}
            className="flex items-center text-purple-600 mr-4 hover:text-purple-700 mb-4 sm:mb-0 transition-colors"
          >
            <FiArrowLeft className="mr-2" /> Continue Shopping
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <motion.h2
                className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-6 drop-shadow-sm flex items-center justify-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <FiShoppingBag className="mr-3 text-purple-600" />
                Shopping Cart
              </motion.h2>
              
              <div className="space-y-4">
                {cart.map((item) => (
                  <div 
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shadow-sm mb-4 sm:mb-0 sm:mr-4">
                      <img 
                        src={item.image || (item.images && item.images.length > 0 ? item.images[0] : null) || '/assets/images/placeholder.jpg'} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/assets/images/placeholder.jpg';
                        }}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 mb-4 sm:mb-0">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">{item.name}</h3>
                      <p className="text-purple-600 font-semibold text-lg">${item.price.toFixed(2)}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3 mb-4 sm:mb-0 sm:mr-4">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className="font-semibold text-lg min-w-[2rem] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>

                    {/* Item Total & Remove */}
                    <div className="flex items-center space-x-4">
                      <span className="font-bold text-xl text-gray-800">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-full"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6 text-gray-800">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.length} items)</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">Free</span>
                </div>
                <hr />
                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-gray-800">Total</span>
                  <span className="text-purple-600">${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg text-center block"
              >
                Proceed to Checkout
              </Link>

              <p className="text-xs text-gray-500 text-center mt-4">
                Secure checkout powered by SSL encryption
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
