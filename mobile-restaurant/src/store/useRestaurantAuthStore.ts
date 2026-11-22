import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loginRestaurantApi,
  logoutApi,
  getMeApi,
  getRestaurantProfileApi,
  toggleRestaurantStatusApi,
} from '../api';
import { RestaurantUser, RestaurantProfile } from '../types';
import { restaurantSocketService } from '../services/socketService';

interface RestaurantAuthState {
  token: string | null;
  user: RestaurantUser | null;
  restaurant: RestaurantProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnline: boolean;

  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  toggleOnlineStatus: () => Promise<boolean>;
}

export const useRestaurantAuthStore = create<RestaurantAuthState>((set, get) => ({
  token: null,
  user: null,
  restaurant: null,
  isAuthenticated: false,
  isLoading: true,
  isOnline: true,

  initAuth: async () => {
    try {
      set({ isLoading: true });
      const [storedToken, storedUser, storedRest] = await Promise.all([
        AsyncStorage.getItem('yumora_restaurant_token'),
        AsyncStorage.getItem('yumora_restaurant_user'),
        AsyncStorage.getItem('yumora_restaurant_profile'),
      ]);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const parsedRest = storedRest ? JSON.parse(storedRest) : null;
        set({
          token: storedToken,
          user: parsedUser,
          restaurant: parsedRest,
          isAuthenticated: true,
          isOnline: parsedRest?.acceptsOrders ?? true,
        });

        const storedRestIds = [parsedRest?.id, parsedRest?._id].filter(Boolean) as string[];
        if (storedRestIds.length > 0) {
          restaurantSocketService.connect(storedRestIds);
        }

        // Silent refresh of fresh profile data
        try {
          const restRes: any = await getRestaurantProfileApi();
          if (restRes?.data) {
            const freshRest = restRes.data;
            await AsyncStorage.setItem(
              'yumora_restaurant_profile',
              JSON.stringify(freshRest)
            );
            set({
              restaurant: freshRest,
              isOnline: freshRest.acceptsOrders ?? true,
            });
            const freshIds = [freshRest.id, freshRest._id].filter(Boolean) as string[];
            restaurantSocketService.connect(freshIds);
          }
        } catch {
          // Keep cached data
        }
      }
    } catch (err) {
      console.error('[RestaurantAuth] Init error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      const res: any = await loginRestaurantApi({ email, password });
      if (res && res.token) {
        const u = res.data?.user || {};
        const restaurantUser: RestaurantUser = {
          id: u._id || u.id,
          _id: u._id || u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: 'restaurant',
          status: u.status || 'approved',
        };

        await AsyncStorage.setItem('yumora_restaurant_token', res.token);
        await AsyncStorage.setItem(
          'yumora_restaurant_user',
          JSON.stringify(restaurantUser)
        );

        set({
          token: res.token,
          user: restaurantUser,
          isAuthenticated: true,
        });

        // Fetch associated restaurant document
        try {
          const restRes: any = await getRestaurantProfileApi();
          if (restRes?.data) {
            const rest = restRes.data;
            await AsyncStorage.setItem(
              'yumora_restaurant_profile',
              JSON.stringify(rest)
            );
            set({
              restaurant: rest,
              isOnline: rest.acceptsOrders ?? true,
            });
            const loginIds = [rest.id, rest._id].filter(Boolean) as string[];
            restaurantSocketService.connect(loginIds);
          }
        } catch (e) {
          console.warn('[RestaurantAuth] Profile fetch error:', e);
        }

        return { success: true };
      }
      return { success: false, message: res?.message || 'Login failed' };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Invalid credentials or account issue',
      };
    }
  },

  logout: async () => {
    try {
      await logoutApi().catch(() => {});
      restaurantSocketService.disconnect();
      await AsyncStorage.multiRemove([
        'yumora_restaurant_token',
        'yumora_restaurant_user',
        'yumora_restaurant_profile',
      ]);
      set({
        user: null,
        token: null,
        restaurant: null,
        isAuthenticated: false,
        isOnline: false,
      });
    } catch (err) {
      console.error('[RestaurantAuth] Logout error:', err);
    }
  },

  refreshProfile: async () => {
    try {
      const restRes: any = await getRestaurantProfileApi();
      if (restRes?.data) {
        const rest = restRes.data;
        await AsyncStorage.setItem(
          'yumora_restaurant_profile',
          JSON.stringify(rest)
        );
        set({
          restaurant: rest,
          isOnline: rest.acceptsOrders ?? true,
        });
        const refreshIds = [rest.id, rest._id].filter(Boolean) as string[];
        restaurantSocketService.connect(refreshIds);
      }
    } catch (err) {
      console.error('[RestaurantAuth] Refresh profile error:', err);
    }
  },

  toggleOnlineStatus: async () => {
    try {
      const res: any = await toggleRestaurantStatusApi();
      if (res?.data) {
        const acceptsOrders = !!res.data.acceptsOrders;
        set((state) => ({
          isOnline: acceptsOrders,
          restaurant: state.restaurant
            ? { ...state.restaurant, acceptsOrders }
            : null,
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('[RestaurantAuth] Toggle status error:', err);
      return false;
    }
  },
}));
