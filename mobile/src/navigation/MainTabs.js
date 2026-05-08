// Bottom tabs matching the design: Menu, Orders, My QR, Profile.
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MenuScreen from '../screens/MenuScreen';
import OrdersScreen from '../screens/OrdersScreen';
import MyQRScreen from '../screens/MyQRScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

function tabIcon(emoji) {
  return ({ focused }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.35 }}>{emoji}</Text>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentLight,
        tabBarInactiveTintColor: 'rgba(232,201,154,0.4)',
        tabBarStyle: {
          backgroundColor: 'rgba(26,10,4,0.97)',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: 20,
          height: 70,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', letterSpacing: 0.5 },
      }}
    >
      <Tab.Screen name="Menu"     component={MenuScreen}    options={{ tabBarIcon: tabIcon('☕') }} />
      <Tab.Screen name="Orders"   component={OrdersScreen}  options={{ tabBarIcon: tabIcon('📦') }} />
      <Tab.Screen name="My QR"    component={MyQRScreen}    options={{ tabBarIcon: tabIcon('⬛') }} />
      <Tab.Screen name="Profile"  component={ProfileScreen} options={{ tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}
