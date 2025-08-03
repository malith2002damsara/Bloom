import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

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
      // Verify token and set admin
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        try {
          const data = await response.json();
          setAdmin(data.admin);
        } catch (jsonError) {
          console.error('JSON parsing error during verification:', jsonError);
          // If it's a demo token (base64 encoded), decode it
          try {
            const decodedToken = JSON.parse(atob(token));
            if (decodedToken.email === 'malithdamsara87@gmail.com') {
              setAdmin({
                id: decodedToken.id,
                email: decodedToken.email,
                name: decodedToken.name,
                role: decodedToken.role
              });
            } else {
              localStorage.removeItem('adminToken');
            }
          } catch (decodeError) {
            localStorage.removeItem('adminToken');
          }
        }
      } else {
        localStorage.removeItem('adminToken');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      // Try to decode demo token as fallback
      try {
        const decodedToken = JSON.parse(atob(token));
        if (decodedToken.email === 'malithdamsara87@gmail.com') {
          setAdmin({
            id: decodedToken.id,
            email: decodedToken.email,
            name: decodedToken.name,
            role: decodedToken.role
          });
        } else {
          localStorage.removeItem('adminToken');
        }
      } catch (decodeError) {
        localStorage.removeItem('adminToken');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        // If JSON parsing fails, fallback to hardcoded credentials
        throw new Error('Backend connection failed');
      }

      if (response.ok && data.success) {
        localStorage.setItem('adminToken', data.data.token);
        setAdmin(data.data.admin);
        toast.success('Login successful!');
        return { success: true };
      } else {
        toast.error(data.message || 'Invalid admin credentials');
        return { success: false, message: data.message || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Login error:', error);
      // Fallback to hardcoded credentials for demo when backend is not available
      if (email === 'malithdamsara87@gmail.com' && password === 'malith123') {
        const adminData = {
          id: 'admin_1',
          email: 'malithdamsara87@gmail.com',
          name: 'Admin User',
          role: 'admin'
        };
        
        const token = btoa(JSON.stringify({ ...adminData, timestamp: Date.now() }));
        localStorage.setItem('adminToken', token);
        setAdmin(adminData);
        toast.success('Login successful! (Demo mode - Backend not connected)');
        return { success: true };
      } else {
        toast.error('Invalid credentials or backend connection failed');
        return { success: false, message: 'Login failed' };
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setAdmin(null);
    toast.success('Logged out successfully');
  };

  const value = {
    admin,
    login,
    logout,
    loading,
    isAuthenticated: !!admin,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
