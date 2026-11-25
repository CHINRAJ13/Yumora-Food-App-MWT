import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRestaurantAuthStore } from '../../src/store/useRestaurantAuthStore';
import { updateRestaurantProfileApi } from '../../src/api';
import { soundService } from '../../src/services/soundService';
import { dialPhoneNumber } from '../../src/utils/navigation';

export default function RestaurantProfileScreen() {
  const router = useRouter();
  const user = useRestaurantAuthStore((s) => s.user);
  const restaurant = useRestaurantAuthStore((s) => s.restaurant);
  const isOnline = useRestaurantAuthStore((s) => s.isOnline);
  const toggleOnlineStatus = useRestaurantAuthStore((s) => s.toggleOnlineStatus);
  const logout = useRestaurantAuthStore((s) => s.logout);
  const refreshProfile = useRestaurantAuthStore((s) => s.refreshProfile);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCuisines, setEditCuisines] = useState('');
  const [editDeliveryTime, setEditDeliveryTime] = useState('');
  const [editPriceForTwo, setEditPriceForTwo] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editIsVeg, setEditIsVeg] = useState(false);
  const [newBannerUri, setNewBannerUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const handleOpenEdit = () => {
    setEditName(restaurant?.name || '');
    setEditCuisines(restaurant?.cuisines?.join(', ') || '');
    setEditDeliveryTime(restaurant?.deliveryTime || '25-35 mins');
    const coords = (restaurant as any)?.location?.coordinates;
    const validCoords = Array.isArray(coords) && coords.length === 2 && !(coords[0] === 0 && coords[1] === 0);
    setEditPriceForTwo(String(restaurant?.priceForTwo || '350'));
    setEditLat(validCoords ? String(coords[1]) : '');
    setEditLng(validCoords ? String(coords[0]) : '');
    setEditIsVeg(!!restaurant?.isVeg);
    setNewBannerUri(null);
    setIsEditModalOpen(true);
  };

  const handlePickBanner = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Denied', 'Camera roll access is required to upload a banner.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setNewBannerUri(res.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Restaurant name cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('name', editName.trim());
      formData.append('cuisines', editCuisines.trim());
      formData.append('deliveryTime', editDeliveryTime.trim());
      formData.append('priceForTwo', editPriceForTwo.trim());
      formData.append('isVeg', String(editIsVeg));
      if (editLat.trim() && editLng.trim()) {
        formData.append('lat', editLat.trim());
        formData.append('lng', editLng.trim());
      }

      if (newBannerUri) {
        const filename = newBannerUri.split('/').pop() || 'banner.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append('image', {
          uri: newBannerUri,
          name: filename,
          type,
        } as any);
      }

      const res: any = await updateRestaurantProfileApi(formData);
      if (res?.status === 'success' || res?.data) {
        await refreshProfile();
        setIsEditModalOpen(false);
        Alert.alert('Success', 'Restaurant profile updated successfully!');
      } else {
        Alert.alert('Update Failed', res?.message || 'Could not update profile.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleOnline = async () => {
    const success = await toggleOnlineStatus();
    if (!success) {
      Alert.alert('Status Error', 'Could not update store status. Please try again.');
    }
  };

  const handleTestChime = () => {
    soundService.playOrderAlert({ loop: false, vibrate: true });
    Alert.alert(
      'Kitchen Chime 🔔',
      'A synthetic order alert chime and double vibration was triggered.'
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out of your Yumora Merchant account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const bannerImage =
    newBannerUri ||
    restaurant?.image ||
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Top Header */}
      <View className="px-5 py-3.5 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-black text-gray-900">Kitchen Settings</Text>
          <Text className="text-xs font-semibold text-gray-500 mt-0.5">
            Store identity & kitchen hardware
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
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Restaurant Hero Banner Card */}
        <View className="px-5 pt-4">
          <View className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            {/* Banner Image Container */}
            <View className="h-40 bg-gray-200 relative">
              <Image
                source={{ uri: bannerImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/25" />

              {/* Edit button badge */}
              <TouchableOpacity
                onPress={handleOpenEdit}
                activeOpacity={0.8}
                className="absolute top-3 right-3 bg-white/95 px-3 py-1.5 rounded-full flex-row items-center shadow-sm"
              >
                <Ionicons name="pencil" size={13} color="#ea580c" />
                <Text className="text-xs font-black text-gray-800 ml-1">Edit</Text>
              </TouchableOpacity>

              {/* Veg / NonVeg badge */}
              {restaurant?.isVeg && (
                <View className="absolute bottom-3 left-4 bg-emerald-600 px-3 py-1 rounded-full flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-white mr-1.5" />
                  <Text className="text-[10px] font-black text-white uppercase tracking-wider">
                    Pure Vegetarian
                  </Text>
                </View>
              )}
            </View>

            {/* Restaurant Meta Info */}
            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-black text-gray-900 flex-1 mr-2" numberOfLines={1}>
                  {restaurant?.name || 'Restaurant Name'}
                </Text>
                <View className="flex-row items-center bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text className="text-xs font-black text-amber-700 ml-1">
                    {restaurant?.rating ? Number(restaurant.rating).toFixed(1) : '4.8'}
                  </Text>
                </View>
              </View>

              <Text className="text-xs text-gray-500 mt-1 font-medium">
                {restaurant?.cuisines?.length
                  ? restaurant.cuisines.join(' • ')
                  : 'Fast Food • Multi-cuisine'}
              </Text>

              <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100 gap-4">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={14} color="#6b7280" />
                  <Text className="text-xs font-bold text-gray-600 ml-1">
                    {restaurant?.deliveryTime || '25-35 mins'}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="cash-outline" size={14} color="#6b7280" />
                  <Text className="text-xs font-bold text-gray-600 ml-1">
                    ₹{restaurant?.priceForTwo || 350} for two
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Master Duty Status Switch */}
        <View className="px-5 pt-4">
          <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center">
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: isOnline ? '#10b981' : '#9ca3af',
                    marginRight: 8,
                  }}
                />
                <Text className="text-sm font-black text-gray-900">
                  {isOnline ? 'Accepting Orders' : 'Store Offline'}
                </Text>
              </View>
              <Text className="text-xs text-gray-400 font-medium mt-1">
                {isOnline
                  ? 'Your store is live on customer search. Kitchen orders will ring instantly.'
                  : 'Your kitchen is currently closed. Customers cannot place new orders.'}
              </Text>
            </View>

            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: '#e5e7eb', true: '#fed7aa' }}
              thumbColor={isOnline ? '#ea580c' : '#9ca3af'}
            />
          </View>
        </View>

        {/* Sound & Hardware Alerts */}
        <View className="px-5 pt-3">
          <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-xl bg-orange-50 items-center justify-center mr-2.5">
                  <Ionicons name="notifications-outline" size={17} color="#ea580c" />
                </View>
                <View>
                  <Text className="text-sm font-black text-gray-900">Kitchen Bell Sound</Text>
                  <Text className="text-[10px] text-gray-400 font-medium">
                    Order chime & double vibration
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleTestChime}
                activeOpacity={0.8}
                className="bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl flex-row items-center"
              >
                <Ionicons name="volume-high" size={14} color="#ea580c" />
                <Text className="text-xs font-black text-primary ml-1">Test Chime</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-gray-500 font-medium leading-4">
              When a new customer order arrives, this device will sound a synthetic 880Hz kitchen bell and vibrate continuously until accepted.
            </Text>
          </View>
        </View>

        {/* Operational Info */}
        <View className="px-5 pt-3">
          <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
              Store Information
            </Text>

            {/* Address */}
            <View className="flex-row items-start mb-3 pb-3 border-b border-gray-50">
              <Ionicons name="location-outline" size={18} color="#6b7280" className="mt-0.5" />
              <View className="ml-2.5 flex-1">
                <Text className="text-xs font-bold text-gray-800">Kitchen Address</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {restaurant?.address || '123 Commercial Kitchen Row, Central Hub'}
                </Text>
              </View>
            </View>

            {/* Owner Email */}
            <View className="flex-row items-start mb-3 pb-3 border-b border-gray-50">
              <Ionicons name="mail-outline" size={18} color="#6b7280" className="mt-0.5" />
              <View className="ml-2.5 flex-1">
                <Text className="text-xs font-bold text-gray-800">Registered Email</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {user?.email || restaurant?.email || 'partner@cravequest.com'}
                </Text>
              </View>
            </View>

            {/* Owner Phone */}
            <View className="flex-row items-start">
              <Ionicons name="call-outline" size={18} color="#6b7280" className="mt-0.5" />
              <View className="ml-2.5 flex-1">
                <Text className="text-xs font-bold text-gray-800">Contact Number</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {user?.phone || restaurant?.phone || '+91 98765 43210'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Finance & Payouts */}
        <View className="px-5 pt-3">
          <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
              Finance & Settlements
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/wallet')}
              activeOpacity={0.7}
              className="flex-row items-center justify-between py-2"
            >
              <View className="flex-row items-center">
                <Ionicons name="wallet-outline" size={18} color="#ea580c" />
                <View className="ml-2.5">
                  <Text className="text-xs font-bold text-gray-800">
                    Kitchen Wallet & Bank Payouts
                  </Text>
                  <Text className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    Withdraw net revenue & inspect bank transfer status
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Help & Support */}
        <View className="px-5 pt-3">
          <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
              Merchant Support
            </Text>

            <TouchableOpacity
              onPress={() => dialPhoneNumber('1800123456')}
              activeOpacity={0.7}
              className="flex-row items-center justify-between py-2 border-b border-gray-50"
            >
              <View className="flex-row items-center">
                <Ionicons name="headset-outline" size={18} color="#ea580c" />
                <Text className="text-xs font-bold text-gray-800 ml-2.5">
                  Partner Care Helpline
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Merchant Terms',
                  'Standard 10% platform commission applies to fulfilled food items. Payouts are reconciled daily.'
                )
              }
              activeOpacity={0.7}
              className="flex-row items-center justify-between py-2"
            >
              <View className="flex-row items-center">
                <Ionicons name="document-text-outline" size={18} color="#ea580c" />
                <Text className="text-xs font-bold text-gray-800 ml-2.5">
                  Platform Agreement & Commission
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <View className="px-5 pt-5">
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.85}
            className="bg-red-50 border border-red-200 py-3.5 rounded-2xl items-center flex-row justify-center"
          >
            <Ionicons name="log-out-outline" size={18} color="#dc2626" />
            <Text className="text-red-600 font-black text-sm ml-2">
              Sign Out from Kitchen
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[90%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <Text className="text-lg font-black text-gray-900">
                Edit Restaurant Profile
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-3">
              {/* Banner Image selector */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-700 mb-1.5">
                  Cover Photo
                </Text>
                <TouchableOpacity
                  onPress={handlePickBanner}
                  activeOpacity={0.8}
                  className="h-32 bg-gray-100 rounded-2xl overflow-hidden border border-dashed border-gray-300 items-center justify-center relative"
                >
                  <Image
                    source={{ uri: newBannerUri || bannerImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black/30 items-center justify-center">
                    <Ionicons name="camera" size={24} color="#ffffff" />
                    <Text className="text-white font-bold text-xs mt-1">
                      Tap to change photo
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Name */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">
                  Restaurant Name
                </Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. Biryani Blues"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900"
                />
              </View>

              {/* Cuisines */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">
                  Cuisines (comma separated)
                </Text>
                <TextInput
                  value={editCuisines}
                  onChangeText={setEditCuisines}
                  placeholder="e.g. Biryani, North Indian, Kebabs"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900"
                />
              </View>

              {/* Delivery Time */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">
                  Estimated Delivery Time
                </Text>
                <TextInput
                  value={editDeliveryTime}
                  onChangeText={setEditDeliveryTime}
                  placeholder="e.g. 25-35 mins"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900"
                />
              </View>

              {/* Price For Two */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">
                  Average Price for Two (₹)
                </Text>
                <TextInput
                  value={editPriceForTwo}
                  onChangeText={setEditPriceForTwo}
                  placeholder="e.g. 350"
                  keyboardType="numeric"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900"
                />
              </View>

              {/* Kitchen GPS Coordinates */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">
                  Kitchen GPS Coordinates (for Distance Delivery Fee)
                </Text>
                <View className="flex-row gap-2">
                  <TextInput
                    value={editLat}
                    onChangeText={setEditLat}
                    placeholder="Lat (11.0168)"
                    keyboardType="numeric"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900"
                  />
                  <TextInput
                    value={editLng}
                    onChangeText={setEditLng}
                    placeholder="Lng (76.9558)"
                    keyboardType="numeric"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900"
                  />
                </View>
              </View>

              {/* Pure Veg Switch */}
              <View className="flex-row items-center justify-between py-2 mb-4">
                <View>
                  <Text className="text-xs font-bold text-gray-800">
                    Pure Vegetarian Restaurant
                  </Text>
                  <Text className="text-[10px] text-gray-400">
                    Tag kitchen as strictly 100% vegetarian
                  </Text>
                </View>
                <Switch
                  value={editIsVeg}
                  onValueChange={setEditIsVeg}
                  trackColor={{ false: '#e5e7eb', true: '#a7f3d0' }}
                  thumbColor={editIsVeg ? '#10b981' : '#9ca3af'}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={isSaving}
              activeOpacity={0.85}
              className="bg-primary py-3.5 rounded-2xl items-center shadow-md shadow-orange-500/25 mt-2 flex-row justify-center"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                  <Text className="text-white font-black text-sm ml-2">
                    Save Changes
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
