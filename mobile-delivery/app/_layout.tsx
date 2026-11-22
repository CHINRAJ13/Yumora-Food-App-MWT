import React, { useEffect } from 'react';
import { View, ActivityIndicator, LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDeliveryAuthStore } from '../src/store/useDeliveryAuthStore';
import { useActiveTripStore } from '../src/store/useActiveTripStore';
import { deliverySocketService } from '../src/services/socketService';
import AssignedOrderAlertModal from '../src/components/AssignedOrderAlertModal';
import AudioAlertBridge from '../src/components/AudioAlertBridge';
import '../global.css';

LogBox.ignoreLogs(['Cannot connect to Expo CLI']);

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const { initAuth } = useDeliveryAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Global socket listener for order assignments directed to this rider
  useEffect(() => {
    const handleAssignedEvent = (data: any) => {
      const order = data?.order || data;
      const targetDriverId = data?.deliveryPersonId || order?.deliveryPersonId;
      const currentRiderId =
        useDeliveryAuthStore.getState().user?._id ||
        useDeliveryAuthStore.getState().user?.id;

      // Check if this assignment belongs to this delivery driver
      if (
        !targetDriverId ||
        !currentRiderId ||
        targetDriverId.toString() === currentRiderId.toString()
      ) {
        useActiveTripStore.getState().handleOrderAssigned(order);
      }
    };

    deliverySocketService.onOrderAssigned(handleAssignedEvent);

    return () => {
      deliverySocketService.offOrderAssigned(handleAssignedEvent);
    };
  }, []);

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
      <AssignedOrderAlertModal />
      <AudioAlertBridge />
    </SafeAreaProvider>
  );
}
