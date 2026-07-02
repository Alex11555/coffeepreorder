// Cart — list of configured drinks, quantity steppers, remove, and a
// running subtotal. "Proceed to Checkout" carries the cart to Payment.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import QuantityStepper from '../components/QuantityStepper';
import EmptyState from '../components/EmptyState';

import { FadeInView } from '../components/anim';
import { useCart } from '../context/CartContext';
import { colors, radius, spacing } from '../theme/colors';
import { formatPrice } from '../utils/format';

export default function CartScreen({ navigation }) {
  const { items, updateQty, removeItem, subtotalCents, itemCount, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <Text style={styles.kicker}>Your Cart</Text>
          <Text style={styles.title}>Cart</Text>
        </View>
        <EmptyState icon="🛒" title="Your cart is empty" message="Add a few drinks from the menu to get started." />
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Button title="Browse the menu" onPress={() => navigation.navigate('Menu')} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.kicker}>Your Cart</Text>
        <Text style={styles.title}>{itemCount} item{itemCount === 1 ? '' : 's'}</Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        {items.map((it, i) => (
          <FadeInView key={it.lineId} delay={i * 70}>
            <Card style={styles.lineCard}>
              <View style={styles.lineTop}>
                <Text style={styles.lineEmoji}>{it.product.emoji || '☕'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineName}>{it.product.name}</Text>
                  <Text style={styles.lineNotes}>{it.notes}</Text>
                </View>
                <Pressable onPress={() => removeItem(it.lineId)} hitSlop={10}>
                  <Text style={styles.remove}>✕</Text>
                </Pressable>
              </View>
              <View style={styles.lineBottom}>
                <QuantityStepper value={it.qty} onChange={(q) => updateQty(it.lineId, q)} />
                <Text style={styles.linePrice}>{formatPrice(it.unitCents * it.qty)}</Text>
              </View>
            </Card>
          </FadeInView>
        ))}

        <Pressable onPress={clearCart} style={{ alignSelf: 'flex-end', paddingVertical: 8 }}>
          <Text style={styles.clearLink}>Clear cart</Text>
        </Pressable>
      </View>

      <View style={styles.subtotalRow}>
        <Text style={styles.subtotalLabel}>Subtotal</Text>
        <Text style={styles.subtotalValue}>{formatPrice(subtotalCents)}</Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
        <Button
          title="Proceed to Checkout"
          subtitle={`${itemCount} item${itemCount === 1 ? '' : 's'} · ${formatPrice(subtotalCents)}`}
          onPress={() => navigation.navigate('Payment')}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  kicker: { color: colors.creamFaint, fontSize: 13 },
  title: { color: '#fdf8f2', fontSize: 22, fontWeight: '700', marginTop: 4 },
  lineCard: { marginBottom: spacing.md, padding: 14, borderRadius: radius.lg, gap: 12 },
  lineTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  lineEmoji: { fontSize: 32 },
  lineName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  lineNotes: { color: colors.creamFaint, fontSize: 11, marginTop: 2 },
  remove: { color: colors.creamMuted, fontSize: 16, fontWeight: '700', paddingHorizontal: 4 },
  lineBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linePrice: { color: colors.accentLight, fontSize: 16, fontWeight: '800' },
  clearLink: { color: colors.creamMuted, fontSize: 12 },
  subtotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginTop: spacing.sm,
  },
  subtotalLabel: { color: colors.creamMuted, fontSize: 14 },
  subtotalValue: { color: colors.accentLight, fontSize: 24, fontWeight: '800' },
});
