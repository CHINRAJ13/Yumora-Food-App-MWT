import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRestaurantMenuStore } from '../../src/store/useRestaurantMenuStore';
import { uploadMenuImageApi } from '../../src/api';
import { MenuItem } from '../../src/types';

export default function RestaurantMenuScreen() {
  const menuItems = useRestaurantMenuStore((s) => s.menuItems);
  const isLoading = useRestaurantMenuStore((s) => s.isLoading);
  const isSaving = useRestaurantMenuStore((s) => s.isSaving);
  const fetchMenu = useRestaurantMenuStore((s) => s.fetchMenu);
  const toggleItemStock = useRestaurantMenuStore((s) => s.toggleItemStock);
  const addItem = useRestaurantMenuStore((s) => s.addItem);
  const deleteItem = useRestaurantMenuStore((s) => s.deleteItem);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [modalVisible, setModalVisible] = useState(false);

  // Form fields for new item
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Main Course');
  const [description, setDescription] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchMenu();
    }, [fetchMenu])
  );

  const categories = ['All', ...Array.from(new Set(menuItems.map((i) => i.category).filter(Boolean)))];

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Denied', 'Please allow gallery access to pick food dish photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSaveNewItem = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Required Fields', 'Please enter a name and price for the dish.');
      return;
    }

    try {
      setIsUploading(true);
      let uploadedUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600';

      if (imageUri) {
        const formData = new FormData();
        const rawFilename = imageUri.split('/').pop() || 'dish.jpg';
        const match = /\.(\w+)$/.exec(rawFilename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        const validExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
        const safeFilename = rawFilename.includes('.') ? rawFilename : `dish_${Date.now()}.${validExt}`;
        const type = `image/${validExt === 'jpg' ? 'jpeg' : validExt}`;

        formData.append('image', {
          uri: imageUri,
          name: safeFilename,
          type,
        } as any);

        const uploadRes: any = await uploadMenuImageApi(formData);
        if (uploadRes?.data?.url) {
          uploadedUrl = uploadRes.data.url;
        }
      }

      const success = await addItem({
        name: name.trim(),
        price: Number(price),
        category: category.trim() || 'General',
        description: description.trim(),
        isVeg,
        image: uploadedUrl,
      });

      if (success) {
        setModalVisible(false);
        setName('');
        setPrice('');
        setDescription('');
        setImageUri(null);
        Alert.alert('Dish Added! 🍽️', `${name} has been added to your live menu.`);
      } else {
        Alert.alert('Error', 'Could not save dish to menu.');
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err?.message || 'Could not upload dish image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePrompt = (item: MenuItem) => {
    Alert.alert(
      'Remove Dish',
      `Are you sure you want to remove "${item.name}" from your restaurant menu?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteItem(item.id || item._id || ''),
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-3.5 border-b border-gray-100 flex-row items-center justify-between bg-white">
        <View>
          <Text className="text-xl font-black text-gray-900">Menu & Catalog</Text>
          <Text className="text-xs font-semibold text-gray-500 mt-0.5">
            {menuItems.length} dishes in your kitchen
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.88}
          className="bg-primary px-3.5 py-2 rounded-xl flex-row items-center shadow-md shadow-orange-500/25"
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text className="text-white text-xs font-black ml-1">Add Dish</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View className="px-5 pt-3 pb-2 bg-white">
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5">
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search dish or category..."
            placeholderTextColor="#9ca3af"
            className="flex-1 ml-2.5 text-sm text-gray-900 font-medium"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      <View className="py-2 bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: isSelected ? '#ea580c' : '#f8fafc',
                  borderColor: isSelected ? '#ea580c' : '#e2e8f0',
                }}
                className="px-3.5 py-1.5 rounded-full border items-center justify-center"
              >
                <Text
                  style={{ color: isSelected ? '#ffffff' : '#64748b' }}
                  className="text-xs font-bold"
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Menu Item Cards */}
      <ScrollView
        className="flex-1 px-5 pt-4 bg-slate-50"
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#ea580c" />
            <Text className="text-gray-400 text-xs font-bold mt-3">Loading menu catalog...</Text>
          </View>
        )}

        {!isLoading && filteredItems.length === 0 && (
          <View className="bg-white rounded-3xl p-8 items-center border border-gray-100 shadow-sm my-6">
            <View className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 items-center justify-center mb-3">
              <Ionicons name="fast-food-outline" size={28} color="#ea580c" />
            </View>
            <Text className="text-base font-black text-gray-900">No Dishes Found</Text>
            <Text className="text-xs text-gray-500 font-semibold text-center mt-1.5 leading-5 max-w-xs">
              {search
                ? `No dishes match "${search}". Try searching for another item.`
                : 'Your menu is empty. Tap "Add Dish" above to add your first kitchen specialty!'}
            </Text>
          </View>
        )}

        {!isLoading &&
          filteredItems.map((item) => {
            const itemId = item.id || item._id || '';
            const inStock = item.inStock !== false && item.isAvailable !== false;

            return (
              <View
                key={itemId}
                className="bg-white rounded-2xl p-4 border border-gray-100 mb-3 shadow-xs flex-row items-center justify-between"
              >
                {/* Left: Thumbnail & Details */}
                <View className="flex-row items-center flex-1 mr-3">
                  <Image
                    source={{
                      uri:
                        item.image ||
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200',
                    }}
                    className="w-14 h-14 rounded-xl bg-gray-100 mr-3"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5 mb-0.5">
                      <View
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: item.isVeg ? '#10b981' : '#ef4444' }}
                      />
                      <Text
                        className="text-gray-900 font-bold text-sm"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <Text className="text-xs font-black text-gray-700">₹{item.price}</Text>
                    <Text className="text-[10px] text-gray-400 font-medium">{item.category}</Text>
                  </View>
                </View>

                {/* Right: In-Stock Switch & Delete Button */}
                <View className="items-end gap-2">
                  <View className="flex-row items-center">
                    <Text
                      className="text-[10px] font-black mr-1.5 uppercase"
                      style={{ color: inStock ? '#059669' : '#9ca3af' }}
                    >
                      {inStock ? 'In Stock' : 'Out'}
                    </Text>
                    <Switch
                      value={inStock}
                      onValueChange={(val) => {
                        toggleItemStock(itemId, val);
                      }}
                      trackColor={{ false: '#d1d5db', true: '#a7f3d0' }}
                      thumbColor={inStock ? '#059669' : '#9ca3af'}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeletePrompt(item)}
                    activeOpacity={0.7}
                    className="p-1"
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
      </ScrollView>

      {/* Add Dish Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Add New Menu Item</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photo Picker */}
              <TouchableOpacity
                onPress={handlePickImage}
                style={modalStyles.imagePicker}
                activeOpacity={0.8}
              >
                {imageUri ? (
                  <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Image source={{ uri: imageUri }} style={modalStyles.pickedImage} />
                    <TouchableOpacity
                      onPress={() => setImageUri(null)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderRadius: 14,
                        padding: 4,
                      }}
                    >
                      <Ionicons name="close" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={modalStyles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={28} color="#ea580c" />
                    <Text style={modalStyles.imagePickerText}>Select Dish Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Dish Name */}
              <Text style={modalStyles.inputLabel}>Dish Name *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Hyderabadi Chicken Biryani"
                style={modalStyles.input}
              />

              {/* Price & Category Row */}
              <View style={modalStyles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={modalStyles.inputLabel}>Price (₹) *</Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    placeholder="250"
                    keyboardType="numeric"
                    style={modalStyles.input}
                  />
                </View>

                <View style={{ flex: 1.2 }}>
                  <Text style={modalStyles.inputLabel}>Category</Text>
                  <TextInput
                    value={category}
                    onChangeText={setCategory}
                    placeholder="e.g. Main Course"
                    style={modalStyles.input}
                  />
                </View>
              </View>

              {/* Veg / Non-Veg Toggle */}
              <View style={modalStyles.vegToggleRow}>
                <Text style={modalStyles.vegLabel}>Food Type:</Text>
                <View style={modalStyles.vegButtonsGroup}>
                  <TouchableOpacity
                    onPress={() => setIsVeg(true)}
                    style={[
                      modalStyles.vegTypeBtn,
                      isVeg && modalStyles.vegTypeBtnActive,
                    ]}
                  >
                    <View style={[modalStyles.dot, { backgroundColor: '#10b981' }]} />
                    <Text style={modalStyles.vegBtnText}>Veg</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsVeg(false)}
                    style={[
                      modalStyles.vegTypeBtn,
                      !isVeg && modalStyles.nonVegTypeBtnActive,
                    ]}
                  >
                    <View style={[modalStyles.dot, { backgroundColor: '#ef4444' }]} />
                    <Text style={modalStyles.vegBtnText}>Non-Veg</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Description */}
              <Text style={modalStyles.inputLabel}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Short description of ingredients, flavor or spices"
                multiline
                numberOfLines={2}
                style={[modalStyles.input, { height: 60, textAlignVertical: 'top' }]}
              />

              {/* Submit */}
              <TouchableOpacity
                onPress={handleSaveNewItem}
                disabled={isUploading || isSaving}
                style={modalStyles.saveButton}
                activeOpacity={0.88}
              >
                {isUploading || isSaving ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color="#ffffff" size="small" style={{ marginRight: 8 }} />
                    <Text style={modalStyles.saveButtonText}>
                      {isUploading ? 'Uploading Image...' : 'Saving Dish...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={modalStyles.saveButtonText}>Add to Menu</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  imagePicker: {
    width: '100%',
    height: 140,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#fed7aa',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pickedImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
    marginTop: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4b5563',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  vegToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  vegLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  vegButtonsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  vegTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    gap: 5,
  },
  vegTypeBtnActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  nonVegTypeBtnActive: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vegBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#ea580c',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
});
