// Horizontally scrolling category chip (used in the menu's filter row).
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function Pill({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
    >
      <Text style={[styles.text, active ? styles.textActive : styles.textIdle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  pillIdle: {
    borderColor: colors.borderStrong,
    backgroundColor: 'transparent',
  },
  pillActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  text: { fontSize: 12 },
  textIdle: { color: colors.cream, fontWeight: '500' },
  textActive: { color: colors.textInverse, fontWeight: '700' },
});
