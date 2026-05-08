// Option chip used inside the customizer (Size, Milk, Extras).
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function OptionPill({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, selected ? styles.pillSel : styles.pillIdle]}
    >
      <Text style={[styles.text, selected ? styles.textSel : styles.textIdle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    marginRight: 8,
    marginBottom: 8,
  },
  pillIdle: {
    borderColor: colors.creamGhost,
    backgroundColor: 'transparent',
  },
  pillSel: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  text: { fontSize: 12 },
  textIdle: { color: colors.cream, fontWeight: '500' },
  textSel: { color: colors.textInverse, fontWeight: '700' },
});
