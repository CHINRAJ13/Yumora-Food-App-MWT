import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  const router = useRouter();
  const isOnline = restaurant.acceptsOrders !== false;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => router.push(`/restaurant/${restaurant.id}`)}
      className={`bg-white rounded-3xl overflow-hidden mb-5 border border-gray-100 shadow-sm ${
        !isOnline ? 'opacity-85' : ''
      }`}
    >
      {/* Image Container with Black & White tint if offline */}
      <View className="relative w-full h-44 bg-gray-100">
        <Image
          source={{ uri: restaurant.image }}
          className="w-full h-full object-cover"
          style={!isOnline ? { tintColor: '#666666' } : undefined}
          resizeMode="cover"
        />

        {/* Dark Vignette / Tint overlay if offline */}
        {!isOnline && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center" />
        )}

        {/* Status / Pro Selection Badge */}
        {!isOnline ? (
          <View className="absolute top-3 left-3 bg-black/90 px-3 py-1.5 rounded-xl border border-white/20 flex-row items-center gap-1.5 shadow-md">
            <View className="w-2 h-2 rounded-full bg-red-400" />
            <Text className="text-white text-[11px] font-black tracking-wider uppercase">
              Offline
            </Text>
          </View>
        ) : restaurant.rating >= 4.5 ? (
          <View className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-xl flex-row items-center gap-1 shadow-md border border-white/50">
            <Ionicons name="flash" size={12} color="#ea580c" />
            <Text className="text-gray-900 text-[10px] font-black uppercase">Pro Selection</Text>
          </View>
        ) : null}

        {/* Bottom Delivery time badge or Closed label */}
        <View className="absolute bottom-3 right-3 bg-white/95 px-2.5 py-1 rounded-xl shadow-md border border-white/50">
          <Text className={`text-[10px] font-black ${isOnline ? 'text-gray-900' : 'text-gray-500'}`}>
            {isOnline ? restaurant.deliveryTime : 'Closed For Orders'}
          </Text>
        </View>

        {/* Offer badge */}
        {restaurant.offer && isOnline && (
          <View className="absolute bottom-3 left-3 bg-primary/95 px-2.5 py-1 rounded-xl shadow-md">
            <Text className="text-white text-xs font-black">{restaurant.offer}</Text>
          </View>
        )}
      </View>

      {/* Info details */}
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text
            numberOfLines={1}
            className={`text-base font-black flex-1 mr-2 ${isOnline ? 'text-gray-900' : 'text-gray-600'}`}
          >
            {restaurant.name}
          </Text>
          <View
            className={`flex-row items-center px-2 py-0.5 rounded-full gap-1 ${
              isOnline ? 'bg-green-600' : 'bg-gray-400'
            }`}
          >
            <Ionicons name="star" size={10} color="#ffffff" />
            <Text className="text-white text-xs font-black">{restaurant.rating}</Text>
          </View>
        </View>

        <Text numberOfLines={1} className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {restaurant.cuisines?.join(' • ')}
        </Text>

        <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
          <View className="flex-row items-center gap-1">
            <Text className="text-xs font-bold text-gray-500">₹{restaurant.priceForTwo} for two</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-sharp" size={13} color="#f97316" />
            <Text className="text-xs font-bold text-gray-500">{restaurant.distance || '2.5 km'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
