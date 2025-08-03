import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

const CartSidebar = () => {
  const { 
    cart, 
    cartTotal, 
    isCartOpen, 
    closeCart, 
    removeFromCart, 
    updateQuantity 
  } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeCart}
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: 'easeInOut' }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-xl"
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <FiShoppingCart className="mr-2" />
                  Your Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})
                </h2>
                <button onClick={closeCart} className="p-1 hover:bg-gray-100 rounded">
                  <FiX size={24} />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <FiShoppingCart size={48} className="text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-500 mb-2">Your cart is empty</h3>
                  <p className="text-gray-400 mb-6">Start shopping to add items to your cart</p>
                  <button
                    onClick={closeCart}
                    className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex mb-4 pb-4 border-b">
                        <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden mr-4">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-gray-600">${item.price.toFixed(2)}</p>
                          <div className="flex items-center mt-2">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-1 bg-gray-200 rounded-l"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 bg-gray-100">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-1 bg-gray-200 rounded-r"
                            >
                              +
                            </button>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="ml-auto text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t">
                    <div className="flex justify-between mb-4">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-bold">${cartTotal.toFixed(2)}</span>
                    </div>
                    <Link
                      to="/cart"
                      onClick={closeCart}
                      className="block w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-center rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors"
                    >
                      Proceed to Checkout
                    </Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;