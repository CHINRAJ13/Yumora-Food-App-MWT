import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDeliveryAuthStore } from '../../src/store/useDeliveryAuthStore';
import { useActiveTripStore } from '../../src/store/useActiveTripStore';
import { getDeliveryStatsApi } from '../../src/api';
import { deliverySocketService } from '../../src/services/socketService';
import { soundService } from '../../src/services/soundService';
import { DeliveryOrder } from '../../src/types';

export default function RiderRadarScreen() {
  const { user, isOnline, setOnlineStatus, isAuthenticated } = useDeliveryAuthStore();
  const availableOrders = useActiveTripStore((s) => s.availableOrders);
  const activeOrder = useActiveTripStore((s) => s.activeOrder);
  const isLoading = useActiveTripStore((s) => s.isLoading);
  const isAccepting = useActiveTripStore((s) => s.isAccepting);
  const fetchAvailableOrders = useActiveTripStore((s) => s.fetchAvailableOrders);
  const fetchActiveOrder = useActiveTripStore((s) => s.fetchActiveOrder);
  const acceptOrder = useActiveTripStore((s) => s.acceptOrder);
  const addAvailableOrder = useActiveTripStore((s) => s.addAvailableOrder);
  const removeAvailableOrder = useActiveTripStore((s) => s.removeAvailableOrder);

  const [refreshing, setRefreshing] = useState(false);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    totalEarnings: 0,
    todayDeliveries: 0,
    totalDeliveries: 0,
    balance: 0,
    rating: 4.9,
  });

  const loadStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res: any = await getDeliveryStatsApi();
      if (res?.data) {
        setStats({
          todayEarnings: res.data.todayEarnings || 0,
          totalEarnings: res.data.totalEarnings || 0,
          todayDeliveries: res.data.todayDeliveries || 0,
          totalDeliveries: res.data.totalDeliveries || 0,
          balance: res.data.balance || 0,
          rating: user?.deliveryDetails?.rating || 4.9,
        });
      }
    } catch {
      // quiet fallback
    }
  }, [user, isAuthenticated]);

  // Re-fetch stats and active order whenever the rider views the Radar/Dashboard screen
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadStats();
        fetchActiveOrder();
        if (isOnline) {
          fetchAvailableOrders();
        }
      }
    }, [isAuthenticated, isOnline, loadStats, fetchActiveOrder, fetchAvailableOrders])
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchActiveOrder();
    loadStats();
    if (isOnline) {
      fetchAvailableOrders();
    }
  }, [isAuthenticated, isOnline, fetchActiveOrder, fetchAvailableOrders, loadStats]);

  // Real-time socket order events
  useEffect(() => {
    deliverySocketService.onNewAvailableOrder((newOrder: DeliveryOrder) => {
      addAvailableOrder(newOrder);
      // Play alert chime and vibrate when a new order appears on the radar
      soundService.playOrderAlert({ loop: false, vibrate: true });
    });

    deliverySocketService.onOrderTaken((data: { orderId: string }) => {
      removeAvailableOrder(data.orderId);
    });

    return () => {
      deliverySocketService.offDeliveryEvents();
    };
  }, [addAvailableOrder, removeAvailableOrder]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchActiveOrder(),
      fetchAvailableOrders(),
      loadStats(),
    ]);
    setRefreshing(false);
  };

  const handleToggleOnline = async (value: boolean) => {
    const success = await setOnlineStatus(value);
    if (!success) {
      Alert.alert('Status Error', 'Could not update duty status. Please try again.');
    } else if (value) {
      fetchAvailableOrders();
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (activeOrder) {
      Alert.alert(
        'Active Delivery in Progress',
        'Please complete your current delivery before accepting another order.'
      );
      return;
    }

    try {
      setAcceptingOrderId(orderId);
      soundService.stopAlert();
      const res = await acceptOrder(orderId);
      if (res.success) {
        router.navigate('/(tabs)/active');
      } else {
        Alert.alert('Order Alert', res.message || 'Unable to accept this order.');
        fetchAvailableOrders();
      }
    } finally {
      setAcceptingOrderId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <View className="w-20 h-20 rounded-full bg-orange-50 border border-orange-100 items-center justify-center mb-5 shadow-sm">
          <Ionicons name="lock-closed-outline" size={36} color="#ea580c" />
        </View>
        <Text className="text-xl font-black text-gray-900 mb-2 text-center">Authentication Required</Text>
        <Text className="text-xs text-gray-500 font-semibold text-center mb-6 leading-5 max-w-xs">
          Please sign in with your Yumora Partner account to access the Order Radar.
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

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Top Header */}
      <View className="px-5 py-3 border-b border-gray-100 flex-row items-center justify-between bg-white">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-full bg-orange-50 items-center justify-center border border-orange-100">
            <Ionicons name="bicycle" size={22} color="#ea580c" />
          </View>
          <View className="ml-3">
            <Text className="text-gray-900 font-black text-base leading-tight">
              {user?.name || 'Partner Rider'}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <View
                className="w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: isOnline ? '#10b981' : '#9ca3af' }}
              />
              <Text className="text-xs text-gray-500 font-semibold">
                {isOnline ? 'Online • Ready for orders' : 'Offline • Duty off'}
              </Text>
            </View>
          </View>
        </View>

        {/* Online Toggle Switch Pill */}
        <View
          className="flex-row items-center px-3 py-1.5 rounded-full border"
          style={{
            backgroundColor: isOnline ? '#ecfdf5' : '#f3f4f6',
            borderColor: isOnline ? '#a7f3d0' : '#e5e7eb',
          }}
        >
          <Text
            className="text-xs font-black mr-2 uppercase"
            style={{ color: isOnline ? '#047857' : '#6b7280' }}
          >
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: '#d1d5db', true: '#a7f3d0' }}
            thumbColor={isOnline ? '#059669' : '#9ca3af'}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4 bg-slate-50"
        contentContainerStyle={{ paddingBottom: 110 }}
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
        {/* Active Order Ongoing Alert Pill */}
        {activeOrder && (
          <TouchableOpacity
            onPress={() => router.navigate('/(tabs)/active')}
            activeOpacity={0.88}
            className="bg-orange-50 border border-orange-200 rounded-3xl p-4 mb-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-2xl bg-primary items-center justify-center mr-3 shadow-sm">
                <Ionicons name="navigate" size={18} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-primary font-black text-[11px] uppercase tracking-wider">
                  Active Delivery In Progress
                </Text>
                <Text className="text-gray-900 font-black text-sm" numberOfLines={1}>
                  {activeOrder.restaurantName} ➔ {activeOrder.address}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ea580c" />
          </TouchableOpacity>
        )}

        {/* Today's Stats Bar Card */}
        <View className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm mb-4">
          <View className="flex-row justify-between items-center">
            <View className="items-center flex-1 border-r border-gray-100 px-1">
              <Text numberOfLines={1} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Today's Earn
              </Text>
              <Text numberOfLines={1} className="text-xl font-black text-gray-900 mt-0.5">
                ₹{stats.todayEarnings}
              </Text>
            </View>
            <View className="items-center flex-1 border-r border-gray-100 px-1">
              <Text numberOfLines={1} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Today's Trips
              </Text>
              <Text numberOfLines={1} className="text-xl font-black text-gray-900 mt-0.5">
                {stats.todayDeliveries}
              </Text>
            </View>
            <View className="items-center flex-1 px-1">
              <Text numberOfLines={1} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Rating
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Ionicons name="star" size={15} color="#f59e0b" />
                <Text numberOfLines={1} className="text-xl font-black text-gray-900 ml-1">
                  {stats.rating}
                </Text>
              </View>
            </View>
          </View>

          {/* Wallet Balance & Lifetime Summary */}
          <TouchableOpacity
            onPress={() => router.push('/wallet')}
            activeOpacity={0.8}
            className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100 px-1 bg-orange-50/50 -mx-4 -mb-4 p-3 rounded-b-3xl"
          >
            <View className="flex-row items-center">
              <View className="w-7 h-7 rounded-xl bg-orange-100 items-center justify-center mr-2">
                <Ionicons name="wallet" size={15} color="#ea580c" />
              </View>
              <View>
                <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Available Wallet</Text>
                <Text className="text-sm font-black text-gray-900">₹{stats.balance}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-orange-200 shadow-sm">
              <Text className="text-[11px] font-black text-primary">Withdraw</Text>
              <Ionicons name="chevron-forward" size={12} color="#ea580c" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Radar Section Title */}
        <View className="flex-row items-center justify-between mb-3 pt-1">
          <View className="flex-row items-center">
            <View className="w-2.5 h-2.5 rounded-full bg-primary mr-2" />
            <Text className="text-base font-black text-gray-900">
              Available Orders ({availableOrders.length})
            </Text>
          </View>
          {isOnline && (
            <TouchableOpacity onPress={onRefresh} className="p-1 flex-row items-center">
              <Ionicons name="refresh" size={14} color="#ea580c" />
              <Text className="text-xs font-black text-primary ml-1">Refresh</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Offline Banner */}
        {!isOnline && (
          <View className="bg-white rounded-3xl p-8 items-center border border-gray-100 shadow-sm my-4">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
              <Ionicons name="power" size={28} color="#6b7280" />
            </View>
            <View className="flex-row items-center justify-center gap-1.5 mb-1">
              <View className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <Text className="text-lg font-bold text-gray-900">
                You are Offline
              </Text>
            </View>
            <Text className="text-xs text-gray-500 font-semibold text-center mt-1 mb-5 leading-5 max-w-xs">
              Switch your duty toggle to ONLINE to receive order alerts and start earning.
            </Text>
            <TouchableOpacity
              onPress={() => handleToggleOnline(true)}
              activeOpacity={0.85}
              className="bg-emerald-600 px-6 py-3.5 rounded-2xl flex-row items-center shadow-md shadow-emerald-600/20"
            >
              <Ionicons name="flash" size={16} color="#ffffff" />
              <Text className="text-white font-bold text-sm ml-1.5">Go Online Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Spinner */}
        {isOnline && isLoading && availableOrders.length === 0 && (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#ea580c" />
            <Text className="text-gray-500 text-xs font-bold mt-3">Scanning nearby orders...</Text>
          </View>
        )}

        {/* Empty State */}
        {isOnline && !isLoading && availableOrders.length === 0 && (
          <View className="bg-white rounded-3xl p-8 items-center border border-gray-100 shadow-sm my-4">
            <View className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 items-center justify-center mb-3">
              <Ionicons name="radio-outline" size={30} color="#ea580c" />
            </View>
            <Text className="text-base font-bold text-gray-900 text-center w-full">
              Radar is Scanning
            </Text>
            <Text className="text-xs text-gray-500 font-semibold text-center mt-1 leading-5 max-w-xs">
              No orders waiting right now. Keep app open, you will receive an alert as soon as an order is ready!
            </Text>
          </View>
        )}

        {/* Available Orders List */}
        {isOnline &&
          availableOrders.map((order) => {
            const orderId = order._id || order.id;
            const itemsCount = (order.items || []).reduce(
              (acc, i) => acc + (i.quantity || 1),
              0
            );
            const payout = order.deliveryFee || order.estimatedEarnings || 45;

            return (
              <View
                key={orderId}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-4"
              >
                {/* Header: Restaurant & Payout */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 items-center justify-center mr-2.5">
                      <Ionicons name="restaurant" size={18} color="#ea580c" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-black text-base" numberOfLines={1}>
                        {order.restaurantName}
                      </Text>
                      <Text className="text-gray-500 text-xs font-semibold mt-0.5" numberOfLines={1}>
                        {order.restaurantAddress || 'Commercial Kitchen'}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full items-center">
                    <Text className="text-emerald-700 font-black text-sm">
                      +₹{payout}
                    </Text>
                  </View>
                </View>

                {/* Drop-off route preview card */}
                <View className="bg-gray-50 rounded-2xl p-3 mb-4 border border-gray-100">
                  <View className="flex-row items-center mb-2">
                    <View className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-2" />
                    <Text className="text-xs text-gray-700 font-bold flex-1" numberOfLines={1}>
                      Pickup: {order.restaurantName}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
                    <Text className="text-xs text-gray-700 font-bold flex-1" numberOfLines={1}>
                      Drop: {order.address}
                    </Text>
                  </View>
                </View>

                {/* Order Meta Bar */}
                <View className="flex-row items-center justify-between py-2 border-t border-gray-100 mb-2.5">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="receipt-outline" size={14} color="#64748b" />
                    <Text className="text-xs text-gray-600 font-bold">
                      {itemsCount} {itemsCount === 1 ? 'item' : 'items'} • ₹{order.totalAmount}
                    </Text>
                  </View>
                  <View className="bg-gray-100 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      #{orderId.slice(-6).toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Prominent Full-Width Accept Button */}
                <TouchableOpacity
                  onPress={() => handleAcceptOrder(orderId)}
                  disabled={acceptingOrderId !== null}
                  activeOpacity={0.88}
                  className="w-full bg-primary py-3.5 px-4 rounded-2xl flex-row items-center justify-between shadow-md shadow-orange-500/25"
                >
                  {acceptingOrderId === orderId ? (
                    <View className="flex-row items-center justify-center w-full py-0.5">
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text className="text-white font-black text-sm ml-2">
                        Accepting Order...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                        <Text className="text-white font-black text-sm tracking-wide">
                          Accept Order
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1.5 bg-orange-700/40 px-2.5 py-1 rounded-xl">
                        <Text className="text-white font-black text-xs">+₹{payout}</Text>
                        <Ionicons name="arrow-forward" size={14} color="#ffffff" />
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}
