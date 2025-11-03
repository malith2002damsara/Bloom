const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL || 'https://bloombackend.vercel.app'}/api`;

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('token');
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
      ...options,
    };

    console.log('Making API request:', {
      url,
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body
    });

    try {
      const response = await fetch(url, config);
      console.log('API response status:', response.status);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response data:', data);

      if (!response.ok) {
        // Handle authentication errors (401)
        if (response.status === 401) {
          // Clear invalid token and user data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Dispatch custom event for auth context to handle
          window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: data.message } }));
          
          throw new Error(data.message || 'Authentication required. Please login again.');
        }
        
        // Handle validation errors with more detail
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map(err => err.msg).join(', ');
          throw new Error(errorMessages);
        }
        
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection or try again later.');
      }
      
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      auth: false,
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      auth: false,
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(userData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(passwordData) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  // Product endpoints
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    return this.request(endpoint, { auth: false });
  }

  async getHomeProducts() {
    return this.request('/products/home', { auth: false });
  }

  async getProductById(id) {
    return this.request(`/products/${id}`, { auth: false });
  }

  async getCategories() {
    return this.request('/products/categories', { auth: false });
  }

  // Order endpoints
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getUserOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/orders?${queryString}` : '/orders';
    return this.request(endpoint);
  }

  async getOrderById(id) {
    return this.request(`/orders/${id}`);
  }

  async cancelOrder(id) {
    return this.request(`/orders/${id}/cancel`, {
      method: 'PUT',
    });
  }

  // Feedback endpoints
  async submitFeedback(feedbackData) {
    return this.request('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  }

  async getProductFeedback(productId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `/feedback/product/${productId}?${queryString}` 
      : `/feedback/product/${productId}`;
    return this.request(endpoint, { auth: false });
  }

  async getTopComments() {
    return this.request('/feedback/top-comments', { auth: false });
  }

  async checkFeedbackEligibility(orderId) {
    return this.request(`/feedback/check/${orderId}`);
  }

  async getAdminFeedback(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/feedback/admin?${queryString}` : '/feedback/admin';
    return this.request(endpoint);
  }
}

export default new ApiService();
