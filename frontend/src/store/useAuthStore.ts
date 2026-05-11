import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as api from '../api';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin' | 'delivery' | 'restaurant';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      setUser: (user) => set({ user }),

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const response: any = await api.loginUser(credentials);
          set({ 
            user: response.data.user, 
            token: response.token, 
            isAuthenticated: true, 
            loading: false 
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ loading: true, error: null });
        try {
          const response: any = await api.registerUser(data);
          set({ 
            user: response.data.user, 
            token: response.token, 
            isAuthenticated: true, 
            loading: false 
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.logoutUser();
        } finally {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'yumora-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
