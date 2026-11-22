import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurantOrdersStore } from '../../src/store/useRestaurantOrdersStore';
import { useRestaurantAuthStore } from '../../src/store/useRestaurantAuthStore';
import { RestaurantOrder } from '../../src/types';
import { dialPhoneNumber } from '../../src/utils/navigation';

type FilterTab = 'all' | 'Delivered' | 'Cancelled';

export default function OrderHistoryScreen() {
  const isAuthenticated = useRestaurantAuthStore((s) => s.isAuthenticated);
  const historyOrders = useRestaurantOrdersStore((s) => s.historyOrders);
  const isLoading = useRestaurantOrdersStore((s) => s.isLoading);
  const fetchHistoryOrders = useRestaurantOrdersStore((s) => s.fetchHistoryOrders);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchHistoryOrders();
      }
    }, [isAuthenticated, fetchHistoryOrders])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistoryOrders();
    setRefreshing(false);
  };

  // Filter & Search
  const filteredOrders = useMemo(() => {
    return historyOrders.filter((order) => {
      // Tab filter
      if (activeTab !== 'all' && order.status !== activeTab) {
        return false;
      }
      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const idMatch = (order._id || order.id || '').toLowerCase().includes(q);
      const customerMatch = (order.customerName || '').toLowerCase().includes(q);
      const itemMatch = order.items?.some((i) => i.name.toLowerCase().includes(q));
      return idMatch || customerMatch || itemMatch;
    });
  }, [historyOrders, activeTab, searchQuery]);

  // Aggregate metrics
  const totalSettledEarnings = useMemo(() => {
    return historyOrders
      .filter((o) => o.status === 'Delivered')
      .reduce((sum, o) => {
        const foodSubtotal = o.pricing?.foodSubtotal || o.totalAmount || 0;
        const comm = o.settlement?.platformCommission ?? Math.round(foodSubtotal * 0.1);
        const net = o.settlement?.restaurantAmount ?? Math.max(0, foodSubtotal - comm);
        return sum + net;
      }, 0);
  }, [historyOrders]);

  const deliveredCount = historyOrders.filter((o) => o.status === 'Delivered').length;
  const cancelledCount = historyOrders.filter((o) => o.status === 'Cancelled').length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-3.5 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-black text-gray-900">Order History</Text>
          <Text className="text-xs font-semibold text-gray-500 mt-0.5">
            Past kitchen receipts & settlements
          </Text>
        </View>

        <View className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl items-end shadow-sm">
          <Text className="text-emerald-700 font-black text-sm">
            ₹{totalSettledEarnings.toLocaleString()}
          </Text>
          <Text className="text-[9px] text-emerald-600 font-black uppercase tracking-wider">
            Settled Net Payout
          </Text>
        </View>
      </View>

      {/* KPI Stats Strip */}
      <View className="bg-white px-5 py-3 border-b border-gray-100 flex-row justify-between">
        <View className="items-center flex-1">
          <Text className="text-xs font-bold text-gray-400">Total Completed</Text>
          <Text className="text-lg font-black text-gray-900 mt-0.5">{historyOrders.length}</Text>
        </View>
        <View className="w-[1px] bg-gray-100" />
        <View className="items-center flex-1">
          <Text className="text-xs font-bold text-emerald-600">Delivered</Text>
          <Text className="text-lg font-black text-emerald-700 mt-0.5">{deliveredCount}</Text>
        </View>
        <View className="w-[1px] bg-gray-100" />
        <View className="items-center flex-1">
          <Text className="text-xs font-bold text-red-500">Cancelled</Text>
          <Text className="text-lg font-black text-red-600 mt-0.5">{cancelledCount}</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View className="px-5 pt-3 pb-2 bg-white">
        <View className="flex-row items-center bg-gray-100 px-3.5 py-2.5 rounded-xl border border-gray-200">
          <Ionicons name="search" size={17} color="#6b7280" />
          <TextInput
            placeholder="Search by order #, customer, dish..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-sm text-gray-800 p-0"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={17} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row px-5 py-2.5 bg-white border-b border-gray-100 gap-2">
        {(['all', 'Delivered', 'Cancelled'] as FilterTab[]).map((tab) => {
          const isSelected = activeTab === tab;
          const label = tab === 'all' ? 'All Orders' : tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
              className={`px-4 py-1.5 rounded-full border ${
                isSelected
                  ? 'bg-orange-500 border-orange-500'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isSelected ? 'text-white' : 'text-gray-600'
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content List */}
      <ScrollView
        className="flex-1 px-5 pt-3"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ea580c']}
          />
        }
      >
        {isLoading && !refreshing && historyOrders.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#ea580c" />
            <Text className="text-gray-400 font-semibold text-xs mt-3">
              Loading order history...
            </Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View className="py-16 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
              <Ionicons name="receipt-outline" size={32} color="#9ca3af" />
            </View>
            <Text className="text-base font-bold text-gray-800">No past orders found</Text>
            <Text className="text-xs text-gray-400 mt-1 text-center max-w-xs">
              {searchQuery
                ? 'Try a different search keyword'
                : 'Completed and fulfilled orders will appear here for record-keeping and settlement.'}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const orderId = order._id || order.id || 'ORDER';
            const shortId = orderId.slice(-6).toUpperCase();
            const isDelivered = order.status === 'Delivered';
            const foodSubtotal = order.pricing?.foodSubtotal || order.totalAmount || 0;
            const comm =
              order.settlement?.platformCommission ?? Math.round(foodSubtotal * 0.1);
            const netEarnings =
              order.settlement?.restaurantAmount ?? Math.max(0, foodSubtotal - comm);

            return (
              <TouchableOpacity
                key={orderId}
                onPress={() => setSelectedOrder(order)}
                activeOpacity={0.9}
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
              >
                {/* Header row */}
                <View className="flex-row items-center justify-between pb-2.5 border-b border-gray-100">
                  <View className="flex-row items-center">
                    <Text className="font-black text-gray-900 text-sm">#{shortId}</Text>
                    <Text className="text-gray-400 text-xs ml-2 font-medium">
                      {formatDate(order.createdAt)}
                    </Text>
                  </View>
                  <View
                    className={`px-2.5 py-0.5 rounded-full border ${
                      isDelivered
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-black uppercase ${
                        isDelivered ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>

                {/* Items preview */}
                <View className="py-2.5 border-b border-gray-50">
                  {order.items?.map((item, idx) => (
                    <View
                      key={idx}
                      className="flex-row items-center justify-between py-0.5"
                    >
                      <View className="flex-row items-center flex-1 mr-2">
                        <View
                          className={`w-2 h-2 rounded-full mr-2 ${
                            item.isVeg ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                        <Text
                          className="text-xs font-semibold text-gray-800"
                          numberOfLines={1}
                        >
                          {item.quantity}x {item.name}
                        </Text>
                      </View>
                      <Text className="text-xs font-bold text-gray-600">
                        ₹{item.price * item.quantity}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Customer & Settlement summary row */}
                <View className="pt-2.5 flex-row items-center justify-between">
                  <View className="flex-1 mr-2">
                    <Text className="text-xs font-bold text-gray-700" numberOfLines={1}>
                      {order.customerName || 'Customer'}
                    </Text>
                    <Text className="text-[10px] text-gray-400 font-medium">
                      Payment: {order.paymentMethod || 'Prepaid'}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-xs font-bold text-gray-400">Net Earning</Text>
                    <Text
                      className={`text-base font-black ${
                        isDelivered ? 'text-emerald-600' : 'text-gray-400'
                      }`}
                    >
                      {isDelivered ? `₹${netEarnings}` : '₹0'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Detailed Order Receipt Modal */}
      <Modal
        visible={!!selectedOrder}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[85%]">
            {/* Modal header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <View>
                <Text className="text-lg font-black text-gray-900">
                  Receipt #{selectedOrder?._id?.slice(-6).toUpperCase()}
                </Text>
                <Text className="text-xs text-gray-400 font-medium">
                  {formatDate(selectedOrder?.createdAt)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-3">
              {/* Customer Info */}
              <View className="bg-gray-50 rounded-2xl p-3.5 mb-3 border border-gray-100">
                <Text className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-1">
                  Customer & Delivery
                </Text>
                <Text className="text-sm font-bold text-gray-900">
                  {selectedOrder?.customerName || 'Customer'}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {selectedOrder?.address}
                </Text>
                {selectedOrder?.phone && (
                  <TouchableOpacity
                    onPress={() => dialPhoneNumber(selectedOrder.phone!)}
                    className="flex-row items-center mt-2"
                  >
                    <Ionicons name="call" size={14} color="#ea580c" />
                    <Text className="text-xs font-bold text-primary ml-1.5">
                      {selectedOrder.phone}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Items Breakdown */}
              <View className="bg-gray-50 rounded-2xl p-3.5 mb-3 border border-gray-100">
                <Text className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-2">
                  Order Items
                </Text>
                {selectedOrder?.items?.map((item, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center justify-between py-1 border-b border-gray-100 last:border-b-0"
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <View
                        className={`w-2.5 h-2.5 rounded-full mr-2 ${
                          item.isVeg ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      <Text className="text-xs font-bold text-gray-800">
                        {item.quantity}x {item.name}
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-gray-800">
                      ₹{item.price * item.quantity}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Settlement Calculation */}
              <View className="bg-orange-50/50 rounded-2xl p-3.5 mb-4 border border-orange-100">
                <Text className="text-[11px] font-black uppercase text-orange-600 tracking-wider mb-2">
                  Financial Settlement
                </Text>

                <View className="flex-row justify-between py-1">
                  <Text className="text-xs text-gray-600">Food Subtotal</Text>
                  <Text className="text-xs font-bold text-gray-800">
                    ₹{selectedOrder?.pricing?.foodSubtotal || selectedOrder?.totalAmount || 0}
                  </Text>
                </View>

                {!!selectedOrder?.pricing?.packagingFee && (
                  <View className="flex-row justify-between py-1">
                    <Text className="text-xs text-gray-600">Packaging Fee</Text>
                    <Text className="text-xs font-bold text-gray-800">
                      +₹{selectedOrder.pricing.packagingFee}
                    </Text>
                  </View>
                )}

                <View className="flex-row justify-between py-1">
                  <Text className="text-xs text-red-500">
                    Platform Commission (10%)
                  </Text>
                  <Text className="text-xs font-bold text-red-500">
                    -₹
                    {selectedOrder?.settlement?.platformCommission ??
                      Math.round(
                        (selectedOrder?.pricing?.foodSubtotal ||
                          selectedOrder?.totalAmount ||
                          0) * 0.1
                      )}
                  </Text>
                </View>

                <View className="h-[1px] bg-orange-200 my-2" />

                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-black text-gray-900">
                    Net Restaurant Payout
                  </Text>
                  <Text className="text-lg font-black text-emerald-600">
                    ₹
                    {selectedOrder?.settlement?.restaurantAmount ??
                      Math.max(
                        0,
                        (selectedOrder?.pricing?.foodSubtotal ||
                          selectedOrder?.totalAmount ||
                          0) -
                          Math.round(
                            (selectedOrder?.pricing?.foodSubtotal ||
                              selectedOrder?.totalAmount ||
                              0) * 0.1
                          )
                      )}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setSelectedOrder(null)}
              activeOpacity={0.85}
              className="bg-primary py-3.5 rounded-2xl items-center shadow-md shadow-orange-500/25 mt-2"
            >
              <Text className="text-white font-black text-sm">Close Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
