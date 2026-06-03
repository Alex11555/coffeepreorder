// Root component — wraps the app in providers and sets the dark nav theme.
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';

import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import RootNavigator from './src/navigation/RootNavigator';
import { addNotificationTapListener } from './src/utils/push';
import { colors } from './src/theme/colors';

const NavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
    notification: colors.accent,
  },
};

const navRef = createNavigationContainerRef();

export default function App() {
  const readyRef = useRef(false);

  useEffect(() => {
    // When the user taps a push notification, jump to that order's detail.
    const unsub = addNotificationTapListener((data) => {
      if (data?.orderId && readyRef.current && navRef.isReady()) {
        navRef.navigate('OrderDetail', { orderId: data.orderId });
      }
    });
    return unsub;
  }, []);

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.bg }}>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer
            ref={navRef}
            theme={NavTheme}
            onReady={() => { readyRef.current = true; }}
          >
            <RootNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
