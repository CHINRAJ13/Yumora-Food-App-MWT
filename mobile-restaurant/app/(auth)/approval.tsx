import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export default function ApprovalStatusScreen() {
  const handleSupport = () => {
    Linking.openURL('tel:1800123456');
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200',
        }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.58)' }]} />

      <SafeAreaView className="flex-1 justify-center px-6">
        <View style={styles.cardWrapper}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.96)' }]} />
          )}

          <View style={styles.cardContent}>
            <View className="items-center mb-6">
              <View className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 items-center justify-center mb-4 shadow-sm">
                <Ionicons name="time-outline" size={40} color="#d97706" />
              </View>

              <Text className="text-2xl font-black text-gray-900 tracking-tight text-center mb-2">
                Application Under Review
              </Text>

              <Text className="text-xs text-gray-500 font-medium text-center leading-5 mb-5">
                Thank you for applying to partner with Yumora! Our compliance team is verifying your FSSAI and kitchen details.
              </Text>

              {/* Progress Milestones */}
              <View className="bg-gray-50 border border-gray-100 rounded-2xl p-4 w-full mb-4">
                <View className="flex-row items-center mb-2.5">
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                  <Text className="text-xs font-bold text-gray-700 ml-2">Restaurant Profile Created</Text>
                </View>
                <View className="flex-row items-center mb-2.5">
                  <Ionicons name="hourglass" size={18} color="#d97706" />
                  <Text className="text-xs font-bold text-amber-700 ml-2">Document Verification (In Progress)</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="ellipse-outline" size={18} color="#9ca3af" />
                  <Text className="text-xs font-bold text-gray-400 ml-2">Kitchen Activation & Menu Live</Text>
                </View>
              </View>
            </View>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={handleSupport}
                activeOpacity={0.85}
                className="bg-gray-100 rounded-2xl py-3.5 flex-row items-center justify-center"
              >
                <Ionicons name="call-outline" size={18} color="#374151" />
                <Text className="text-gray-800 font-bold text-sm ml-2">Contact Merchant Support</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.85}
                className="bg-primary rounded-2xl py-3.5 items-center justify-center shadow-md shadow-orange-500/25 mt-2"
              >
                <Text className="text-white font-black text-sm">Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cardWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  cardContent: {
    padding: 24,
    position: 'relative',
    zIndex: 1,
  },
});
