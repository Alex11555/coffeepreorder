// Bottom tabs: Menu, Cart, Orders, Rewards, Profile.
// The Cart tab shows a badge with the number of items.
import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MenuScreen from '../screens/MenuScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import RewardsScreen from '../screens/RewardsScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { useCart } from '../context/CartContext';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

function tabIcon(emoji) {
  return ({ focused }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.35 }}>{emoji}</Text>
  );
}

// Cart icon with an item-count badge.
function CartIcon({ focused }) {
  const { itemCount } = useCart();
  return (
    <View>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.35 }}>🛒</Text>
      {itemCount > 0 ? (
        <View
          style={{
            position: 'absolute', top: -6, right: -10,
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
          backgroundColor: 'rgba(26,10,4,0.97)',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: 20,
          height: 70,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', letterSpacing: 0.3 },
      }}
    >
      <Tab.Screen name="Menu"    component={MenuScreen}    options={{ tabBarIcon: tabIcon('☕') }} />
      <Tab.Screen name="Cart"    component={CartScreen}    options={{ tabBarIcon: CartIcon }} />
      <Tab.Screen name="Orders"  component={OrdersScreen}  options={{ tabBarIcon: tabIcon('📦') }} />
      <Tab.Screen name="Rewards" component={RewardsScreen} options={{ tabBarIcon: tabIcon('🎁') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}
