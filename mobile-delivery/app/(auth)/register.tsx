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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { registerDeliveryApi } from '../../src/api';

export default function DeliveryRegisterScreen() {
  // Personal Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Vehicle Info
  const [vehicleType, setVehicleType] = useState<'Bike' | 'Scooter' | 'Cycle'>('Bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  // Payout & Numbers
  const [aadharNumber, setAadharNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // KYC Document Images (Mandatory for Backend)
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [aadharUri, setAadharUri] = useState<string | null>(null);
  const [licenseUri, setLicenseUri] = useState<string | null>(null);
  const [rcUri, setRcUri] = useState<string | null>(null);
  const [panUri, setPanUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Helper to pick document from library
  const pickDocument = async (type: 'aadhar' | 'license' | 'rc' | 'pan') => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Gallery access is required to upload KYC documents.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets[0]?.uri) {
        const uri = res.assets[0].uri;
        if (type === 'aadhar') setAadharUri(uri);
        if (type === 'license') setLicenseUri(uri);
        if (type === 'rc') setRcUri(uri);
        if (type === 'pan') setPanUri(uri);
      }
    } catch (err: any) {
      Alert.alert('Upload Error', 'Failed to pick image from device.');
    }
  };

  // Helper to capture live selfie with front camera
  const captureSelfie = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera Permission Required', 'Please enable camera access to take your rider profile photo.');
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!res.canceled && res.assets[0]?.uri) {
        setSelfieUri(res.assets[0].uri);
      }
    } catch {
      // Fallback to gallery if camera fails in simulator
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        setSelfieUri(res.assets[0].uri);
      }
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setErrorMsg('Please fill in all personal information fields');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    if (!vehicleNumber.trim() || !licenseNumber.trim()) {
      setErrorMsg('Please enter your vehicle registration number and driving license number');
      return;
    }

    if (!aadharNumber || aadharNumber.length !== 12) {
      setErrorMsg('A valid 12-digit Aadhar number is required');
      return;
    }

    if (!panNumber || !accountNumber || !ifscCode) {
      setErrorMsg('Please complete bank details for weekly earnings payout');
      return;
    }

    // Mandatory KYC Image Checks
    if (!selfieUri) {
      setErrorMsg('Please take a live selfie/profile photo');
      return;
    }
    if (!aadharUri) {
      setErrorMsg('Please upload a photo of your Aadhar card');
      return;
    }
    if (!licenseUri) {
      setErrorMsg('Please upload a photo of your Driving License');
      return;
    }
    if (!rcUri) {
      setErrorMsg('Please upload a photo of your Vehicle RC book');
      return;
    }
    if (!panUri) {
      setErrorMsg('Please upload a photo of your PAN card');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('phone', phone.trim());
      formData.append('password', password);
      formData.append('vehicleType', vehicleType);
      formData.append('vehicleNumber', vehicleNumber.trim().toUpperCase());
      formData.append('licenseNumber', licenseNumber.trim().toUpperCase());
      formData.append('aadharNumber', aadharNumber.trim());
      formData.append('panNumber', panNumber.trim().toUpperCase());
      formData.append('accountNumber', accountNumber.trim());
      formData.append('ifscCode', ifscCode.trim().toUpperCase());

      // Attach KYC Image files for multer
      formData.append('selfieImage', {
        uri: selfieUri,
        name: 'selfie.jpg',
        type: 'image/jpeg',
      } as any);

      formData.append('aadharImage', {
        uri: aadharUri,
        name: 'aadhar.jpg',
        type: 'image/jpeg',
      } as any);

      formData.append('licenseImage', {
        uri: licenseUri,
        name: 'license.jpg',
        type: 'image/jpeg',
      } as any);

      formData.append('rcImage', {
        uri: rcUri,
        name: 'rc.jpg',
        type: 'image/jpeg',
      } as any);

      formData.append('panImage', {
        uri: panUri,
        name: 'pan.jpg',
        type: 'image/jpeg',
      } as any);

      const res: any = await registerDeliveryApi(formData);
      if (res && (res.status === 'success' || res.data)) {
        setIsSuccess(true);
      } else {
        setErrorMsg(res?.message || 'Registration failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Check inputs.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-6">
        <View className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 items-center justify-center mb-6">
          <Ionicons name="checkmark-done" size={44} color="#10b981" />
        </View>
        <Text className="text-2xl font-black text-gray-900 text-center mb-2">
          Application Submitted!
        </Text>
        <Text className="text-xs text-gray-500 font-semibold text-center mb-8 px-4 leading-5">
          Your delivery partner registration and KYC documents have been submitted. Our fleet team will verify your application within 24 hours.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          className="bg-primary px-8 py-3.5 rounded-2xl shadow-lg shadow-orange-600/30"
        >
          <Text className="text-white font-black text-sm">Return to Sign In</Text>
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
  }: {
    title: string;
    uri: string | null;
    onPress: () => void;
    icon?: any;
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
          <Text className="text-xs font-black text-gray-900">{title}</Text>
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
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?q=80&w=1200',
        }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]} />

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
          <Text className="text-white font-black text-lg ml-3">Fleet Onboarding</Text>
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
            <View style={styles.cardWrapper} className="mb-8">
              {Platform.OS === 'ios' ? (
                <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.97)' }]} />
              )}

              <View style={styles.cardContent}>
                <Text className="text-2xl font-black text-gray-900">Partner Registration</Text>
                <Text className="text-xs font-semibold text-gray-500 mt-1 mb-5">
                  Deliver food, earn payouts, and join the CraveQuest fleet
                </Text>

                {errorMsg && (
                  <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex-row items-center gap-2">
                    <Ionicons name="alert-circle" size={18} color="#ef4444" />
                    <Text className="text-red-700 text-xs font-bold flex-1">{errorMsg}</Text>
                  </View>
                )}

                {/* ── Section 1: Personal Information ── */}
                <Text className="text-xs font-black text-primary uppercase tracking-wider mb-3">
                  1. Personal Information & Photo
                </Text>

                <View className="mb-3">
                  <Text className="text-xs font-bold text-gray-700 mb-1">Full Name *</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Rahul Kumar"
                    placeholderTextColor="#9ca3af"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold text-sm"
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-xs font-bold text-gray-700 mb-1">Email Address *</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="rahul@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold text-sm"
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-xs font-bold text-gray-700 mb-1">Phone Number *</Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="9876543210"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold text-sm"
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-xs font-bold text-gray-700 mb-1">Password *</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Min 6 characters"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold text-sm"
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-xs font-bold text-gray-700 mb-1">Confirm Password *</Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold text-sm"
                  />
                </View>

                {/* Live Selfie Card */}
                <Text className="text-xs font-bold text-gray-700 mb-1.5">Live Profile Photo (Selfie) *</Text>
                <DocumentPickerCard
                  title="Take Profile Selfie"
                  uri={selfieUri}
                  onPress={captureSelfie}
                  icon="camera"
                />

                {/* ── Section 2: Vehicle Details ── */}
                <Text className="text-xs font-black text-primary uppercase tracking-wider mt-4 mb-3">
                  2. Vehicle Details & Documents
                </Text>

                <Text className="text-xs font-bold text-gray-700 mb-2">Vehicle Type</Text>
                <View className="flex-row space-x-2 mb-3">
                  {(['Bike', 'Scooter', 'Cycle'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setVehicleType(t)}
                      className={`flex-1 py-2.5 rounded-xl border items-center ${
                        vehicleType === t
                          ? 'bg-orange-50 border-primary'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          vehicleType === t ? 'text-primary' : 'text-gray-500'
                        }`}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View className="mb-3">
                  <Text className="text-xs font-bold text-gray-700 mb-1">Vehicle Registration Number *</Text>
                  <TextInput
                    value={vehicleNumber}
                    onChangeText={setVehicleNumber}
                    placeholder="TN 38 CD 4321"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="characters"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold text-sm"
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-xs font-bold text-gray-700 mb-1">Driving License Number *</Text>
                  <TextInput
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                    placeholder="DL-0420110012345"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="characters"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold text-sm"
                  />
                </View>

                <DocumentPickerCard
                  title="Driving License Photo *"
                  uri={licenseUri}
                  onPress={() => pickDocument('license')}
                  icon="card"
                />

                <DocumentPickerCard
                  title="Vehicle RC Book Photo *"
                  uri={rcUri}
                  onPress={() => pickDocument('rc')}
                  icon="car"
                />

                {/* ── Section 3: Payout & KYC ── */}
                <Text className="text-xs font-black text-primary uppercase tracking-wider mt-4 mb-3">
                  3. Payout & Identification (KYC)
                </Text>

                <View className="mb-3">
                  <Text className="text-xs font-bold text-gray-700 mb-1">Aadhar Number (12 digits) *</Text>
                  <TextInput
                    value={aadharNumber}
                    onChangeText={setAadharNumber}
                    placeholder="123456789012"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    maxLength={12}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold text-sm"
                  />
                </View>

                <DocumentPickerCard
                  title="Aadhar Card Photo *"
                  uri={aadharUri}
                  onPress={() => pickDocument('aadhar')}
                  icon="id-card"
                />

                <View className="mb-3">
                  <Text className="text-xs font-bold text-gray-700 mb-1">PAN Number *</Text>
                  <TextInput
                    value={panNumber}
                    onChangeText={setPanNumber}
                    placeholder="ABCDE1234F"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="characters"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold text-sm"
                  />
                </View>

                <DocumentPickerCard
                  title="PAN Card Photo *"
                  uri={panUri}
                  onPress={() => pickDocument('pan')}
                  icon="receipt"
                />

                <View className="mb-3">
                  <Text className="text-xs font-bold text-gray-700 mb-1">Bank Account Number *</Text>
                  <TextInput
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="1234567890123"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold text-sm"
                  />
                </View>

                <View className="mb-6">
                  <Text className="text-xs font-bold text-gray-700 mb-1">Bank IFSC Code *</Text>
                  <TextInput
                    value={ifscCode}
                    onChangeText={setIfscCode}
                    placeholder="HDFC0000123"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="characters"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold text-sm uppercase font-mono"
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                  className="w-full bg-primary rounded-2xl py-4 items-center justify-center shadow-lg shadow-orange-600/30 flex-row"
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Text className="text-white text-base font-black mr-2">Submit Fleet Application</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>
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
    padding: 22,
    position: 'relative',
    zIndex: 1,
  },
});
