import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useDeliveryAuthStore } from '../src/store/useDeliveryAuthStore';

export default function IndexGateway() {
  const { isAuthenticated, isLoading } = useDeliveryAuthStore();

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
