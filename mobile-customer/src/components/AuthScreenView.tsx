import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { loginApi, registerApi, sendOtpApi, verifyOtpApi } from '../api';
import { useAuthStore } from '../store/useAuthStore';

type AuthTab = 'otp' | 'login' | 'signup';

interface AuthScreenViewProps {
  initialTab?: AuthTab;
}

export const AuthScreenView: React.FC<AuthScreenViewProps> = ({ initialTab = 'login' }) => {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email / Password Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration Form
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');

  // Phone OTP Form
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Reset error when switching tabs
  const handleTabChange = (tab: AuthTab) => {
    setError(null);
    setActiveTab(tab);
  };

  // 1. Email Sign In Handler
  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res: any = await loginApi({ email: email.trim(), password });
      if (res.token) {
        await login(res.token, res.data?.user || res.user || { name: 'Customer', email });
        Alert.alert('Welcome back!', 'Logged in successfully.');
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // 2. Send Phone OTP Handler
  const handleSendOtp = async () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res: any = await sendOtpApi({ phone: cleanPhone });
      setIsOtpSent(true);
      Alert.alert('OTP Sent', res.message || 'Verification code sent to your phone.');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify Phone OTP Handler
  const handleVerifyOtp = async () => {
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 4) {
      setError('Please enter the verification code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res: any = await verifyOtpApi({ phone: phone.trim(), otp: cleanOtp });
      if (res.token) {
        await login(res.token, res.data?.user || res.user || { name: `User_${phone.slice(-4)}`, phone });
        Alert.alert('Welcome!', 'Signed in successfully with phone.');
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  // 4. Registration Handler
  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in your name, email, and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res: any = await registerApi({
        name: fullName.trim(),
        email: email.trim(),
        password,
        phone: signupPhone.trim() || undefined,
      });

      if (res.token) {
        await login(res.token, res.data?.user || res.user || { name: fullName, email, phone: signupPhone });
        Alert.alert('🎉 Welcome to Yumora!', 'Account created successfully.');
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      {/* Background Food Photography */}
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=75&w=720',
        }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {/* Dark Vignette Overlay */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.48)' }]} />

      <SafeAreaView className="flex-1">
          {/* Top Navigation Bar */}
          <View className="px-5 pt-1 pb-2 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/30 backdrop-blur-md"
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              className="px-3.5 py-1.5 rounded-full bg-black/30 border border-white/20"
              activeOpacity={0.8}
            >
              <Text className="text-white/90 text-xs font-black tracking-wider uppercase">
                Skip
              </Text>
            </TouchableOpacity>
          </View>

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
              <View className="items-center mb-5">
                <View className="w-14 h-14 rounded-2xl bg-primary items-center justify-center shadow-2xl mb-2">
                  <Text className="text-white font-black text-2xl">Y</Text>
                </View>
                <Text className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                  Yumora
                </Text>
                <Text className="text-white/80 text-xs font-semibold mt-0.5">
                  Coimbatore's Premium Food Delivery
                </Text>
              </View>

              {/* Glassmorphism Auth Card */}
              <View style={styles.cardWrapper}>
                {Platform.OS === 'ios' ? (
                  <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.94)' }]} />
                )}
                <View style={styles.cardContent}>
                  {/* Card Title & Subtitle */}
                  <Text className="text-2xl font-black text-center text-gray-900">
                    Welcome
                  </Text>
                  <Text className="text-center font-semibold text-gray-500 text-xs mt-0.5">
                    Pick your preferred login method
                  </Text>

                  {/* Error Banner */}
                  {error && (
                    <View className="mt-3.5 p-3 bg-red-50/90 border border-red-200 rounded-2xl flex-row items-center gap-2">
                      <View className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      <Text className="text-red-700 text-xs font-bold flex-1">{error}</Text>
                    </View>
                  )}

                  {/* Segmented Tabs Switcher */}
                  <View className="flex-row bg-gray-200/60 p-1 rounded-2xl mt-4 mb-4">
                    <TouchableOpacity
                      onPress={() => handleTabChange('otp')}
                      style={[
                        styles.tabButton,
                        activeTab === 'otp' && styles.tabButtonActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.tabButtonText,
                          activeTab === 'otp' && styles.tabButtonTextActive,
                        ]}
                      >
                        Phone
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleTabChange('login')}
                      style={[
                        styles.tabButton,
                        activeTab === 'login' && styles.tabButtonActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.tabButtonText,
                          activeTab === 'login' && styles.tabButtonTextActive,
                        ]}
                      >
                        Email
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleTabChange('signup')}
                      style={[
                        styles.tabButton,
                        activeTab === 'signup' && styles.tabButtonActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.tabButtonText,
                          activeTab === 'signup' && styles.tabButtonTextActive,
                        ]}
                      >
                        Join
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Tab 1: Phone OTP */}
                  {activeTab === 'otp' && (
                    <View className="space-y-3.5">
                      {!isOtpSent ? (
                        <>
                          <View>
                            <Text className="text-[10px] font-black uppercase text-gray-500 mb-1.5 ml-1">
                              Phone Number
                            </Text>
                            <View className="bg-white/80 border border-gray-200 rounded-2xl px-3.5 py-3 flex-row items-center gap-2.5">
                              <Ionicons name="call-outline" size={18} color="#ea580c" />
                              <Text className="text-sm font-bold text-gray-700 mr-1">+91</Text>
                              <TextInput
                                placeholder="Enter 10-digit number"
                                placeholderTextColor="#9ca3af"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                maxLength={10}
                                className="flex-1 text-sm font-bold text-gray-900"
                              />
                            </View>
                          </View>

                          <TouchableOpacity
                            disabled={loading}
                            onPress={handleSendOtp}
                            activeOpacity={0.9}
                            className="bg-primary rounded-2xl py-3.5 items-center justify-center shadow-lg mt-2"
                          >
                            {loading ? (
                              <ActivityIndicator color="#ffffff" />
                            ) : (
                              <Text className="text-white text-sm font-black">
                                Send Verification Code
                              </Text>
                            )}
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <View>
                            <Text className="text-[10px] font-black uppercase text-gray-500 mb-1.5 ml-1">
                              Enter 6-Digit Code
                            </Text>
                            <View className="bg-white/80 border border-gray-200 rounded-2xl px-3.5 py-3 flex-row items-center gap-2.5">
                              <Ionicons name="key-outline" size={18} color="#ea580c" />
                              <TextInput
                                placeholder="••••••"
                                placeholderTextColor="#9ca3af"
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                maxLength={6}
                                className="flex-1 text-center text-lg font-black tracking-widest text-gray-900"
                              />
                            </View>
                            <Text className="text-[11px] text-gray-500 font-semibold text-center mt-2">
                              Code sent to <Text className="font-bold text-gray-800">+91 {phone}</Text>
                            </Text>
                          </View>

                          <TouchableOpacity
                            disabled={loading}
                            onPress={handleVerifyOtp}
                            activeOpacity={0.9}
                            className="bg-primary rounded-2xl py-3.5 items-center justify-center shadow-lg mt-2"
                          >
                            {loading ? (
                              <ActivityIndicator color="#ffffff" />
                            ) : (
                              <Text className="text-white text-sm font-black">
                                Verify & Sign In
                              </Text>
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              setIsOtpSent(false);
                              setOtp('');
                            }}
                            className="py-1 items-center"
                          >
                            <Text className="text-xs font-bold text-primary">
                              Change Phone Number
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}

                  {/* Tab 2: Email Sign In */}
                  {activeTab === 'login' && (
                    <View className="space-y-3">
                      <View>
                        <Text className="text-[10px] font-black uppercase text-gray-500 mb-1.5 ml-1">
                          Email
                        </Text>
                        <View className="bg-white/80 border border-gray-200 rounded-2xl px-3.5 py-3 flex-row items-center gap-2.5">
                          <Ionicons name="mail-outline" size={18} color="#ea580c" />
                          <TextInput
                            placeholder="your@email.com"
                            placeholderTextColor="#9ca3af"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            className="flex-1 text-sm font-bold text-gray-900"
                          />
                        </View>
                      </View>

                      <View className="mt-3">
                        <Text className="text-[10px] font-black uppercase text-gray-500 mb-1.5 ml-1">
                          Password
                        </Text>
                        <View className="bg-white/80 border border-gray-200 rounded-2xl px-3.5 py-3 flex-row items-center gap-2.5">
                          <Ionicons name="lock-closed-outline" size={18} color="#ea580c" />
                          <TextInput
                            placeholder="••••••••"
                            placeholderTextColor="#9ca3af"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            className="flex-1 text-sm font-bold text-gray-900"
                          />
                          <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons
                              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                              size={18}
                              color="#9ca3af"
                            />
                          </TouchableOpacity>
                        </View>

                        <View className="flex-row justify-end mt-1.5 mr-1">
                          <TouchableOpacity
                            onPress={() =>
                              Alert.alert(
                                'Forgot Password',
                                'Please contact support or check your email to reset your password.'
                              )
                            }
                          >
                            <Text className="text-xs font-bold text-primary">
                              Forgot Password?
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <TouchableOpacity
                        disabled={loading}
                        onPress={handleEmailLogin}
                        activeOpacity={0.9}
                        className="bg-primary rounded-2xl py-3.5 items-center justify-center shadow-lg mt-3"
                      >
                        {loading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <Text className="text-white text-sm font-black">Sign In</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Tab 3: Join / Register */}
                  {activeTab === 'signup' && (
                    <View className="space-y-3">
                      <View>
                        <Text className="text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">
                          Full Name
                        </Text>
                        <View className="bg-white/80 border border-gray-200 rounded-2xl px-3.5 py-2.5 flex-row items-center gap-2.5">
                          <Ionicons name="person-outline" size={17} color="#ea580c" />
                          <TextInput
                            placeholder="Your Name"
                            placeholderTextColor="#9ca3af"
                            value={fullName}
                            onChangeText={setFullName}
                            className="flex-1 text-sm font-bold text-gray-900"
                          />
                        </View>
                      </View>

                      <View className="mt-2">
                        <Text className="text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">
                          Email
                        </Text>
                        <View className="bg-white/80 border border-gray-200 rounded-2xl px-3.5 py-2.5 flex-row items-center gap-2.5">
                          <Ionicons name="mail-outline" size={17} color="#ea580c" />
                          <TextInput
                            placeholder="your@email.com"
                            placeholderTextColor="#9ca3af"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            className="flex-1 text-sm font-bold text-gray-900"
                          />
                        </View>
                      </View>

                      <View className="mt-2">
                        <Text className="text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">
                          Phone Number (Optional)
                        </Text>
                        <View className="bg-white/80 border border-gray-200 rounded-2xl px-3.5 py-2.5 flex-row items-center gap-2.5">
                          <Ionicons name="call-outline" size={17} color="#ea580c" />
                          <TextInput
                            placeholder="10-digit number"
                            placeholderTextColor="#9ca3af"
                            value={signupPhone}
                            onChangeText={setSignupPhone}
                            keyboardType="phone-pad"
                            maxLength={10}
                            className="flex-1 text-sm font-bold text-gray-900"
                          />
                        </View>
                      </View>

                      <View className="flex-row gap-2.5 mt-2">
                        <View className="flex-1">
                          <Text className="text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">
                            Password
                          </Text>
                          <View className="bg-white/80 border border-gray-200 rounded-2xl px-3 py-2.5 flex-row items-center gap-1.5">
                            <TextInput
                              placeholder="Min 6 chars"
                              placeholderTextColor="#9ca3af"
                              value={password}
                              onChangeText={setPassword}
                              secureTextEntry={!showPassword}
                              className="flex-1 text-xs font-bold text-gray-900"
                            />
                          </View>
                        </View>

                        <View className="flex-1">
                          <Text className="text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">
                            Confirm
                          </Text>
                          <View className="bg-white/80 border border-gray-200 rounded-2xl px-3 py-2.5 flex-row items-center gap-1.5">
                            <TextInput
                              placeholder="Repeat pwd"
                              placeholderTextColor="#9ca3af"
                              value={confirmPassword}
                              onChangeText={setConfirmPassword}
                              secureTextEntry={!showPassword}
                              className="flex-1 text-xs font-bold text-gray-900"
                            />
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity
                        disabled={loading}
                        onPress={handleSignup}
                        activeOpacity={0.9}
                        className="bg-primary rounded-2xl py-3.5 items-center justify-center shadow-lg mt-3"
                      >
                        {loading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <Text className="text-white text-sm font-black">
                            Create Account
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Bottom Alternate Mode Link */}
                  <View className="flex-row items-center justify-center gap-1 mt-5 pt-3 border-t border-gray-200/50">
                    <Text className="text-xs text-gray-500 font-semibold">
                      {activeTab === 'signup'
                        ? 'Already have an account?'
                        : "Don't have an account?"}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        handleTabChange(activeTab === 'signup' ? 'login' : 'signup')
                      }
                    >
                      <Text className="text-xs text-primary font-black">
                        {activeTab === 'signup' ? 'Sign In' : 'Join'}
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
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  cardWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  cardContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    fontWeight: '900',
    color: '#111827',
  },
});
