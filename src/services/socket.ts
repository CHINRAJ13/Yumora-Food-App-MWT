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
}

export const socketService = new SocketService();
