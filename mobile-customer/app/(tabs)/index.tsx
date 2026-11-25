import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RestaurantCard } from '../../src/components/RestaurantCard';
import { ProfileMenuModal } from '../../src/components/ProfileMenuModal';
import { getRestaurants, getCategories, getUserOrdersApi } from '../../src/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { getCurrentAddressFromGPS } from '../../src/services/locationService';
import { Restaurant } from '../../src/types';

type VegFilterMode = 'all' | 'veg' | 'non-veg';
type SortOption = 'relevance' | 'nearest' | 'rating' | 'fastest';

const parseDistanceKm = (dist?: string): number => {
  if (!dist) return 999;
  const match = dist.match(/([0-9.]+)/);
  return match ? parseFloat(match[1]) : 999;
};

const parseDeliveryMins = (time?: string): number => {
  if (!time) return 999;
  const match = time.match(/([0-9]+)/);
  return match ? parseInt(match[1], 10) : 999;
};

const getCategoryIcon = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('biryani') || n.includes('rice')) return '🍗';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('burger')) return '🍔';
  if (n.includes('south') || n.includes('dosa') || n.includes('idli')) return '🥞';
  if (n.includes('chinese') || n.includes('noodle')) return '🍜';
  if (n.includes('dessert') || n.includes('sweet') || n.includes('cake') || n.includes('ice cream')) return '🍰';
  if (n.includes('drink') || n.includes('beverage') || n.includes('shake') || n.includes('juice') || n.includes('tea') || n.includes('coffee')) return '🥤';
  if (n.includes('roll') || n.includes('wrap') || n.includes('shawarma')) return '🌯';
  if (n.includes('sandwich')) return '🥪';
  if (n.includes('healthy') || n.includes('salad')) return '🥗';
  return '🍽️';
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // New Filters & Sorting State
  const [vegFilter, setVegFilter] = useState<VegFilterMode>('all');
  const [fastDeliveryOnly, setFastDeliveryOnly] = useState(false);
  const [rating4PlusOnly, setRating4PlusOnly] = useState(false);
  const [offersOnly, setOffersOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  // Progressive Batch Rendering (4 by 4)
  const [visibleCount, setVisibleCount] = useState(4);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Active Ongoing Order
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  const fetchActiveOrder = useCallback(async () => {
    if (!token) {
      setActiveOrder(null);
      return;
    }
    try {
      const res: any = await getUserOrdersApi();
      if (res?.data && Array.isArray(res.data)) {
        const ongoing = res.data.find(
          (o: any) => o.status && !['Delivered', 'Cancelled'].includes(o.status)
        );
        setActiveOrder(ongoing || null);
      }
    } catch {
      setActiveOrder(null);
    }
  }, [token]);

  const fetchData = useCallback(async () => {
    try {
      const [restRes, catRes]: any = await Promise.all([
        getRestaurants(),
        getCategories().catch(() => ({ data: [] })),
      ]);
      if (restRes?.data) setRestaurants(restRes.data);
      if (catRes?.data) setCategories(catRes.data);
      await fetchActiveOrder();
    } catch (e) {
      console.error('Error fetching home data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchActiveOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check if any filter is actively applied
  const hasActiveFilters = useMemo(() => {
    return (
      vegFilter !== 'all' ||
      fastDeliveryOnly ||
      rating4PlusOnly ||
      offersOnly ||
      sortBy !== 'relevance' ||
      activeCategory !== null ||
      search.trim().length > 0
    );
  }, [vegFilter, fastDeliveryOnly, rating4PlusOnly, offersOnly, sortBy, activeCategory, search]);

  const handleResetFilters = () => {
    setVegFilter('all');
    setFastDeliveryOnly(false);
    setRating4PlusOnly(false);
    setOffersOnly(false);
    setSortBy('relevance');
    setActiveCategory(null);
    setSearch('');
    setVisibleCount(4);
  };

  // Top Rated spotlight restaurants (Rating >= 4.4 and online)
  const topRatedRestaurants = useMemo(() => {
    return restaurants
      .filter((r) => (r.rating || 0) >= 4.4 && r.acceptsOrders !== false)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }, [restaurants]);

  // Filtered & Sorted main list
  const filteredRestaurants = useMemo(() => {
    let list = [...restaurants];

    // 1. Text Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisines?.some((c) => c.toLowerCase().includes(q)) ||
          r.menu?.some((m) => m.name.toLowerCase().includes(q))
      );
    }

    // 2. Category / Cuisine
    if (activeCategory) {
      list = list.filter((r) =>
        r.cuisines?.some((c) => c.toLowerCase().includes(activeCategory.toLowerCase()))
      );
    }

    // 3. Veg / Non-Veg Filtering
    if (vegFilter === 'veg') {
      list = list.filter((r) => r.isVeg === true || r.menu?.some((m) => m.isVeg));
    } else if (vegFilter === 'non-veg') {
      list = list.filter((r) => r.isVeg === false || r.menu?.some((m) => !m.isVeg));
    }

    // 4. Rating 4.0+
    if (rating4PlusOnly) {
      list = list.filter((r) => (r.rating || 0) >= 4.0);
    }

    // 5. Fast Delivery (<= 30 mins or <= 3.0 km)
    if (fastDeliveryOnly) {
      list = list.filter((r) => {
        const mins = parseDeliveryMins(r.deliveryTime);
        const km = parseDistanceKm(r.distance);
        return mins <= 30 || km <= 3.0;
      });
    }

    // 6. Offers Only
    if (offersOnly) {
      list = list.filter((r) => Boolean(r.offer));
    }

    // 7. Sorting
    if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'nearest') {
      list.sort((a, b) => parseDistanceKm(a.distance) - parseDistanceKm(b.distance));
    } else if (sortBy === 'fastest') {
      list.sort((a, b) => parseDeliveryMins(a.deliveryTime) - parseDeliveryMins(b.deliveryTime));
    }

    return list;
  }, [
    restaurants,
    search,
    activeCategory,
    vegFilter,
    rating4PlusOnly,
    fastDeliveryOnly,
    offersOnly,
    sortBy,
  ]);

  // Reset visibleCount whenever any filter or search changes
  useEffect(() => {
    setVisibleCount(4);
  }, [search, activeCategory, vegFilter, fastDeliveryOnly, rating4PlusOnly, offersOnly, sortBy]);

  // Slice list for progressive 4-by-4 rendering
  const visibleRestaurants = useMemo(() => {
    return filteredRestaurants.slice(0, visibleCount);
  }, [filteredRestaurants, visibleCount]);

  // Infinite scroll trigger: load next 4 when near bottom
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;

    if (isCloseToBottom && !isLoadingMore && visibleCount < filteredRestaurants.length) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + 4, filteredRestaurants.length));
        setIsLoadingMore(false);
      }, 250);
    }
  };

  const [isLocating, setIsLocating] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  const handleQuickDetectLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await getCurrentAddressFromGPS();
      setCurrentAddress(loc.address);
      Alert.alert('📍 Location Updated', `Delivering to:\n${loc.address}`);
    } catch (err: any) {
      Alert.alert('Location Access', err?.message || 'Could not fetch current GPS location.');
    } finally {
      setIsLocating(false);
    }
  };

  const displayAddress = useMemo(() => {
    if (currentAddress) {
      return currentAddress.split(',')[0].trim();
    }
    if (user?.address) {
      return user.address.split(',')[0].trim();
    }
    return 'Coimbatore Central';
  }, [currentAddress, user?.address]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Location & Profile Header */}
      <View className="px-5 pt-3 pb-3 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={handleQuickDetectLocation}
          disabled={isLocating}
          activeOpacity={0.7}
          className="flex-row items-center gap-2.5 flex-1 mr-2"
        >
          <View className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center">
            {isLocating ? (
              <ActivityIndicator size="small" color="#ea580c" />
            ) : (
              <Ionicons name="location-sharp" size={16} color="#ea580c" />
            )}
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              <Text className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Delivering to
              </Text>
              <Ionicons name="chevron-down" size={10} color="#ea580c" />
            </View>
            <Text numberOfLines={1} className="text-sm font-black text-gray-900">
              {displayAddress}
            </Text>
          </View>
        </TouchableOpacity>

        {/* User Profile Avatar / Sign In Button */}
        {token && user ? (
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.8}
            className="flex-row items-center pl-2"
          >
            <View className="relative">
              <View className="w-9 h-9 rounded-full bg-orange-600 items-center justify-center shadow-sm">
                <Text className="text-white text-xs font-black">
                  {user.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'U'}
                </Text>
              </View>
              <View className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
            className="flex-row items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full"
          >
            <Ionicons name="log-in-outline" size={15} color="#ea580c" />
            <Text className="text-primary text-xs font-black uppercase tracking-wider">
              Sign In
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
          />
        }
        className="flex-1 bg-white"
      >
        {/* Search Bar with Clear Button */}
        <View className="px-5 pt-3 mb-2">
          <View className="bg-gray-50 rounded-2xl flex-row items-center px-4 py-2.5 border border-gray-200/80">
            <Ionicons name="search-outline" size={18} color="#9ca3af" />
            <TextInput
              placeholder="Search restaurants, cuisines or dishes..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-2.5 text-sm font-semibold text-gray-900"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} className="p-1">
                <Ionicons name="close-circle" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Filter Pills Row (Veg, Fast Delivery, Rating, Offers) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          className="flex-row py-2 mb-3"
        >
          {/* Veg Toggle Pill */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setVegFilter(vegFilter === 'veg' ? 'all' : 'veg')}
            className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl mr-2 border ${
              vegFilter === 'veg'
                ? 'bg-emerald-600 border-emerald-600'
                : 'bg-white border-gray-200'
            }`}
          >
            <View
              className={`w-3.5 h-3.5 rounded-sm border items-center justify-center ${
                vegFilter === 'veg' ? 'border-white bg-white' : 'border-green-600'
              }`}
            >
              <View
                className={`w-1.5 h-1.5 rounded-full ${
                  vegFilter === 'veg' ? 'bg-emerald-600' : 'bg-green-600'
                }`}
              />
            </View>
            <Text
              className={`text-xs font-black ${
                vegFilter === 'veg' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Pure Veg
            </Text>
          </TouchableOpacity>

          {/* Non-Veg Toggle Pill */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setVegFilter(vegFilter === 'non-veg' ? 'all' : 'non-veg')}
            className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl mr-2 border ${
              vegFilter === 'non-veg'
                ? 'bg-red-600 border-red-600'
                : 'bg-white border-gray-200'
            }`}
          >
            <View
              className={`w-3.5 h-3.5 rounded-sm border items-center justify-center ${
                vegFilter === 'non-veg' ? 'border-white bg-white' : 'border-red-600'
              }`}
            >
              <View
                className={`w-1.5 h-1.5 rounded-full ${
                  vegFilter === 'non-veg' ? 'bg-red-600' : 'bg-red-600'
                }`}
              />
            </View>
            <Text
              className={`text-xs font-black ${
                vegFilter === 'non-veg' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Non-Veg
            </Text>
          </TouchableOpacity>

          {/* Fast Delivery (<30 mins) */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setFastDeliveryOnly((prev) => !prev)}
            className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl mr-2 border ${
              fastDeliveryOnly
                ? 'bg-primary border-primary'
                : 'bg-white border-gray-200'
            }`}
          >
            <Ionicons
              name="flash"
              size={13}
              color={fastDeliveryOnly ? '#ffffff' : '#ea580c'}
            />
            <Text
              className={`text-xs font-black ${
                fastDeliveryOnly ? 'text-white' : 'text-gray-700'
              }`}
            >
              Fast (&lt;30m)
            </Text>
          </TouchableOpacity>

          {/* Rating 4.0+ */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setRating4PlusOnly((prev) => !prev)}
            className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl mr-2 border ${
              rating4PlusOnly
                ? 'bg-primary border-primary'
                : 'bg-white border-gray-200'
            }`}
          >
            <Ionicons
              name="star"
              size={12}
              color={rating4PlusOnly ? '#ffffff' : '#f59e0b'}
            />
            <Text
              className={`text-xs font-black ${
                rating4PlusOnly ? 'text-white' : 'text-gray-700'
              }`}
            >
              Rating 4.0+
            </Text>
          </TouchableOpacity>

          {/* Offers Only */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setOffersOnly((prev) => !prev)}
            className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl mr-2 border ${
              offersOnly
                ? 'bg-primary border-primary'
                : 'bg-white border-gray-200'
            }`}
          >
            <Ionicons
              name="pricetag"
              size={12}
              color={offersOnly ? '#ffffff' : '#ea580c'}
            />
            <Text
              className={`text-xs font-black ${
                offersOnly ? 'text-white' : 'text-gray-700'
              }`}
            >
              Offers
            </Text>
          </TouchableOpacity>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleResetFilters}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200"
            >
              <Ionicons name="close" size={13} color="#4b5563" />
              <Text className="text-xs font-bold text-gray-700">Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Visual "What's On Your Mind?" Cuisine Bubbles */}
        {categories.length > 0 && (
          <View className="mb-5">
            <View className="px-5 mb-2.5 flex-row items-center justify-between">
              <Text className="text-base font-black text-gray-900 tracking-tight">
                What's on your mind?
              </Text>
              {activeCategory && (
                <TouchableOpacity onPress={() => setActiveCategory(null)}>
                  <Text className="text-xs font-bold text-primary">Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              className="flex-row"
            >
              {/* "All" Bubble */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveCategory(null)}
                className={`items-center mr-3 px-3.5 py-2 rounded-2xl border ${
                  !activeCategory
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text className="text-xl mb-1">🍽️</Text>
                <Text
                  className={`text-[11px] font-black ${
                    !activeCategory ? 'text-primary' : 'text-gray-700'
                  }`}
                >
                  All
                </Text>
              </TouchableOpacity>

              {categories.map((cat: any) => {
                const catName = cat.name || '';
                const isSelected = activeCategory === catName;
                const emoji = getCategoryIcon(catName);

                return (
                  <TouchableOpacity
                    key={cat._id || cat.id || catName}
                    activeOpacity={0.8}
                    onPress={() =>
                      setActiveCategory(isSelected ? null : catName)
                    }
                    className={`items-center mr-3 px-3 py-2 rounded-2xl border ${
                      isSelected
                        ? 'bg-orange-50 border-orange-300'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text className="text-xl mb-1">{emoji}</Text>
                    <Text
                      numberOfLines={1}
                      className={`text-[11px] font-black ${
                        isSelected ? 'text-primary' : 'text-gray-700'
                      }`}
                    >
                      {catName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ⭐ Top Rated Spotlight Carousel (Hidden when search query is entered) */}
        {!search.trim() && topRatedRestaurants.length > 0 && (
          <View className="mb-6">
            <View className="px-5 mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text className="text-base font-black text-gray-900 tracking-tight">
                  Top Rated Spotlights
                </Text>
              </View>
              <Text className="text-xs font-bold text-gray-400">★ 4.4+ rating</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              className="flex-row"
            >
              {topRatedRestaurants.map((restaurant) => (
                <TouchableOpacity
                  key={restaurant.id || restaurant._id}
                  activeOpacity={0.88}
                  onPress={() => router.push(`/restaurant/${restaurant.id}`)}
                  className="w-64 bg-white rounded-3xl overflow-hidden mr-3.5 border border-gray-100 shadow-sm"
                >
                  <View className="relative w-full h-32 bg-gray-100">
                    <Image
                      source={{ uri: restaurant.image }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />

                    {/* Rating Pill */}
                    <View className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-0.5 rounded-xl flex-row items-center gap-1">
                      <Ionicons name="star" size={10} color="#f59e0b" />
                      <Text className="text-white text-[11px] font-black">
                        {restaurant.rating}
                      </Text>
                    </View>

                    {/* Pure Veg Pill */}
                    {restaurant.isVeg && (
                      <View className="absolute top-2.5 right-2.5 bg-white/95 px-2 py-0.5 rounded-xl flex-row items-center gap-1 shadow-sm">
                        <View className="w-1.5 h-1.5 rounded-full bg-green-600" />
                        <Text className="text-green-800 text-[9px] font-black uppercase">
                          Pure Veg
                        </Text>
                      </View>
                    )}

                    {/* Delivery Time */}
                    <View className="absolute bottom-2.5 right-2.5 bg-white/95 px-2 py-0.5 rounded-lg shadow-sm">
                      <Text className="text-[10px] font-bold text-gray-800">
                        {restaurant.deliveryTime}
                      </Text>
                    </View>

                    {/* Offer Tag */}
                    {restaurant.offer && (
                      <View className="absolute bottom-2.5 left-2.5 bg-primary px-2 py-0.5 rounded-lg shadow-sm">
                        <Text className="text-white text-[10px] font-black">
                          {restaurant.offer}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="p-3">
                    <Text numberOfLines={1} className="text-sm font-black text-gray-900 mb-0.5">
                      {restaurant.name}
                    </Text>
                    <Text numberOfLines={1} className="text-[11px] font-medium text-gray-400 mb-2">
                      {restaurant.cuisines?.join(' • ')}
                    </Text>
                    <View className="flex-row items-center justify-between pt-1.5 border-t border-gray-50">
                      <Text className="text-[11px] font-bold text-gray-500">
                        ₹{restaurant.priceForTwo} for two
                      </Text>
                      <View className="flex-row items-center gap-0.5">
                        <Ionicons name="location-sharp" size={12} color="#ea580c" />
                        <Text className="text-[11px] font-bold text-gray-500">
                          {restaurant.distance || '2.0 km'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main List Section Header & Sorting Chips */}
        <View className="px-5 mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-black text-gray-900 tracking-tight">
              {sortBy === 'nearest'
                ? 'Nearby Restaurants'
                : vegFilter === 'veg'
                ? 'Pure Veg Spots'
                : 'Restaurants Around You'}
            </Text>
            <Text className="text-xs font-bold text-gray-400">
              {filteredRestaurants.length} places
            </Text>
          </View>

          {/* Quick Sort Chips */}
          <View className="flex-row items-center gap-1.5 flex-wrap">
            <Text className="text-[10px] font-black uppercase text-gray-400 tracking-wider mr-1">
              Sort:
            </Text>

            <TouchableOpacity
              onPress={() => setSortBy('relevance')}
              className={`px-2.5 py-1 rounded-lg border ${
                sortBy === 'relevance'
                  ? 'bg-gray-900 border-gray-900'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  sortBy === 'relevance' ? 'text-white' : 'text-gray-600'
                }`}
              >
                Relevance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSortBy('nearest')}
              className={`px-2.5 py-1 rounded-lg border ${
                sortBy === 'nearest'
                  ? 'bg-gray-900 border-gray-900'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  sortBy === 'nearest' ? 'text-white' : 'text-gray-600'
                }`}
              >
                Nearest 📍
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSortBy('rating')}
              className={`px-2.5 py-1 rounded-lg border ${
                sortBy === 'rating'
                  ? 'bg-gray-900 border-gray-900'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  sortBy === 'rating' ? 'text-white' : 'text-gray-600'
                }`}
              >
                Rating ⭐
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSortBy('fastest')}
              className={`px-2.5 py-1 rounded-lg border ${
                sortBy === 'fastest'
                  ? 'bg-gray-900 border-gray-900'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  sortBy === 'fastest' ? 'text-white' : 'text-gray-600'
                }`}
              >
                Fastest ⚡
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading / Restaurant Cards / Empty State */}
        <View className="px-5">
          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color="#ea580c" />
              <Text className="text-xs text-gray-500 font-bold mt-3">
                Finding delicious spots...
              </Text>
            </View>
          ) : filteredRestaurants.length === 0 ? (
            <View className="py-16 items-center justify-center bg-gray-50 rounded-3xl p-6 border border-gray-100 mt-2">
              <View className="w-14 h-14 rounded-full bg-orange-100 items-center justify-center mb-3">
                <Ionicons name="restaurant-outline" size={26} color="#ea580c" />
              </View>
              <Text className="text-base font-black text-gray-800 text-center">
                No matching restaurants found
              </Text>
              <Text className="text-xs text-gray-500 font-medium mt-1 text-center mb-4">
                Try relaxing your filters or searching for something else
              </Text>
              <TouchableOpacity
                onPress={handleResetFilters}
                className="bg-primary px-5 py-2.5 rounded-xl shadow-xs"
              >
                <Text className="text-white text-xs font-black uppercase">
                  Reset All Filters
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {visibleRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id || restaurant._id}
                  restaurant={restaurant}
                />
              ))}

              {/* Progressive 4-by-4 Batch Loading Footer */}
              {visibleCount < filteredRestaurants.length ? (
                <View className="pt-2 pb-6 items-center justify-center">
                  {isLoadingMore ? (
                    <View className="flex-row items-center gap-2 py-3">
                      <ActivityIndicator size="small" color="#ea580c" />
                      <Text className="text-xs font-bold text-gray-500">
                        Loading next 4 spots...
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setIsLoadingMore(true);
                        setTimeout(() => {
                          setVisibleCount((prev) =>
                            Math.min(prev + 4, filteredRestaurants.length)
                          );
                          setIsLoadingMore(false);
                        }, 200);
                      }}
                      className="w-full py-3 rounded-2xl bg-orange-50 border border-orange-200 flex-row items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Ionicons
                        name="arrow-down-circle-outline"
                        size={16}
                        color="#ea580c"
                      />
                      <Text className="text-xs font-black text-primary uppercase tracking-wide">
                        Load More ({filteredRestaurants.length - visibleCount} remaining)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : filteredRestaurants.length > 4 ? (
                <View className="py-6 items-center justify-center">
                  <View className="w-10 h-1 bg-gray-200 rounded-full mb-2.5" />
                  <Text className="text-xs font-bold text-gray-400">
                    You've reached the end • {filteredRestaurants.length} restaurants shown 🎉
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {/* Floating Active Ongoing Order Pill (Fixed above floating tab bar) */}
      {token && activeOrder && (
        <View className="absolute bottom-28 left-4 right-4">
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() =>
              router.push(`/tracking/${activeOrder._id || activeOrder.id}`)
            }
            className="bg-gray-950/95 rounded-2xl px-4 py-3 flex-row items-center justify-between border border-gray-800 shadow-2xl"
          >
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="w-10 h-10 rounded-2xl bg-orange-500/20 items-center justify-center border border-orange-500/30">
                <Ionicons
                  name={
                    activeOrder.status === 'Out for Delivery'
                      ? 'bicycle'
                      : activeOrder.status === 'Ready for Pickup'
                      ? 'cube-outline'
                      : 'flame-outline'
                  }
                  size={20}
                  color="#ea580c"
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  {/* <View className="w-2 h-2 rounded-full bg-orange-500" /> */}
                  <Text className="text-white text-xs font-black tracking-wide" numberOfLines={1}>
                    Order Status: <Text className="text-orange-400 font-black">{activeOrder.status}</Text>
                  </Text>
                </View>
                <Text
                  className="text-gray-400 text-[11px] font-semibold mt-0.5"
                  numberOfLines={1}
                >
                  {activeOrder.restaurantName || 'Your order'} • Tap to live track
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1 bg-primary px-3 py-1.5 rounded-xl shadow-xs">
              <Text className="text-white text-xs font-black">Track</Text>
              <Ionicons name="chevron-forward" size={13} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Profile Corner Popup Menu */}
      <ProfileMenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </SafeAreaView>
  );
}
