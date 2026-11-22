import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getOrderByIdApi, cancelOrderApi } from '../../src/api';
import { socketService } from '../../src/services/socketService';
import { useCartStore } from '../../src/store/useCartStore';
import { LiveTrackingMap } from '../../src/components/LiveTrackingMap';
import * as Location from 'expo-location';

const COMPACT_STAGES = [
  { id: 'Placed', label: 'Placed', icon: 'receipt-outline' as const },
  { id: 'Kitchen', label: 'Kitchen', icon: 'flame-outline' as const },
  { id: 'On Way', label: 'On Way', icon: 'bicycle-outline' as const },
  { id: 'Delivered', label: 'Delivered', icon: 'checkmark-circle-outline' as const },
];

export default function OrderDetailsAndTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [liveETA, setLiveETA] = useState<string | null>(null);
  const [liveDistance, setLiveDistance] = useState<string | null>(null);
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const fetchOrder = useCallback(
    async (isManualRefresh = false) => {
      if (!id) return;
      if (isManualRefresh) setRefreshing(true);
      try {
        const res: any = await getOrderByIdApi(id);
        if (res?.data) {
          setOrder(res.data);
        }
      } catch (err: any) {
        console.error('[Tracking] Fetch error:', err?.message || err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  // Send customer delivery location to backend tracking session
  useEffect(() => {
    if (!id || !order) return;

    if (order.location?.lat && order.location?.lng) {
      socketService.sendCustomerLocation(id, order.location.lat, order.location.lng);
    } else {
      Location.getForegroundPermissionsAsync()
        .then((perm) => {
          if (perm.granted) {
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
              .then((pos) => {
                socketService.sendCustomerLocation(id, pos.coords.latitude, pos.coords.longitude);
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [id, order?.location]);

  useEffect(() => {
    fetchOrder();

    if (!id) return;

    // Connect to Socket.IO and join BOTH the order status room and tracking room
    socketService.connect();
    socketService.joinOrder(id);
    socketService.joinTracking(id, 'customer');

    // 1. Order Status Updates
    const handleStatusUpdate = ({ status, data }: { status: string; data: any }) => {
      console.log('[Tracking] Socket order_status_update:', status);
      if (data && (data._id === id || data.id === id)) {
        setOrder((prev: any) => ({ ...prev, ...data, status }));
      } else if (status) {
        setOrder((prev: any) => ({ ...prev, status }));
      }
    };
    socketService.onOrderStatusUpdate(handleStatusUpdate);

    // 2. Delivery Partner Assignment
    const handleOrderAccepted = ({ deliveryPerson }: { orderId: string; deliveryPerson: any }) => {
      console.log('[Tracking] Socket order_accepted:', deliveryPerson);
      if (deliveryPerson) {
        setOrder((prev: any) => ({
          ...prev,
          deliveryPersonName: deliveryPerson.name,
          deliveryPersonPhone: deliveryPerson.phone,
        }));
      }
    };
    socketService.onOrderAccepted(handleOrderAccepted);

    // 3. Live Driver GPS Location & ETA Updates
    const handleLocationUpdated = (locData: any) => {
      console.log('[Tracking] Socket location-updated:', locData);
      if (locData.orderId === id) {
        if (locData.lat && locData.lng) {
          setDriverCoords({ lat: locData.lat, lng: locData.lng });
          setIsTrackingActive(true);
        }
        if (locData.eta) setLiveETA(locData.eta);
        if (locData.distance) setLiveDistance(locData.distance);
      }
    };
    socketService.onLocationUpdated(handleLocationUpdated);

    // 4. Tracking Started (driver picked up order & started moving)
    const handleTrackingStarted = (data: any) => {
      console.log('[Tracking] Socket tracking-started:', data);
      setIsTrackingActive(true);
    };
    socketService.onTrackingStarted(handleTrackingStarted);

    // 5. Tracking Ended (driver delivered order)
    const handleTrackingEnded = (data: any) => {
      console.log('[Tracking] Socket tracking-ended:', data);
      setIsTrackingActive(false);
    };
    socketService.onTrackingEnded(handleTrackingEnded);

    // 6. Order Cancelled Event
    const handleCancelled = ({ order: cancelledOrder }: any) => {
      if (cancelledOrder && (cancelledOrder._id === id || cancelledOrder.id === id)) {
        setOrder(cancelledOrder);
      } else {
        setOrder((prev: any) => ({ ...prev, status: 'Cancelled' }));
      }
      setIsTrackingActive(false);
    };
    socketService.onOrderCancelled(handleCancelled);

    return () => {
      socketService.offOrderStatusUpdate(handleStatusUpdate);
      socketService.offOrderAccepted();
      socketService.offLocationUpdated();
      socketService.offTrackingStarted();
      socketService.offTrackingEnded();
      socketService.offOrderCancelled();
    };
  }, [id, fetchOrder]);

  const handleCancelOrder = () => {
    if (!id) return;
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelOrderApi(id, 'Customer requested cancellation via mobile app');
              await fetchOrder();
              Alert.alert('Order Cancelled', 'Your order has been successfully cancelled.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not cancel order.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleCallRider = () => {
    if (!order?.deliveryPersonPhone) {
      Alert.alert('Contact Unavailable', 'Rider phone number is not available yet.');
      return;
    }
    Linking.openURL(`tel:${order.deliveryPersonPhone}`);
  };

  const handleReorder = () => {
    if (!order?.items || order.items.length === 0) return;
    const restId = order.restaurantId || 'unknown';
    const restName = order.restaurantName || 'Restaurant';

    order.items.forEach((item: any) => {
      addItem(
        {
          id: item.id || item._id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          category: item.category || 'Dishes',
          isVeg: item.isVeg ?? true,
          image: item.image || '',
        },
        restId,
        restName
      );
    });

    router.push('/cart');
  };

  // Compact 4-Stage Horizontal Stepper Index:
  // 0: Placed / Confirmed
  // 1: Kitchen (Preparing / Ready for Pickup)
  // 2: On Way (Out for Delivery)
  // 3: Delivered
  const compactStepIdx = useMemo(() => {
    if (!order?.status || order.status === 'Cancelled') return -1;
    if (['Placed', 'Confirmed'].includes(order.status)) return 0;
    if (['Preparing', 'Ready for Pickup'].includes(order.status)) return 1;
    if (order.status === 'Out for Delivery') return 2;
    if (order.status === 'Delivered') return 3;
    return 0;
  }, [order?.status]);

  const isLive = order?.status && !['Delivered', 'Cancelled'].includes(order.status);
  const isCancelled = order?.status === 'Cancelled';
  const isDelivered = order?.status === 'Delivered';
  const isOutForDelivery =
    order?.status === 'Out for Delivery' ||
    (isTrackingActive && !isDelivered && !isCancelled);
  const isPrePickup = !isDelivered && !isCancelled && !isOutForDelivery;

  // Bill calculations fallback if pricing sub-object is missing
  const foodSubtotal =
    order?.pricing?.foodSubtotal ??
    (order?.items?.reduce((acc: number, item: any) => acc + (item.price || 0) * (item.quantity || 1), 0) ||
      order?.totalAmount ||
      0);
  const packagingFee = order?.pricing?.packagingFee ?? 15;
  const deliveryFee = order?.pricing?.deliveryFee ?? 0;
  const platformFee = order?.pricing?.platformFee ?? 5;
  const tax = order?.pricing?.tax ?? Math.round(foodSubtotal * 0.05);
  const grandTotal = order?.totalAmount ?? foodSubtotal + packagingFee + deliveryFee + platformFee + tax;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className="text-xs font-bold text-gray-400 mt-3">Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
        <Text className="text-lg font-black text-gray-900 mt-4 mb-1">Order Not Found</Text>
        <Text className="text-xs text-gray-400 text-center mb-6">
          The requested order could not be loaded or may have been deleted.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-primary px-6 py-3 rounded-2xl">
          <Text className="text-white font-black text-xs uppercase">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Header */}
      <View className="px-5 py-3.5 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1 pr-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 items-center justify-center shadow-sm"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-base font-black text-gray-900" numberOfLines={1}>
              {order.restaurantName || 'Order Details'}
            </Text>
            <Text className="text-xs font-bold text-gray-400 mt-0.5">
              #{order._id?.substring(order._id.length - 8).toUpperCase()} • {order.items?.length || 0} items
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => fetchOrder(true)}
          disabled={refreshing}
          className="w-9 h-9 rounded-full bg-orange-50 border border-orange-200 items-center justify-center shadow-sm"
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#ea580c" />
          ) : (
            <Ionicons name="refresh" size={18} color="#ea580c" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrder(true)} />}
        className="flex-1 bg-white"
      >
        {/* Status Card with Compact 4-Stage Horizontal Tracker */}
        <View
          className={`rounded-3xl p-5 mb-4 border ${
            isCancelled
              ? 'bg-red-50/70 border-red-200'
              : isDelivered
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-orange-50/70 border-orange-200'
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View
                className={`w-2.5 h-2.5 rounded-full ${
                  isCancelled ? 'bg-red-500' : isDelivered ? 'bg-emerald-500' : 'bg-orange-500'
                }`}
              />
              <Text
                className={`text-[11px] font-black uppercase tracking-wider ${
                  isCancelled ? 'text-red-700' : isDelivered ? 'text-emerald-700' : 'text-orange-700'
                }`}
              >
                {isLive ? 'Live Tracking • In Progress' : isDelivered ? 'Order Completed' : 'Order Cancelled'}
              </Text>
            </View>

            <View
              className={`px-3 py-1 rounded-full ${
                isCancelled ? 'bg-red-200' : isDelivered ? 'bg-emerald-200' : 'bg-orange-200'
              }`}
            >
              <Text
                className={`text-[10px] font-black uppercase ${
                  isCancelled ? 'text-red-800' : isDelivered ? 'text-emerald-800' : 'text-orange-800'
                }`}
              >
                {order.status}
              </Text>
            </View>
          </View>

          <Text className="text-xl font-black text-gray-900 mt-1">
            {isCancelled
              ? 'This order was cancelled'
              : isDelivered
              ? 'Your meal has been delivered!'
              : order.status === 'Out for Delivery'
              ? 'Your rider is on the way!'
              : order.status === 'Ready for Pickup'
              ? 'Food is packed and ready for rider'
              : order.status === 'Preparing'
              ? 'Chef is preparing your meal'
              : 'Order placed & awaiting preparation'}
          </Text>

          {isLive && (
            <View className="flex-row items-center gap-1.5 mt-2.5">
              <Ionicons name="time-outline" size={15} color="#ea580c" />
              <Text className="text-xs font-black text-primary">
                {liveETA ? `Estimated Arrival: ${liveETA}` : 'Estimated Arrival: 25 - 35 mins'}
              </Text>
              {liveDistance && (
                <Text className="text-xs font-bold text-gray-500">({liveDistance} away)</Text>
              )}
            </View>
          )}

          {isCancelled && order?.cancellation?.reason && (
            <Text className="text-xs font-semibold text-red-600 mt-2">
              Reason: {order.cancellation.reason}
            </Text>
          )}

          {/* Compact 4-Stage Horizontal Tracker */}
          {!isCancelled && (
            <View className="mt-4 pt-3.5 border-t border-orange-200/60">
              <View className="flex-row items-center justify-between">
                {COMPACT_STAGES.map((stg, idx) => {
                  const isDone = compactStepIdx >= idx;
                  const isCurrent = compactStepIdx === idx;
                  return (
                    <React.Fragment key={stg.id}>
                      <View className="items-center">
                        <View
                          className={`w-7 h-7 rounded-full items-center justify-center ${
                            isCurrent
                              ? 'bg-primary'
                              : isDone
                              ? 'bg-emerald-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          <Ionicons
                            name={isDone && !isCurrent ? 'checkmark' : stg.icon}
                            size={13}
                            color={isDone || isCurrent ? '#ffffff' : '#6b7280'}
                          />
                        </View>
                        <Text
                          className={`text-[10px] mt-1 font-bold ${
                            isCurrent
                              ? 'text-primary font-black'
                              : isDone
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                        >
                          {stg.label}
                        </Text>
                      </View>
                      {idx < COMPACT_STAGES.length - 1 && (
                        <View
                          className={`flex-1 h-[2px] mx-1.5 mb-3.5 ${
                            compactStepIdx > idx ? 'bg-emerald-500' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Dedicated Refund Settlement Card (When Cancelled) */}
        {isCancelled && (
          <View className="bg-white rounded-3xl p-5 mb-4 border border-emerald-200/80 shadow-sm">
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 mb-3.5">
              <View className="flex-row items-center gap-2.5">
                <View className="w-10 h-10 rounded-2xl bg-emerald-50 items-center justify-center border border-emerald-100">
                  <Ionicons name="shield-checkmark" size={22} color="#059669" />
                </View>
                <View>
                  <Text className="text-sm font-black text-gray-900">
                    {order.refund?.status === 'processed'
                      ? 'Refund Completed'
                      : order.refund?.status === 'failed'
                      ? 'Refund Action Required'
                      : 'Refund Processing'}
                  </Text>
                  <Text className="text-[11px] font-semibold text-gray-500">
                    Original Payment Source
                  </Text>
                </View>
              </View>

              <View
                className={`px-3 py-1 rounded-full border ${
                  order.refund?.status === 'processed'
                    ? 'bg-emerald-50 border-emerald-200'
                    : order.refund?.status === 'failed'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <Text
                  className={`text-[10px] font-black uppercase ${
                    order.refund?.status === 'processed'
                      ? 'text-emerald-700'
                      : order.refund?.status === 'failed'
                      ? 'text-red-700'
                      : 'text-amber-700'
                  }`}
                >
                  {order.refund?.status === 'processed'
                    ? 'Processed'
                    : order.refund?.status === 'failed'
                    ? 'Failed'
                    : 'Initiated'}
                </Text>
              </View>
            </View>

            {/* Refund Amount Row */}
            <View className="flex-row items-center justify-between py-2 border-b border-gray-50">
              <Text className="text-xs font-bold text-gray-600">Total Refund Amount</Text>
              <Text className="text-lg font-black text-emerald-600">
                ₹{order.refund?.amount || order.totalAmount}
              </Text>
            </View>

            {/* Razorpay Refund Transaction ID */}
            {order.refund?.refundId && (
              <View className="flex-row items-center justify-between py-2 border-b border-gray-50">
                <Text className="text-xs font-bold text-gray-600">Gateway Refund ID</Text>
                <Text className="text-xs font-mono font-bold text-gray-800">
                  {order.refund.refundId}
                </Text>
              </View>
            )}

            {/* Refund Timestamp */}
            <View className="flex-row items-center justify-between py-2 border-b border-gray-50">
              <Text className="text-xs font-bold text-gray-600">Refund Timestamp</Text>
              <Text className="text-xs font-semibold text-gray-700">
                {new Date(
                  order.refund?.refundedAt ||
                  order.cancellation?.cancelledAt ||
                  order.updatedAt ||
                  order.createdAt
                ).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            {/* Cancellation Reason */}
            {order.cancellation?.reason && (
              <View className="flex-row items-start justify-between py-2 border-b border-gray-50">
                <Text className="text-xs font-bold text-gray-600">Cancellation Reason</Text>
                <Text className="text-xs font-semibold text-gray-700 max-w-[60%] text-right">
                  {order.cancellation.reason}
                </Text>
              </View>
            )}

            {/* Banking Timeline Disclaimer */}
            <View className="mt-3.5 p-3 rounded-2xl bg-gray-50 border border-gray-100 flex-row items-start gap-2">
              <Ionicons name="information-circle-outline" size={16} color="#6b7280" className="mt-0.5" />
              <Text className="text-[11px] font-medium text-gray-500 flex-1 leading-4">
                UPI and netbanking refunds are credited directly to your bank account within 24 hours. Credit & Debit cards may take 3–5 working days to reflect on your statement.
              </Text>
            </View>
          </View>
        )}

        {/* Delivery Partner Card (if assigned) */}
        {order?.deliveryPersonName && (
          <View className="bg-white rounded-3xl p-4 mb-4 border border-gray-100 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-2xl bg-violet-100 items-center justify-center shadow-xs">
                <Ionicons name="bicycle" size={24} color="#7c3aed" />
              </View>
              <View>
                <Text className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Your Rider
                </Text>
                <Text className="text-base font-black text-gray-900">{order.deliveryPersonName}</Text>
                <Text className="text-xs font-semibold text-gray-500">
                  {order.deliveryPersonPhone ? 'Verified Yumora Partner' : 'Assigned & en route'}
                </Text>
              </View>
            </View>

            {order?.deliveryPersonPhone && (
              <TouchableOpacity
                onPress={handleCallRider}
                className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 items-center justify-center shadow-sm"
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={18} color="#059669" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Pre-Pickup Kitchen Status (Shown while order is in kitchen / awaiting pickup) */}
        {isPrePickup && (
          <View className="bg-amber-50/80 rounded-3xl p-5 mb-4 border border-amber-200/80">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2.5">
                <View className="w-9 h-9 rounded-2xl bg-amber-100 items-center justify-center">
                  <Ionicons
                    name={order?.status === 'Ready for Pickup' ? 'cube' : 'flame'}
                    size={18}
                    color="#d97706"
                  />
                </View>
                <View>
                  <Text className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                    {order?.status === 'Ready for Pickup' ? 'Awaiting Rider Pickup' : 'Kitchen In Progress'}
                  </Text>
                  <Text className="text-sm font-black text-gray-900">
                    {order?.status === 'Ready for Pickup'
                      ? 'Food is Packed & Waiting'
                      : order?.status === 'Preparing'
                      ? 'Chef is Preparing Your Dish'
                      : 'Order Confirmed'}
                  </Text>
                </View>
              </View>

              <View className="bg-white/80 border border-amber-200 px-2.5 py-1 rounded-full">
                <Text className="text-[10px] font-black text-amber-800 uppercase">
                  {order?.status === 'Ready for Pickup' ? 'Ready' : 'In Kitchen'}
                </Text>
              </View>
            </View>

            <Text className="text-xs font-semibold text-gray-600 leading-relaxed mb-3.5">
              {order?.status === 'Ready for Pickup'
                ? `Your food is ready at ${order.restaurantName || 'the restaurant'}. The Live GPS map will open as soon as your rider picks it up.`
                : `Chef is currently preparing your meal fresh. Live road tracking activates the moment your rider picks up the order.`}
            </Text>

            <View className="flex-row items-center justify-between bg-white/80 rounded-2xl px-3.5 py-2.5 border border-amber-200/60">
              <View className="flex-row items-center gap-2">
                <Ionicons name="map" size={15} color="#d97706" />
                <Text className="text-[11px] font-bold text-gray-700">Live Road Map</Text>
              </View>
              <Text className="text-[10px] font-black text-amber-700 uppercase">
                Opens on Pickup
              </Text>
            </View>
          </View>
        )}

        {/* Interactive Live Road Tracking Map (Opens when rider confirms pickup & on the way) */}
        {isOutForDelivery && (
          <LiveTrackingMap
            customerLocation={order.location}
            driverCoords={driverCoords}
            liveETA={liveETA}
            liveDistance={liveDistance}
            isDelivered={false}
          />
        )}

        {/* Delivered Celebration Card (Closes map upon delivery & provides reorder) */}
        {isDelivered && (
          <View className="bg-emerald-50/90 rounded-3xl p-5 mb-4 border border-emerald-200">
            <View className="flex-row items-center gap-3 mb-3">
              <View className="w-12 h-12 rounded-2xl bg-emerald-100 items-center justify-center">
                <Ionicons name="checkmark-done-circle" size={28} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  Order Completed
                </Text>
                <Text className="text-base font-black text-gray-900">
                  Delivered! Enjoy Your Food 🎉
                </Text>
                <Text className="text-xs font-semibold text-gray-600 mt-0.5">
                  Package delivered to {order.address || 'your address'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleReorder}
              className="bg-emerald-600 rounded-2xl py-3 flex-row items-center justify-center gap-2 shadow-xs"
            >
              <Ionicons name="reload" size={15} color="#ffffff" />
              <Text className="text-white text-xs font-black">Reorder Same Dishes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Collapsible Food Items & Bill Receipt Accordion */}
        <View className="bg-white rounded-3xl mb-4 border border-gray-100 shadow-sm overflow-hidden">
          {/* Accordion Toggle Header */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsDetailsExpanded((prev) => !prev)}
            className="p-4 flex-row items-center justify-between bg-white"
          >
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 items-center justify-center">
                <Ionicons name="fast-food-outline" size={20} color="#ea580c" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-black text-gray-900">
                    Order Items ({order.items?.length || 0})
                  </Text>
                  <View className="bg-orange-100 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-black text-primary">₹{grandTotal}</Text>
                  </View>
                </View>
                <Text className="text-xs font-semibold text-gray-500 mt-0.5" numberOfLines={1}>
                  {order.items?.map((it: any) => `${it.quantity}x ${it.name}`).join(', ') || 'View items & bill receipt'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-xl">
              <Text className="text-[11px] font-bold text-gray-700">
                {isDetailsExpanded ? 'Hide' : 'Details'}
              </Text>
              <Ionicons
                name={isDetailsExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#374151"
              />
            </View>
          </TouchableOpacity>

          {/* Expanded Section: Kitchen link, Food items with veg dots & prices, Bill breakdown */}
          {isDetailsExpanded && (
            <View className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50">
              {/* Restaurant info / quick link */}
              {order.restaurantName && (
                <View className="flex-row items-center justify-between pb-3 mb-2.5 border-b border-gray-200/70">
                  <View className="flex-row items-center gap-2 flex-1 pr-2">
                    <Ionicons name="restaurant-outline" size={15} color="#ea580c" />
                    <Text className="text-xs font-bold text-gray-800" numberOfLines={1}>
                      Kitchen: {order.restaurantName}
                    </Text>
                  </View>
                  {order.restaurantId && (
                    <TouchableOpacity
                      onPress={() => router.push(`/restaurant/${order.restaurantId}`)}
                      className="flex-row items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-lg"
                    >
                      <Text className="text-[10px] font-black text-primary">View Menu</Text>
                      <Ionicons name="chevron-forward" size={11} color="#ea580c" />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Food Items List */}
              <Text className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                Food Items
              </Text>
              {order.items?.map((item: any, idx: number) => (
                <View
                  key={idx}
                  className="flex-row items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                >
                  <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                    <View
                      className={`w-3.5 h-3.5 rounded-sm border items-center justify-center ${
                        item.isVeg !== false ? 'border-green-600' : 'border-red-600'
                      }`}
                    >
                      <View
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.isVeg !== false ? 'bg-green-600' : 'bg-red-600'
                        }`}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-black text-gray-900">{item.name}</Text>
                      <Text className="text-[11px] font-semibold text-gray-500">
                        {item.quantity} × ₹{item.price}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-xs font-black text-gray-900">
                    ₹{(item.price || 0) * (item.quantity || 1)}
                  </Text>
                </View>
              ))}

              {/* Bill Receipt Breakdown */}
              <View className="mt-3 pt-3 border-t border-gray-200/80">
                <Text className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                  Bill Receipt
                </Text>

                <View className="flex-row justify-between py-1">
                  <Text className="text-xs font-semibold text-gray-500">Item Subtotal</Text>
                  <Text className="text-xs font-bold text-gray-800">₹{foodSubtotal}</Text>
                </View>

                <View className="flex-row justify-between py-1">
                  <Text className="text-xs font-semibold text-gray-500">Restaurant Packaging</Text>
                  <Text className="text-xs font-bold text-gray-800">₹{packagingFee}</Text>
                </View>

                <View className="flex-row justify-between py-1">
                  <Text className="text-xs font-semibold text-gray-500">Delivery Fee</Text>
                  <Text className="text-xs font-bold text-gray-800">
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </Text>
                </View>

                <View className="flex-row justify-between py-1">
                  <Text className="text-xs font-semibold text-gray-500">Platform Fee</Text>
                  <Text className="text-xs font-bold text-gray-800">₹{platformFee}</Text>
                </View>

                <View className="flex-row justify-between py-1 border-b border-gray-200 pb-2">
                  <Text className="text-xs font-semibold text-gray-500">Taxes & GST (5%)</Text>
                  <Text className="text-xs font-bold text-gray-800">₹{tax}</Text>
                </View>

                <View className="flex-row justify-between pt-2.5">
                  <Text className="text-sm font-black text-gray-900">Grand Total Paid</Text>
                  <Text className="text-base font-black text-primary">₹{grandTotal}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Delivery & Payment Information */}
        <View className="bg-white rounded-3xl p-4 mb-6 border border-gray-100 shadow-sm">
          <Text className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
            Delivery & Payment Info
          </Text>

          <View className="flex-row items-start gap-2.5 mb-3">
            <Ionicons name="location-outline" size={18} color="#ea580c" />
            <View className="flex-1">
              <Text className="text-xs font-black text-gray-900">Delivery Address</Text>
              <Text className="text-xs font-semibold text-gray-500 mt-0.5">{order.address}</Text>
              {order.phone && (
                <Text className="text-xs font-bold text-gray-500 mt-1">Phone: {order.phone}</Text>
              )}
            </View>
          </View>

          <View className="flex-row items-center gap-2.5 pt-2 border-t border-gray-50">
            <Ionicons name="card-outline" size={18} color="#ea580c" />
            <View className="flex-1">
              <Text className="text-xs font-black text-gray-900">Payment Mode</Text>
              <Text className="text-xs font-semibold text-gray-500">
                {order.paymentMethod?.toUpperCase() || 'ONLINE / UPI'} •{' '}
                <Text className="text-emerald-600 font-black">
                  {order.paymentStatus === 'Success' || !order.paymentStatus ? 'Paid' : order.paymentStatus}
                </Text>
              </Text>
            </View>
          </View>

          {order.createdAt && (
            <View className="flex-row items-center gap-2.5 pt-2 border-t border-gray-50 mt-2">
              <Ionicons name="calendar-outline" size={18} color="#ea580c" />
              <View className="flex-1">
                <Text className="text-xs font-black text-gray-900">Order Placed On</Text>
                <Text className="text-xs font-semibold text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Controls */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        {order.status === 'Placed' ? (
          <TouchableOpacity
            disabled={cancelling}
            activeOpacity={0.88}
            onPress={handleCancelOrder}
            className="bg-red-50 border border-red-200 rounded-2xl py-3.5 items-center justify-center flex-row gap-2 shadow-sm"
          >
            {cancelling ? (
              <ActivityIndicator color="#dc2626" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color="#dc2626" />
                <Text className="text-red-600 text-sm font-black uppercase">Cancel This Order</Text>
              </>
            )}
          </TouchableOpacity>
        ) : isLive ? (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl py-3 px-4 flex-row items-center justify-center gap-2">
            <Ionicons name="restaurant" size={16} color="#d97706" />
            <Text className="text-amber-800 text-xs font-bold text-center">
              Kitchen is preparing your food • Cancellation window closed
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleReorder}
            className="bg-primary rounded-2xl py-3.5 items-center justify-center flex-row gap-2 shadow-lg"
          >
            <Ionicons name="repeat-outline" size={20} color="#ffffff" />
            <Text className="text-white text-base font-black">Reorder This Meal</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
