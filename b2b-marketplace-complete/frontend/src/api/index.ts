import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper to get token from localStorage (persisted by Zustand)
const getToken = (): string | null => {
  try {
    const storage = localStorage.getItem('auth-storage');
    if (storage) {
      const parsed = JSON.parse(storage);
      return parsed?.state?.token || null;
    }
  } catch {
    return null;
  }
  return null;
};

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token
api.interceptors.request.use((config) => {
  // Skip if Authorization header already set (e.g., passed directly)
  if (!config.headers.Authorization) {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not on login page and not during login flow
      const isLoginPage = window.location.pathname.includes('/login');
      const isAuthRequest = error.config?.url?.includes('/auth/');
      
      if (!isLoginPage && !isAuthRequest) {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  loginJson: (email: string, password: string) => 
    api.post('/auth/login/json', { email, password }),
  getMe: (token?: string) => api.get('/users/me', token ? {
    headers: { Authorization: `Bearer ${token}` }
  } : undefined),
};

// Products API
export const productsApi = {
  list: (params?: any) => api.get('/products', { params }),
  get: (id: number) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
};

// Suppliers API
export const suppliersApi = {
  list: (params?: any) => api.get('/suppliers', { params }),
  get: (id: number) => api.get(`/suppliers/${id}`),
  getMe: () => api.get('/suppliers/me'),
  updateMe: (data: any) => api.patch('/suppliers/me', data),
  getProducts: () => api.get('/suppliers/me/products'),
  createProduct: (data: any) => api.post('/suppliers/me/products', data),
  updateProduct: (id: number, data: any) => api.patch(`/suppliers/me/products/${id}`, data),
  deleteProduct: (id: number) => api.delete(`/suppliers/me/products/${id}`),
  getQuotes: () => api.get('/suppliers/me/quotes'),
  createQuote: (data: any) => api.post('/suppliers/me/quotes', data),
};

// Shops API
export const shopsApi = {
  getMe: () => api.get('/shops/me'),
  updateMe: (data: any) => api.patch('/shops/me', data),
  searchProducts: (params?: any) => api.get('/shops/products', { params }),
  searchSuppliers: (params?: any) => api.get('/shops/suppliers', { params }),
  createRFQ: (data: any) => api.post('/shops/rfq', data),
  getRFQs: () => api.get('/shops/rfq'),
  getRFQ: (id: number) => api.get(`/shops/rfq/${id}`),
  createContract: (data: any) => api.post('/shops/contracts', data),
  getContracts: () => api.get('/shops/contracts'),
};

// RFQ API
export const rfqApi = {
  list: () => api.get('/rfq'),
  get: (id: number) => api.get(`/rfq/${id}`),
  updateStatus: (id: number, status: string) => api.patch(`/rfq/${id}/status`, null, { params: { status } }),
};

// Quotes API
export const quotesApi = {
  list: () => api.get('/quotes'),
  get: (id: number) => api.get(`/quotes/${id}`),
  update: (id: number, data: any) => api.patch(`/quotes/${id}`, data),
};

// Negotiations API
export const negotiationsApi = {
  list: (rfqId: number) => api.get(`/negotiations/${rfqId}`),
  create: (data: any) => api.post('/negotiations', data),
};

// Contracts API
export const contractsApi = {
  list: () => api.get('/contracts'),
  get: (id: number) => api.get(`/contracts/${id}`),
  update: (id: number, data: any) => api.patch(`/contracts/${id}`, data),
  delete: (id: number) => api.delete(`/contracts/${id}`),
};

// Admin API
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getPendingProducts: () => api.get('/admin/products/pending'),
  approveProduct: (id: number) => api.patch(`/admin/products/${id}/approve`),
  rejectProduct: (id: number) => api.patch(`/admin/products/${id}/reject`),
  getUsers: () => api.get('/admin/users'),
  getSuppliers: () => api.get('/admin/suppliers'),
  getShops: () => api.get('/admin/shops'),
};
