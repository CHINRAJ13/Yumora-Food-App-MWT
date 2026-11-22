import { create } from 'zustand';
import {
  getRestaurantActiveOrdersApi,
  getRestaurantOrdersApi,
  updateRestaurantOrderStatusApi,
} from '../api';
import { RestaurantOrder } from '../types';
import { soundService } from '../services/soundService';

interface RestaurantOrdersState {
  activeOrders: RestaurantOrder[];
  historyOrders: RestaurantOrder[];
  incomingAlertOrder: RestaurantOrder | null;
  isLoading: boolean;
  isUpdatingStatus: boolean;

  fetchActiveOrders: () => Promise<void>;
  fetchHistoryOrders: () => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    status: string
  ) => Promise<{ success: boolean; message?: string }>;
  handleNewOrder: (order: RestaurantOrder) => void;
  handleOrderUpdated: (data: { orderId: string; status: string; data?: any }) => void;
  dismissAlertOrder: () => void;
}

export const useRestaurantOrdersStore = create<RestaurantOrdersState>((set, get) => ({
  activeOrders: [],
  historyOrders: [],
  incomingAlertOrder: null,
  isLoading: false,
  isUpdatingStatus: false,

  fetchActiveOrders: async () => {
    try {
      set({ isLoading: true });
      const res: any = await getRestaurantActiveOrdersApi();
      if (res?.data) {
        set({ activeOrders: res.data });
      }
    } catch (err: any) {
      console.error('[OrdersStore] Fetch active error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHistoryOrders: async () => {
    try {
      set({ isLoading: true });
      const res: any = await getRestaurantOrdersApi('history');
      if (res?.data) {
        const historyOnly = (res.data || []).filter(
          (o: any) => o.status === 'Delivered' || o.status === 'Cancelled'
        );
        set({ historyOrders: historyOnly });
      }
    } catch (err: any) {
      console.error('[OrdersStore] Fetch history error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    try {
      set({ isUpdatingStatus: true });
      const res: any = await updateRestaurantOrderStatusApi(orderId, status);
      if (res?.status === 'success' || res?.data) {
        const updated = res.data;
        if (status === 'Cancelled' || status === 'Delivered') {
          set((state) => ({
            activeOrders: state.activeOrders.filter(
              (o) => (o._id || o.id) !== orderId
            ),
            historyOrders: updated
              ? [updated, ...state.historyOrders]
              : state.historyOrders,
          }));
        } else {
          set((state) => ({
            activeOrders: state.activeOrders.map((o) =>
              (o._id || o.id) === orderId ? (updated || { ...o, status }) : o
            ),
          }));
        }
        return { success: true };
      }
      return { success: false, message: res?.message || 'Could not update status' };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to update order status',
      };
    } finally {
      set({ isUpdatingStatus: false });
    }
  },

  handleNewOrder: (order: RestaurantOrder) => {
    // 1. Play kitchen bell chime and trigger device haptic pulses
    soundService.playOrderAlert({ loop: false, vibrate: true });

    // 2. Add to active orders immediately in state
    set((state) => {
      const orderId = order._id || order.id;
      const exists = state.activeOrders.some(
        (o) => (o._id || o.id) === orderId
      );
      if (exists) {
        return { incomingAlertOrder: order };
      }

      return {
        activeOrders: [order, ...state.activeOrders],
        incomingAlertOrder: order,
      };
    });

    // 3. Silently fetch fresh active orders list from server to ensure 100% sync
    get().fetchActiveOrders();
  },

  handleOrderUpdated: ({ orderId, status, data }) => {
    set((state) => {
      if (status === 'Delivered' || status === 'Cancelled') {
        const target = state.activeOrders.find(
          (o) => (o._id || o.id) === orderId
        );
        return {
          activeOrders: state.activeOrders.filter(
            (o) => (o._id || o.id) !== orderId
          ),
          historyOrders: target
            ? [{ ...target, status, ...data }, ...state.historyOrders]
            : state.historyOrders,
          incomingAlertOrder:
            state.incomingAlertOrder &&
            (state.incomingAlertOrder._id || state.incomingAlertOrder.id) === orderId
              ? null
              : state.incomingAlertOrder,
        };
      } else {
        return {
          activeOrders: state.activeOrders.map((o) =>
            (o._id || o.id) === orderId ? { ...o, status, ...data } : o
          ),
        };
      }
    });

    // Silently refresh in background
    get().fetchActiveOrders();
  },

  dismissAlertOrder: () => {
    soundService.stopAlert();
    set({ incomingAlertOrder: null });
  },
}));
