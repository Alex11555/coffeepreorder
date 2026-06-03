// Bottom tabs: Menu, Cart, Orders, Rewards, Profile.
// The Cart tab shows a badge with the number of items.
import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MenuScreen from '../screens/MenuScreen';
import CartScreen from '../screens/CartScreen';
import RewardsScreen from '../screens/RewardsScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { useCart } from '../context/CartContext';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

function tabIcon(emoji) {
  return ({ focused }) => (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
  );
}

// Cart icon with an item-count badge.
function CartIcon({ focused }) {
  const { itemCount } = useCart();
  return (
    <View>
      <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.4 }}>🛒</Text>
      {itemCount > 0 ? (
        <View
          style={{
            position: 'absolute', top: -6, right: -12,
            backgroundColor: colors.accent, borderRadius: 9,
            minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: '#1a0a04', fontSize: 10, fontWeight: '800' }}>{itemCount}</Text>
        </View>
      ) : null}
    </View>
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
          backgroundColor: 'rgba(26,10,4,0.98)',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 12,
          paddingBottom: 24,
          height: 78,
        },
        tabBarItemStyle: { paddingTop: 2 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, marginTop: 4 },
      }}
    >
      <Tab.Screen name="Menu"    component={MenuScreen}    options={{ tabBarIcon: tabIcon('☕') }} />
      <Tab.Screen name="Cart"    component={CartScreen}    options={{ tabBarIcon: CartIcon }} />
      <Tab.Screen name="Rewards" component={RewardsScreen} options={{ tabBarIcon: tabIcon('🎁') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}
