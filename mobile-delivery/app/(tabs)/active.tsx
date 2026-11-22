import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTripStore } from '../../src/store/useActiveTripStore';
import { openTurnByTurnNavigation, dialPhoneNumber } from '../../src/utils/navigation';
import { useDeliveryAuthStore } from '../../src/store/useDeliveryAuthStore';

const COMPACT_STAGES = [
  { id: 'Assigned', label: 'Assigned', icon: 'receipt-outline' as const },
  { id: 'Kitchen', label: 'Kitchen', icon: 'flame-outline' as const },
  { id: 'On Way', label: 'On Way', icon: 'bicycle-outline' as const },
  { id: 'Delivered', label: 'Delivered', icon: 'checkmark-circle-outline' as const },
];

export default function ActiveTripScreen() {
  const isAuthenticated = useDeliveryAuthStore((s) => s.isAuthenticated);
  const activeOrder = useActiveTripStore((s) => s.activeOrder);
  const fetchActiveOrder = useActiveTripStore((s) => s.fetchActiveOrder);
  const confirmPickup = useActiveTripStore((s) => s.confirmPickup);
  const completeDelivery = useActiveTripStore((s) => s.completeDelivery);

  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveOrder();
    }
  }, [isAuthenticated, fetchActiveOrder]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActiveOrder();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <View className="w-20 h-20 rounded-full bg-orange-50 border border-orange-100 items-center justify-center mb-5 shadow-sm">
          <Ionicons name="lock-closed-outline" size={36} color="#ea580c" />
        </View>
        <Text className="text-xl font-black text-gray-900 mb-2 text-center">Authentication Required</Text>
        <Text className="text-xs text-gray-500 font-semibold text-center mb-6 leading-5 max-w-xs">
          Please sign in with your Yumora Partner account to access active trips.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.85}
          className="bg-primary px-7 py-3.5 rounded-2xl flex-row items-center shadow-md shadow-orange-500/25"
        >
          <Ionicons name="log-in-outline" size={18} color="#ffffff" />
          <Text className="text-white font-black text-sm ml-2">Go to Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!activeOrder) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <View className="w-24 h-24 rounded-full bg-orange-50 border border-orange-100 items-center justify-center mb-5 shadow-sm">
          <Ionicons name="bicycle-outline" size={44} color="#ea580c" />
        </View>
        <Text className="text-xl font-black text-gray-900 mb-2 text-center">No Active Trip</Text>
        <Text className="text-xs text-gray-500 font-semibold text-center mb-6 leading-5 max-w-xs">
          You are currently not assigned to an active delivery. Check your Order Radar to accept available orders in your area.
        </Text>
        <TouchableOpacity
          onPress={() => router.navigate('/(tabs)')}
          activeOpacity={0.85}
          className="bg-primary px-7 py-3.5 rounded-2xl flex-row items-center shadow-md shadow-orange-500/25"
        >
          <Ionicons name="radio" size={17} color="#ffffff" />
          <Text className="text-white font-black text-sm ml-2">Open Order Radar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const orderId = activeOrder._id || activeOrder.id;
  // Phase 1: Going to restaurant until picked up. Phase 2: Heading to customer.
  const isPickedUp = !!(activeOrder as any).pickedUpAt;
  const currentPhase = isPickedUp ? 'customer' : 'restaurant';

  const restaurantLat = activeOrder.restaurantLocation?.lat || 11.025;
  const restaurantLng = activeOrder.restaurantLocation?.lng || 76.965;
  const customerLat = activeOrder.location?.lat || 11.018;
  const customerLng = activeOrder.location?.lng || 76.958;

  const targetCoords = isPickedUp
    ? { lat: customerLat, lng: customerLng }
    : { lat: restaurantLat, lng: restaurantLng };

  const targetName = isPickedUp ? 'Customer Delivery' : activeOrder.restaurantName;

  // Determine stage progress (0: Assigned, 1: Kitchen, 2: On Way, 3: Delivered)
  const currentStageIdx = isPickedUp ? 2 : 1;
  const payout = activeOrder.deliveryFee || activeOrder.estimatedEarnings || 45;

  const handleNavigate = () => {
    const lat = isPickedUp ? customerLat : restaurantLat;
    const lng = isPickedUp ? customerLng : restaurantLng;
    openTurnByTurnNavigation(lat, lng, targetName);
  };

  const handleCall = () => {
    const phone = isPickedUp ? activeOrder.phone : activeOrder.restaurantPhone || '9876543210';
    dialPhoneNumber(phone);
  };

  const handleConfirmPickup = () => {
    if (actionLoading || !orderId) return;

    Alert.alert(
      'Confirm Food Pickup',
      'Have you verified all meal items and package seals with the restaurant kitchen?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Food Picked Up',
          onPress: async () => {
            if (actionLoading) return;

            setActionLoading(true);

            try {
              const res = await confirmPickup(orderId);

              if (!res.success) {
                Alert.alert(
                  'Pickup Error',
                  res.message || 'Could not confirm pickup. Please try again.'
                );
              }
            } catch (error) {
              console.error('Confirm pickup error:', error);

              Alert.alert(
                'Pickup Error',
                'Something went wrong while confirming pickup. Please try again.'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCompleteDelivery = () => {
    if (actionLoading || !orderId) return;

    Alert.alert(
      'Complete Delivery',
      'Are you at the customer doorstep and ready to hand over the order package?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Delivered',
          onPress: async () => {
            if (actionLoading) return;

            setActionLoading(true);

            try {
              const res = await completeDelivery(orderId);

              if (!res.success) {
                Alert.alert(
                  'Delivery Error',
                  res.message || 'Could not complete delivery. Please try again.'
                );
                return;
              }

              Alert.alert(
                'Trip Completed! 🎉',
                `₹${payout} credited to your rider earnings.`,
                [
                  {
                    text: 'Back to Radar',
                    onPress: () => {
                      router.navigate('/(tabs)');
                    },
                  },
                ],
                { cancelable: false }
              );
            } catch (error) {
              console.error('Complete delivery error:', error);

              Alert.alert(
                'Delivery Error',
                'Something went wrong while completing delivery. Please check the order status before retrying.'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Top Header */}
      <View className="px-5 py-3.5 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <Text className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
              {isPickedUp ? 'Phase 2 • Delivering' : 'Phase 1 • Pickup Prep'}
            </Text>
          </View>
          <Text className="text-lg font-black text-gray-900 mt-0.5" numberOfLines={1}>
            Order #{orderId.slice(-6).toUpperCase()}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full shadow-sm">
            <Text className="text-primary font-black text-xs">+₹{payout} Payout</Text>
          </View>

          <TouchableOpacity
            onPress={onRefresh}
            disabled={refreshing}
            className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 items-center justify-center shadow-sm"
            activeOpacity={0.7}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#ea580c" />
            ) : (
              <Ionicons name="refresh" size={17} color="#475569" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ea580c"
            colors={['#ea580c']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Compact 4-Stage Horizontal Progress Tracker (Matches Customer App) */}
        <View className="bg-orange-50 border border-orange-200 rounded-3xl p-5 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-black text-orange-950 uppercase tracking-wide">
              {isPickedUp ? 'Rider On The Way To Customer' : 'Collecting Meal at Restaurant'}
            </Text>
            <View className="bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200">
              <Text className="text-[10px] font-black text-orange-800 uppercase">
                {isPickedUp ? 'En Route' : 'Pickup'}
              </Text>
            </View>
          </View>

          <Text className="text-lg font-black text-gray-900 mb-3">
            {isPickedUp
              ? `Deliver to ${activeOrder.address}`
              : `Pick up from ${activeOrder.restaurantName}`}
          </Text>

          {/* 4-Stage Tracker Bar */}
          <View className="pt-3 border-t border-orange-200">
            <View className="flex-row items-center justify-between">
              {COMPACT_STAGES.map((stg, idx) => {
                const isDone = currentStageIdx >= idx;
                const isCurrent = currentStageIdx === idx;
                return (
                  <React.Fragment key={stg.id}>
                    <View className="items-center">
                      <View
                        className="w-7 h-7 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: isCurrent ? '#ea580c' : isDone ? '#059669' : '#e5e7eb',
                          ...(isCurrent ? { elevation: 2 } : {}),
                        }}
                      >
                        <Ionicons
                          name={isDone && !isCurrent ? 'checkmark' : stg.icon}
                          size={13}
                          color={isDone || isCurrent ? '#ffffff' : '#6b7280'}
                        />
                      </View>
                      <Text
                        className="text-[9px] mt-1 font-bold"
                        style={{
                          color: isCurrent ? '#ea580c' : isDone ? '#047857' : '#9ca3af',
                          fontWeight: isCurrent ? '900' : '700',
                        }}
                      >
                        {stg.label}
                      </Text>
                    </View>
                    {idx < COMPACT_STAGES.length - 1 && (
                      <View
                        className="flex-1 h-0.5 mx-1 mb-3.5"
                        style={{
                          backgroundColor: currentStageIdx > idx ? '#10b981' : '#e5e7eb',
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        </View>

        {/* Active Waypoint & Navigation Hub Card */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4">
          {/* Live GPS Broadcasting Status */}
          <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-50">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <Text className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
                Live GPS Active
              </Text>
            </View>
            <View className="bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <Text className="text-[10px] font-black text-emerald-700 uppercase">
                Broadcasting Location
              </Text>
            </View>
          </View>

          {/* Waypoint details */}
          <View className="flex-row items-center mb-3">
            <View
              className="w-11 h-11 rounded-2xl items-center justify-center mr-3 border"
              style={{
                backgroundColor: isPickedUp ? '#ecfdf5' : '#fff7ed',
                borderColor: isPickedUp ? '#d1fae5' : '#ffedd5',
              }}
            >
              <Ionicons
                name={isPickedUp ? 'home' : 'restaurant'}
                size={22}
                color={isPickedUp ? '#10b981' : '#ea580c'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 text-[10px] font-black uppercase tracking-wider">
                {isPickedUp ? 'Deliver To Customer' : 'Collect From Kitchen'}
              </Text>
              <Text className="text-gray-900 font-black text-base mt-0.5" numberOfLines={1}>
                {isPickedUp ? activeOrder.phone : activeOrder.restaurantName}
              </Text>
            </View>
          </View>

          <View className="bg-slate-50 rounded-2xl p-3.5 border border-gray-100 mb-4">
            <View className="flex-row items-start gap-2">
              <Ionicons name="location-sharp" size={16} color="#ea580c" style={{ marginTop: 2 }} />
              <Text className="text-gray-700 text-xs font-semibold leading-5 flex-1">
                {isPickedUp
                  ? activeOrder.address
                  : activeOrder.restaurantAddress || 'Main Road, Commercial Plaza, Coimbatore'}
              </Text>
            </View>
          </View>

          {/* 1-Tap Google Navigation & Direct Call Buttons */}
          <View className="flex-row items-center gap-3 mb-3">
            <TouchableOpacity
              onPress={handleNavigate}
              activeOpacity={0.85}
              style={{ elevation: 2 }}
              className="flex-1 bg-blue-600 rounded-2xl py-3.5 items-center justify-center flex-row"
            >
              <Ionicons name="navigate" size={17} color="#ffffff" />
              <Text className="text-white font-black text-xs uppercase tracking-wider ml-1.5">
                Google Maps
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCall}
              activeOpacity={0.85}
              style={{ elevation: 2 }}
              className="flex-1 bg-emerald-600 rounded-2xl py-3.5 items-center justify-center flex-row"
            >
              <Ionicons name="call" size={17} color="#ffffff" />
              <Text className="text-white font-black text-xs uppercase tracking-wider ml-1.5">
                Call {isPickedUp ? 'Customer' : 'Kitchen'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Payment & Order Value Pill */}
          <View className="flex-row items-center justify-between bg-gray-50 rounded-2xl px-3.5 py-2.5 border border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="cash-outline" size={16} color="#64748b" />
              <Text className="text-gray-700 text-xs font-black ml-2">
                Order Value: ₹{activeOrder.totalAmount}
              </Text>
            </View>
            <View className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <Text className="text-emerald-700 text-[10px] font-black uppercase">
                Paid Online
              </Text>
            </View>
          </View>
        </View>

        {/* Food Items Checklist Card */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-5">
          <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-gray-50">
            <Text className="text-gray-900 font-black text-sm">
              Items Checklist ({activeOrder.items?.length || 0})
            </Text>
            <Text className="text-[11px] font-bold text-gray-400">Verify packages</Text>
          </View>

          {(activeOrder.items || []).map((item, index) => (
            <View
              key={item.id || item._id || index}
              className="flex-row items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200 mr-2.5">
                  <Text className="text-primary font-black text-xs">{item.quantity}x</Text>
                </View>
                <Text className="text-gray-800 text-xs font-bold flex-1" numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
              <Text className="text-gray-900 text-xs font-black">₹{item.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Primary Milestone Action Button */}
        <View className="mb-4">
          {!isPickedUp ? (
            <TouchableOpacity
              onPress={handleConfirmPickup}
              disabled={actionLoading}
              activeOpacity={0.88}
              style={{ elevation: 4 }}
              className="w-full bg-primary rounded-2xl py-4 items-center justify-center flex-row"
            >
              {actionLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="bag-check" size={20} color="#ffffff" />
                  <Text className="text-white text-sm font-black uppercase tracking-wider ml-2">
                    Confirm Food Picked Up
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleCompleteDelivery}
              disabled={actionLoading}
              activeOpacity={0.88}
              style={{ elevation: 4 }}
              className="w-full bg-emerald-600 rounded-2xl py-4 items-center justify-center flex-row"
            >
              {actionLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                  <Text className="text-white text-sm font-black uppercase tracking-wider ml-2">
                    Complete Delivery • Earn ₹{payout}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
