import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FieldTabBar } from '@/components/layout/FieldTabBar';
import { HapticTab } from '@/components/haptic-tab';
import { Colors, Brand, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLanguage } from '@/features/state/LanguageContext';

/** Icon + label row inside the tab bar (system nav inset handled by FieldTabBar). */
const TAB_BAR_CONTENT_HEIGHT = 56;
const TAB_BAR_PADDING_TOP = 8;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useLanguage();

  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => (
      <FieldTabBar
        {...props}
        chromeStyle={{
          backgroundColor: colors.tabBackground,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          ...Shadows.sm,
        }}
      />
    ),
    [colors.tabBackground, colors.border],
  );

  return (
    <Tabs
      tabBar={renderTabBar}
      screenOptions={{
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          paddingTop: TAB_BAR_PADDING_TOP,
          // BottomTabBar adds paddingBottom from useSafeAreaInsets(); zero it here because
          // FieldTabBar's SafeAreaView owns the system navigation bar inset natively.
          paddingBottom: 0,
          height: TAB_BAR_CONTENT_HEIGHT + TAB_BAR_PADDING_TOP,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_home'),
          tabBarButton: (props) => <HapticTab {...props} testID="tab-home" />,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tab_my_plots'),
          tabBarButton: (props) => <HapticTab {...props} testID="tab-my-plots" />,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <Ionicons name={focused ? 'map' : 'map-outline'} size={26} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="harvests"
        options={{
          title: t('tab_harvests'),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <Ionicons name={focused ? 'scale' : 'scale-outline'} size={26} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tab_settings'),
          tabBarButton: (props) => <HapticTab {...props} testID="tab-settings" />,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={26} color={color} />
            </View>
          ),
        }}
      />

      {/* Hidden routes that Home tiles navigate to */}
      <Tabs.Screen
        name="explore.web"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore.v0"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    backgroundColor: 'rgba(16,185,129,0.16)',
    borderRadius: 14,
    padding: 6,
    marginBottom: -4,
  },
});
