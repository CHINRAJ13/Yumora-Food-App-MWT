import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRestaurantAuthStore } from '../src/store/useRestaurantAuthStore';
import { useRestaurantOrdersStore } from '../src/store/useRestaurantOrdersStore';
import { restaurantSocketService } from '../src/services/socketService';
import NewOrderAlertModal from '../src/components/NewOrderAlertModal';
import AudioAlertBridge from '../src/components/AudioAlertBridge';
import '../global.css';

LogBox.ignoreLogs(['Cannot connect to Expo CLI']);

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const initAuth = useRestaurantAuthStore((s) => s.initAuth);
  const handleNewOrder = useRestaurantOrdersStore((s) => s.handleNewOrder);
  const handleOrderUpdated = useRestaurantOrdersStore((s) => s.handleOrderUpdated);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Global socket listener for new restaurant orders & updates
  useEffect(() => {
    restaurantSocketService.onNewRestaurantOrder((order) => {
      console.log('[RootLayout] 🔔 New restaurant order received:', order._id || order.id);
      handleNewOrder(order);
    });

    restaurantSocketService.onRestaurantOrderUpdated((data) => {
      console.log('[RootLayout] 📦 Order updated event:', data);
      handleOrderUpdated(data);
    });

    return () => {
      restaurantSocketService.offRestaurantEvents();
    };
  }, [handleNewOrder, handleOrderUpdated]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f8fafc' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
      <NewOrderAlertModal />
      <AudioAlertBridge />
    </SafeAreaProvider>
  );
}
