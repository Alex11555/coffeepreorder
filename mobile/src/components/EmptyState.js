// Placeholder shown when a list / screen has no items.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/colors';

export default function EmptyState({ icon = '☕', title, message }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  icon: { fontSize: 48, marginBottom: spacing.sm, color: colors.creamFaint },
  title: { fontSize: 16, color: colors.creamMuted, fontWeight: '600', textAlign: 'center' },
  message: { fontSize: 13, color: colors.creamFaint, textAlign: 'center' },
});
