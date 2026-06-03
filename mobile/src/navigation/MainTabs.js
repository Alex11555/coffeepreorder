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

// Fixed-size, centered icon box so the emoji glyph never gets clipped.
const ICON_BOX = { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' };
const emojiStyle = (focused) => ({
  fontSize: 22,
  lineHeight: 28, // explicit line height prevents top-clipping on Android
  opacity: focused ? 1 : 0.4,
  textAlign: 'center',
});

function tabIcon(emoji) {
  return ({ focused }) => (
    <View style={ICON_BOX}>
      <Text style={emojiStyle(focused)}>{emoji}</Text>
    </View>
  );
}

// Cart icon with an item-count badge.
function CartIcon({ focused }) {
  const { itemCount } = useCart();
  return (
    <View style={ICON_BOX}>
      <Text style={emojiStyle(focused)}>🛒</Text>
      {itemCount > 0 ? (
        <View
          style={{
            position: 'absolute', top: 0, right: -2,
            backgroundColor: colors.accent, borderRadius: 9,
            minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
            paddingHorizontal: 4,
            borderWidth: 2, borderColor: '#1a0a04',
          }}
        >
          <Text style={{ color: '#1a0a04', fontSize: 9, fontWeight: '800' }}>{itemCount}</Text>
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
          paddingTop: 10,
          paddingBottom: 28,
          height: 84,
        },
        tabBarIconStyle: { marginTop: 2 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, marginTop: 2 },
      }}
    >
      <Tab.Screen name="Menu"    component={MenuScreen}    options={{ tabBarIcon: tabIcon('☕') }} />
      <Tab.Screen name="Cart"    component={CartScreen}    options={{ tabBarIcon: CartIcon }} />
      <Tab.Screen name="Rewards" component={RewardsScreen} options={{ tabBarIcon: tabIcon('🎁') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}
