// Compact +/- stepper used on the item-detail screen.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/colors';

export default function QuantityStepper({ value, onChange, min = 1, max = 9 }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <View style={styles.row}>
      <Pressable onPress={dec} style={styles.btn}>
        <Text style={styles.btnText}>−</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable onPress={inc} style={styles.btn}>
        <Text style={styles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  btn: {
    width: 32, height: 32,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: colors.cream, fontSize: 18, fontWeight: '700', lineHeight: 20 },
  value: { color: colors.accentLight, fontSize: 18, fontWeight: '700', minWidth: 20, textAlign: 'center' },
});
