import React, { createContext, useContext, useState, useEffect } from 'react';
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
        if (admin.role === 'superadmin' || admin.role === 'admin') {
          setIsAuthenticated(true);
          setSuperAdmin(admin);
        } else {
          localStorage.removeItem('superAdminToken');
          setIsAuthenticated(false);
          setSuperAdmin(null);
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
        
        if (admin.role === 'superadmin' || admin.role === 'admin') {
          localStorage.setItem('superAdminToken', token);
          setIsAuthenticated(true);
          setSuperAdmin(admin);
          return { success: true };
        } else {
          throw new Error('Unauthorized: Admin access required');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('superAdminToken');
    setIsAuthenticated(false);
    setSuperAdmin(null);
  };

  const value = {
    isAuthenticated,
    superAdmin,
    loading,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <SuperAdminAuthContext.Provider value={value}>
      {children}
    </SuperAdminAuthContext.Provider>
  );
};
