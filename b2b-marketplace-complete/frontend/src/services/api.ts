import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('refreshToken', refresh);
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('refreshToken');
};

export const getAccessToken = () => accessToken;

export const initializeTokens = () => {
  refreshToken = localStorage.getItem('refreshToken');
};

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // If 401 and we have a refresh token, try to refresh
    if (
      error.response?.status === 401 &&
      refreshToken &&
      originalRequest &&
      !(originalRequest as any)._retry
    ) {
      (originalRequest as any)._retry = true;

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
        setTokens(newAccessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
    errors?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Generic API methods
export const apiGet = async <T>(url: string, params?: Record<string, any>): Promise<T> => {
  const response = await api.get<ApiResponse<T>>(url, { params });
  return response.data.data as T;
};

export const apiPost = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.post<ApiResponse<T>>(url, data);
  return response.data.data as T;
};

export const apiPut = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.put<ApiResponse<T>>(url, data);
  return response.data.data as T;
};

export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await api.delete<ApiResponse<T>>(url);
  return response.data.data as T;
};

export default api;
