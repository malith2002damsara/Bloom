import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/api';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Fetch orders from backend API
  const fetchOrders = useCallback(async (params = {}) => {
    if (!isAuthenticated || !user) {
      setOrders([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('OrderContext: Fetching orders from API...');
      
      const response = await apiService.getUserOrders(params);
      
      if (response.success) {
        setOrders(response.data.orders);
        console.log('OrderContext: Orders fetched successfully', response.data.orders.length);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('OrderContext: Error fetching orders', err);
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // Load orders when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [user, isAuthenticated, fetchOrders]);

  const placeOrder = async (orderData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.createOrder(orderData);
      
      if (response.success) {
        const newOrder = response.data.order;
        // Add new order to the beginning of the list
        setOrders(prevOrders => [newOrder, ...prevOrders]);
        console.log('OrderContext: Order placed successfully', newOrder._id);
        return newOrder;
      } else {
        throw new Error(response.message || 'Failed to place order');
      }
    } catch (err) {
      console.error('OrderContext: Error placing order', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getOrderById = useCallback(async (orderId) => {
    // First check if order exists in cache
    const cachedOrder = orders.find(order => order._id === orderId);
    if (cachedOrder) {
      return cachedOrder;
    }

    // If not in cache, fetch from API
    try {
      const response = await apiService.getOrderById(orderId);
      if (response.success) {
        return response.data.order;
      }
      return null;
    } catch (err) {
      console.error('OrderContext: Error getting order by ID', err);
      return null;
    }
  }, [orders]);

  const cancelOrder = async (orderId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.cancelOrder(orderId);
      
      if (response.success) {
        // Update order status in local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, orderStatus: 'cancelled' } : order
          )
        );
        console.log('OrderContext: Order cancelled successfully', orderId);
        return true;
      } else {
        throw new Error(response.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('OrderContext: Error cancelling order', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshOrders = useCallback(() => {
    return fetchOrders();
  }, [fetchOrders]);

  const value = {
    orders,
    loading,
    error,
    placeOrder,
    getOrderById,
    cancelOrder,
    fetchOrders,
    refreshOrders
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
