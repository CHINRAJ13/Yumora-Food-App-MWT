import { create } from 'zustand';
import * as Location from 'expo-location';
import { DeliveryOrder } from '../types';
import {
  getAvailableOrdersApi,
  getMyActiveDeliveriesApi,
  acceptDeliveryOrderApi,
  pickupDeliveryOrderApi,
  completeDeliveryOrderApi,
} from '../api';
import { deliverySocketService } from '../services/socketService';
import { soundService } from '../services/soundService';
import { useDeliveryAuthStore } from './useDeliveryAuthStore';

interface ActiveTripState {
  activeOrder: DeliveryOrder | null;
  availableOrders: DeliveryOrder[];
  incomingAssignedAlert: DeliveryOrder | null;
  isLoading: boolean;
  isAccepting: boolean;
  currentLocation: { lat: number; lng: number } | null;
  isTracking: boolean;
  locationSubscription: Location.LocationSubscription | null;

  // Actions
  fetchAvailableOrders: () => Promise<void>;
  fetchActiveOrder: () => Promise<void>;
  acceptOrder: (orderId: string) => Promise<{ success: boolean; message?: string }>;
  confirmPickup: (orderId: string) => Promise<{ success: boolean; message?: string }>;
  completeDelivery: (orderId: string) => Promise<{ success: boolean; message?: string }>;
  
  // Realtime handlers
  addAvailableOrder: (order: DeliveryOrder) => void;
  removeAvailableOrder: (orderId: string) => void;
  handleOrderAssigned: (order: DeliveryOrder) => void;
  dismissAssignedAlert: () => void;

  // GPS Tracking
  startLiveLocationTracking: (orderId: string) => Promise<void>;
  stopLiveLocationTracking: () => void;
}

export const useActiveTripStore = create<ActiveTripState>((set, get) => ({
  activeOrder: null,
  availableOrders: [],
  incomingAssignedAlert: null,
  isLoading: false,
  isAccepting: false,
  currentLocation: null,
  isTracking: false,
  locationSubscription: null,

  fetchAvailableOrders: async () => {
    if (!useDeliveryAuthStore.getState().isAuthenticated) return;
    try {
      set({ isLoading: true });
      const res: any = await getAvailableOrdersApi();
      const orders = res?.data || [];
      set({ availableOrders: orders });
    } catch (err: any) {
      if (err?.status !== 401) {
        console.error('[TripStore] Fetch available orders error:', err);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchActiveOrder: async () => {
    if (!useDeliveryAuthStore.getState().isAuthenticated) return;
    try {
      const res: any = await getMyActiveDeliveriesApi();
      const orders = res?.data || [];
      if (orders.length > 0) {
        const currentActive = orders[0];
        set({ activeOrder: currentActive });
        // Auto-join tracking room
        deliverySocketService.joinTracking(currentActive._id || currentActive.id);
        // If out for delivery, ensure GPS emission is running
        if (currentActive.status === 'Out for Delivery') {
          get().startLiveLocationTracking(currentActive._id || currentActive.id);
        }
      } else {
        set({ activeOrder: null });
        get().stopLiveLocationTracking();
      }
    } catch (err: any) {
      if (err?.status !== 401) {
        console.error('[TripStore] Fetch active order error:', err);
      }
    }
  },

  acceptOrder: async (orderId: string) => {
    try {
      set({ isAccepting: true });
      soundService.stopAlert();
      const res: any = await acceptDeliveryOrderApi(orderId);
      const acceptedOrder = res?.data;

      if (acceptedOrder) {
        set((state) => ({
          activeOrder: acceptedOrder,
          availableOrders: state.availableOrders.filter(
            (o) => (o._id || o.id) !== orderId
          ),
        }));

        deliverySocketService.joinTracking(orderId);
        return { success: true };
      }
      return { success: false, message: 'Could not accept order' };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to accept order. It might already be taken.',
      };
    } finally {
      set({ isAccepting: false });
    }
  },

  confirmPickup: async (orderId: string) => {
    try {
      const res: any = await pickupDeliveryOrderApi(orderId);
      const updatedOrder = res?.data;

      if (updatedOrder) {
        set({ activeOrder: updatedOrder });
        // Start continuous GPS tracking to emit rider coordinates to customer
        get().startLiveLocationTracking(orderId);
        return { success: true };
      }
      return { success: false, message: 'Could not confirm pickup' };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to confirm pickup',
      };
    }
  },

  completeDelivery: async (orderId: string) => {
    try {
      const res: any = await completeDeliveryOrderApi(orderId);
      if (res?.data) {
        get().stopLiveLocationTracking();
        set({ activeOrder: null });
        return { success: true };
      }
      return { success: false, message: 'Could not complete delivery' };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to complete delivery',
      };
    }
  },

  addAvailableOrder: (order: DeliveryOrder) => {
    set((state) => {
      const exists = state.availableOrders.some(
        (o) => (o._id || o.id) === (order._id || order.id)
      );
      if (exists) return state;
      return { availableOrders: [order, ...state.availableOrders] };
    });
  },

  removeAvailableOrder: (orderId: string) => {
    set((state) => ({
      availableOrders: state.availableOrders.filter(
        (o) => (o._id || o.id) !== orderId
      ),
    }));
  },

  handleOrderAssigned: (order: DeliveryOrder) => {
    console.log('[TripStore] 🚨 Order assigned alert received for order:', order._id || order.id);
    // Play loud alert sound and vibrate device!
    soundService.playOrderAlert({ loop: false, vibrate: true });

    const orderId = order._id || order.id;
    set((state) => ({
      activeOrder: order,
      incomingAssignedAlert: order,
      availableOrders: state.availableOrders.filter(
        (o) => (o._id || o.id) !== orderId
      ),
    }));

    if (orderId) {
      deliverySocketService.joinTracking(orderId);
      if (order.status === 'Out for Delivery') {
        get().startLiveLocationTracking(orderId);
      }
    }
  },

  dismissAssignedAlert: () => {
    soundService.stopAlert();
    set({ incomingAssignedAlert: null });
  },

  startLiveLocationTracking: async (orderId: string) => {
    const { isTracking, locationSubscription } = get();
    if (isTracking && locationSubscription) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[GPS] Permission to access location was denied');
        return;
      }

      // Initial fast location
      const initialLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (initialLoc) {
        const coords = {
          lat: initialLoc.coords.latitude,
          lng: initialLoc.coords.longitude,
        };
        set({ currentLocation: coords });
        deliverySocketService.emitLocationUpdate(orderId, coords.lat, coords.lng);
      }

      // Continuous watcher
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // emit every 10 meters
          timeInterval: 4000,    // or every 4 seconds
        },
        (loc) => {
          const lat = loc.coords.latitude;
          const lng = loc.coords.longitude;
          set({ currentLocation: { lat, lng } });
          deliverySocketService.emitLocationUpdate(orderId, lat, lng);
        }
      );

      set({ locationSubscription: sub, isTracking: true });
    } catch (err) {
      console.error('[GPS] Error initializing live location tracker:', err);
    }
  },

  stopLiveLocationTracking: () => {
    const { locationSubscription } = get();
    if (locationSubscription) {
      locationSubscription.remove();
    }
    set({ locationSubscription: null, isTracking: false });
  },
}));
