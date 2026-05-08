// Generic key/value row used in checkout summary blocks (Item, Locker, ETA, …).
// Optional `divider` adds a hairline below; `accent` paints the value amber.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function CartItemRow({ label, value, divider = true, accent = false }) {
  return (
    <View style={[styles.row, divider && styles.divider]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent && { color: colors.accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(232,201,154,0.06)' },
  label: { color: colors.creamMuted, fontSize: 13 },
  value: { color: colors.text, fontSize: 13, fontWeight: '600' },
});
