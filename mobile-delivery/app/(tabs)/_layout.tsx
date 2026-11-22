import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { FloatingTabBar } from '../../src/components/FloatingTabBar';
import { useDeliveryAuthStore } from '../../src/store/useDeliveryAuthStore';

export default function TabsLayout() {
  const isAuthenticated = useDeliveryAuthStore((s) => s.isAuthenticated);
  const isLoading = useDeliveryAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Radar',
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: 'Active Trip',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
