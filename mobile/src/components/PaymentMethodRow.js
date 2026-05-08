// Selectable payment method row on the checkout screen.
import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/colors';

export default function PaymentMethodRow({ method, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, selected ? styles.rowSel : styles.rowIdle]}
    >
      <Text style={styles.icon}>{method.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{method.name}</Text>
        <Text style={styles.detail}>{method.detail}</Text>
      </View>
      <View style={styles.radio}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 2,
    marginBottom: 10,
  },
  rowIdle: { borderColor: 'rgba(232,201,154,0.06)' },
  rowSel: { borderColor: colors.accent },
  icon: { fontSize: 24 },
  name: { color: colors.text, fontSize: 14, fontWeight: '600' },
  detail: { color: colors.creamFaint, fontSize: 11 },
  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
});
