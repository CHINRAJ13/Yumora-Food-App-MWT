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
import { useActiveTripStore } from '../store/useActiveTripStore';

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
    label: 'Radar',
    activeIcon: 'radio',
    inactiveIcon: 'radio-outline',
  },
  active: {
    label: 'Active Trip',
    activeIcon: 'bicycle',
    inactiveIcon: 'bicycle-outline',
  },
  history: {
    label: 'History',
    activeIcon: 'receipt',
    inactiveIcon: 'receipt-outline',
  },
  profile: {
    label: 'Profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
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
  const activeOrder = useActiveTripStore((s) => s.activeOrder);

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
      {/* Blurred Glass Background Layer (Android & iOS safe) */}
      <View style={styles.blurWrapper}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.94)' }]} />
        )}
        <View style={styles.glassOverlay} />

        {/* Tab Items Row */}
        <View style={styles.tabsRow}>
          {state.routes.map((route, idx) => {
            const isFocused = state.index === idx;
            const config = TAB_CONFIG[route.name] || {
              label: route.name,
              activeIcon: 'apps' as IoniconsName,
              inactiveIcon: 'apps-outline' as IoniconsName,
            };

            const iconName = isFocused ? config.activeIcon : config.inactiveIcon;
            const isActiveTripTab = route.name === 'active';

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
                  {isActiveTripTab && activeOrder && (
                    <View style={styles.activeDot} />
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
    height: 64,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
    zIndex: 50,
  },
  blurWrapper: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor:
      Platform.OS === 'ios'
        ? 'rgba(255, 255, 255, 0.85)'
        : 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor:
      Platform.OS === 'ios'
        ? 'rgba(0, 0, 0, 0.06)'
        : 'rgba(0, 0, 0, 0.08)',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    paddingVertical: 4,
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(234, 88, 12, 0.08)',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    right: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ea580c',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#ea580c',
    fontWeight: '900',
  },
  tabLabelInactive: {
    color: '#9ca3af',
    fontWeight: '600',
  },
});
