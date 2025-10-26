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
      const url = `${this.baseURL}${endpoint}`;
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      console.error('Request details:', {
        endpoint,
        baseURL: this.baseURL,
        hasToken: !!token
      });
      throw error;
    }
  }

  // Authentication
  async login(credentials) {
    return this.makeRequest('/superadmin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async verifyToken() {
    return this.makeRequest('/superadmin/verify', {
      method: 'GET',
    });
  }

  async changePassword(passwordData) {
    return this.makeRequest('/superadmin/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  // Admin Account Management
  async getAllAdmins() {
    return this.makeRequest('/superadmin/admins');
  }

  async getAdmin(adminId) {
    return this.makeRequest(`/superadmin/admins/${adminId}`);
  }

  async createAdmin(adminData) {
    return this.makeRequest('/superadmin/admins', {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
  }

  async updateAdmin(adminId, updateData) {
    return this.makeRequest(`/superadmin/admins/${adminId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async activateAdmin(adminId) {
    return this.makeRequest(`/superadmin/admins/${adminId}/activate`, {
      method: 'PATCH',
    });
  }

  async deactivateAdmin(adminId) {
    return this.makeRequest(`/superadmin/admins/${adminId}/deactivate`, {
      method: 'PATCH',
    });
  }

  async deleteAdmin(adminId) {
    return this.makeRequest(`/superadmin/admins/${adminId}`, {
      method: 'DELETE',
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.makeRequest('/superadmin/dashboard/stats');
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
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateTransactionPayment(transactionId, paymentData) {
    return this.makeRequest(`/superadmin/transactions/${transactionId}/payment`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  }

  async generateMonthlyCommissions(month, year) {
    return this.makeRequest('/superadmin/transactions/generate-monthly', {
      method: 'POST',
      body: JSON.stringify({ month, year }),
    });
  }

  async getAdminCommissionReport(adminId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(`/superadmin/admins/${adminId}/commission-report${queryString ? `?${queryString}` : ''}`);
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
