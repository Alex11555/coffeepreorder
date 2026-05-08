// Compact past-order row used in the Orders screen below the active order.
import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';
import { formatPrice, formatTime } from '../utils/format';

export default function OrderListItem({ order, onPress }) {
  const first = order.items[0]?.product;
  return (
    <Pressable
      onPress={() => onPress?.(order)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      <Text style={styles.emoji}>{first?.emoji || '☕'}</Text>
      <View style={styles.center}>
        <Text style={styles.name} numberOfLines={1}>
          {first?.name || 'Order'}{order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
        </Text>
        <Text style={styles.meta}>{formatTime(order.createdAt)}</Text>
      </View>
      <Text style={styles.price}>{formatPrice(order.totalCents)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: 8,
    opacity: 0.85,
  },
  emoji: { fontSize: 28 },
  center: { flex: 1 },
  name: { color: colors.text, fontSize: 13, fontWeight: '600' },
  meta: { color: colors.creamFaint, fontSize: 11, marginTop: 2 },
  price: { color: colors.cream, fontSize: 13, fontWeight: '600' },
});
