import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRestaurants, getCategories } from '../../src/api';
import { MenuItemCard } from '../../src/components/MenuItemCard';
import { RestaurantCard } from '../../src/components/RestaurantCard';
import { useCartStore } from '../../src/store/useCartStore';
import { Restaurant, MenuItem } from '../../src/types';

interface FlatDishItem extends MenuItem {
  restaurantId: string;
  restaurantName: string;
  isRestaurantOffline?: boolean;
}

const POPULAR_CATEGORIES = [
  'All',
  'Biryani',
  'Pizza',
  'Burgers',
  'South Indian',
  'Chinese',
  'Desserts',
  'Beverages',
];

export default function MenuScreen() {
  const router = useRouter();
  const totalCartItems = useCartStore((state) => state.getTotalItems());

  const [query, setQuery] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRestaurants()
      .then((res: any) => {
        if (res.data) setRestaurants(res.data);
      })
      .catch((e) => console.error('Error fetching menu restaurants:', e))
      .finally(() => setLoading(false));
  }, []);

  // Flatten all dishes across restaurants
  const allDishes = useMemo(() => {
    const list: FlatDishItem[] = [];
    restaurants.forEach((r) => {
      const isOffline = r.acceptsOrders === false;
      if (r.menu && Array.isArray(r.menu)) {
        r.menu.forEach((item) => {
          list.push({
            ...item,
            restaurantId: r.id || (r as any)._id,
            restaurantName: r.name,
            isRestaurantOffline: isOffline,
          });
        });
      }
    });
    return list;
  }, [restaurants]);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return allDishes.filter((dish) => {
      // Query search match
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesName = dish.name.toLowerCase().includes(q);
        const matchesDesc = dish.description?.toLowerCase().includes(q);
        const matchesCat = dish.category?.toLowerCase().includes(q);
        const matchesRest = dish.restaurantName.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat && !matchesRest) {
          return false;
        }
      }

      // Category match
      if (selectedCategory !== 'All') {
        const cat = selectedCategory.toLowerCase();
        const matchesCat =
          dish.category?.toLowerCase().includes(cat) ||
          dish.name.toLowerCase().includes(cat);
        if (!matchesCat) return false;
      }

      // Diet filter match
      if (dietFilter === 'veg' && !dish.isVeg) return false;
      if (dietFilter === 'non-veg' && dish.isVeg) return false;

      return true;
    });
  }, [allDishes, query, selectedCategory, dietFilter]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Header & Search Bar */}
      <View className="px-5 pt-3 pb-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-1 mr-3">
            <Text className="text-xl font-black text-gray-900">Explore Menu</Text>
            <Text className="text-xs font-semibold text-gray-500 mt-0.5">
              Find tasty dishes from Coimbatore restaurants
            </Text>
          </View>

          {/* Cart Icon with Live Count Badge */}
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

        {/* Search Input */}
        <View className="bg-gray-100 rounded-2xl flex-row items-center px-3.5 py-2.5">
          <Ionicons name="search-outline" size={18} color="#ea580c" />
          <TextInput
            placeholder="Search dishes (e.g. Biryani, Dosa, Shake)..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            className="flex-1 ml-2 text-xs font-bold text-gray-900"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row mt-3 -mx-1"
        >
          {POPULAR_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
                className={`px-3.5 py-1.5 rounded-xl mr-2 ${
                  isSelected
                    ? 'bg-primary'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-black ${
                    isSelected ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Diet Filters: Veg / Non-Veg */}
        <View className="flex-row items-center gap-2 mt-2.5">
          <TouchableOpacity
            onPress={() => setDietFilter('all')}
            className={`px-3 py-1 rounded-full border ${
              dietFilter === 'all'
                ? 'bg-gray-900 border-gray-900'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-[10px] font-black uppercase ${
                dietFilter === 'all' ? 'text-white' : 'text-gray-600'
              }`}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDietFilter(dietFilter === 'veg' ? 'all' : 'veg')}
            className={`px-3 py-1 rounded-full border flex-row items-center gap-1 ${
              dietFilter === 'veg'
                ? 'bg-emerald-600 border-emerald-600'
                : 'bg-white border-emerald-300'
            }`}
          >
            <View className="w-2 h-2 rounded-full bg-emerald-500" />
            <Text
              className={`text-[10px] font-black uppercase ${
                dietFilter === 'veg' ? 'text-white' : 'text-emerald-700'
              }`}
            >
              Pure Veg
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDietFilter(dietFilter === 'non-veg' ? 'all' : 'non-veg')}
            className={`px-3 py-1 rounded-full border flex-row items-center gap-1 ${
              dietFilter === 'non-veg'
                ? 'bg-rose-600 border-rose-600'
                : 'bg-white border-rose-300'
            }`}
          >
            <View className="w-2 h-2 rounded-full bg-rose-500" />
            <Text
              className={`text-[10px] font-black uppercase ${
                dietFilter === 'non-veg' ? 'text-white' : 'text-rose-700'
              }`}
            >
              Non-Veg
            </Text>
          </TouchableOpacity>

          <View className="flex-1 items-end">
            <Text className="text-xs font-bold text-gray-500">
              {filteredDishes.length} dish{filteredDishes.length === 1 ? '' : 'es'}
            </Text>
          </View>
        </View>
      </View>

      {/* Dishes List */}
      <ScrollView
        className="flex-1 px-5 pt-4 bg-white"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#ea580c" />
            <Text className="text-xs font-bold text-gray-500 mt-3">
              Loading tasty dishes...
            </Text>
          </View>
        ) : filteredDishes.length > 0 ? (
          filteredDishes.map((dish) => (
            <MenuItemCard
              key={`${dish.restaurantId}-${dish.id || (dish as any)._id}`}
              item={dish}
              restaurantId={dish.restaurantId}
              restaurantName={dish.restaurantName}
              isOffline={dish.isRestaurantOffline}
            />
          ))
        ) : (
          <View className="py-24 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-orange-50 items-center justify-center mb-3">
              <Ionicons name="restaurant-outline" size={32} color="#ea580c" />
            </View>
            <Text className="text-sm font-black text-gray-900">
              No matching dishes found
            </Text>
            <Text className="text-xs text-gray-500 font-semibold text-center mt-1 px-8">
              Try searching for different items or clearing your category filters
            </Text>
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setSelectedCategory('All');
                setDietFilter('all');
              }}
              className="mt-4 bg-gray-100 px-4 py-2 rounded-xl"
            >
              <Text className="text-xs font-black text-gray-700">Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
