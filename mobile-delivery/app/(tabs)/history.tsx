import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getMyDeliveryHistoryApi } from '../../src/api';
import { DeliveryOrder } from '../../src/types';
import { useDeliveryAuthStore } from '../../src/store/useDeliveryAuthStore';

export default function DeliveryHistoryScreen() {
  const isAuthenticated = useDeliveryAuthStore((s) => s.isAuthenticated);
  const [history, setHistory] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    if (!isAuthenticated) return;
    try {
      const res: any = await getMyDeliveryHistoryApi();
      setHistory(res?.data || []);
    } catch (err: any) {
      if (err?.status !== 401) {
        console.error('[History] Fetch history error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchHistory();
      }
    }, [isAuthenticated])
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const totalEarned = history.reduce(
    (acc, o: any) =>
      acc + (o.settlement?.deliveryPartnerAmount || o.pricing?.deliveryFee || o.deliveryFee || o.estimatedEarnings || 30),
    0
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <View className="w-20 h-20 rounded-full bg-orange-50 border border-orange-100 items-center justify-center mb-5 shadow-sm">
          <Ionicons name="lock-closed-outline" size={36} color="#ea580c" />
        </View>
        <Text className="text-xl font-black text-gray-900 mb-2 text-center">Authentication Required</Text>
        <Text className="text-xs text-gray-500 font-semibold text-center mb-6 leading-5 max-w-xs">
          Please sign in with your Yumora Partner account to access your delivery history.
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
      {/* Header Bar */}
      <View className="px-5 py-3.5 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-black text-gray-900">Trip History</Text>
          <Text className="text-xs font-semibold text-gray-500 mt-0.5">
            {history.length} completed {history.length === 1 ? 'trip' : 'trips'}
          </Text>
        </View>

        <View className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-2xl items-end shadow-sm">
          <Text className="text-emerald-700 font-black text-sm">₹{totalEarned}</Text>
          <Text className="text-[9px] text-emerald-600 font-black uppercase tracking-wider">
            Total Earned
          </Text>
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
        {loading && (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#ea580c" />
            <Text className="text-gray-400 text-xs font-bold mt-3">Loading trip history...</Text>
          </View>
        )}

        {!loading && history.length === 0 && (
          <View className="bg-white rounded-3xl p-8 items-center border border-gray-100 shadow-sm my-8">
            <View className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 items-center justify-center mb-3">
              <Ionicons name="receipt-outline" size={28} color="#ea580c" />
            </View>
            <Text className="text-base font-black text-gray-900">No Completed Trips Yet</Text>
            <Text className="text-xs text-gray-500 font-semibold text-center mt-1.5 leading-5 max-w-xs">
              When you accept and deliver orders, your trip receipts and wallet payout history will appear here.
            </Text>
          </View>
        )}

        {!loading &&
          history.map((order) => {
            const orderId = order._id || order.id;
            const payout =
              (order as any).settlement?.deliveryPartnerAmount ||
              (order as any).pricing?.deliveryFee ||
              order.deliveryFee ||
              order.estimatedEarnings ||
              30;
            const formattedDate = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            return (
              <View
                key={orderId}
                className="bg-white rounded-3xl p-5 border border-gray-100 mb-4 shadow-sm"
              >
                {/* Header status & date */}
                <View className="flex-row items-center justify-between mb-2.5">
                  <View className="bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex-row items-center">
                    <Ionicons name="checkmark-circle" size={13} color="#10b981" />
                    <Text className="text-emerald-700 font-black text-[10px] ml-1 uppercase">
                      Delivered
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-xs font-semibold">{formattedDate}</Text>
                </View>

                {/* Restaurant & destination */}
                <Text className="text-gray-900 font-black text-base mt-1" numberOfLines={1}>
                  {order.restaurantName}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="location-outline" size={14} color="#64748b" />
                  <Text className="text-gray-500 text-xs font-semibold ml-1 flex-1" numberOfLines={1}>
                    {order.address}
                  </Text>
                </View>

                {/* Subtotal & payout strip */}
                <View className="bg-gray-50 rounded-2xl p-3.5 my-3 border border-gray-100 flex-row items-center justify-between">
                  <Text className="text-gray-700 text-xs font-bold">
                    {(order.items || []).length} items • Total ₹{order.totalAmount}
                  </Text>
                  <View className="bg-emerald-100/70 px-2.5 py-1 rounded-xl">
                    <Text className="text-emerald-800 font-black text-xs">+₹{payout} Payout</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-1">
                  <Text className="text-[10px] text-gray-400 font-mono">
                    #{orderId.slice(-8).toUpperCase()}
                  </Text>
                  <Text className="text-[10px] font-black text-primary uppercase">
                    Payout Settled
                  </Text>
                </View>
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}
