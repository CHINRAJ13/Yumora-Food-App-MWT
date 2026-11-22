import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

interface ProfileMenuModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileMenuModal: React.FC<ProfileMenuModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const totalCartItems = useCartStore((state) => state.getTotalItems());

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const handleProfile = () => {
    onClose();
    router.push('/profile');
  };

  const handleCart = () => {
    onClose();
    router.push('/cart');
  };

  const handleLogout = () => {
    onClose();
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Yumora?',
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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.popoverCard,
            { top: insets.top + (Platform.OS === 'ios' ? 12 : 20) },
          ]}
        >
          {/* Mini Profile Header Card */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleProfile}
            className="flex-row items-center gap-3 p-3.5 bg-orange-50/60 rounded-2xl mb-2 border border-orange-100"
          >
            <View className="relative">
              <View className="w-12 h-12 rounded-full bg-orange-600 items-center justify-center shadow-sm">
                <Text className="text-white text-base font-black">{initials}</Text>
              </View>
              <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
            </View>

            <View className="flex-1 pr-1">
              <Text numberOfLines={1} className="text-base font-black text-gray-900">
                {user?.name || 'Customer'}
              </Text>
              <Text numberOfLines={1} className="text-xs font-semibold text-gray-500 mt-0.5">
                {user?.phone || user?.email || 'Valued Member'}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          {/* Action Items: My Cart */}
          <View className="py-1">
            <TouchableOpacity
              onPress={handleCart}
              activeOpacity={0.7}
              className="flex-row items-center justify-between py-2.5 px-3 rounded-2xl active:bg-gray-50"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-amber-100 items-center justify-center">
                  <Ionicons name="cart-outline" size={18} color="#d97706" />
                </View>
                <View>
                  <Text className="text-sm font-black text-gray-800">My Cart</Text>
                  <Text className="text-xs text-gray-400 font-medium">View added dishes</Text>
                </View>
              </View>

              {totalCartItems > 0 && (
                <View className="bg-primary px-2.5 py-0.5 rounded-full">
                  <Text className="text-white text-xs font-black">{totalCartItems}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-gray-100 my-1.5" />

          {/* Sign Out Button */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            className="flex-row items-center gap-3 py-2 px-3 rounded-2xl active:bg-red-50"
          >
            <View className="w-9 h-9 rounded-full bg-red-50 items-center justify-center">
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            </View>
            <Text className="text-sm font-black text-red-600">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  popoverCard: {
    position: 'absolute',
    right: 16,
    width: 280,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 9999,
  },
});
