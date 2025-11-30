import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setTokens, clearTokens, initializeTokens } from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  role: 'SUPPLIER' | 'SHOP' | 'ADMIN';
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  role: 'SUPPLIER' | 'SHOP';
  companyName?: string;
  shopName?: string;
  country: string;
}

interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from stored token
  useEffect(() => {
    const initAuth = async () => {
      initializeTokens();
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (storedRefreshToken) {
        try {
          const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/refresh', {
            refreshToken: storedRefreshToken,
          });

          const { user: userData, tokens } = response.data.data;
          setTokens(tokens.accessToken, tokens.refreshToken);
          setUser(userData);
        } catch (error) {
          clearTokens();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', {
        email,
        password,
      });

      const { user: userData, tokens } = response.data.data;
      setTokens(tokens.accessToken, tokens.refreshToken);
      setUser(userData);

      toast.success('Welcome back!');

      // Redirect based on role
      switch (userData.role) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'SUPPLIER':
          navigate('/supplier/dashboard');
          break;
        case 'SHOP':
          navigate('/shop/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  }, [navigate]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', data);

      const { user: userData, tokens } = response.data.data;
      setTokens(tokens.accessToken, tokens.refreshToken);
      setUser(userData);

      toast.success('Registration successful! Please verify your email.');

      // Redirect based on role
      if (userData.role === 'SUPPLIER') {
        navigate('/supplier/onboarding');
      } else {
        navigate('/shop/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      // Ignore errors on logout
    } finally {
      clearTokens();
      setUser(null);
      navigate('/login');
      toast.success('Logged out successfully');
    }
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; data: User }>('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      // If refresh fails, clear auth state
      clearTokens();
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
