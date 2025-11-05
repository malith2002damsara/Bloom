const normalizeBaseUrl = (value) => {
  if (!value) return null;
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const envBaseUrl = normalizeBaseUrl(import.meta.env.VITE_BACKEND_URL);
const defaultBaseUrl = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://bloombackend.vercel.app';

const API_BASE_URL = `${normalizeBaseUrl(envBaseUrl || defaultBaseUrl)}/api`;

class AdminApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('adminToken');
  }

  // Get default headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.auth !== false),
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Generic GET method
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // Generic POST method
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin Auth endpoints
  async adminLogin(credentials) {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      auth: false,
    });
  }

  async verifyAdmin() {
    return this.request('/admin/verify');
  }

  async changePassword(passwordData) {
    return this.request('/admin/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async getProfile() {
    return this.request('/admin/profile');
  }

  async updateProfile(profileData) {
    return this.request('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Product endpoints
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    return this.request(endpoint);
  }

  async getAdminProducts() {
    // Get current admin's ID from token
    const token = this.getToken();
    if (!token) return { success: false, message: 'No auth token' };
    
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const adminId = decoded.userId;
      return this.request(`/products?adminId=${adminId}`);
    } catch (error) {
      console.error('Error getting admin products:', error);
      return { success: false, message: 'Failed to get admin products' };
    }
  }

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Order endpoints
  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/orders/admin/all?${queryString}` : '/orders/admin/all';
    return this.request(endpoint);
  }

  async updateOrderStatus(id, status) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // User endpoints
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/auth/users?${queryString}` : '/auth/users';
    return this.request(endpoint);
  }

  // Analytics endpoints
  async getDashboardStats() {
    return this.request('/admin/stats');
  }

  async getAnalytics(timeRange = '7d') {
    return this.request(`/admin/analytics?range=${timeRange}`);
  }

  // Seller endpoints (if needed)
  async getSellers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/sellers?${queryString}` : '/admin/sellers';
    return this.request(endpoint);
  }

  // Notification endpoints
  async getNotifications() {
    return this.request('/admin/notifications');
  }

  async markNotificationRead(notificationId) {
    return this.request(`/admin/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/admin/notifications/read-all', {
      method: 'PUT',
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/admin/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // Get base URL for direct API calls (like file uploads)
  getBaseURL() {
    return this.baseURL;
  }

  // Get backend URL without /api suffix (for file uploads)
  getBackendURL() {
    return this.baseURL.replace('/api', '');
  }
}

export default new AdminApiService();
