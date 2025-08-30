const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class SuperAdminAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async makeRequest(endpoint, options = {}) {
    const token = localStorage.getItem('superAdminToken');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication
  async login(credentials) {
    return this.makeRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async verifyToken() {
    return this.makeRequest('/admin/verify', {
      method: 'GET',
    });
  }

  // Admin Account Management
  async getAdminAccounts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(`/superadmin/admins${queryString ? `?${queryString}` : ''}`);
  }

  async createAdminAccount(adminData) {
    return this.makeRequest('/superadmin/admins', {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
  }

  async updateAdminAccount(adminId, updateData) {
    return this.makeRequest(`/superadmin/admins/${adminId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deactivateAdminAccount(adminId) {
    return this.makeRequest(`/superadmin/admins/${adminId}/deactivate`, {
      method: 'PATCH',
    });
  }

  async activateAdminAccount(adminId) {
    return this.makeRequest(`/superadmin/admins/${adminId}/activate`, {
      method: 'PATCH',
    });
  }

  async deleteAdminAccount(adminId) {
    return this.makeRequest(`/superadmin/admins/${adminId}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getDashboardStats() {
    return this.makeRequest('/admin/stats');
  }

  async getAnalyticsData(period = '30d') {
    return this.makeRequest(`/admin/analytics?period=${period}`);
  }

  async getRevenueStats(period = '30d') {
    return this.makeRequest(`/superadmin/analytics/revenue?period=${period}`);
  }

  async getUserGrowthStats(period = '30d') {
    return this.makeRequest(`/superadmin/analytics/user-growth?period=${period}`);
  }

  // Transactions
  async getTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(`/superadmin/transactions${queryString ? `?${queryString}` : ''}`);
  }

  async getTransactionDetails(transactionId) {
    return this.makeRequest(`/superadmin/transactions/${transactionId}`);
  }

  async updateTransactionStatus(transactionId, status) {
    return this.makeRequest(`/superadmin/transactions/${transactionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Products
  async getAllProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(`/superadmin/products${queryString ? `?${queryString}` : ''}`);
  }

  async updateProductStatus(productId, status) {
    return this.makeRequest(`/superadmin/products/${productId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteProduct(productId) {
    return this.makeRequest(`/superadmin/products/${productId}`, {
      method: 'DELETE',
    });
  }

  // System Settings
  async getSystemSettings() {
    return this.makeRequest('/superadmin/settings');
  }

  async updateSystemSettings(settings) {
    return this.makeRequest('/superadmin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const superAdminAPI = new SuperAdminAPI();
