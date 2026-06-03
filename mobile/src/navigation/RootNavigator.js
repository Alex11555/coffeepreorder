// Top-level navigator — Auth stack vs Main tabs.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

import OrderScreen from '../screens/OrderScreen';
import PaymentScreen from '../screens/PaymentScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Warming up the espresso machine…" />;
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1a0a04' },
        // Smooth slide both ways; the explicit dark background + slide
        // animation kills the white flash Android shows on the default anim.
        animation: 'slide_from_right',
        animationDuration: 250,
        // Keep the area behind the transition dark, not white.
        navigationBarColor: '#1a0a04',
        // CRITICAL on Android: screens 4.x freezes the blurred screen by
        // default, which makes the screen underneath render BLANK during the
        // back transition. Disable it so both screens stay painted while the
        // slide animates.
        freezeOnBlur: false,
        // Don't unmount the previous screen mid-animation.
        detachPreviousScreen: false,
      }}
    >
      {!user ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Order" component={OrderScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="QRCode" component={QRCodeScreen} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
