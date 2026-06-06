import { Server } from 'socket.io';
import { calculateDistanceAndETA } from './controllers/locationController.js';

let io;

// In-memory store for active tracking sessions
// Structure: { [orderId]: { driver: { lat, lng, socketId }, customer: { lat, lng, socketId } } }
const trackingSessions = {};

export const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:8080",
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // ─── Existing Order Status Rooms ───
    socket.on('join_order', (orderId) => {
      console.log(`Client ${socket.id} joined order room: ${orderId}`);
      socket.join(orderId);
    });

    socket.on('join_admin', () => {
      console.log(`Client ${socket.id} joined admin room`);
      socket.join('admin_room');
    });

    socket.on('join_delivery', () => {
      console.log(`Client ${socket.id} joined delivery room`);
      socket.join('delivery_room');
    });

    socket.on('join_restaurant', (restaurantId) => {
      console.log(`Client ${socket.id} joined restaurant room: ${restaurantId}`);
      socket.join(`restaurant_${restaurantId}`);
    });

    // ─── Live Location Tracking ───

    /**
     * Join a tracking room for a specific order.
     * Both driver and customer call this after pickup.
     * data: { orderId, role: 'driver' | 'customer' }
     */
    socket.on('join-tracking', ({ orderId, role }) => {
      const room = `tracking_${orderId}`;
      socket.join(room);
      socket.trackingOrderId = orderId;
      socket.trackingRole = role;

      if (!trackingSessions[orderId]) {
        trackingSessions[orderId] = {};
      }

      console.log(`[Tracking] ${role} ${socket.id} joined room ${room}`);
    });

    /**
     * Driver emits this continuously via watchPosition.
     * data: { lat, lng, orderId }
     */
    socket.on('location-update', async (data) => {
      const { lat, lng, orderId } = data;
      if (!orderId || !trackingSessions[orderId]) return;

      // Store driver location
      trackingSessions[orderId].driver = { lat, lng, socketId: socket.id };

      const session = trackingSessions[orderId];

      // Calculate distance/ETA if customer location is known
      let distance = null;
      let eta = null;

      if (session.customer?.lat && session.driver?.lat) {
        try {
          const result = await calculateDistanceAndETA(
            { lat: session.driver.lat, lng: session.driver.lng },
            { lat: session.customer.lat, lng: session.customer.lng }
          );
          distance = result.distance;
          eta = result.duration;
        } catch (err) {
          console.error('[Tracking] ETA calculation failed:', err.message);
        }
      }

      // Broadcast to everyone in the tracking room
      io.to(`tracking_${orderId}`).emit('location-updated', {
        lat,
        lng,
        distance,
        eta,
        orderId
      });
    });

    /**
     * Customer sends their static location once when joining tracking.
     * data: { lat, lng, orderId }
     */
    socket.on('customer-location', (data) => {
      const { lat, lng, orderId } = data;
      if (!orderId || !trackingSessions[orderId]) return;
      trackingSessions[orderId].customer = { lat, lng, socketId: socket.id };
      console.log(`[Tracking] Customer location set for order ${orderId}`);
    });

    // ─── Disconnect ───
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      // Cleanup tracking session if this was a tracked user
      if (socket.trackingOrderId) {
        const orderId = socket.trackingOrderId;
        const session = trackingSessions[orderId];
        if (session) {
          if (session.driver?.socketId === socket.id) {
            delete session.driver;
          }
          if (session.customer?.socketId === socket.id) {
            delete session.customer;
          }
          // Remove empty sessions
          if (!session.driver && !session.customer) {
            delete trackingSessions[orderId];
            console.log(`[Tracking] Cleaned up session for order ${orderId}`);
          }
        }
      }
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
    io.to('admin_room').emit('order_updated', { orderId, status, data });
    io.to('delivery_room').emit('order_status_changed', { orderId, status, data });
    if (data?.restaurantId) {
      io.to(`restaurant_${data.restaurantId}`).emit('restaurant_order_updated', { orderId, status, data });
    }
  }
};

export const emitNewOrder = (order) => {
  if (io) {
    io.to('admin_room').emit('new_order', order);
    if (order.restaurantId) {
      io.to(`restaurant_${order.restaurantId}`).emit('new_restaurant_order', order);
    }
  }
};

export const emitNewAvailableOrder = (order) => {
  if (io) {
    io.to('delivery_room').emit('new_available_order', order);
  }
};

export const emitOrderAccepted = (orderId, deliveryPerson) => {
  if (io) {
    io.to(orderId).emit('order_accepted', { orderId, deliveryPerson });
    io.to('delivery_room').emit('order_taken', { orderId });
    io.to('admin_room').emit('order_accepted', { orderId, deliveryPerson });
  }
};

/**
 * Emit tracking-started event when the driver picks up an order.
 * This tells the customer to show the live map.
 */
export const emitTrackingStarted = (orderId) => {
  if (io) {
    io.to(orderId).emit('tracking-started', { orderId });
  }
};

/**
 * Emit tracking-ended event and cleanup the session.
 * This tells the customer to hide the live map.
 */
export const emitTrackingEnded = (orderId) => {
  if (io) {
    io.to(orderId).emit('tracking-ended', { orderId });
    io.to(`tracking_${orderId}`).emit('tracking-ended', { orderId });
    // Cleanup tracking session
    if (trackingSessions[orderId]) {
      delete trackingSessions[orderId];
      console.log(`[Tracking] Session ended for order ${orderId}`);
    }
  }
};
