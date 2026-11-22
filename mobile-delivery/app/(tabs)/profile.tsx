import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDeliveryAuthStore } from '../../src/store/useDeliveryAuthStore';
import { dialPhoneNumber } from '../../src/utils/navigation';
import { soundService } from '../../src/services/soundService';

export default function DeliveryProfileScreen() {
  const { user, isOnline, setOnlineStatus, logout, refreshProfile, isAuthenticated } =
    useDeliveryAuthStore();

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const handleToggleOnline = async (val: boolean) => {
    await setOnlineStatus(val);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your Yumora Rider account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleEmergencyCall = () => {
    dialPhoneNumber('112');
  };

  const handleSupportCall = () => {
    dialPhoneNumber('1800123456');
  };

  // User initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'RP';

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <View className="w-20 h-20 rounded-full bg-orange-50 border border-orange-100 items-center justify-center mb-5 shadow-sm">
          <Ionicons name="lock-closed-outline" size={36} color="#ea580c" />
        </View>
        <Text className="text-xl font-black text-gray-900 mb-2 text-center">Authentication Required</Text>
        <Text className="text-xs text-gray-500 font-semibold text-center mb-6 leading-5 max-w-xs">
          Please sign in with your Yumora Partner account to access your profile settings.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.85}
          className="bg-primary px-7 py-3.5 rounded-2xl flex-row items-center shadow-md shadow-orange-500/25"
        >
          <Ionicons name="log-in-outline" size={18} color="#ffffff" />
          <Text className="text-white font-black text-sm ml-2">Go to Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Top Header */}
      <View className="px-5 py-3.5 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-black text-gray-900">Partner Profile</Text>
          <Text className="text-xs font-semibold text-gray-500 mt-0.5">
            Fleet settings & compliance
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="w-9 h-9 rounded-full bg-red-50 border border-red-200 items-center justify-center shadow-sm"
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View className="bg-white rounded-3xl p-6 border border-gray-100 mb-4 items-center shadow-sm">
          <View className="relative mb-3">
            <View className="w-20 h-20 rounded-full bg-orange-600 items-center justify-center shadow-md">
              <Text className="text-white text-2xl font-black">{initials}</Text>
            </View>
            <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white items-center justify-center">
              <Ionicons name="checkmark" size={13} color="#ffffff" />
            </View>
          </View>

          <Text className="text-xl font-black text-gray-900">{user?.name || 'Partner Rider'}</Text>
          <Text className="text-xs font-semibold text-gray-500 mt-0.5">{user?.email}</Text>
          <Text className="text-xs font-semibold text-gray-500">{user?.phone || '+91 9876543210'}</Text>

          {/* Status Badges */}
          <View className="flex-row items-center gap-2 mt-4">
            <View className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
              <Text className="text-emerald-700 font-black text-xs uppercase">
                {user?.approvalStatus || 'Approved Rider'}
              </Text>
            </View>

            <View className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex-row items-center">
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text className="text-amber-800 font-black text-xs ml-1">
                {user?.deliveryDetails?.rating || 4.9} Rating
              </Text>
            </View>
          </View>
        </View>

        {/* Duty Status Control Card */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 mb-4 flex-row items-center justify-between shadow-sm">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center gap-1.5 mb-1">
              <View
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: isOnline ? '#10b981' : '#9ca3af' }}
              />
              <Text className="text-gray-900 font-black text-base">
                {isOnline ? 'Online for Deliveries' : 'Currently Offline'}
              </Text>
            </View>
            <Text className="text-gray-500 text-xs font-semibold">
              {isOnline
                ? 'Your GPS is broadcasting. You will receive nearby food orders.'
                : 'Toggle ON when you are ready to take deliveries and earn.'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: '#e2e8f0', true: '#bbf7d0' }}
            thumbColor={isOnline ? '#10b981' : '#94a3b8'}
          />
        </View>

        {/* Vehicle & Compliance Specs Card */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 mb-4 shadow-sm">
          <View className="flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-50">
            <Ionicons name="shield-checkmark-outline" size={18} color="#ea580c" />
            <Text className="text-gray-900 font-black text-sm">Vehicle & Compliance</Text>
          </View>

          <View className="space-y-3">
            <View className="flex-row justify-between py-2 border-b border-gray-50">
              <Text className="text-gray-500 text-xs font-semibold">Vehicle Type</Text>
              <Text className="text-gray-900 font-black text-xs">
                {user?.deliveryDetails?.vehicleType || 'Motorbike'}
              </Text>
            </View>

            <View className="flex-row justify-between py-2 border-b border-gray-50">
              <Text className="text-gray-500 text-xs font-semibold">Registration Number</Text>
              <Text className="text-gray-900 font-black text-xs">
                {user?.deliveryDetails?.vehicleNumber || 'TN 37 AB 1234'}
              </Text>
            </View>

            <View className="flex-row justify-between py-2">
              <Text className="text-gray-500 text-xs font-semibold">Driving License</Text>
              <Text className="text-gray-900 font-black text-xs">
                {user?.deliveryDetails?.licenseNumber || 'DL-9876543210'}
              </Text>
            </View>
          </View>
        </View>

        {/* Finance & Payouts */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 mb-5 shadow-sm">
          <View className="flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-50">
            <Ionicons name="wallet-outline" size={18} color="#ea580c" />
            <Text className="text-gray-900 font-black text-sm">Finance & Settlements</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/wallet')}
            activeOpacity={0.75}
            className="flex-row items-center justify-between py-2"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-orange-50 border border-orange-100 items-center justify-center mr-3">
                <Ionicons name="card-outline" size={16} color="#ea580c" />
              </View>
              <View>
                <Text className="text-gray-900 text-xs font-black">
                  Wallet & Bank Payouts
                </Text>
                <Text className="text-gray-400 text-[10px] font-semibold">
                  Withdraw rider earnings & view payment receipts
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Rider Support & Safety */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 mb-5 shadow-sm">
          <View className="flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-50">
            <Ionicons name="headset-outline" size={18} color="#ea580c" />
            <Text className="text-gray-900 font-black text-sm">Rider Support & Safety</Text>
          </View>

          <TouchableOpacity
            onPress={handleSupportCall}
            activeOpacity={0.75}
            className="flex-row items-center justify-between py-3 border-b border-gray-50"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 items-center justify-center mr-3">
                <Ionicons name="call" size={15} color="#2563eb" />
              </View>
              <View>
                <Text className="text-gray-900 text-xs font-black">
                  Fleet Operations Hotline
                </Text>
                <Text className="text-gray-400 text-[10px] font-semibold">
                  Toll-free 24/7 delivery partner line
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEmergencyCall}
            activeOpacity={0.75}
            className="flex-row items-center justify-between py-3 border-b border-gray-50"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-red-50 border border-red-100 items-center justify-center mr-3">
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
              </View>
              <View>
                <Text className="text-red-600 text-xs font-black">
                  Emergency Roadside SOS (112)
                </Text>
                <Text className="text-gray-400 text-[10px] font-semibold">
                  Police & medical emergency assistance
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>

          {/* Test Order Alert Sound */}
          <TouchableOpacity
            onPress={() => soundService.testSound()}
            activeOpacity={0.75}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 items-center justify-center mr-3">
                <Ionicons name="volume-high-outline" size={16} color="#d97706" />
              </View>
              <View>
                <Text className="text-gray-900 text-xs font-black">
                  Test Alert Sound & Vibration
                </Text>
                <Text className="text-gray-400 text-[10px] font-semibold">
                  Preview incoming order ringtone
                </Text>
              </View>
            </View>
            <Ionicons name="play-circle-outline" size={20} color="#ea580c" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          className="w-full bg-red-50 border border-red-200 rounded-2xl py-3.5 items-center justify-center flex-row shadow-sm"
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text className="text-red-600 text-xs font-black uppercase tracking-wider ml-2">
            Sign Out of Yumora Partner
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
