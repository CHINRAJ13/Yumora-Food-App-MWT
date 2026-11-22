import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuItem } from '../types';
import { useCartStore } from '../store/useCartStore';

interface MenuItemCardProps {
  item: MenuItem;
  restaurantId: string;
  restaurantName: string;
  isOffline?: boolean;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  restaurantId,
  restaurantName,
  isOffline = false,
}) => {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.id === item.id);

  const handleAdd = () => {
    if (isOffline) return;
    const added = addItem(item, restaurantId, restaurantName);
    if (!added) {
      Alert.alert(
        'Start new basket?',
        'Your cart contains dishes from another restaurant. Do you want to reset your cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Reset',
            style: 'destructive',
            onPress: () => {
              useCartStore.getState().clearCart();
              addItem(item, restaurantId, restaurantName);
            },
          },
        ]
      );
    }
  };

  return (
    <View className="bg-white rounded-2xl p-3.5 mb-3 border border-gray-100 flex-row items-center justify-between shadow-sm">
      {/* Left: Info */}
      <View className="flex-1 pr-3">
        {/* Veg/Non-Veg tag */}
        <View className="flex-row items-center gap-2 mb-1">
          <View
            className={`w-3.5 h-3.5 rounded-sm border items-center justify-center ${
              item.isVeg ? 'border-green-600' : 'border-red-600'
            }`}
          >
            <View
              className={`w-1.5 h-1.5 rounded-full ${
                item.isVeg ? 'bg-green-600' : 'bg-red-600'
              }`}
            />
          </View>
          {item.isBestseller && (
            <View className="flex-row items-center gap-0.5">
              <Ionicons name="star" size={9} color="#ea580c" />
              <Text className="text-[10px] font-bold text-orange-600">Bestseller</Text>
            </View>
          )}
        </View>

        <Text className="font-extrabold text-gray-900 text-sm leading-tight mb-1">{item.name}</Text>
        <Text className="font-bold text-gray-900 text-xs mb-1.5">₹{item.price}</Text>
        {item.description ? (
          <Text numberOfLines={2} className="text-[11px] text-gray-400 leading-relaxed font-medium">
            {item.description}
          </Text>
        ) : null}
      </View>

      {/* Right: Image + Action */}
      <View className="items-center relative">
        <Image
          source={{ uri: item.image }}
          className="w-20 h-20 rounded-2xl bg-gray-100"
          resizeMode="cover"
        />

        {/* Action Button: Disabled Closed pill or Add/Stepper */}
        <View className="absolute -bottom-2 w-16">
          {isOffline ? (
            <View className="bg-gray-100 border border-gray-200 py-1 rounded-lg items-center justify-center">
              <Text className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Closed
              </Text>
            </View>
          ) : cartItem ? (
            <View className="bg-white border border-green-600 py-0.5 px-1 rounded-lg flex-row items-center justify-between shadow-md">
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, cartItem.quantity - 1)}
                className="p-0.5"
              >
                <Ionicons name="remove" size={13} color="#16a34a" />
              </TouchableOpacity>
              <Text className="text-xs font-black text-green-600 px-1">{cartItem.quantity}</Text>
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, cartItem.quantity + 1)}
                className="p-0.5"
              >
                <Ionicons name="add" size={13} color="#16a34a" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAdd}
              className="bg-white border border-gray-200 py-1 rounded-lg items-center justify-center shadow-md active:bg-green-50"
            >
              <Text className="text-[11px] font-black text-green-600 uppercase tracking-wide">
                + ADD
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};
