import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRestaurantStatsApi } from '../../src/api';
import { useRestaurantAuthStore } from '../../src/store/useRestaurantAuthStore';
import { RestaurantStats } from '../../src/types';

export default function RevenueScreen() {
  const router = useRouter();
  const isAuthenticated = useRestaurantAuthStore((s) => s.isAuthenticated);
  const isOnline = useRestaurantAuthStore((s) => s.isOnline);
  const restaurant = useRestaurantAuthStore((s) => s.restaurant);

  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res: any = await getRestaurantStatsApi();
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err: any) {
      console.error('[RevenueScreen] Fetch stats error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchStats();
      }
    }, [isAuthenticated, fetchStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  // Helper for 7-day revenue chart
  const dailyData = useMemo(() => {
    const list = stats?.dailyRevenue || [];
    if (list.length === 0) return [];
    const maxRev = Math.max(...list.map((d: any) => d.revenue || 0), 1);

    return list.map((item: any) => {
      const date = new Date(item._id);
      const dayLabel = isNaN(date.getTime())
        ? item._id
        : date.toLocaleDateString('en-US', { weekday: 'short' });
      const rev = item.revenue || 0;
      const heightPct = Math.min(100, Math.max(12, Math.round((rev / maxRev) * 100)));
      return {
        label: dayLabel,
        revenue: rev,
        orders: item.count || item.orders || 0,
        heightPct,
      };
    });
  }, [stats?.dailyRevenue]);

  // Max revenue across top items for relative progress bars
  const topItemsList = useMemo(() => {
    const items = stats?.topItems || [];
    const maxQty = Math.max(
      ...items.map((i: any) => i.totalQuantity || i.count || 1),
      1
    );
    return items.map((i: any) => ({
      name: i._id || i.name || 'Dish',
      quantity: i.totalQuantity || i.count || 0,
      revenue: i.totalRevenue || i.revenue || 0,
      pct: Math.min(100, Math.max(10, Math.round(((i.totalQuantity || i.count || 0) / maxQty) * 100))),
    }));
  }, [stats?.topItems]);

  const completionRate = useMemo(() => {
    if (!stats || !stats.totalOrders) return 100;
    const delivered = stats.deliveredOrders || 0;
    return Math.min(100, Math.round((delivered / stats.totalOrders) * 100));
  }, [stats]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Top Header */}
      <View className="px-5 py-3.5 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-black text-gray-900">Revenue & Insights</Text>
          <Text className="text-xs font-semibold text-gray-500 mt-0.5">
            Financial analytics & dish performance
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 9999,
            backgroundColor: isOnline ? '#ecfdf5' : '#f3f4f6',
            borderWidth: 1,
            borderColor: isOnline ? '#a7f3d0' : '#e5e7eb',
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isOnline ? '#10b981' : '#9ca3af',
              marginRight: 6,
            }}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: isOnline ? '#047857' : '#6b7280',
            }}
          >
            {isOnline ? 'Store Open' : 'Store Closed'}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ea580c']}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="py-24 items-center justify-center">
            <ActivityIndicator size="large" color="#ea580c" />
            <Text className="text-gray-400 font-bold text-xs mt-3">
              Calculating kitchen financial data...
            </Text>
          </View>
        ) : (
          <View className="px-5 pt-4">
            {/* Primary KPI 2x2 Grid */}
            <View className="flex-row gap-3 mb-3">
              {/* Today's Revenue */}
              <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <View className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 items-center justify-center mb-2">
                  <Ionicons name="cash-outline" size={18} color="#059669" />
                </View>
                <Text className="text-xs font-bold text-gray-400">Today's Net</Text>
                <Text className="text-lg font-black text-gray-900 mt-0.5">
                  ₹{(stats?.todayRevenue || 0).toLocaleString()}
                </Text>
                <Text className="text-[10px] font-bold text-emerald-600 mt-1">
                  {stats?.todayOrders || 0} orders today
                </Text>
              </View>

              {/* Monthly Revenue */}
              <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <View className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 items-center justify-center mb-2">
                  <Ionicons name="trending-up" size={18} color="#7c3aed" />
                </View>
                <Text className="text-xs font-bold text-gray-400">This Month</Text>
                <Text className="text-lg font-black text-gray-900 mt-0.5">
                  ₹{(stats?.monthlyRevenue || 0).toLocaleString()}
                </Text>
                <Text className="text-[10px] font-bold text-purple-600 mt-1">
                  {stats?.monthlyOrders || 0} monthly orders
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3 mb-4">
              {/* Weekly Revenue */}
              <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <View className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 items-center justify-center mb-2">
                  <Ionicons name="calendar-outline" size={18} color="#2563eb" />
                </View>
                <Text className="text-xs font-bold text-gray-400">This Week</Text>
                <Text className="text-lg font-black text-gray-900 mt-0.5">
                  ₹{(stats?.weeklyRevenue || 0).toLocaleString()}
                </Text>
                <Text className="text-[10px] font-bold text-blue-600 mt-1">
                  Last 7 days earnings
                </Text>
              </View>

              {/* All Time Delivered */}
              <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <View className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 items-center justify-center mb-2">
                  <Ionicons name="checkmark-done-circle" size={18} color="#ea580c" />
                </View>
                <Text className="text-xs font-bold text-gray-400">Fulfillment</Text>
                <Text className="text-lg font-black text-gray-900 mt-0.5">
                  {completionRate}%
                </Text>
                <Text className="text-[10px] font-bold text-orange-600 mt-1">
                  {stats?.deliveredOrders || 0} of {stats?.totalOrders || 0} delivered
                </Text>
              </View>
            </View>

            {/* 7-Day Revenue Trend Bar Chart */}
            <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-xl bg-emerald-50 items-center justify-center mr-2.5">
                    <Ionicons name="bar-chart-outline" size={16} color="#059669" />
                  </View>
                  <View>
                    <Text className="text-sm font-black text-gray-900">
                      7-Day Revenue Trend
                    </Text>
                    <Text className="text-[10px] text-gray-400 font-medium">
                      Daily gross kitchen earnings
                    </Text>
                  </View>
                </View>
                <Text className="text-base font-black text-emerald-600">
                  ₹{(stats?.weeklyRevenue || 0).toLocaleString()}
                </Text>
              </View>

              {dailyData.length > 0 ? (
                <View className="h-44 pt-4 flex-row items-end justify-between">
                  {dailyData.map((day, idx) => (
                    <View key={idx} className="flex-1 items-center mx-1">
                      {/* Revenue label on top */}
                      <Text
                        className="text-[9px] font-black text-gray-500 mb-1"
                        numberOfLines={1}
                      >
                        {day.revenue > 0 ? `₹${day.revenue}` : '₹0'}
                      </Text>

                      {/* Bar Container */}
                      <View className="w-full bg-gray-100 h-28 rounded-t-lg justify-end overflow-hidden">
                        <View
                          style={{
                            height: `${day.heightPct}%`,
                            backgroundColor:
                              day.revenue > 0 ? '#10b981' : '#e5e7eb',
                          }}
                          className="w-full rounded-t-lg"
                        />
                      </View>

                      {/* Day Label */}
                      <Text className="text-[10px] font-bold text-gray-500 mt-1.5 uppercase">
                        {day.label}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="h-32 items-center justify-center bg-gray-50 rounded-xl">
                  <Ionicons name="analytics-outline" size={28} color="#d1d5db" />
                  <Text className="text-xs font-bold text-gray-400 mt-2">
                    No order transactions recorded this week yet
                  </Text>
                </View>
              )}
            </View>

            {/* Top Selling Dishes */}
            <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-xl bg-amber-50 items-center justify-center mr-2.5">
                  <Ionicons name="trophy-outline" size={16} color="#d97706" />
                </View>
                <View>
                  <Text className="text-sm font-black text-gray-900">
                    Bestselling Dishes
                  </Text>
                  <Text className="text-[10px] text-gray-400 font-medium">
                    Most ordered menu items
                  </Text>
                </View>
              </View>

              {topItemsList.length > 0 ? (
                <View className="space-y-3">
                  {topItemsList.map((item, idx) => (
                    <View key={idx} className="py-2 border-b border-gray-50 last:border-b-0">
                      <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center flex-1 mr-2">
                          <View
                            className={`w-5 h-5 rounded-full items-center justify-center mr-2 ${
                              idx === 0
                                ? 'bg-amber-100'
                                : idx === 1
                                ? 'bg-gray-200'
                                : 'bg-orange-50'
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-black ${
                                idx === 0
                                  ? 'text-amber-800'
                                  : idx === 1
                                  ? 'text-gray-700'
                                  : 'text-orange-700'
                              }`}
                            >
                              {idx + 1}
                            </Text>
                          </View>
                          <Text
                            className="text-xs font-black text-gray-800"
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                        </View>
                        <Text className="text-xs font-black text-gray-900">
                          {item.quantity} sold
                        </Text>
                      </View>

                      {/* Progress bar */}
                      <View className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <View
                          style={{
                            width: `${item.pct}%`,
                            backgroundColor: idx === 0 ? '#f59e0b' : '#ea580c',
                          }}
                          className="h-full rounded-full"
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="py-6 items-center justify-center bg-gray-50 rounded-xl">
                  <Ionicons name="restaurant-outline" size={24} color="#d1d5db" />
                  <Text className="text-xs font-bold text-gray-400 mt-2">
                    Dish rankings will generate once orders are delivered
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Kitchen Settlement Card */}
            <View className="bg-orange-50/70 border border-orange-200 rounded-3xl p-5 mb-2">
              <View className="flex-row items-start mb-3">
                <Ionicons name="wallet" size={20} color="#ea580c" className="mt-0.5" />
                <View className="ml-2.5 flex-1">
                  <Text className="text-sm font-black text-orange-950">
                    Kitchen Settlements & Wallet
                  </Text>
                  <Text className="text-[11px] text-orange-800 font-medium leading-4 mt-0.5">
                    Platform commissions (10%) are automatically deducted at order completion. You can withdraw your net revenue to your bank account anytime.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/wallet')}
                activeOpacity={0.85}
                className="bg-primary py-3 px-4 rounded-2xl flex-row items-center justify-between shadow-md shadow-primary/20"
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons name="card-outline" size={16} color="#ffffff" />
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    Open Kitchen Wallet & Withdraw
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
