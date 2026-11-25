import { Server } from 'socket.io';
import { calculateDistanceAndETA } from './controllers/locationController.js';

let io;

// In-memory store for active tracking sessions
// Structure: { [orderId]: { driver: { lat, lng, socketId }, customer: { lat, lng, socketId } } }
const trackingSessions = {};

export const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow mobile clients (no origin), localhost, LAN IPs, or any origin in development
        callback(null, true);
      },
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

    socket.on('join_delivery', (partnerId) => {
      console.log(`Client ${socket.id} joined delivery room`);
      socket.join('delivery_room');
      if (partnerId) {
        const personalRoom = `delivery_${partnerId}`;
        socket.join(personalRoom);
        console.log(`Client ${socket.id} joined personal delivery room: ${personalRoom}`);
      }
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
      if (!orderId) return;
      const room = `tracking_${orderId}`;
      socket.join(room);
      socket.join(orderId);
      socket.trackingOrderId = orderId;
      socket.trackingRole = role;

      if (!trackingSessions[orderId]) {
        trackingSessions[orderId] = {};
      }

      console.log(`[Tracking] ${role} ${socket.id} joined room ${room}`);

      // If customer joins and driver location is already known, immediately emit it to this customer
      if (role === 'customer' && trackingSessions[orderId]?.driver?.lat) {
        socket.emit('location-updated', {
          lat: trackingSessions[orderId].driver.lat,
          lng: trackingSessions[orderId].driver.lng,
          distance: trackingSessions[orderId].lastDistance || null,
          eta: trackingSessions[orderId].lastEta || null,
          orderId
        });
      }
    });

    /**
     * Driver emits this continuously via watchPosition.
     * data: { lat, lng, orderId }
     */
    socket.on('location-update', async (data) => {
      const { lat, lng, orderId } = data;
      if (!orderId) return;

      if (!trackingSessions[orderId]) {
        trackingSessions[orderId] = {};
      }

      socket.join(`tracking_${orderId}`);

      // Store driver location
      trackingSessions[orderId].driver = { lat, lng, socketId: socket.id };

      const session = trackingSessions[orderId];

      // Calculate distance/ETA if customer location is known
      let distance = session.lastDistance || null;
      let eta = session.lastEta || null;

      if (session.customer?.lat && session.driver?.lat) {
        try {
          const result = await calculateDistanceAndETA(
            { lat: session.driver.lat, lng: session.driver.lng },
            { lat: session.customer.lat, lng: session.customer.lng }
          );
          if (result && result.distance !== 'N/A') {
            distance = result.distance;
            eta = result.duration;
            session.lastDistance = distance;
            session.lastEta = eta;
          }
        } catch (err) {
          console.error('[Tracking] ETA calculation failed:', err.message);
        }
      }

      // Broadcast to both tracking and order rooms
      const payload = {
        lat,
        lng,
        distance,
        eta,
        orderId
      };

      io.to(`tracking_${orderId}`).emit('location-updated', payload);
      io.to(orderId).emit('location-updated', payload);
    });

    /**
     * Customer sends their static location once when joining tracking.
     * data: { lat, lng, orderId }
     */
    socket.on('customer-location', async (data) => {
      const { lat, lng, orderId } = data;
      if (!orderId) return;

      if (!trackingSessions[orderId]) {
        trackingSessions[orderId] = {};
      }

      trackingSessions[orderId].customer = { lat, lng, socketId: socket.id };
      console.log(`[Tracking] Customer location set for order ${orderId}`);

      // If driver position is already known, immediately calculate & emit ETA/distance
      const session = trackingSessions[orderId];
      if (session.driver?.lat && session.driver?.lng) {
        try {
          const result = await calculateDistanceAndETA(
            { lat: session.driver.lat, lng: session.driver.lng },
            { lat, lng }
          );
          if (result && result.distance !== 'N/A') {
            session.lastDistance = result.distance;
            session.lastEta = result.duration;

            const payload = {
              lat: session.driver.lat,
              lng: session.driver.lng,
              distance: result.distance,
              eta: result.duration,
              orderId
            };

            io.to(`tracking_${orderId}`).emit('location-updated', payload);
            io.to(orderId).emit('location-updated', payload);
          }
        } catch (err) {
          console.error('[Tracking] Immediate ETA calculation failed:', err.message);
        }
      }
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
      console.log(`[Socket] 🔔 Emitting new_restaurant_order to room: restaurant_${order.restaurantId} (Order #${order._id})`);
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

export const emitOrderAssignedToDriver = (deliveryPersonId, order) => {
  if (io) {
    if (deliveryPersonId) {
      io.to(`delivery_${deliveryPersonId}`).emit('order_assigned', order);
    }
    // Also broadcast to delivery_room with target driver ID for synced tracking
    io.to('delivery_room').emit('order_assigned', { deliveryPersonId, order });
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

/**
 * Emit order cancelled event across all rooms (customer, restaurant, delivery, admin)
 */
export const emitOrderCancelled = (orderId, order) => {
  if (io) {
    io.to(orderId).emit('order_cancelled', { orderId, order });
    io.to(orderId).emit('order_status_update', { status: 'Cancelled', data: order });
    io.to('admin_room').emit('order_cancelled', { orderId, order });
    io.to('delivery_room').emit('order_cancelled', { orderId, order });
    if (order?.restaurantId) {
      io.to(`restaurant_${order.restaurantId}`).emit('restaurant_order_updated', {
        orderId,
        status: 'Cancelled',
        data: order
      });
    }
  }
};

