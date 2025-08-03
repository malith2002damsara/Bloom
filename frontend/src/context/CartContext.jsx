import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      // Create a unique identifier for products with different options
      const productKey = `${product.id}-${product.selectedSize || 'default'}`;
      const existingItem = prevCart.find(item => {
        const itemKey = `${item.id}-${item.selectedSize || 'default'}`;
        return itemKey === productKey;
      });
      
      if (existingItem) {
        return prevCart.map(item => {
          const itemKey = `${item.id}-${item.selectedSize || 'default'}`;
          return itemKey === productKey
            ? { ...item, quantity: item.quantity + (product.quantity || 1) } 
            : item;
        });
      } else {
        // Use provided quantity or default to 1
        const quantity = product.quantity || 1;
        return [...prevCart, { ...product, quantity }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    setNotification({
      message: 'Item removed from cart',
      type: 'info'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce(
    (total, item) => total + (item.price * item.quantity), 
    0
  );

  const cartCount = cart.reduce(
    (count, item) => count + item.quantity, 
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        cartTotal,
        cartCount,
        isCartOpen,
        notification,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        toggleCart: () => setIsCartOpen(!isCartOpen),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);