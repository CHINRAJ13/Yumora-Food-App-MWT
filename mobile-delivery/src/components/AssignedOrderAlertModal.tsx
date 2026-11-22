import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTripStore } from '../store/useActiveTripStore';

export default function AssignedOrderAlertModal() {
  const incomingAssignedAlert = useActiveTripStore((s) => s.incomingAssignedAlert);
  const dismissAssignedAlert = useActiveTripStore((s) => s.dismissAssignedAlert);

  if (!incomingAssignedAlert) return null;

  const orderId = incomingAssignedAlert._id || incomingAssignedAlert.id || '';
  const orderIdShort = orderId.slice(-6).toUpperCase();
  const restaurantName =
    incomingAssignedAlert.restaurantName || 'Restaurant Partner';
  const customerAddress =
    incomingAssignedAlert.address || 'Customer Delivery Address';
  const payout =
    incomingAssignedAlert.estimatedEarnings ||
    incomingAssignedAlert.deliveryFee ||
    45;

  const handleViewTrip = () => {
    dismissAssignedAlert();
    router.navigate('/(tabs)/active');
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={!!incomingAssignedAlert}
      onRequestClose={dismissAssignedAlert}
    >
      <View className="flex-1 bg-black/70 justify-center items-center px-5">
        <View className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-2 border-orange-500 items-center">
          {/* Animated Alarm Icon Badge */}
          <View className="w-16 h-16 rounded-full bg-orange-100 items-center justify-center mb-3">
            <Ionicons name="notifications-outline" size={32} color="#ea580c" />
          </View>

          <Text className="text-xl font-black text-gray-950 text-center tracking-tight">
            NEW ORDER ASSIGNED!
          </Text>
          <Text className="text-xs font-semibold text-orange-600 uppercase tracking-widest mt-0.5 mb-4">
            Order #{orderIdShort} • Ready for Pickup
          </Text>

          {/* Details Card */}
          <View className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-5">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="restaurant-outline" size={16} color="#4b5563" />
              <Text className="text-sm font-bold text-gray-900 flex-1" numberOfLines={1}>
                {restaurantName}
              </Text>
            </View>

            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text className="text-xs font-medium text-gray-600 flex-1" numberOfLines={1}>
                {customerAddress}
              </Text>
            </View>

            <View className="flex-row items-center justify-between pt-2 border-t border-gray-200">
              <Text className="text-xs font-semibold text-gray-500">Trip Earnings</Text>
              <Text className="text-base font-black text-emerald-600">₹{payout}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="w-full gap-2.5">
            <TouchableOpacity
              onPress={handleViewTrip}
              activeOpacity={0.88}
              className="w-full bg-orange-600 py-3.5 rounded-2xl items-center justify-center shadow-md shadow-orange-500/20"
            >
              <Text className="text-white font-bold text-base tracking-wide">
                View Active Trip
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={dismissAssignedAlert}
              activeOpacity={0.8}
              className="w-full py-2.5 rounded-2xl items-center justify-center"
            >
              <Text className="text-gray-500 font-semibold text-sm">
                Dismiss Sound
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
