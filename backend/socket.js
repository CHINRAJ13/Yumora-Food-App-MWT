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

    // Delivery person joins the delivery room
    socket.on('join_delivery', () => {
      console.log(`Client ${socket.id} joined delivery room`);
      socket.join('delivery_room');
    });

    // Restaurant owner joins their restaurant-specific room
    socket.on('join_restaurant', (restaurantId) => {
      console.log(`Client ${socket.id} joined restaurant room: ${restaurantId}`);
      socket.join(`restaurant_${restaurantId}`);
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
    // Notify delivery room about status changes
    io.to('delivery_room').emit('order_status_changed', { orderId, status, data });
    // Notify the restaurant about their order status changes
    if (data?.restaurantId) {
      io.to(`restaurant_${data.restaurantId}`).emit('restaurant_order_updated', { orderId, status, data });
    }
  }
};

export const emitNewOrder = (order) => {
  if (io) {
    io.to('admin_room').emit('new_order', order);
    // Also notify the specific restaurant about the new order
    if (order.restaurantId) {
      io.to(`restaurant_${order.restaurantId}`).emit('new_restaurant_order', order);
    }
  }
};

// Notify delivery riders when an order becomes available for pickup
export const emitNewAvailableOrder = (order) => {
  if (io) {
    io.to('delivery_room').emit('new_available_order', order);
  }
};

// Notify everyone when a rider accepts an order
export const emitOrderAccepted = (orderId, deliveryPerson) => {
  if (io) {
    io.to(orderId).emit('order_accepted', { orderId, deliveryPerson });
    io.to('delivery_room').emit('order_taken', { orderId });
    io.to('admin_room').emit('order_accepted', { orderId, deliveryPerson });
  }
};
