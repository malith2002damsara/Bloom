import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { superAdminAPI } from '../utils/api';

const SuperAdminAuthContext = createContext();

export const useSuperAdminAuth = () => {
  const context = useContext(SuperAdminAuthContext);
  if (!context) {
    throw new Error('useSuperAdminAuth must be used within a SuperAdminAuthProvider');
  }
  return context;
};

export const SuperAdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [superAdmin, setSuperAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await superAdminAPI.verifyToken();
      if (response.success && response.data && response.data.admin) {
        const admin = response.data.admin;
        if (admin.role === 'superadmin') {
          setIsAuthenticated(true);
          setSuperAdmin(admin);
        } else {
          localStorage.removeItem('superAdminToken');
          setIsAuthenticated(false);
          setSuperAdmin(null);
          toast.error('Access denied. SuperAdmin role required.');
        }
      } else {
        localStorage.removeItem('superAdminToken');
        setIsAuthenticated(false);
        setSuperAdmin(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('superAdminToken');
      setIsAuthenticated(false);
      setSuperAdmin(null);
      
      // Check if it's a disabled account error
      if (error.message && error.message.includes('disabled')) {
        toast.error('Your account has been disabled');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await superAdminAPI.login({ email, password });
      if (response.success && response.data && response.data.admin) {
        const admin = response.data.admin;
        const token = response.data.token;
        
        if (admin.role === 'superadmin') {
          localStorage.setItem('superAdminToken', token);
          setIsAuthenticated(true);
          setSuperAdmin(admin);
          toast.success('Login successful!');
          return { success: true };
        } else {
          throw new Error('Access denied. SuperAdmin role required.');
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Check if account is disabled
      if (error.message && error.message.includes('disabled')) {
        toast.error('Your account has been disabled');
        return { success: false, message: 'Account disabled', disabled: true };
      }
      
      toast.error(error.message || 'Login failed');
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('superAdminToken');
    setIsAuthenticated(false);
    setSuperAdmin(null);
    toast.success('Logged out successfully');
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await superAdminAPI.changePassword({ currentPassword, newPassword });
      
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
    isAuthenticated,
    superAdmin,
    loading,
    login,
    logout,
    changePassword,
    checkAuthStatus
  };

  return (
    <SuperAdminAuthContext.Provider value={value}>
      {children}
    </SuperAdminAuthContext.Provider>
  );
};
