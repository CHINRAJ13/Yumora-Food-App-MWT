import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Switch,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/useAuthStore';
import { useCartStore } from '../src/store/useCartStore';
import { getCurrentAddressFromGPS } from '../src/services/locationService';

export default function ProfileScreen() {
  const { user, token, logout, updateUser } = useAuthStore();
  const router = useRouter();

  // Edit Profile Modal State
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAddress, setEditAddress] = useState(user?.address || '123, Avinashi Road, Peelamedu, Coimbatore');

  // Preferences toggles
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  const handleFetchCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await getCurrentAddressFromGPS();
      setEditAddress(loc.address);
      if (token && user) {
        await updateUser({ address: loc.address });
      }
      Alert.alert('📍 Location Found!', `Address auto-filled:\n${loc.address}`);
    } catch (err: any) {
      Alert.alert(
        'Location Access',
        err.message || 'Unable to retrieve GPS location. Please check device location settings.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleOpenEditModal = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setEditAddress(user?.address || '123, Avinashi Road, Peelamedu, Coimbatore');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    await updateUser({
      name: editName.trim(),
      phone: editPhone.trim() || undefined,
      address: editAddress.trim() || undefined,
    });
    setEditModalVisible(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Yumora?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  // Get user initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'Y';

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Header with Back Navigation */}
      <View className="px-5 py-3.5 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 items-center justify-center shadow-sm"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-black text-gray-900">My Profile</Text>
            <Text className="text-xs font-semibold text-gray-500 mt-0.5">
              Account settings & orders
            </Text>
          </View>
        </View>

        {token && (
          <TouchableOpacity
            onPress={handleOpenEditModal}
            className="w-9 h-9 rounded-full bg-orange-50 border border-orange-200 items-center justify-center shadow-sm"
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={18} color="#ea580c" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Profile Card / Guest Banner */}
        {token ? (
          <View className="bg-white rounded-3xl p-5 mb-5 border border-gray-100 shadow-sm">
            <View className="flex-row items-center gap-4">
              {/* Avatar with Verified Badge */}
              <View className="relative">
                <View className="w-16 h-16 rounded-full bg-orange-600 items-center justify-center shadow-md">
                  <Text className="text-white text-xl font-black">{initials}</Text>
                </View>
                <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white items-center justify-center">
                  <Ionicons name="checkmark" size={11} color="#ffffff" />
                </View>
              </View>

              {/* Name & Contact Info */}
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5 flex-wrap">
                  <Text className="text-lg font-black text-gray-900">
                    {user?.name || 'Customer'}
                  </Text>
                  <View className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                    <Ionicons name="star" size={10} color="#f59e0b" />
                    <Text className="text-[9px] font-black text-amber-700 uppercase">
                      Gold Member
                    </Text>
                  </View>
                </View>

                <Text className="text-xs font-semibold text-gray-500 mt-0.5">
                  {user?.email || 'No email registered'}
                </Text>

                {user?.phone ? (
                  <Text className="text-xs font-semibold text-gray-500 mt-0.5">
                    +91 {user.phone}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Default Address Snippet */}
            <View className="mt-4 pt-3 border-t border-gray-100 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <Ionicons name="location-sharp" size={15} color="#ea580c" />
                <Text
                  numberOfLines={1}
                  className="text-xs font-bold text-gray-700 flex-1"
                >
                  {user?.address || '123, Avinashi Road, Peelamedu, Coimbatore'}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  disabled={isLocating}
                  onPress={handleFetchCurrentLocation}
                  className="flex-row items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200"
                  activeOpacity={0.7}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color="#ea580c" />
                  ) : (
                    <Ionicons name="navigate-circle-outline" size={13} color="#ea580c" />
                  )}
                  <Text className="text-[10px] font-black text-primary">GPS</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleOpenEditModal}>
                  <Text className="text-[11px] font-black text-primary">Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View className="bg-gray-900 rounded-3xl p-5 mb-5 shadow-lg">
            <View className="flex-row items-center gap-3.5 mb-3">
              <View className="w-12 h-12 rounded-2xl bg-orange-600 items-center justify-center">
                <Text className="text-white font-black text-xl">Y</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white text-base font-black">Welcome to Yumora!</Text>
                <Text className="text-gray-300 text-xs font-medium">
                  Sign in to track orders, earn cash & save addresses
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.9}
              className="bg-primary rounded-2xl py-3 items-center justify-center shadow-md mt-2 flex-row gap-2"
            >
              <Ionicons name="log-in-outline" size={18} color="#ffffff" />
              <Text className="text-white text-sm font-black uppercase tracking-wider">
                Sign In / Join
              </Text>
            </TouchableOpacity>
          </View>
        )}
 
        {/* Quick Highlights / Metrics Bar */}
        {/* <View className="flex-row gap-3 mb-5">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/orders')}
            activeOpacity={0.8}
            className="flex-1 bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm items-center"
          >
            <View className="w-9 h-9 rounded-full bg-orange-50 items-center justify-center mb-1.5">
              <Ionicons name="receipt-outline" size={18} color="#ea580c" />
            </View>
            <Text className="text-xs font-black text-gray-900">Orders</Text>
            <Text className="text-[10px] font-bold text-gray-400">View History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert('Yumora Wallet', 'Your active wallet balance is ₹150. Use it at checkout!')
            }
            activeOpacity={0.8}
            className="flex-1 bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm items-center"
          >
            <View className="w-9 h-9 rounded-full bg-emerald-50 items-center justify-center mb-1.5">
              <Ionicons name="wallet-outline" size={18} color="#10b981" />
            </View>
            <Text className="text-xs font-black text-gray-900">₹150 Cash</Text>
            <Text className="text-[10px] font-bold text-gray-400">Wallet Balance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert('Favorites', 'Browse your saved restaurants and top dishes.')
            }
            activeOpacity={0.8}
            className="flex-1 bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm items-center"
          >
            <View className="w-9 h-9 rounded-full bg-rose-50 items-center justify-center mb-1.5">
              <Ionicons name="heart-outline" size={18} color="#f43f5e" />
            </View>
            <Text className="text-xs font-black text-gray-900">Saved</Text>
            <Text className="text-[10px] font-bold text-gray-400">Favorites</Text>
          </TouchableOpacity>
        </View> */}

        {/* Section 1: Food & Orders */}
        <Text className="text-[11px] font-black uppercase text-gray-500 tracking-wider mb-2.5 ml-1">
          Food & Orders
        </Text>
        <View className="bg-white rounded-3xl p-2 mb-5 border border-gray-100 shadow-sm">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/orders')}
            className="flex-row items-center justify-between p-3 border-b border-gray-50"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-orange-100 items-center justify-center">
                <Ionicons name="bag-handle" size={18} color="#ea580c" />
              </View>
              <View>
                <Text className="text-xs font-black text-gray-900">My Orders</Text>
                <Text className="text-xs font-semibold text-gray-500 mt-0.5">
                  Track live orders & view receipts
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleOpenEditModal}
            className="flex-row items-center justify-between p-3 border-b border-gray-50"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-blue-100 items-center justify-center">
                <Ionicons name="location" size={18} color="#2563eb" />
              </View>
              <View>
                <Text className="text-xs font-black text-gray-900">Delivery Address</Text>
                <Text className="text-xs font-semibold text-gray-500 mt-0.5">
                  Manage saved home and work locations
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                '🎉 Special Offers',
                'Use code YUMORA50 to get 50% off on your first 3 food deliveries!'
              )
            }
            className="flex-row items-center justify-between p-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-amber-100 items-center justify-center">
                <Ionicons name="pricetag" size={18} color="#d97706" />
              </View>
              <View>
                <Text className="text-xs font-black text-gray-900">Offers & Coupons</Text>
                <Text className="text-[10px] font-semibold text-gray-400">
                  Up to 50% discount on top restaurants
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                <Text className="text-[9px] font-black text-amber-800">1 NEW</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 2: Payments & Wallet */}
        {/* <Text className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-2.5 ml-1">
          Payments & Wallet
        </Text>
        <View className="bg-white rounded-3xl p-2 mb-5 border border-gray-100 shadow-sm">
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Payment Modes', 'UPI (Google Pay, PhonePe, Paytm), NetBanking & Cards.')
            }
            className="flex-row items-center justify-between p-3 border-b border-gray-50"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-purple-100 items-center justify-center">
                <Ionicons name="card" size={18} color="#7c3aed" />
              </View>
              <View>
                <Text className="text-xs font-black text-gray-900">Payment Modes</Text>
                <Text className="text-[10px] font-semibold text-gray-400">
                  Instant UPI, Cards & NetBanking
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert('100% Safe Payments', 'All transactions are 256-bit SSL encrypted.')
            }
            className="flex-row items-center justify-between p-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-emerald-100 items-center justify-center">
                <Ionicons name="shield-checkmark" size={18} color="#059669" />
              </View>
              <View>
                <Text className="text-xs font-black text-gray-900">Buyer Protection</Text>
                <Text className="text-[10px] font-semibold text-gray-400">
                  100% money back on order cancellations
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View> */}

        {/* Section 3: App Preferences & Support */}
        <Text className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-2.5 ml-1">
          Preferences & Support
        </Text>
        <View className="bg-white rounded-3xl p-2 mb-5 border border-gray-100 shadow-sm">
          {/* <View className="flex-row items-center justify-between p-3 border-b border-gray-50">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center">
                <Ionicons name="notifications" size={18} color="#4b5563" />
              </View>
              <View>
                <Text className="text-xs font-black text-gray-900">Order Notifications</Text>
                <Text className="text-[10px] font-semibold text-gray-400">
                  Instant real-time cooking & delivery alerts
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e5e7eb', true: '#ea580c' }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#ffffff'}
            />
          </View> */}

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Customer Support',
                'Call: +91 98765 43210\nEmail: support@yumora.com\nLive Support: 24/7'
              )
            }
            className="flex-row items-center justify-between p-3 border-b border-gray-50"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-teal-100 items-center justify-center">
                <Ionicons name="chatbubble-ellipses" size={18} color="#0d9488" />
              </View>
              <View>
                <Text className="text-xs font-black text-gray-900">Help & 24/7 Support</Text>
                <Text className="text-[10px] font-semibold text-gray-400">
                  Chat with our Coimbatore support team
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'About Yumora',
                'Yumora is Coimbatore’s premier hyper-local food delivery application.\nVersion 1.0.0 (Expo SDK 57)'
              )
            }
            className="flex-row items-center justify-between p-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-indigo-100 items-center justify-center">
                <Ionicons name="information-circle" size={18} color="#4f46e5" />
              </View>
              <View>
                <Text className="text-xs font-black text-gray-900">About Yumora</Text>
                <Text className="text-[10px] font-semibold text-gray-400">
                  Version 1.0.0 • Terms & Privacy
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Auth Action Button */}
        {token ? (
          <TouchableOpacity
            onPress={handleLogoutPress}
            activeOpacity={0.8}
            className="bg-red-50 border border-red-200 rounded-2xl py-4 flex-row items-center justify-center gap-2 shadow-sm mb-6"
          >
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text className="text-red-600 font-black text-xs uppercase tracking-wider">
              Log Out of Account
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.9}
            className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2 shadow-md mb-6"
          >
            <Ionicons name="log-in-outline" size={18} color="#ffffff" />
            <Text className="text-white font-black text-xs uppercase tracking-wider">
              Sign In / Register
            </Text>
          </TouchableOpacity>
        )}

        {/* Footer Credit */}
        <View className="items-center">
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Made with ❤️ for Coimbatore
          </Text>
          <Text className="text-[9px] font-medium text-gray-300 mt-0.5">
            Yumora Food Technologies Pvt Ltd
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 border-t border-gray-100 shadow-2xl">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <View>
                <Text className="text-lg font-black text-gray-900">Edit Profile</Text>
                <Text className="text-xs font-semibold text-gray-400">
                  Update your contact details
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#4b5563" />
              </TouchableOpacity>
            </View>

            {/* Inputs */}
            <View className="space-y-3.5 mb-6">
              <View>
                <Text className="text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">
                  Full Name
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-3 flex-row items-center gap-2.5">
                  <Ionicons name="person-outline" size={18} color="#ea580c" />
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Your Name"
                    className="flex-1 text-sm font-bold text-gray-900"
                  />
                </View>
              </View>

              <View className="mt-3">
                <Text className="text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">
                  Phone Number
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-3 flex-row items-center gap-2.5">
                  <Ionicons name="call-outline" size={18} color="#ea580c" />
                  <TextInput
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="10-digit number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    className="flex-1 text-sm font-bold text-gray-900"
                  />
                </View>
              </View>

              <View className="mt-3">
                <View className="flex-row items-center justify-between mb-1 ml-1">
                  <Text className="text-[10px] font-black uppercase text-gray-500">
                    Default Delivery Address
                  </Text>
                  <TouchableOpacity
                    disabled={isLocating}
                    onPress={handleFetchCurrentLocation}
                    activeOpacity={0.7}
                    className="flex-row items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200"
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color="#ea580c" />
                    ) : (
                      <Ionicons name="navigate-circle-outline" size={12} color="#ea580c" />
                    )}
                    <Text className="text-[10px] font-black text-primary">
                      {isLocating ? 'Locating...' : 'Use Current GPS'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-3 flex-row items-start gap-2.5">
                  <Ionicons name="location-outline" size={18} color="#ea580c" />
                  <TextInput
                    value={editAddress}
                    onChangeText={setEditAddress}
                    placeholder="Enter street, area, city"
                    multiline
                    numberOfLines={2}
                    className="flex-1 text-sm font-bold text-gray-900"
                  />
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSaveProfile}
              activeOpacity={0.9}
              className="bg-primary rounded-2xl py-4 items-center justify-center shadow-lg"
            >
              <Text className="text-white text-sm font-black uppercase tracking-wider">
                Save Changes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
