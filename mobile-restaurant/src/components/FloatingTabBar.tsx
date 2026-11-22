import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurantOrdersStore } from '../store/useRestaurantOrdersStore';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface FloatingTabBarProps {
  state: {
    index: number;
    routes: Array<{
      key: string;
      name: string;
      params?: any;
    }>;
  };
  descriptors: Record<string, {
    options: any;
  }>;
  navigation?: {
    emit?: (event: any) => any;
    navigate?: (name: string, params?: any) => void;
  };
  navigateToTab?: (routeKey: string) => void;
  emitter?: {
    emit: (options: any) => any;
  };
  insets?: any;
}

interface TabConfigItem {
  label: string;
  activeIcon: IoniconsName;
  inactiveIcon: IoniconsName;
}

const TAB_CONFIG: Record<string, TabConfigItem> = {
  index: {
    label: 'Kitchen',
    activeIcon: 'restaurant',
    inactiveIcon: 'restaurant-outline',
  },
  history: {
    label: 'History',
    activeIcon: 'receipt',
    inactiveIcon: 'receipt-outline',
  },
  menu: {
    label: 'Menu',
    activeIcon: 'fast-food',
    inactiveIcon: 'fast-food-outline',
  },
  revenue: {
    label: 'Revenue',
    activeIcon: 'trending-up',
    inactiveIcon: 'trending-up-outline',
  },
  profile: {
    label: 'Settings',
    activeIcon: 'settings',
    inactiveIcon: 'settings-outline',
  },
};

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  state,
  descriptors,
  navigation,
  navigateToTab,
  emitter,
}) => {
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const activeOrdersCount = useRestaurantOrdersStore((s) => s.activeOrders.length);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (isKeyboardVisible) {
    return null;
  }

  const bottomOffset = Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 20;

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <View style={styles.blurWrapper}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.94)' }]} />
        )}
        <View style={styles.glassOverlay} />

        <View style={styles.tabsRow}>
          {state.routes.map((route, idx) => {
            const isFocused = state.index === idx;
            const config = TAB_CONFIG[route.name] || {
              label: route.name,
              activeIcon: 'apps' as IoniconsName,
              inactiveIcon: 'apps-outline' as IoniconsName,
            };

            const iconName = isFocused ? config.activeIcon : config.inactiveIcon;
            const isKitchenTab = route.name === 'index';

            const onPress = () => {
              const event = (emitter || navigation)?.emit?.({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event?.defaultPrevented) {
                if (navigateToTab) {
                  navigateToTab(route.key);
                } else if (navigation?.navigate) {
                  navigation.navigate(route.name, route.params);
                } else {
                  router.navigate(route.name as any);
                }
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.75}
                onPress={onPress}
                style={[
                  styles.tabButton,
                  isFocused && styles.tabButtonActive,
                ]}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons
                    name={iconName}
                    size={21}
                    color={isFocused ? '#ea580c' : '#9ca3af'}
                  />
                  {isKitchenTab && activeOrdersCount > 0 && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.badgeText}>{activeOrdersCount}</Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                  numberOfLines={1}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
  },
  blurWrapper: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(234, 88, 12, 0.08)',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#ea580c',
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: '#9ca3af',
    fontWeight: '600',
  },
});
