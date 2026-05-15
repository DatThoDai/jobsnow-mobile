import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { HomeScreen } from '../features/home/HomeScreen';
import { SearchScreen } from '../features/search/SearchScreen';
import { SavedScreen } from '../features/saved/SavedScreen';
import { ApplicationsScreen } from '../features/applications/ApplicationsScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { colors, fontFamilies, spacing } from '../theme';

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  SavedTab: undefined;
  ApplicationsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIconMap: Record<string, string> = {
  HomeTab: 'home',
  SearchTab: 'search',
  SavedTab: 'heart',
  ApplicationsTab: 'briefcase',
  ProfileTab: 'user',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: colors.surface,
          paddingTop: spacing.sm,
          height: 70,
          elevation: 12,
          shadowColor: colors.black,
          shadowOpacity: 0.1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: {
          fontFamily: fontFamilies.body,
          fontSize: 11,
          paddingBottom: spacing.sm,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName = tabIconMap[route.name] || 'home';
          return <Feather name={iconName as any} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ tabBarLabel: 'Tìm kiếm' }} />
      <Tab.Screen name="SavedTab" component={SavedScreen} options={{ tabBarLabel: 'Đã lưu' }} />
      <Tab.Screen name="ApplicationsTab" component={ApplicationsScreen} options={{ tabBarLabel: 'Ứng tuyển' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Tài khoản' }} />
    </Tab.Navigator>
  );
}
