// Centered spinner used during async boots / fetches.
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/colors';

export default function Loading({ label }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.accent} size="large" />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
  label: { color: colors.creamMuted, fontSize: 14 },
});
