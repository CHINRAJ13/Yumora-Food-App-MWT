import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants/config';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket || !this.socket.connected) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected to backend server:', this.socket?.id);
      });

      this.socket.on('connect_error', (error) => {
        console.warn('[Socket] Connection error:', error.message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
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
    const s = this.connect();
    s.emit('join_order', orderId);
    console.log(`[Socket] Joined order room: ${orderId}`);
  }

  joinTracking(orderId: string, role: 'customer' | 'driver' = 'customer') {
    const s = this.connect();
    s.emit('join-tracking', { orderId, role });
    console.log(`[Socket] Joined tracking room tracking_${orderId} as ${role}`);
  }

  sendCustomerLocation(orderId: string, lat: number, lng: number) {
    if (this.socket) {
      this.socket.emit('customer-location', { orderId, lat, lng });
      console.log(`[Socket] Sent customer location for order ${orderId}: (${lat}, ${lng})`);
    }
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  onOrderStatusUpdate(callback: (data: { status: string; data: any }) => void) {
    if (this.socket) {
      this.socket.on('order_status_update', callback);
    }
  }

  offOrderStatusUpdate(callback?: (data: { status: string; data: any }) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('order_status_update', callback);
      } else {
        this.socket.off('order_status_update');
      }
    }
  }

  onOrderAccepted(callback: (data: { orderId: string; deliveryPerson: any }) => void) {
    if (this.socket) {
      this.socket.on('order_accepted', callback);
    }
  }

  offOrderAccepted() {
    if (this.socket) {
      this.socket.off('order_accepted');
    }
  }

  onLocationUpdated(callback: (data: { lat: number; lng: number; distance: string | null; eta: string | null; orderId: string }) => void) {
    if (this.socket) {
      this.socket.on('location-updated', callback);
    }
  }

  offLocationUpdated() {
    if (this.socket) {
      this.socket.off('location-updated');
    }
  }

  onTrackingStarted(callback: (data: { orderId: string }) => void) {
    if (this.socket) {
      this.socket.on('tracking-started', callback);
    }
  }

  offTrackingStarted() {
    if (this.socket) {
      this.socket.off('tracking-started');
    }
  }

  onTrackingEnded(callback: (data: { orderId: string }) => void) {
    if (this.socket) {
      this.socket.on('tracking-ended', callback);
    }
  }

  offTrackingEnded() {
    if (this.socket) {
      this.socket.off('tracking-ended');
    }
  }

  onOrderCancelled(callback: (data: { orderId: string; order: any }) => void) {
    if (this.socket) {
      this.socket.on('order_cancelled', callback);
    }
  }

  offOrderCancelled() {
    if (this.socket) {
      this.socket.off('order_cancelled');
    }
  }
}

export const socketService = new SocketService();
