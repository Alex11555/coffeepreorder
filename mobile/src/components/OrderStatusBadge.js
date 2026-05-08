// Pill that renders the current order status, dark-theme variant.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/colors';

const STATUS_STYLE = {
  PAID:      { bg: 'rgba(212,128,42,0.2)',  fg: colors.warning, label: 'Paid' },
  PREPARING: { bg: 'rgba(212,128,42,0.2)',  fg: colors.warning, label: 'Preparing' },
  READY:     { bg: 'rgba(76,175,125,0.2)',  fg: colors.success, label: 'Ready' },
  PICKED_UP: { bg: 'rgba(232,201,154,0.1)', fg: colors.creamMuted, label: 'Picked up' },
  CANCELLED: { bg: 'rgba(224,82,82,0.2)',   fg: colors.danger,  label: 'Cancelled' },
};

export default function OrderStatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: 'rgba(232,201,154,0.1)', fg: colors.creamMuted, label: status };
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.fg }]}>{s.label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});
