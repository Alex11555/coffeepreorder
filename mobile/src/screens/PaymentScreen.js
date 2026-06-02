// Checkout from the cart: shows tier discount, lets the customer redeem
// loyalty points, picks a payment method, then POSTs the multi-item order.
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Switch } from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import CartItemRow from '../components/CartItemRow';
import PaymentMethodRow from '../components/PaymentMethodRow';

import { createOrder } from '../api/orders';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../theme/colors';
import { formatPrice } from '../utils/format';
import { tierForPoints, pointsForSpend, CENTS_PER_POINT } from '../utils/loyalty';

const PAYMENT_METHODS = [
  { id: 'mock_card',      icon: '💳', name: 'Visa •••• 4242', detail: 'Expires 09/27' },
  { id: 'mock_apple_pay', icon: '📱', name: 'Apple Pay',       detail: 'Touch ID ready' },
  { id: 'mock_credits',   icon: '🏦', name: 'Brew Credits',    detail: '€12.40 balance' },
];

export default function PaymentScreen({ navigation }) {
  const { items, subtotalCents, clearCart, setActive } = useCart();
  const { user, refreshUser } = useAuth();

  const [methodId, setMethodId] = useState('mock_card');
  const [usePoints, setUsePoints] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const loyalty = user?.loyalty;
  const tier = tierForPoints(loyalty?.lifetimePoints || 0);
  const balance = loyalty?.points || 0;

  // Pricing preview (server recomputes authoritatively).
  const tierDiscountCents = Math.round(subtotalCents * (tier.discountPct / 100));
  const afterTier = subtotalCents - tierDiscountCents;
  const redeemCents = usePoints ? Math.min(balance * CENTS_PER_POINT, afterTier) : 0;
  const totalCents = Math.max(0, afterTier - redeemCents);
  const pointsToRedeem = usePoints ? Math.ceil(redeemCents / CENTS_PER_POINT) : 0;
  const pointsToEarn = pointsForSpend(totalCents, tier);

  async function pay() {
    if (items.length === 0) return;
    setError('');
    setPaying(true);
    try {
      const { order, qrToken } = await createOrder({
        items: items.map((it) => ({
          productId: it.product.id,
          quantity: it.qty,
          notes: it.notes,
        })),
        payment: { method: methodId },
        redeemPoints: pointsToRedeem,
      });
      clearCart();
      await setActive(order.id, qrToken);
      refreshUser?.(); // pull fresh points balance
      navigation.replace('QRCode', { orderId: order.id, qrToken });
    } catch (e) {
      setError(e.message || 'Payment failed.');
    } finally {
      setPaying(false);
    }
  }

  return (
    <ScreenContainer>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.subtitle}>Review and confirm your order</Text>
      </View>

      <Card style={styles.summary}>
        {items.map((it) => (
          <CartItemRow
            key={it.lineId}
            label={`${it.qty}× ${it.product.name}`}
            value={formatPrice(it.unitCents * it.qty)}
          />
        ))}
        <CartItemRow label="Subtotal" value={formatPrice(subtotalCents)} />
        {tierDiscountCents > 0 ? (
          <CartItemRow
            label={`${tier.emoji} ${tier.name} discount (${tier.discountPct}%)`}
            value={`−${formatPrice(tierDiscountCents)}`}
            accent
          />
        ) : null}
        {redeemCents > 0 ? (
          <CartItemRow label={`Points redeemed (${pointsToRedeem})`} value={`−${formatPrice(redeemCents)}`} accent />
        ) : null}
        <View style={styles.summaryTotal}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(totalCents)}</Text>
        </View>
      </Card>

      {/* Points redemption toggle */}
      {balance > 0 ? (
        <Card style={styles.pointsCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pointsTitle}>Use {balance} points</Text>
            <Text style={styles.pointsSub}>
              Worth {formatPrice(balance * CENTS_PER_POINT)} off this order
            </Text>
          </View>
          <Switch
            value={usePoints}
            onValueChange={setUsePoints}
            trackColor={{ true: colors.accent, false: '#3a2a20' }}
            thumbColor="#fff"
          />
        </Card>
      ) : null}

      {/* Earn preview */}
      <View style={styles.earnRow}>
        <Text style={styles.earnText}>
          You'll earn <Text style={styles.earnBold}>+{pointsToEarn} points</Text>
          {tier.multiplier > 1 ? `  (${tier.emoji} ${tier.multiplier}× boost)` : ''}
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Text style={styles.section}>Payment Method</Text>
        {PAYMENT_METHODS.map((pm) => (
          <PaymentMethodRow
            key={pm.id}
            method={pm}
            selected={methodId === pm.id}
            onPress={() => setMethodId(pm.id)}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
        <Button
          title={paying ? 'Charging…' : 'Pay & Pre-Order'}
          subtitle={`${formatPrice(totalCents)} · Secure checkout`}
          loading={paying}
          onPress={pay}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backText: { color: 'rgba(232,201,154,0.7)', fontSize: 14 },
  title: { color: '#fdf8f2', fontSize: 22, fontWeight: '700' },
  subtitle: { color: 'rgba(232,201,154,0.5)', fontSize: 13, marginTop: 4 },
  summary: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: 16, borderRadius: radius.lg },
  summaryTotal: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(232,201,154,0.1)', marginTop: 4,
  },
  totalLabel: { color: colors.creamMuted, fontSize: 13 },
  totalValue: { color: colors.accentLight, fontSize: 18, fontWeight: '800' },
  pointsCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: 16, borderRadius: radius.lg,
  },
  pointsTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  pointsSub: { color: colors.creamMuted, fontSize: 12, marginTop: 2 },
  earnRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  earnText: { color: colors.creamMuted, fontSize: 13 },
  earnBold: { color: colors.accentLight, fontWeight: '800' },
  section: {
    color: 'rgba(232,201,154,0.6)', fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
  },
  error: { color: colors.danger, textAlign: 'center', paddingHorizontal: spacing.lg, marginTop: 8 },
});
