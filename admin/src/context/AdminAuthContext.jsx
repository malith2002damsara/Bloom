import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../utils/api';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await adminApi.verifyAdmin();
      if (response.success && response.data && response.data.admin) {
        setAdmin(response.data.admin);
      } else {
        localStorage.removeItem('adminToken');
        setAdmin(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('adminToken');
      setAdmin(null);
      
      // Check if it's a disabled account error
      if (error.message && error.message.includes('disabled')) {
        toast.error('Your account has been disabled. Please contact the Super Administrator.');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await adminApi.adminLogin({ email, password });

      if (response.success && response.data) {
        localStorage.setItem('adminToken', response.data.token);
        setAdmin(response.data.admin);
        toast.success('Login successful!');
        return { success: true };
      } else {
        toast.error(response.message || 'Invalid admin credentials');
        return { success: false, message: response.message || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Check if account is disabled
      if (error.message && error.message.includes('disabled')) {
        toast.error('Your account has been disabled. Please contact the Super Administrator.');
        return { success: false, message: 'Account disabled', disabled: true };
      }
      
      toast.error(error.message || 'Login failed');
      return { success: false, message: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setAdmin(null);
    toast.success('Logged out successfully');
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await adminApi.changePassword({ currentPassword, newPassword });
      
      if (response.success) {
        toast.success('Password changed successfully. Please login again.');
        logout();
        return { success: true };
      } else {
        toast.error(response.message || 'Failed to change password');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(error.message || 'Failed to change password');
      return { success: false, message: error.message };
    }
  };

  const value = {
    admin,
    login,
    logout,
    changePassword,
    loading,
    isAuthenticated: !!admin,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
