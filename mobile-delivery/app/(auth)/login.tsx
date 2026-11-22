import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useDeliveryAuthStore } from '../../src/store/useDeliveryAuthStore';

export default function DeliveryLoginScreen() {
  const { login } = useDeliveryAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    const res = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (res.success) {
      router.replace('/(tabs)');
    } else {
      setErrorMsg(res.message || 'Login failed');
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('rider@yumora.com');
    setPassword('password123');
    setErrorMsg(null);
  };

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?q=80&w=1200',
        }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {/* Dark Vignette Overlay */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.52)' }]} />

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
              {/* Brand Header */}
              <View className="items-center mb-6">
                <View className="w-16 h-16 rounded-3xl bg-primary items-center justify-center shadow-2xl mb-2 border border-white/20">
                  <Ionicons name="bicycle" size={32} color="#ffffff" />
                </View>
                <Text className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                  Yumora <Text className="text-orange-400">Rider</Text>
                </Text>
                <Text className="text-white/80 text-xs font-semibold mt-1">
                  Delivery Partner Fleet Portal
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
                    Partner Sign In
                  </Text>
                  <Text className="text-center font-semibold text-gray-500 text-xs mt-1 mb-5">
                    Enter your credentials to start your shift
                  </Text>

                  {/* Error Banner */}
                  {errorMsg && (
                    <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex-row items-center gap-2">
                      <View className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      <Text className="text-red-700 text-xs font-bold flex-1">{errorMsg}</Text>
                    </View>
                  )}

                  {/* Email Input */}
                  <View className="mb-4">
                    <Text className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Email Address
                    </Text>
                    <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:border-primary">
                      <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="rider@yumora.com"
                        placeholderTextColor="#9ca3af"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        className="flex-1 ml-3 text-gray-900 text-sm font-semibold"
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View className="mb-5">
                    <Text className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
                        className="flex-1 ml-3 text-gray-900 text-sm font-semibold"
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="#9ca3af"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Login Button */}
                  <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.85}
                    className="w-full bg-primary rounded-2xl py-4 items-center justify-center shadow-lg shadow-orange-600/30 flex-row"
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Text className="text-white text-base font-black mr-2">Start Shift</Text>
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
                      Quick Fill Demo Rider (rider@yumora.com)
                    </Text>
                  </TouchableOpacity>

                  {/* Onboarding Link */}
                  <View className="mt-5 items-center flex-row justify-center">
                    <Text className="text-gray-500 text-xs font-semibold">Want to deliver with us? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                      <Text className="text-primary font-black text-xs">Join Fleet</Text>
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
