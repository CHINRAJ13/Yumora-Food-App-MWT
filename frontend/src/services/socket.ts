import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to socket server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinOrder(orderId: string) {
    if (this.socket) {
      this.socket.emit('join_order', orderId);
    }
  }

  joinAdminRoom() {
    if (this.socket) {
      this.socket.emit('join_admin');
    }
  }

  joinDeliveryRoom() {
    if (this.socket) {
      this.socket.emit('join_delivery');
    }
  }

  onOrderStatusUpdate(callback: (data: { status: string, data: any }) => void) {
    if (this.socket) {
      this.socket.on('order_status_update', callback);
    }
  }

  offOrderStatusUpdate() {
    if (this.socket) {
      this.socket.off('order_status_update');
    }
  }

  // Delivery-specific events
  onNewAvailableOrder(callback: (order: any) => void) {
    if (this.socket) {
      this.socket.on('new_available_order', callback);
    }
  }

  onOrderTaken(callback: (data: { orderId: string }) => void) {
    if (this.socket) {
      this.socket.on('order_taken', callback);
    }
  }

  onOrderAccepted(callback: (data: { orderId: string, deliveryPerson: any }) => void) {
    if (this.socket) {
      this.socket.on('order_accepted', callback);
    }
  }

  offDeliveryEvents() {
    if (this.socket) {
      this.socket.off('new_available_order');
      this.socket.off('order_taken');
      this.socket.off('order_accepted');
    }
  }

  // Restaurant-specific events
  joinRestaurantRoom(restaurantId: string) {
    if (this.socket) {
      this.socket.emit('join_restaurant', restaurantId);
    }
  }

  onNewRestaurantOrder(callback: (order: any) => void) {
    if (this.socket) {
      this.socket.on('new_restaurant_order', callback);
    }
  }

  onRestaurantOrderUpdated(callback: (data: { orderId: string; status: string; data: any }) => void) {
    if (this.socket) {
      this.socket.on('restaurant_order_updated', callback);
    }
  }

  offRestaurantEvents() {
    if (this.socket) {
      this.socket.off('new_restaurant_order');
      this.socket.off('restaurant_order_updated');
    }
  }
}

export const socketService = new SocketService();


