import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRestaurantById } from '../../src/api';
import { MenuItemCard } from '../../src/components/MenuItemCard';
import { useCartStore } from '../../src/store/useCartStore';
import { Restaurant } from '../../src/types';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { items, getTotalItems, getTotalPrice } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  useEffect(() => {
    if (!id) return;
    getRestaurantById(id)
      .then((res: any) => {
        if (res.data) setRestaurant(res.data);
      })
      .catch((e) => console.error('Error fetching restaurant', e))
      .finally(() => setLoading(false));
  }, [id]);

  const isOnline = restaurant?.acceptsOrders !== false;

  const categories = useMemo(() => {
    if (!restaurant?.menu) return [];
    return Array.from(new Set(restaurant.menu.map((m) => m.category)));
  }, [restaurant]);

  const filteredMenu = useMemo(() => {
    if (!restaurant?.menu) return [];
    if (!activeCategory) return restaurant.menu;
    return restaurant.menu.filter((m) => m.category === activeCategory);
  }, [restaurant, activeCategory]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-base font-black text-gray-900 mb-2">Restaurant Not Found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary px-6 py-2.5 rounded-xl mt-3"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header Banner */}
      <View className="relative w-full h-56 bg-gray-900">
        <Image
          source={{ uri: restaurant.image }}
          className="w-full h-full opacity-80"
          resizeMode="cover"
        />
        <SafeAreaView className="absolute top-0 left-0 right-0 p-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-md"
          >
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <ScrollView className="flex-1 px-5 -mt-6">
        {/* Info Card */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          {/* Offline Notice Banner */}
          {!isOnline && (
            <View className="mb-4 p-3.5 bg-gray-900 rounded-2xl flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <View className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <Text className="text-white text-xs font-bold leading-tight">
                  Currently Offline — Menu browsing only
                </Text>
              </View>
              <View className="bg-white/10 px-2.5 py-1 rounded-md">
                <Text className="text-gray-300 text-[9px] font-black uppercase">Closed</Text>
              </View>
            </View>
          )}

          <View className="flex-row items-start justify-between mb-2">
            <Text className="text-xl font-black text-gray-900 flex-1 mr-2 leading-tight">
              {restaurant.name}
            </Text>
            <View className="flex-row items-center bg-green-600 px-2.5 py-1 rounded-full gap-1">
              <Ionicons name="star" size={11} color="#ffffff" />
              <Text className="text-white text-xs font-black">{restaurant.rating}</Text>
            </View>
          </View>

          <Text className="text-xs text-gray-400 font-bold uppercase mb-3">
            {restaurant.cuisines?.join(' • ')}
          </Text>

          <View className="flex-row items-center gap-4 pt-3 border-t border-gray-100">
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={13} color="#9ca3af" />
              <Text className="text-xs font-bold text-gray-600">
                {restaurant.deliveryTime}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="location-outline" size={13} color="#9ca3af" />
              <Text className="text-xs font-bold text-gray-600">
                {restaurant.distance || 'Coimbatore'}
              </Text>
            </View>
            <Text className="text-xs font-bold text-gray-600">
              ₹{restaurant.priceForTwo} for two
            </Text>
          </View>
        </View>

        {/* Category Tabs */}
        {categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
            <TouchableOpacity
              onPress={() => setActiveCategory(null)}
              className={`px-3.5 py-1.5 rounded-xl mr-2 ${
                !activeCategory ? 'bg-gray-900' : 'bg-white border border-gray-200'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  !activeCategory ? 'text-white' : 'text-gray-600'
                }`}
              >
                All Dishes
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl mr-2 ${
                  activeCategory === cat ? 'bg-gray-900' : 'bg-white border border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    activeCategory === cat ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Menu Items List */}
        <View className="pb-28">
          {filteredMenu.map((item) => (
            <MenuItemCard
              key={item.id || item._id}
              item={item}
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
              isOffline={!isOnline}
            />
          ))}
        </View>
      </ScrollView>

      {/* Floating Cart Bar (Only displayed if restaurant is online and has items) */}
      {totalItems > 0 && isOnline && (
        <SafeAreaView className="absolute bottom-5 left-5 right-5">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/cart')}
            className="bg-primary rounded-2xl p-4 flex-row items-center justify-between shadow-xl"
          >
            <View>
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                {totalItems} item{totalItems > 1 ? 's' : ''} added
              </Text>
              <Text className="text-white text-base font-black">₹{totalPrice}</Text>
            </View>
            <View className="flex-row items-center gap-1.5 bg-white/20 px-3.5 py-2 rounded-xl">
              <Text className="text-white text-xs font-black uppercase">View Cart</Text>
              <Ionicons name="cart" size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
}
