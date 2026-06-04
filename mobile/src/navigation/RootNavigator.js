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
        // iOS-style push/pop: the leaving screen slides off to the right
        // while the one underneath parallaxes in. Smoothest on both platforms
        // and — unlike slide_from_right on Android — the leaving screen stays
        // fully painted instead of vanishing.
        animation: 'ios_from_right',
        animationDuration: 300,
        navigationBarColor: '#1a0a04',
        // Keep the screen underneath painted (screens 4.x freezes it by
        // default, which made the menu render blank during the transition).
        freezeOnBlur: false,
        // Allow swipe-back gesture too.
        gestureEnabled: true,
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
