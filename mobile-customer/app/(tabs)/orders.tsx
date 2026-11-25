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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserOrdersApi, cancelOrderApi } from '../../src/api';
import { socketService } from '../../src/services/socketService';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useCartStore } from '../../src/store/useCartStore';

export default function OrdersScreen() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuthStore();
  const totalCartItems = useCartStore((state) => state.getTotalItems());
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoading(true);
    try {
      const res: any = await getUserOrdersApi();
      if (res.data) {
        setOrders(res.data);
        // Join socket room for all active in-progress orders
        res.data.forEach((o: any) => {
          if (o.status !== 'Delivered' && o.status !== 'Cancelled') {
            socketService.joinOrder(o._id || o.id);
          }
        });
      }
    } catch (e: any) {
      console.log('Error fetching orders:', e.message || e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();

      socketService.connect();
      const handleStatusUpdate = ({ status, data }: { status: string; data: any }) => {
        setOrders((prev) =>
          prev.map((ord) => {
            const matchId = data?._id || data?.id;
            if ((ord._id && ord._id === matchId) || (ord.id && ord.id === matchId)) {
              return { ...ord, ...(data || {}), status };
            }
            return ord;
          })
        );
      };
      socketService.onOrderStatusUpdate(handleStatusUpdate);

      return () => {
        socketService.offOrderStatusUpdate(handleStatusUpdate);
      };
    }
  }, [token]);

  const handleCancel = (orderId: string) => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrderApi(orderId, 'Cancelled from mobile app');
            Alert.alert('Order Cancelled', 'Your refund has been initiated.');
            fetchOrders();
          } catch (err: any) {
            Alert.alert('Cancellation Failed', err.message || 'Could not cancel order');
          }
        },
      },
    ]);
  };

  if (authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#ea580c" />
      </SafeAreaView>
    );
  }

  if (!token) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-5 py-3.5 bg-white border-b border-gray-100 flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-black text-gray-900">My Orders</Text>
            <Text className="text-xs font-semibold text-gray-500 mt-0.5">
              Track live food deliveries
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/cart')}
            activeOpacity={0.75}
            className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 items-center justify-center relative shadow-sm"
          >
            <Ionicons name="cart-outline" size={20} color="#111827" />
            {totalCartItems > 0 && (
              <View className="absolute -top-1 -right-1 bg-primary px-1.5 py-0.5 rounded-full min-w-[18px] items-center justify-center border-2 border-white shadow-sm">
                <Text className="text-white text-[10px] font-black leading-none">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="bag-handle-outline" size={48} color="#d1d5db" />
          <Text className="text-lg font-black text-gray-900 mt-4 mb-1">Sign in to view orders</Text>
          <Text className="text-xs text-gray-500 font-semibold text-center mb-6">
            Track live food deliveries, reorder meals, and view your receipts
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            className="bg-primary px-8 py-3.5 rounded-2xl shadow-md"
          >
            <Text className="text-white font-black text-sm">Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 py-3.5 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-black text-gray-900">My Orders</Text>
          <Text className="text-xs font-semibold text-gray-500 mt-0.5">
            Track live food deliveries
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/cart')}
          activeOpacity={0.75}
          className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 items-center justify-center relative shadow-sm"
        >
          <Ionicons name="cart-outline" size={20} color="#111827" />
          {totalCartItems > 0 && (
            <View className="absolute -top-1 -right-1 bg-primary px-1.5 py-0.5 rounded-full min-w-[18px] items-center justify-center border-2 border-white shadow-sm">
              <Text className="text-white text-[10px] font-black leading-none">
                {totalCartItems > 99 ? '99+' : totalCartItems}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
        className="flex-1 px-5 pt-4 bg-white"
      >
        {loading && orders.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#ea580c" />
          </View>
        ) : orders.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <Text className="text-base font-black text-gray-800">No orders placed yet</Text>
            <Text className="text-xs text-gray-500 font-medium mt-1">Start by ordering your favorite dish!</Text>
          </View>
        ) : (
          orders.map((order) => {
            const isLive = !['Delivered', 'Cancelled'].includes(order.status);
            return (
              <TouchableOpacity
                key={order._id || order.id}
                activeOpacity={0.88}
                onPress={() => router.push(`/tracking/${order._id || order.id}`)}
                className="bg-white rounded-3xl p-4 mb-4 border border-gray-100 shadow-sm"
              >
                <View className="flex-row items-center justify-between pb-3 border-b border-gray-50 mb-3">
                  <View>
                    <Text className="text-sm font-black text-gray-900">
                      {order.restaurantName || 'Restaurant'}
                    </Text>
                    <Text className="text-xs text-gray-500 font-bold mt-0.5">
                      Order #{order._id?.substring(0, 8)}
                      {order.status === 'Delivered'
                        ? ` • ✅ ${
                            order.actualDeliveryMinutes ||
                            Math.max(
                              1,
                              Math.round(
                                (new Date(order.deliveredAt || order.updatedAt).getTime() -
                                  new Date(order.createdAt).getTime()) /
                                  60000
                              )
                            )
                          }m`
                        : isLive
                        ? ` • ⏱️ ~${order.estimatedDeliveryMinutes || 35}m`
                        : ''}
                    </Text>
                  </View>
                    <View className="flex-row items-center gap-1.5">
                      {order.status === 'Cancelled' && (
                        <View
                          className={`px-2 py-0.5 rounded-full ${
                            order.refund?.status === 'processed'
                              ? 'bg-emerald-100'
                              : order.refund?.status === 'failed'
                              ? 'bg-red-200'
                              : 'bg-amber-100'
                          }`}
                        >
                          <Text
                            className={`text-[9px] font-black uppercase ${
                              order.refund?.status === 'processed'
                                ? 'text-emerald-800'
                                : order.refund?.status === 'failed'
                                ? 'text-red-900'
                                : 'text-amber-800'
                            }`}
                          >
                            {order.refund?.status === 'processed'
                              ? '✓ Refunded'
                              : order.refund?.status === 'failed'
                              ? 'Refund Failed'
                              : 'Refund Initiated'}
                          </Text>
                        </View>
                      )}
                      <View
                        className={`px-2.5 py-1 rounded-full ${
                          order.status === 'Delivered'
                            ? 'bg-green-100'
                            : order.status === 'Cancelled'
                            ? 'bg-red-100'
                            : 'bg-orange-100'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-black uppercase ${
                            order.status === 'Delivered'
                              ? 'text-green-700'
                              : order.status === 'Cancelled'
                              ? 'text-red-700'
                              : 'text-orange-700'
                          }`}
                        >
                          {order.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Refund Notice Banner on Cancelled Orders */}
                  {order.status === 'Cancelled' && (
                    <View className="mb-3 p-3 bg-red-50/70 rounded-2xl border border-red-100">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[10px] font-black uppercase tracking-wider text-red-700">
                          {order.refund?.status === 'processed' ? 'Refund Processed' : 'Refund In Progress'}
                        </Text>
                        <Text className="text-xs font-black text-gray-900">
                          ₹{order.refund?.amount || order.totalAmount}
                        </Text>
                      </View>
                      <Text className="text-[11px] text-gray-600 font-medium mt-1">
                        {order.refund?.status === 'processed'
                          ? 'Transferred back to your original payment source (UPI/Card).'
                          : 'Initiated to your original payment method.'}
                      </Text>
                      {order.refund?.refundId && (
                        <Text className="text-[10px] text-gray-400 font-mono mt-1">
                          Ref: {order.refund.refundId}
                        </Text>
                      )}
                    </View>
                  )}

                {/* Items */}
                <View className="mb-3">
                  {order.items?.map((item: any, idx: number) => (
                    <Text key={idx} className="text-xs text-gray-600 font-semibold mb-0.5">
                      {item.quantity}x {item.name}
                    </Text>
                  ))}
                </View>

                <View className="flex-row items-center justify-between pt-2 border-t border-gray-50">
                  <View className="shrink-0">
                    <Text className="text-[10px] text-gray-500 font-black uppercase tracking-wider">
                      Total
                    </Text>
                    <Text className="text-sm font-black text-gray-900">
                      ₹{order.totalAmount}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2 shrink-0">
                    {order.status === 'Placed' && (
                      <TouchableOpacity
                        onPress={() => handleCancel(order._id || order.id)}
                        className="bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl shrink-0"
                      >
                        <Text numberOfLines={1} className="text-xs font-bold text-red-600">Cancel</Text>
                      </TouchableOpacity>
                    )}
                    <View className="flex-row items-center shrink-0 gap-1 bg-orange-50 border border-orange-200/90 px-3 py-1.5 rounded-xl">
                      <Text numberOfLines={1} className="text-primary text-xs font-black">
                        {isLive ? 'Track & View' : 'View Details'}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color="#ea580c" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
