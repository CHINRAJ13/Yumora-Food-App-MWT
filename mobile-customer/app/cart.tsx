import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../src/store/useCartStore';

const DELIVERY_INSTRUCTIONS = [
  { id: 'nobell', label: "Don't ring bell", icon: 'notifications-off-outline' as const },
  { id: 'door', label: 'Leave at door', icon: 'home-outline' as const },
  { id: 'nocall', label: 'Avoid calling', icon: 'volume-mute-outline' as const },
];

export default function CartModal() {
  const router = useRouter();
  const { items, restaurantId, restaurantName, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [selectedInstruction, setSelectedInstruction] = useState<string | null>(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Basket?',
      'Are you sure you want to remove all items from your basket?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Clear', style: 'destructive', onPress: clearCart },
      ]
    );
  };

  const handleAddMore = () => {
    if (restaurantId) {
      router.push(`/restaurant/${restaurantId}`);
    } else {
      router.push('/(tabs)');
    }
  };

  const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const foodSubtotal = getTotalPrice();
  const packagingFee = items.length > 0 ? 20 : 0;
  const deliveryFee = foodSubtotal > 199 || items.length === 0 ? 0 : 30;
  const platformFee = items.length > 0 ? 5 : 0;
  const gstTax = Math.round((foodSubtotal + packagingFee) * 0.05);
  const grandTotal = foodSubtotal + packagingFee + deliveryFee + platformFee + gstTax;

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <View className="w-20 h-20 rounded-full bg-orange-50 border border-orange-100 items-center justify-center mb-4">
          <Ionicons name="cart-outline" size={38} color="#ea580c" />
        </View>
        <Text numberOfLines={1} className="text-xl font-black text-gray-900 text-center mb-1">
          Your cart is empty
        </Text>
        <Text className="text-xs text-gray-500 font-semibold text-center mb-6">
          Explore restaurants and add some tasty dishes!
        </Text>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleBack}
          style={{ elevation: 2 }}
          className="bg-primary px-8 py-3.5 rounded-2xl flex-row items-center gap-2"
        >
          <Text className="text-white font-black text-sm">Explore Restaurants</Text>
          <Ionicons name="arrow-forward" size={16} color="#ffffff" />
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
            onPress={handleBack}
            className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 items-center justify-center shadow-xs"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              Ordering from
            </Text>
            <Text className="text-base font-black text-gray-900" numberOfLines={1}>
              {restaurantName || 'Restaurant'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleClearCart}
          className="w-9 h-9 rounded-full bg-red-50 border border-red-100 items-center justify-center shadow-xs"
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={17} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-5 pt-4 bg-white"
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Dishes List Card */}
        <View
          className="bg-white rounded-3xl p-4 mb-4 border border-gray-100 shadow-sm"
          style={{ elevation: 1 }}
        >
          <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-gray-50">
            <Text className="text-xs font-black text-gray-900 uppercase tracking-wider">
              Items Added ({totalItemsCount})
            </Text>
            <TouchableOpacity onPress={handleAddMore} activeOpacity={0.7}>
              <Text className="text-xs font-black text-primary">+ Add More</Text>
            </TouchableOpacity>
          </View>

          {items.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center py-3 border-b border-gray-100/70 last:border-b-0"
            >
              {/* Dish Image Thumbnail with Veg/Non-Veg Badge */}
              <View className="relative mr-3">
                {item.image && !imageErrors[item.id] ? (
                  <Image
                    source={{ uri: item.image }}
                    onError={() => setImageErrors((prev) => ({ ...prev, [item.id]: true }))}
                    className="w-14 h-14 rounded-2xl bg-gray-100"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 items-center justify-center">
                    <Ionicons name="fast-food-outline" size={22} color="#ea580c" />
                  </View>
                )}

                {/* Veg/Non-Veg Dot Badge */}
                <View
                  className={`absolute -top-1 -left-1 w-4 h-4 rounded-sm border bg-white items-center justify-center shadow-xs ${
                    item.isVeg !== false ? 'border-green-600' : 'border-red-600'
                  }`}
                >
                  <View
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.isVeg !== false ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  />
                </View>
              </View>

              {/* Item Details */}
              <View className="flex-1 pr-2">
                <Text className="text-sm font-black text-gray-900 leading-snug" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-xs font-bold text-gray-500 mt-0.5">₹{item.price}</Text>
              </View>

              {/* Stepper Counter */}
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 mr-2.5">
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  className="p-0.5"
                >
                  <Ionicons
                    name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                    size={14}
                    color={item.quantity === 1 ? '#ef4444' : '#374151'}
                  />
                </TouchableOpacity>

                <Text className="font-black text-gray-900 text-xs px-2 min-w-[18px] text-center">
                  {item.quantity}
                </Text>

                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-0.5"
                >
                  <Ionicons name="add" size={14} color="#16a34a" />
                </TouchableOpacity>
              </View>

              {/* Line Subtotal */}
              <Text className="text-sm font-black text-gray-900 min-w-[50px] text-right">
                ₹{item.price * item.quantity}
              </Text>
            </View>
          ))}

          {/* Quick Add More Items Shortcut Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleAddMore}
            className="flex-row items-center justify-center gap-1.5 py-2.5 mt-3 rounded-2xl bg-orange-50/70 border border-orange-100"
          >
            <Ionicons name="add-circle-outline" size={16} color="#ea580c" />
            <Text className="text-xs font-black text-primary">+ Add More Items from Menu</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Preferences / Instructions Card */}
        <View
          className="bg-white rounded-3xl p-4 mb-4 border border-gray-100 shadow-sm"
          style={{ elevation: 1 }}
        >
          <Text className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2.5">
            Delivery Instructions
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {DELIVERY_INSTRUCTIONS.map((instr) => {
              const isSelected = selectedInstruction === instr.id;
              return (
                <TouchableOpacity
                  key={instr.id}
                  activeOpacity={0.75}
                  onPress={() =>
                    setSelectedInstruction((prev) => (prev === instr.id ? null : instr.id))
                  }
                  className={`flex-row items-center gap-1.5 px-3 py-2 rounded-2xl border ${
                    isSelected
                      ? 'bg-orange-50 border-orange-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Ionicons
                    name={instr.icon}
                    size={14}
                    color={isSelected ? '#ea580c' : '#6b7280'}
                  />
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-primary font-black' : 'text-gray-700'
                    }`}
                  >
                    {instr.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bill Breakdown Card */}
        <View
          className="bg-white rounded-3xl p-4 mb-6 border border-gray-100 shadow-sm"
          style={{ elevation: 1 }}
        >
          <Text className="text-xs font-black text-gray-900 uppercase tracking-wider mb-3">
            Bill Details
          </Text>

          <View className="flex-row justify-between py-1.5">
            <Text className="text-xs font-semibold text-gray-500">Item Subtotal</Text>
            <Text className="text-xs font-black text-gray-900">₹{foodSubtotal}</Text>
          </View>

          <View className="flex-row justify-between py-1.5">
            <Text className="text-xs font-semibold text-gray-500">Restaurant Packaging</Text>
            <Text className="text-xs font-black text-gray-900">₹{packagingFee}</Text>
          </View>

          <View className="flex-row justify-between py-1.5">
            <Text className="text-xs font-semibold text-gray-500">Delivery Fee</Text>
            <Text className="text-xs font-black text-gray-900">
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>

          <View className="flex-row justify-between py-1.5">
            <Text className="text-xs font-semibold text-gray-500">Platform Fee</Text>
            <Text className="text-xs font-black text-gray-900">₹{platformFee}</Text>
          </View>

          <View className="flex-row justify-between py-1.5 border-b border-gray-100 pb-2">
            <Text className="text-xs font-semibold text-gray-500">Taxes & Charges (GST 5%)</Text>
            <Text className="text-xs font-black text-gray-900">₹{gstTax}</Text>
          </View>

          <View className="flex-row justify-between pt-3">
            <Text className="text-base font-black text-gray-900">Total To Pay</Text>
            <Text className="text-base font-black text-primary">₹{grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 py-3.5 bg-white border-t border-gray-100 flex-row items-center justify-between"
        style={{ elevation: 4 }}
      >
        <View>
          <Text className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
            Total to Pay
          </Text>
          <View className="flex-row items-baseline gap-1.5">
            <Text className="text-xl font-black text-gray-900">₹{grandTotal}</Text>
            <Text className="text-[11px] font-bold text-gray-400">
              ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push('/checkout')}
          className="bg-primary px-6 py-3.5 rounded-2xl flex-row items-center gap-2 shadow-sm"
        >
          <Text className="text-white text-sm font-black uppercase tracking-wider">
            Proceed to Pay
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
