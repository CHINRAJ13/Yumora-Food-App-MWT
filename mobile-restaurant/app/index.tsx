import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useRestaurantAuthStore } from '../src/store/useRestaurantAuthStore';

export default function IndexGateway() {
  const isAuthenticated = useRestaurantAuthStore((s) => s.isAuthenticated);
  const isLoading = useRestaurantAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#f8fafc',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
