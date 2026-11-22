import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants/config';

class DeliverySocketService {
  private socket: Socket | null = null;
  private currentPartnerId: string | null = null;

  connect(partnerId?: string) {
    if (partnerId) {
      this.currentPartnerId = partnerId;
    }

    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 2000,
      });

      this.socket.on('connect', () => {
        console.log('[Rider Socket] Connected to server:', this.socket?.id);
        this.joinDeliveryRoom(this.currentPartnerId || undefined);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Rider Socket] Disconnected:', reason);
      });
    } else if (partnerId && this.currentPartnerId !== partnerId) {
      this.currentPartnerId = partnerId;
      this.joinDeliveryRoom(partnerId);
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinDeliveryRoom(partnerId?: string) {
    if (partnerId) {
      this.currentPartnerId = partnerId;
    }
    if (this.socket) {
      this.socket.emit('join_delivery', this.currentPartnerId);
    }
  }

  joinOrder(orderId: string) {
    if (this.socket) {
      this.socket.emit('join_order', orderId);
    }
  }

  // Live Location Tracking
  joinTracking(orderId: string) {
    if (this.socket) {
      this.socket.emit('join-tracking', { orderId, role: 'driver' });
    }
  }

  emitLocationUpdate(orderId: string, lat: number, lng: number) {
    if (this.socket) {
      this.socket.emit('location-update', { orderId, lat, lng });
    }
  }

  // Delivery Event Listeners
  onNewAvailableOrder(callback: (order: any) => void) {
    if (this.socket) {
      this.socket.on('new_available_order', callback);
    }
  }

  onOrderAssigned(callback: (orderOrData: any) => void) {
    if (this.socket) {
      this.socket.on('order_assigned', callback);
    }
  }

  offOrderAssigned(callback?: (orderOrData: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('order_assigned', callback);
      } else {
        this.socket.off('order_assigned');
      }
    }
  }

  onOrderTaken(callback: (data: { orderId: string }) => void) {
    if (this.socket) {
      this.socket.on('order_taken', callback);
    }
  }

  onOrderStatusUpdate(callback: (data: { status: string; data: any }) => void) {
    if (this.socket) {
      this.socket.on('order_status_update', callback);
    }
  }

  offDeliveryEvents() {
    if (this.socket) {
      this.socket.off('new_available_order');
      this.socket.off('order_taken');
      this.socket.off('order_status_update');
    }
  }
}

export const deliverySocketService = new DeliverySocketService();
