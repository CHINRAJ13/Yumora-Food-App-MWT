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
  Alert,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { registerRestaurantApi } from '../../src/api';

export default function RestaurantRegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisines, setCuisines] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [fssaiNumber, setFssaiNumber] = useState('');

  // KYC Document Images
  const [aadharImageUri, setAadharImageUri] = useState<string | null>(null);
  const [fssaiCertificateUri, setFssaiCertificateUri] = useState<string | null>(null);
  const [storefrontImageUri, setStorefrontImageUri] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Helper to pick document from library
  const pickDocument = async (type: 'aadhar' | 'fssai' | 'storefront') => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Gallery access is required to upload verification documents.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets[0]?.uri) {
        const uri = res.assets[0].uri;
        if (type === 'aadhar') setAadharImageUri(uri);
        if (type === 'fssai') setFssaiCertificateUri(uri);
        if (type === 'storefront') setStorefrontImageUri(uri);
      }
    } catch {
      Alert.alert('Upload Error', 'Failed to pick image from device.');
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim() || !restaurantName.trim()) {
      setErrorMsg('Please fill in all core partner and restaurant details.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!aadharNumber || !/^\d{12}$/.test(aadharNumber.trim())) {
      setErrorMsg('Please enter a valid 12-digit Aadhar number.');
      return;
    }

    if (!aadharImageUri) {
      setErrorMsg('Owner Aadhar Card document photo is required.');
      return;
    }

    if (!fssaiNumber.trim()) {
      setErrorMsg('FSSAI License/Certificate Number is mandatory.');
      return;
    }

    if (!fssaiCertificateUri) {
      setErrorMsg('FSSAI License / Certificate document photo is required.');
      return;
    }

    setErrorMsg(null);
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      formData.append('password', password);
      formData.append('restaurantName', restaurantName.trim());
      formData.append('cuisines', cuisines.trim() || 'Multicuisine');
      formData.append('aadharNumber', aadharNumber.trim());
      formData.append('fssaiNumber', fssaiNumber.trim());

      formData.append('aadharImage', {
        uri: aadharImageUri,
        name: 'aadhar.jpg',
        type: 'image/jpeg',
      } as any);

      formData.append('fssaiCertificate', {
        uri: fssaiCertificateUri,
        name: 'fssai.jpg',
        type: 'image/jpeg',
      } as any);

      if (storefrontImageUri) {
        formData.append('image', {
          uri: storefrontImageUri,
          name: 'storefront.jpg',
          type: 'image/jpeg',
        } as any);
      }

      const res: any = await registerRestaurantApi(formData);
      if (res?.status === 'success' || res?.data) {
        setIsSuccess(true);
      } else {
        setErrorMsg(res?.message || 'Could not register restaurant.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit registration. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-6">
        <View className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 items-center justify-center mb-6">
          <Ionicons name="checkmark-done" size={44} color="#10b981" />
        </View>
        <Text className="text-2xl font-black text-gray-900 text-center mb-2">
          Registration Submitted! 🎉
        </Text>
        <Text className="text-xs text-gray-500 font-semibold text-center mb-8 px-4 leading-5">
          Your restaurant partner application and KYC documents have been submitted. Our compliance team will verify your documents within 24 hours.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/approval')}
          className="bg-primary px-8 py-3.5 rounded-2xl shadow-lg shadow-orange-600/30"
        >
          <Text className="text-white font-black text-sm">Check Approval Status</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Document Upload Card Sub-component
  const DocumentPickerCard = ({
    title,
    uri,
    onPress,
    icon = 'document-attach',
    required = false,
  }: {
    title: string;
    uri: string | null;
    onPress: () => void;
    icon?: any;
    required?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`p-3 rounded-2xl border-2 border-dashed flex-row items-center justify-between mb-3 ${
        uri ? 'bg-emerald-50/70 border-emerald-300' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <View className="flex-row items-center flex-1 mr-2">
        {uri ? (
          <Image source={{ uri }} className="w-12 h-12 rounded-xl mr-3 bg-gray-200" />
        ) : (
          <View className="w-12 h-12 rounded-xl bg-orange-100 items-center justify-center mr-3">
            <Ionicons name={icon} size={22} color="#ea580c" />
          </View>
        )}
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-xs font-black text-gray-900">{title}</Text>
            {required && !uri && (
              <View className="bg-red-100 px-1.5 py-0.5 rounded">
                <Text className="text-[9px] font-bold text-red-600">Required</Text>
              </View>
            )}
          </View>
          <Text className="text-[10px] text-gray-400 mt-0.5">
            {uri ? 'Photo attached • Tap to change' : 'Tap to upload photo'}
          </Text>
        </View>
      </View>

      <View
        className={`w-7 h-7 rounded-full items-center justify-center ${
          uri ? 'bg-emerald-500' : 'bg-gray-200'
        }`}
      >
        <Ionicons name={uri ? 'checkmark' : 'cloud-upload'} size={14} color="#ffffff" />
      </View>
    </TouchableOpacity>
  );

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

      <SafeAreaView className="flex-1">
        {/* Top Back Nav */}
        <View className="px-5 pt-2 pb-1 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/30"
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white font-black text-lg ml-3">Merchant Onboarding</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-5 pt-4 pb-12"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Glassmorphic Form Card */}
            <View style={styles.cardWrapper} className="mb-8">
              {Platform.OS === 'ios' ? (
                <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.96)' }]} />
              )}

              <View style={styles.cardContent}>
                <Text className="text-2xl font-black text-gray-900">Partner Registration</Text>
                <Text className="text-xs font-semibold text-gray-500 mt-1 mb-5">
                  Join Yumora Food Network & grow your restaurant orders
                </Text>

                {errorMsg && (
                  <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex-row items-center gap-2">
                    <Ionicons name="alert-circle" size={18} color="#ef4444" />
                    <Text className="text-red-700 text-xs font-bold flex-1">{errorMsg}</Text>
                  </View>
                )}

                <View className="space-y-3.5">
                  {/* Restaurant Details Section */}
                  <Text className="text-xs font-black text-primary uppercase tracking-wider mt-1">
                    1. Restaurant Details
                  </Text>

                  <View>
                    <Text className="text-[11px] font-bold text-gray-600 mb-1">Restaurant Name *</Text>
                    <TextInput
                      value={restaurantName}
                      onChangeText={setRestaurantName}
                      placeholder="e.g. Spice Symphony Kitchen"
                      placeholderTextColor="#9ca3af"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 font-medium"
                    />
                  </View>

                  <View>
                    <Text className="text-[11px] font-bold text-gray-600 mb-1">Cuisines (comma separated)</Text>
                    <TextInput
                      value={cuisines}
                      onChangeText={setCuisines}
                      placeholder="e.g. Biryani, South Indian, Fast Food"
                      placeholderTextColor="#9ca3af"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 font-medium"
                    />
                  </View>

                  <View className="mt-1">
                    <Text className="text-[11px] font-bold text-gray-600 mb-1">Storefront / Restaurant Logo Photo (Optional)</Text>
                    <DocumentPickerCard
                      title="Storefront Photo"
                      uri={storefrontImageUri}
                      onPress={() => pickDocument('storefront')}
                      icon="image"
                      required={false}
                    />
                  </View>

                  {/* Owner Details Section */}
                  <Text className="text-xs font-black text-primary uppercase tracking-wider mt-4">
                    2. Owner Information
                  </Text>

                  <View>
                    <Text className="text-[11px] font-bold text-gray-600 mb-1">Owner Full Name *</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g. Anand Kumar"
                      placeholderTextColor="#9ca3af"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 font-medium"
                    />
                  </View>

                  <View>
                    <Text className="text-[11px] font-bold text-gray-600 mb-1">Contact Email *</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="partner@restaurant.com"
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 font-medium"
                    />
                  </View>

                  <View>
                    <Text className="text-[11px] font-bold text-gray-600 mb-1">Phone Number *</Text>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="+91 9876543210"
                      placeholderTextColor="#9ca3af"
                      keyboardType="phone-pad"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 font-medium"
                    />
                  </View>

                  <View>
                    <Text className="text-[11px] font-bold text-gray-600 mb-1">Account Password *</Text>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Create a strong password (min 6 chars)"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 font-medium"
                    />
                  </View>

                  <View>
                    <Text className="text-[11px] font-bold text-gray-600 mb-1">Confirm Password *</Text>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 font-medium"
                    />
                  </View>

                  {/* Compliance & KYC Section */}
                  <Text className="text-xs font-black text-primary uppercase tracking-wider mt-4">
                    3. Verification & Compliance Documents
                  </Text>

                  <View>
                    <Text className="text-[11px] font-bold text-gray-600 mb-1">12-Digit Aadhar Number *</Text>
                    <TextInput
                      value={aadharNumber}
                      onChangeText={setAadharNumber}
                      placeholder="1234 5678 9012"
                      placeholderTextColor="#9ca3af"
                      keyboardType="number-pad"
                      maxLength={12}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 font-medium font-mono"
                    />
                  </View>

                  <View>
                    <Text className="text-[11px] font-bold text-gray-600 mb-1">Owner Aadhar Card Photo *</Text>
                    <DocumentPickerCard
                      title="Aadhar Card Photo *"
                      uri={aadharImageUri}
                      onPress={() => pickDocument('aadhar')}
                      icon="card"
                      required={true}
                    />
                  </View>

                  <View>
                    <Text className="text-[11px] font-bold text-gray-600 mb-1">FSSAI License / Registration No. *</Text>
                    <TextInput
                      value={fssaiNumber}
                      onChangeText={setFssaiNumber}
                      placeholder="14-digit FSSAI Number"
                      placeholderTextColor="#9ca3af"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 font-medium font-mono"
                    />
                  </View>

                  <View>
                    <Text className="text-[11px] font-bold text-gray-600 mb-1">FSSAI Certificate Photo *</Text>
                    <DocumentPickerCard
                      title="FSSAI Certificate Photo *"
                      uri={fssaiCertificateUri}
                      onPress={() => pickDocument('fssai')}
                      icon="ribbon"
                      required={true}
                    />
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleRegister}
                    disabled={isSubmitting}
                    activeOpacity={0.88}
                    className="bg-primary rounded-2xl py-4 items-center justify-center mt-6 mb-4 shadow-lg shadow-orange-500/25 flex-row"
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Text className="text-white text-base font-black mr-2">
                          Submit Application
                        </Text>
                        <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                      </>
                    )}
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
