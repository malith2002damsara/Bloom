import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const { user } = useAuth();

  // Load orders from localStorage
  useEffect(() => {
    if (user) {
      const savedOrders = localStorage.getItem(`orders_${user.id}`);
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } else {
      setOrders([]);
    }
  }, [user]);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    if (user && orders.length > 0) {
      localStorage.setItem(`orders_${user.id}`, JSON.stringify(orders));
    }
  }, [orders, user]);

  const placeOrder = (orderData) => {
    const newOrder = {
      id: Date.now().toString(),
      userId: user?.id,
      items: orderData.items,
      total: orderData.total,
      customerInfo: orderData.customerInfo,
      paymentMethod: orderData.paymentMethod,
      status: 'pending',
      orderDate: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };

    setOrders(prevOrders => [newOrder, ...prevOrders]);
    return newOrder;
  };

  const getOrderById = (orderId) => {
    return orders.find(order => order.id === orderId);
  };

  const updateOrderStatus = (orderId, status) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  const value = {
    orders,
    placeOrder,
    getOrderById,
    updateOrderStatus
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
