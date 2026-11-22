import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeliveryUser } from '../types';
import { loginDeliveryApi, getMeApi, updateDeliveryStatusApi, logoutApi } from '../api';
import { deliverySocketService } from '../services/socketService';

interface DeliveryAuthState {
  user: DeliveryUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnline: boolean;
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  setOnlineStatus: (status: boolean) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

export const useDeliveryAuthStore = create<DeliveryAuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isOnline: false,

  initAuth: async () => {
    try {
      set({ isLoading: true });
      const storedToken = await AsyncStorage.getItem('yumora_delivery_token');
      const storedUser = await AsyncStorage.getItem('yumora_delivery_user');

      if (storedToken && storedUser) {
        const parsedUser: DeliveryUser = JSON.parse(storedUser);
        set({
          token: storedToken,
          user: parsedUser,
          isAuthenticated: true,
          isOnline: !!parsedUser.availability,
        });

        // Initialize socket and join delivery room if online
        const riderId = parsedUser._id || parsedUser.id;
        deliverySocketService.connect(riderId);
        if (parsedUser.availability) {
          deliverySocketService.joinDeliveryRoom(riderId);
        }

        // Background refresh profile from backend
        try {
          const res: any = await getMeApi();
          if (res?.data) {
            const freshUser: DeliveryUser = {
              id: res.data._id,
              _id: res.data._id,
              name: res.data.name,
              email: res.data.email,
              phone: res.data.phone,
              role: res.data.type || 'delivery',
              availability: !!res.data.availability,
              approvalStatus: res.data.status || 'approved',
              deliveryDetails: res.data.deliveryProfile,
            };
            await AsyncStorage.setItem('yumora_delivery_user', JSON.stringify(freshUser));
            set({ user: freshUser, isOnline: freshUser.availability });
          }
        } catch (e) {
          console.log('[Auth] Profile refresh silent fail, using cached user');
        }
      }
    } catch (err) {
      console.error('[Auth] Init error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      const res: any = await loginDeliveryApi({ email, password });
      if (res && res.token) {
        const u = res.data?.user || {};
        const deliveryUser: DeliveryUser = {
          id: u._id || u.id,
          _id: u._id || u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: 'delivery',
          availability: !!u.availability,
          approvalStatus: u.status || 'approved',
          deliveryDetails: {
            vehicleType: u.vehicleType,
            vehicleNumber: u.vehicleNumber,
            licenseNumber: u.licenseNumber,
            rating: u.rating || 4.8,
            totalRatings: u.totalRatings || 0,
          },
        };

        await AsyncStorage.setItem('yumora_delivery_token', res.token);
        await AsyncStorage.setItem('yumora_delivery_user', JSON.stringify(deliveryUser));

        set({
          token: res.token,
          user: deliveryUser,
          isAuthenticated: true,
          isOnline: deliveryUser.availability,
        });

        const riderId = deliveryUser._id || deliveryUser.id;
        deliverySocketService.connect(riderId);
        if (deliveryUser.availability) {
          deliverySocketService.joinDeliveryRoom(riderId);
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
      deliverySocketService.disconnect();
      await AsyncStorage.multiRemove(['yumora_delivery_token', 'yumora_delivery_user']);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isOnline: false,
      });
    } catch (err) {
      console.error('[Auth] Logout error:', err);
    }
  },

  setOnlineStatus: async (status: boolean) => {
    try {
      const res: any = await updateDeliveryStatusApi(status);
      const isAvailable = res?.data?.availability ?? status;

      set((state) => ({
        isOnline: isAvailable,
        user: state.user ? { ...state.user, availability: isAvailable } : null,
      }));

      // Update cached user in storage
      const current = get().user;
      if (current) {
        await AsyncStorage.setItem(
          'yumora_delivery_user',
          JSON.stringify({ ...current, availability: isAvailable })
        );
      }

      if (isAvailable) {
        const riderId = current?._id || current?.id;
        deliverySocketService.joinDeliveryRoom(riderId);
      }

      return true;
    } catch (err) {
      console.error('[Auth] Failed to update availability:', err);
      return false;
    }
  },

  refreshProfile: async () => {
    if (!get().isAuthenticated || !get().token) return;
    try {
      const res: any = await getMeApi();
      if (res?.data) {
        const freshUser: DeliveryUser = {
          id: res.data._id,
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          phone: res.data.phone,
          role: res.data.type || 'delivery',
          availability: !!res.data.availability,
          approvalStatus: res.data.status || 'approved',
          deliveryDetails: res.data.deliveryProfile,
        };
        await AsyncStorage.setItem('yumora_delivery_user', JSON.stringify(freshUser));
        set({ user: freshUser, isOnline: freshUser.availability });
      }
    } catch (err: any) {
      if (err?.status !== 401) {
        console.error('[Auth] refreshProfile error:', err);
      }
    }
  },
}));
