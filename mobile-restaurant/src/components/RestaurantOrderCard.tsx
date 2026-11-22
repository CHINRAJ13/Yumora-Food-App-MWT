import React from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RestaurantOrder } from '../types';

interface RestaurantOrderCardProps {
  order: RestaurantOrder;
  onUpdateStatus: (orderId: string, status: string) => Promise<any>;
  isProcessing: boolean;
}

export default function RestaurantOrderCard({
  order,
  onUpdateStatus,
  isProcessing,
}: RestaurantOrderCardProps) {
  const orderId = order._id || order.id;
  const shortId = orderId ? orderId.substring(orderId.length - 6).toUpperCase() : '';

  const formattedTime = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const getStatusBadge = () => {
    switch (order.status) {
      case 'Placed':
        return {
          label: 'NEW ORDER',
          bg: '#eff6ff',
          border: '#bfdbfe',
          text: '#1d4ed8',
          icon: 'sparkles' as const,
        };
      case 'Preparing':
        return {
          label: 'IN KITCHEN',
          bg: '#fff7ed',
          border: '#fed7aa',
          text: '#c2410c',
          icon: 'restaurant' as const,
        };
      case 'Ready for Pickup':
        return {
          label: 'READY FOR RIDER',
          bg: '#ecfdf5',
          border: '#a7f3d0',
          text: '#047857',
          icon: 'cube' as const,
        };
      case 'Out for Delivery':
        return {
          label: 'OUT FOR DELIVERY',
          bg: '#f5f3ff',
          border: '#ddd6fe',
          text: '#6d28d9',
          icon: 'bicycle' as const,
        };
      case 'Delivered':
        return {
          label: 'DELIVERED',
          bg: '#f0fdf4',
          border: '#bbf7d0',
          text: '#15803d',
          icon: 'checkmark-circle' as const,
        };
      case 'Cancelled':
        return {
          label: 'CANCELLED',
          bg: '#fef2f2',
          border: '#fecaca',
          text: '#b91c1c',
          icon: 'close-circle' as const,
        };
      default:
        return {
          label: order.status,
          bg: '#f3f4f6',
          border: '#e5e7eb',
          text: '#374151',
          icon: 'time' as const,
        };
    }
  };

  const badge = getStatusBadge();

  const handleCallCustomer = () => {
    if (order.phone) {
      Linking.openURL(`tel:${order.phone}`);
    } else {
      Alert.alert('No Phone', 'Customer phone number is not available.');
    }
  };

  const handleCallRider = () => {
    if (order.deliveryPersonPhone) {
      Linking.openURL(`tel:${order.deliveryPersonPhone}`);
    } else {
      Alert.alert('Rider Phone', 'Delivery partner has not shared phone number.');
    }
  };

  const handleCancelPrompt = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to reject/cancel this order? The customer will be refunded.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel Order',
          style: 'destructive',
          onPress: () => onUpdateStatus(orderId, 'Cancelled'),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.idGroup}>
          <Text style={styles.orderIdText}>#{shortId}</Text>
          <Text style={styles.timeText}>{formattedTime}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: badge.bg, borderColor: badge.border },
          ]}
        >
          <Ionicons name={badge.icon} size={12} color={badge.text} style={{ marginRight: 4 }} />
          <Text style={[styles.statusBadgeText, { color: badge.text }]}>
            {badge.label}
          </Text>
        </View>
      </View>

      {/* Bill & Payment Method Strip */}
      <View style={styles.billStrip}>
        <View>
          <Text style={styles.billLabel}>Order Total</Text>
          <Text style={styles.billAmount}>₹{order.totalAmount}</Text>
        </View>

        <View
          style={[
            styles.paymentPill,
            order.paymentMethod === 'cod' ? styles.codPill : styles.prepaidPill,
          ]}
        >
          <Text
            style={[
              styles.paymentPillText,
              order.paymentMethod === 'cod' ? styles.codText : styles.prepaidText,
            ]}
          >
            {order.paymentMethod === 'cod' ? 'CASH ON DELIVERY' : 'ONLINE PREPAID'}
          </Text>
        </View>
      </View>

      {/* Items List */}
      <View style={styles.itemsBox}>
        {(order.items || []).map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <View
                style={[
                  styles.vegDot,
                  { backgroundColor: item.isVeg ? '#10b981' : '#ef4444' },
                ]}
              />
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>×{item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
          </View>
        ))}
      </View>

      {/* Customer & Address Details */}
      <View style={styles.customerRow}>
        <View style={styles.customerInfo}>
          <View style={styles.customerNameRow}>
            <Ionicons name="person-circle-outline" size={15} color="#64748b" />
            <Text style={styles.customerName}>
              {order.customerName || 'Customer'}
            </Text>
          </View>
          <Text style={styles.addressText} numberOfLines={1}>
            {order.address || 'Address provided'}
          </Text>
        </View>

        {order.phone && (
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleCallCustomer}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={14} color="#ea580c" />
          </TouchableOpacity>
        )}
      </View>

      {/* Rider Info Strip (if assigned) */}
      {order.deliveryPersonName && (
        <View style={styles.riderStrip}>
          <View style={styles.riderLeft}>
            <View style={styles.riderIcon}>
              <Ionicons name="bicycle" size={14} color="#7c3aed" />
            </View>
            <View>
              <Text style={styles.riderLabel}>Delivery Partner</Text>
              <Text style={styles.riderName}>{order.deliveryPersonName}</Text>
            </View>
          </View>

          {order.deliveryPersonPhone && (
            <TouchableOpacity
              style={styles.callRiderBtn}
              onPress={handleCallRider}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={12} color="#7c3aed" />
              <Text style={styles.callRiderText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Action Buttons State Machine */}
      <View style={styles.actionsContainer}>
        {order.status === 'Placed' && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={handleCancelPrompt}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => onUpdateStatus(orderId, 'Preparing')}
              disabled={isProcessing}
              activeOpacity={0.88}
            >
              <Ionicons name="restaurant" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.primaryActionBtnText}>Accept & Prepare</Text>
            </TouchableOpacity>
          </View>
        )}

        {order.status === 'Preparing' && (
          <TouchableOpacity
            style={[styles.primaryActionBtn, styles.readyBtn]}
            onPress={() => onUpdateStatus(orderId, 'Ready for Pickup')}
            disabled={isProcessing}
            activeOpacity={0.88}
          >
            <Ionicons name="cube" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.primaryActionBtnText}>Food Ready for Pickup 📦</Text>
          </TouchableOpacity>
        )}

        {order.status === 'Ready for Pickup' && (
          <View style={styles.infoBanner}>
            <Ionicons name="time" size={16} color="#059669" />
            <Text style={styles.infoBannerText}>
              Food packaged! Waiting for rider to arrive & confirm pickup.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  billStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  billLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  billAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  paymentPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  prepaidPill: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  codPill: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  paymentPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  prepaidText: {
    color: '#047857',
  },
  codText: {
    color: '#b45309',
  },
  itemsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vegDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
    marginRight: 6,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    marginLeft: 6,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 10,
  },
  customerInfo: {
    flex: 1,
    marginRight: 8,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
  },
  addressText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 1,
  },
  callButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  riderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#ede9fe',
    marginBottom: 10,
  },
  riderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riderIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6d28d9',
    textTransform: 'uppercase',
  },
  riderName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4c1d95',
  },
  callRiderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  callRiderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7c3aed',
  },
  actionsContainer: {
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
  },
  primaryActionBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  readyBtn: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  infoBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
    flex: 1,
  },
});
