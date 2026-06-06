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

  // On both platforms KeyboardAvoidingView shrinks the visible area so the
  // ScrollView can scroll the focused input + button above the keyboard.
  const wrapped = keyboard ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
  // Let the auth screens center/grow and scroll cleanly when the keyboard opens.
  contentGrow: { flexGrow: 1, paddingBottom: spacing.xl },
});
