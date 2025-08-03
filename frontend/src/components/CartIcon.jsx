import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiX, FiPlus, FiMinus, FiTrash2 } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';

const CartIcon = () => {
  const { 
    cartItems, 
    cartCount, 
    removeFromCart, 
    addToCart,
    showAlert,
    alertProduct,
    setShowAlert,
    setAlertProduct
  } = useCart();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const closeCart = () => setIsCartOpen(false);

  const handleAddToCart = (item) => {
    addToCart(item);
    setAlertProduct(item);
    setShowAlert(true);

    // Auto-hide the alert after 3 seconds
    setTimeout(() => setShowAlert(false), 3000);
  };

  const updateQuantity = (productId, newQuantity) => {
    const item = cartItems.find(i => i.id === productId);
    if (!item) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else if (newQuantity > item.quantity) {
      handleAddToCart(item); // Use our alert-enabled version
    } else if (newQuantity < item.quantity) {
      removeFromCart(productId);
    }
  };

  const handleCheckout = () => {
    closeCart();
    navigate('/cart');
  };

  return (
    <>
      {/* Cart Icon */}
      <div className="relative">
        <motion.button
          className="p-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-200 text-black hover:from-green-200 hover:to-emerald-300 relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleCart}
        >
          <FiShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <motion.span
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold min-w-[20px]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={cartCount}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              {cartCount > 99 ? '99+' : cartCount}
            </motion.span>
          )}
        </motion.button>

        {/* Product Added Alert */}
        <AnimatePresence>
          {showAlert && alertProduct && (
            <motion.div
              className="absolute top-12 right-0 bg-white shadow-lg rounded-lg p-3 w-56 z-50 border border-green-200"
              initial={{ opacity: 0, y: -10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <FiShoppingCart className="text-white text-xs" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Added to Cart!</p>
                  <p className="text-xs text-gray-600 truncate">{alertProduct.name}</p>
                </div>
                <button
                  onClick={() => setShowAlert(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
          >
            <div className="p-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Shopping Cart</h2>
                <button onClick={closeCart} className="p-1 rounded-full hover:bg-gray-100">
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 mb-4 p-2 border-b">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-gray-600">${item.price}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <FiMinus className="h-4 w-4" />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <FiPlus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <FiTrash2 className="h-5 w-5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 mt-auto">
                <div className="flex justify-between mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Checkout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartIcon;