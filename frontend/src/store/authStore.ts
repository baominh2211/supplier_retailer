import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authApi } from '../api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchUser: (token?: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Step 1: Get token
          console.log('Step 1: Calling login API...');
          const response = await authApi.login(email, password);
          console.log('Login response:', response.data);
          
          const { access_token } = response.data;
          
          if (!access_token) {
            throw new Error('No access_token in response');
          }
          
          // Step 2: Fetch user with token directly
          console.log('Step 2: Fetching user with token...');
          const userResponse = await authApi.getMe(access_token);
          console.log('User response:', userResponse.data);
          
          // Step 3: Set everything at once
          set({ 
            token: access_token, 
            user: userResponse.data,
            isAuthenticated: true,
            isLoading: false
          });
          
          console.log('Login successful!');
        } catch (error: any) {
          console.error('Login error:', error);
          console.error('Error response:', error.response?.data);
          // Reset state on any error
          set({ 
            token: null, 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
          throw error; // Re-throw to let LoginPage handle it
        }
      },
      
      register: async (data: any) => {
        set({ isLoading: true });
        try {
          await authApi.register(data);
          // Don't auto login - user needs to verify email first
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('auth-storage');
      },
      
      fetchUser: async (token?: string) => {
        try {
          const tokenToUse = token || get().token;
          if (!tokenToUse) {
            set({ user: null, token: null, isAuthenticated: false });
            return;
          }
          const response = await authApi.getMe(tokenToUse);
          set({ user: response.data, isAuthenticated: true });
        } catch (error) {
          console.error('Failed to fetch user:', error);
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
