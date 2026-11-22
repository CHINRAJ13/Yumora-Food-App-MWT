import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurantAuthStore } from '../../src/store/useRestaurantAuthStore';

export default function RestaurantLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const login = useRestaurantAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both partner email and password.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await login(email.trim().toLowerCase(), password);
      if (res.success) {
        router.replace('/(tabs)');
      } else {
        if (res.message?.toLowerCase().includes('pending approval')) {
          router.replace('/(auth)/approval');
        } else {
          setErrorMsg(res.message || 'Invalid partner credentials');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('restaurant@yumora.com');
    setPassword('password123');
    setErrorMsg(null);
  };

  return (
    <View style={styles.container}>
      {/* Background Kitchen / Gourmet Photography */}
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200',
        }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Dark Vignette Overlay */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.55)' }]} />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Brand */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-3xl bg-primary items-center justify-center shadow-2xl mb-3 border border-white/20">
                <Ionicons name="restaurant" size={32} color="#ffffff" />
              </View>
              <Text className="text-3xl font-black text-white tracking-tight drop-shadow-md text-center">
                Yumora <Text className="text-orange-400">Kitchen</Text>
              </Text>
              <Text className="text-white/80 text-xs font-bold mt-1 uppercase tracking-wider text-center">
                Restaurant & Partner Portal
              </Text>
            </View>

            {/* Glassmorphic Auth Card */}
            <View style={styles.cardWrapper}>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]} />
              )}

              <View style={styles.cardContent}>
                <Text className="text-2xl font-black text-center text-gray-900">
                  Kitchen Sign In
                </Text>
                <Text className="text-center font-semibold text-gray-500 text-xs mt-1 mb-5">
                  Enter your credentials to manage live kitchen orders
                </Text>

                {/* Error Banner */}
                {errorMsg && (
                  <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex-row items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <Text className="text-red-700 text-xs font-bold flex-1">{errorMsg}</Text>
                  </View>
                )}

                {/* Partner Email */}
                <View className="mb-4">
                  <Text className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 ml-1">
                    Partner Email
                  </Text>
                  <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:border-primary">
                    <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="restaurant@yumora.com"
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      className="flex-1 ml-3 text-sm text-gray-900 font-semibold"
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View className="mb-5">
                  <Text className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 ml-1">
                    Password
                  </Text>
                  <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:border-primary">
                    <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      className="flex-1 ml-3 text-sm text-gray-900 font-semibold"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                      className="p-1"
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#9ca3af"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isSubmitting}
                  activeOpacity={0.88}
                  className="w-full bg-primary rounded-2xl py-4 items-center justify-center shadow-lg shadow-orange-600/30 flex-row"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Text className="text-white text-base font-black mr-2">
                        Sign In to Kitchen
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Quick Fill Demo Button */}
                <TouchableOpacity
                  onPress={handleQuickDemoFill}
                  activeOpacity={0.8}
                  className="w-full mt-3 bg-orange-50 border border-orange-200 rounded-2xl py-3 items-center justify-center flex-row"
                >
                  <Ionicons name="flash" size={16} color="#ea580c" />
                  <Text className="text-primary text-xs font-black ml-1.5">
                    Quick Fill Demo (restaurant@yumora.com)
                  </Text>
                </TouchableOpacity>

                {/* Register Link */}
                <View className="mt-5 items-center flex-row justify-center">
                  <Text className="text-gray-500 text-xs font-semibold">
                    Want to partner with Yumora?{' '}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(auth)/register')}
                    activeOpacity={0.7}
                  >
                    <Text className="text-primary font-black text-xs">
                      Register Restaurant
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
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
