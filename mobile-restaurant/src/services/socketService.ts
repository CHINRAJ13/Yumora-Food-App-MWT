import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants/config';
import { RestaurantOrder } from '../types';

class RestaurantSocketService {
  private socket: Socket | null = null;
  private currentRestaurantIds: Set<string> = new Set();
  private newOrderCallbacks: Set<(order: RestaurantOrder) => void> = new Set();
  private orderUpdatedCallbacks: Set<
    (data: { orderId: string; status: string; data?: any }) => void
  > = new Set();

  connect(restaurantIdOrIds?: string | string[]) {
    // 1. Register restaurant IDs
    if (restaurantIdOrIds) {
      const ids = Array.isArray(restaurantIdOrIds)
        ? restaurantIdOrIds
        : [restaurantIdOrIds];
      ids.filter(Boolean).forEach((id) => this.currentRestaurantIds.add(String(id)));
    }

    // 2. If socket already created, ensure room is joined and return
    if (this.socket) {
      if (this.socket.connected) {
        this.joinAllRooms();
      }
      return this.socket;
    }

    console.log('[RestaurantSocket] Initializing socket connection to:', SOCKET_URL);

    // 3. Create persistent socket instance with websocket and polling fallback
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1500,
    });

    this.socket.on('connect', () => {
      console.log('[RestaurantSocket] Connected! Socket ID:', this.socket?.id);
      this.joinAllRooms();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[RestaurantSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[RestaurantSocket] Connection error:', error.message);
    });

    // 4. Attach internal socket listeners that dispatch to registered listeners
    this.socket.on('new_restaurant_order', (order: RestaurantOrder) => {
      console.log(
        '[RestaurantSocket] 🔔 new_restaurant_order received:',
        order._id || order.id
      );
      this.newOrderCallbacks.forEach((cb) => {
        try {
          cb(order);
        } catch (e) {
          console.error('[RestaurantSocket] Callback error:', e);
        }
      });
    });

    this.socket.on(
      'restaurant_order_updated',
      (data: { orderId: string; status: string; data?: any }) => {
        console.log(
          '[RestaurantSocket] 📦 restaurant_order_updated received:',
          data.orderId,
          data.status
        );
        this.orderUpdatedCallbacks.forEach((cb) => {
          try {
            cb(data);
          } catch (e) {
            console.error('[RestaurantSocket] Callback error:', e);
          }
        });
      }
    );

    return this.socket;
  }

  private joinAllRooms() {
    if (!this.socket?.connected) return;
    this.currentRestaurantIds.forEach((id) => {
      console.log('[RestaurantSocket] Joining room: restaurant_' + id);
      this.socket?.emit('join_restaurant', id);
    });
  }

  joinRestaurantRoom(restaurantIdOrIds: string | string[]) {
    const ids = Array.isArray(restaurantIdOrIds)
      ? restaurantIdOrIds
      : [restaurantIdOrIds];
    ids.filter(Boolean).forEach((id) => this.currentRestaurantIds.add(String(id)));
    this.joinAllRooms();
  }

  onNewRestaurantOrder(callback: (order: RestaurantOrder) => void) {
    this.newOrderCallbacks.add(callback);
    if (!this.socket) {
      this.connect();
    }
  }

  offNewRestaurantOrder(callback: (order: RestaurantOrder) => void) {
    this.newOrderCallbacks.delete(callback);
  }

  onRestaurantOrderUpdated(
    callback: (data: { orderId: string; status: string; data?: any }) => void
  ) {
    this.orderUpdatedCallbacks.add(callback);
    if (!this.socket) {
      this.connect();
    }
  }

  offRestaurantOrderUpdated(
    callback: (data: { orderId: string; status: string; data?: any }) => void
  ) {
    this.orderUpdatedCallbacks.delete(callback);
  }

  offRestaurantEvents() {
    this.newOrderCallbacks.clear();
    this.orderUpdatedCallbacks.clear();
  }

  disconnect() {
    if (this.socket) {
      this.offRestaurantEvents();
      this.socket.disconnect();
      this.socket = null;
      this.currentRestaurantIds.clear();
    }
  }
}

export const restaurantSocketService = new RestaurantSocketService();
