import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurantAuthStore } from '../../src/store/useRestaurantAuthStore';
import { useRestaurantOrdersStore } from '../../src/store/useRestaurantOrdersStore';
import { getRestaurantStatsApi } from '../../src/api';
import { restaurantSocketService } from '../../src/services/socketService';
import RestaurantOrderCard from '../../src/components/RestaurantOrderCard';

type FilterType = 'all' | 'Placed' | 'Preparing' | 'Ready for Pickup';

export default function KitchenRadarScreen() {
  const restaurant = useRestaurantAuthStore((s) => s.restaurant);
  const isOnline = useRestaurantAuthStore((s) => s.isOnline);
  const toggleOnlineStatus = useRestaurantAuthStore((s) => s.toggleOnlineStatus);
  const isAuthenticated = useRestaurantAuthStore((s) => s.isAuthenticated);

  const activeOrders = useRestaurantOrdersStore((s) => s.activeOrders);
  const isLoading = useRestaurantOrdersStore((s) => s.isLoading);
  const isUpdatingStatus = useRestaurantOrdersStore((s) => s.isUpdatingStatus);
  const fetchActiveOrders = useRestaurantOrdersStore((s) => s.fetchActiveOrders);
  const updateOrderStatus = useRestaurantOrdersStore((s) => s.updateOrderStatus);

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    activeOrders: 0,
    rating: 4.8,
  });

  const loadStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res: any = await getRestaurantStatsApi();
      if (res?.data) {
        setStats({
          todayRevenue: res.data.todayRevenue || 0,
          todayOrders: res.data.todayOrders || 0,
          activeOrders: res.data.activeOrders || 0,
          rating: res.data.restaurant?.rating || 4.8,
        });
      }
    } catch {
      // quiet fallback
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchActiveOrders();
        loadStats();
      }
    }, [isAuthenticated, fetchActiveOrders, loadStats])
  );

  // Real-time socket events on Live Kitchen Radar
  useEffect(() => {
    const handleIncoming = () => {
      fetchActiveOrders();
      loadStats();
    };

    restaurantSocketService.onNewRestaurantOrder(handleIncoming);
    restaurantSocketService.onRestaurantOrderUpdated(handleIncoming);

    return () => {
      restaurantSocketService.offNewRestaurantOrder(handleIncoming);
      restaurantSocketService.offRestaurantOrderUpdated(handleIncoming);
    };
  }, [fetchActiveOrders, loadStats]);

  // Silent automatic 10-second sync while kitchen radar is open
  useEffect(() => {
    if (!isAuthenticated || !isOnline) return;

    const interval = setInterval(() => {
      fetchActiveOrders();
      loadStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isOnline, fetchActiveOrders, loadStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchActiveOrders(), loadStats()]);
    setRefreshing(false);
  };

  const handleToggleOnline = async (value: boolean) => {
    const success = await toggleOnlineStatus();
    if (!success) {
      Alert.alert('Status Error', 'Could not update online status. Please try again.');
    }
  };

  const filteredOrders = activeOrders.filter((order) => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Top Header */}
      <View className="px-5 py-3 border-b border-gray-100 flex-row items-center justify-between bg-white">
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-11 h-11 rounded-2xl bg-orange-50 items-center justify-center border border-orange-100">
            <Ionicons name="restaurant" size={20} color="#ea580c" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-gray-900 font-black text-base leading-tight" numberOfLines={1}>
              {restaurant?.name || 'Kitchen Dashboard'}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <View
                className="w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: isOnline ? '#10b981' : '#9ca3af' }}
              />
              <Text className="text-xs text-gray-500 font-semibold">
                {isOnline ? 'Online • Taking Orders' : 'Store Offline'}
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
            className="text-[10px] font-black mr-2 uppercase"
            style={{ color: isOnline ? '#047857' : '#6b7280' }}
          >
            {isOnline ? 'OPEN' : 'CLOSED'}
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
        className="flex-1 px-4 pt-4 bg-slate-50"
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
        {/* Quick Stats Bar */}
        <View className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm mb-4">
          <View className="flex-row justify-between items-center">
            <View className="items-center flex-1 border-r border-gray-100 px-1">
              <Text numberOfLines={1} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Live Orders
              </Text>
              <Text numberOfLines={1} className="text-xl font-black text-orange-600 mt-0.5">
                {activeOrders.length}
              </Text>
            </View>
            <View className="items-center flex-1 border-r border-gray-100 px-1">
              <Text numberOfLines={1} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Today's Earn
              </Text>
              <Text numberOfLines={1} className="text-xl font-black text-emerald-600 mt-0.5">
                ₹{stats.todayRevenue}
              </Text>
            </View>
            <View className="items-center flex-1 px-1">
              <Text numberOfLines={1} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Store Rating
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Ionicons name="star" size={15} color="#f59e0b" />
                <Text numberOfLines={1} className="text-xl font-black text-gray-900 ml-1">
                  {stats.rating}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Filter Chips Bar */}
        <View className="flex-row mb-4 gap-2">
          {(
            [
              { key: 'all', label: 'All Orders' },
              { key: 'Placed', label: 'New' },
              { key: 'Preparing', label: 'In Kitchen' },
              { key: 'Ready for Pickup', label: 'Ready' },
            ] as const
          ).map((item) => {
            const isSelected = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setFilter(item.key)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: isSelected ? '#ea580c' : '#ffffff',
                  borderColor: isSelected ? '#ea580c' : '#e2e8f0',
                }}
                className="px-3.5 py-2 rounded-xl border items-center justify-center shadow-xs"
              >
                <Text
                  style={{ color: isSelected ? '#ffffff' : '#64748b' }}
                  className="text-xs font-bold"
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Orders List */}
        {isLoading && !refreshing && (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#ea580c" />
            <Text className="text-gray-400 text-xs font-bold mt-3">Loading kitchen orders...</Text>
          </View>
        )}

        {!isLoading && filteredOrders.length === 0 && (
          <View className="bg-white rounded-3xl p-8 items-center border border-gray-100 shadow-sm my-6">
            <View className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 items-center justify-center mb-3">
              <Ionicons name="restaurant-outline" size={28} color="#ea580c" />
            </View>
            <Text className="text-base font-black text-gray-900">Kitchen is All Caught Up!</Text>
            <Text className="text-xs text-gray-500 font-semibold text-center mt-1.5 leading-5 max-w-xs">
              {isOnline
                ? 'Your kitchen is open and ready. New food orders placed by customers will ring here in real time.'
                : 'Your store is currently offline. Toggle Open above to start receiving customer orders.'}
            </Text>
          </View>
        )}

        {!isLoading &&
          filteredOrders.map((order) => (
            <RestaurantOrderCard
              key={order._id || order.id}
              order={order}
              onUpdateStatus={updateOrderStatus}
              isProcessing={isUpdatingStatus}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
