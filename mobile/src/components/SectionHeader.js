// Header used inside a screen's scroll area: a small kicker + serif title.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/colors';

export default function SectionHeader({ kicker, title, subtitle, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: 2 },
  kicker: { fontSize: 13, color: colors.creamMuted, fontWeight: '300' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: 0.2 },
  subtitle: { fontSize: 13, color: colors.creamMuted, marginTop: 4 },
});
