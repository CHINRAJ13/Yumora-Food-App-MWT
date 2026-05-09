import { Server } from 'socket.io';

let io;

export const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:8080",
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join_order', (orderId) => {
      console.log(`Client ${socket.id} joined order room: ${orderId}`);
      socket.join(orderId);
    });

    // Admin joins a special room to receive new-order notifications
    socket.on('join_admin', () => {
      console.log(`Client ${socket.id} joined admin room`);
      socket.join('admin_room');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const emitOrderUpdate = (orderId, status, data) => {
  if (io) {
    io.to(orderId).emit('order_status_update', { status, data });
    // Also notify admins about status changes
    io.to('admin_room').emit('order_updated', { orderId, status, data });
  }
};

export const emitNewOrder = (order) => {
  if (io) {
    io.to('admin_room').emit('new_order', order);
  }
};

