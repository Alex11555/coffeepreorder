// Page-level wrapper: dark background + safe area + scrollable + keyboard.
import React from 'react';
import { ScrollView, View, StyleSheet, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';

export default function ScreenContainer({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  keyboard = false,
  contentStyle,
  edges = ['top', 'left', 'right'],
}) {
  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, keyboard && styles.contentGrow, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.cream}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>
  );

  // KeyboardAvoidingView with 'padding' on both platforms pushes the
  // ScrollView up by the keyboard height, and the ScrollView's bottom padding
  // gives room to scroll the button/footer fully into view.
  const wrapped = keyboard ? (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {wrapped}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing.xxl },
  // Auth screens: top-aligned with generous bottom room so the button/footer
  // can always be scrolled clear of the keyboard.
  contentGrow: { flexGrow: 1, paddingBottom: 120 },
});
