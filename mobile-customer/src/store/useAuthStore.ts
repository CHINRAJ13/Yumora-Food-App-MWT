import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  login: async (token, user) => {
    await AsyncStorage.setItem('yumora_token', token);
    await AsyncStorage.setItem('yumora_user', JSON.stringify(user));
    set({ token, user });
  },
  updateUser: async (updatedData) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const merged = { ...currentUser, ...updatedData };
    await AsyncStorage.setItem('yumora_user', JSON.stringify(merged));
    set({ user: merged });
  },
  logout: async () => {
    await AsyncStorage.removeItem('yumora_token');
    await AsyncStorage.removeItem('yumora_user');
    set({ token: null, user: null });
  },
  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('yumora_token');
      const userStr = await AsyncStorage.getItem('yumora_user');
      const user = userStr ? JSON.parse(userStr) : null;
      set({ token, user, isLoading: false });
    } catch {
      set({ token: null, user: null, isLoading: false });
    }
  },
}));
