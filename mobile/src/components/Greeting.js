// Top-of-menu greeting block: "Good morning" + serif headline + avatar circle.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/colors';

function timeKicker() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning ☀️';
  if (h < 18) return 'Good afternoon ☕';
  return 'Good evening 🌙';
}

export default function Greeting({ user }) {
  const initial = (user?.name || user?.email || '👤').trim()[0]?.toUpperCase();
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.kicker}>{timeKicker()}</Text>
        <Text style={styles.title}>What'll it be?</Text>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial || '👤'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  kicker: { color: colors.creamMuted, fontSize: 13, fontWeight: '300' },
  title: { color: '#f5ede0', fontSize: 22, fontWeight: '700', marginTop: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, color: colors.cream, fontWeight: '700' },
});
