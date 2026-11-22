import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurantOrdersStore } from '../store/useRestaurantOrdersStore';

export default function NewOrderAlertModal() {
  const incomingAlertOrder = useRestaurantOrdersStore((s) => s.incomingAlertOrder);
  const dismissAlertOrder = useRestaurantOrdersStore((s) => s.dismissAlertOrder);
  const updateOrderStatus = useRestaurantOrdersStore((s) => s.updateOrderStatus);

  if (!incomingAlertOrder) return null;

  const orderId = incomingAlertOrder._id || incomingAlertOrder.id;
  const shortId = orderId ? orderId.substring(orderId.length - 6).toUpperCase() : '';

  const handleAccept = async () => {
    dismissAlertOrder();
    await updateOrderStatus(orderId, 'Preparing');
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={dismissAlertOrder}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Bell Icon */}
          <View style={styles.bellBadge}>
            <Ionicons name="notifications" size={32} color="#ea580c" />
          </View>

          <Text style={styles.title}>🔔 New Food Order Received!</Text>
          <Text style={styles.orderNumber}>Order #{shortId}</Text>

          {/* Details Box */}
          <View style={styles.detailsBox}>
            <View style={styles.row}>
              <Text style={styles.label}>Total Bill:</Text>
              <Text style={styles.amount}>₹{incomingAlertOrder.totalAmount}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Payment:</Text>
              <Text style={styles.paymentMethod}>
                {incomingAlertOrder.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Prepaid (Online)'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Items:</Text>
              <Text style={styles.itemsCount}>{(incomingAlertOrder.items || []).length} items</Text>
            </View>
          </View>

          {/* Items snippet */}
          <View style={styles.itemsSnippet}>
            {(incomingAlertOrder.items || []).slice(0, 3).map((item, idx) => (
              <Text key={idx} style={styles.itemText} numberOfLines={1}>
                {item.isVeg ? '🟢' : '🔴'} {item.name} ×{item.quantity}
              </Text>
            ))}
            {(incomingAlertOrder.items || []).length > 3 && (
              <Text style={styles.moreItemsText}>
                +{(incomingAlertOrder.items || []).length - 3} more items
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={dismissAlertOrder}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Ionicons name="restaurant" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.acceptButtonText}>Accept & Prepare</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  bellBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff7ed',
    borderWidth: 2,
    borderColor: '#ffedd5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ea580c',
    marginTop: 2,
    marginBottom: 16,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  amount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  paymentMethod: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
  },
  itemsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  itemsSnippet: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  itemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    marginVertical: 2,
  },
  moreItemsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6b7280',
  },
  acceptButton: {
    flex: 1.6,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
});
