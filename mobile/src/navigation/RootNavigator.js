// Top-level navigator — Auth stack vs Main tabs.
//
// We use the JS stack (@react-navigation/stack) instead of native-stack for
// the modal/detail screens, because native-stack on Android has a bug where
// the LEAVING screen blanks instantly on back instead of sliding off. The JS
// stack animates both screens smoothly (Reanimated-driven), exactly like iOS.
import React from 'react';
import { createStackNavigator, CardStyleInterpolators, TransitionSpecs } from '@react-navigation/stack';

import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

import OrderScreen from '../screens/OrderScreen';
import PaymentScreen from '../screens/PaymentScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Warming up the espresso machine…" />;
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#1a0a04' },
        // iOS-style horizontal slide — both screens move together (the one
        // underneath parallaxes in), so nothing ever blanks on Android.
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        transitionSpec: {
          open: TransitionSpecs.TransitionIOSSpec,
          close: TransitionSpecs.TransitionIOSSpec,
        },
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
