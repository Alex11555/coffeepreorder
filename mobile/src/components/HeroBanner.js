// "Featured drink" hero banner at the top of the menu, mirroring the design.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../theme/colors';

export default function HeroBanner({ tag = '☕ Featured', title, subtitle, emoji = '🥛' }) {
  return (
    <LinearGradient
      colors={[colors.surfaceAlt, colors.surfaceHi]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.wrap}
    >
      <View style={styles.glow} />
      <View style={styles.tag}>
        <Text style={styles.tagText}>{tag}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <Text style={styles.emoji}>{emoji}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    right: -30, top: -30,
    width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(212,128,42,0.18)',
  },
  tag: {
    backgroundColor: colors.accentLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: 8,
  },
  tagText: { color: colors.textInverse, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: '#fdf8f2', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  subtitle: { color: colors.cream, fontSize: 12, opacity: 0.7, marginTop: 2 },
  emoji: { position: 'absolute', right: 24, top: '50%', fontSize: 56, marginTop: -28 },
});
