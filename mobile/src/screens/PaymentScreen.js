// Order summary + payment method picker. Hits POST /api/orders on confirm.
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import CartItemRow from '../components/CartItemRow';
import PaymentMethodRow from '../components/PaymentMethodRow';

import { createOrder } from '../api/orders';
import { useCart } from '../context/CartContext';
import { colors, radius, spacing } from '../theme/colors';
import { formatPrice } from '../utils/format';

const PAYMENT_METHODS = [
  { id: 'mock_card',     icon: '💳', name: 'Visa •••• 4242',  detail: 'Expires 09/27' },
  { id: 'mock_apple_pay',icon: '📱', name: 'Apple Pay',        detail: 'Touch ID ready' },
  { id: 'mock_credits',  icon: '🏦', name: 'Brew Credits',    detail: '€12.40 balance' },
];

export default function PaymentScreen({ route, navigation }) {
  const { product, qty, size, milk, extras, locker } = route.params;
  const { setActive } = useCart();

  const [methodId, setMethodId] = useState('mock_card');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const totalCents = useMemo(() => product.priceCents * qty, [product, qty]);
  const customizationNote = [
    `Size: ${size}`,
    `Milk: ${milk}`,
    extras?.length ? `Extras: ${extras.join(', ')}` : null,
  ].filter(Boolean).join(' · ');

  async function pay() {
    setError('');
    setPaying(true);
    try {
      const { order, qrToken } = await createOrder({
        lockerId: locker.id,
        items: [{ productId: product.id, quantity: qty, notes: customizationNote }],
        payment: { method: methodId },
      });
      await setActive(order.id, qrToken);
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
        <CartItemRow label="Item"          value={`${product.name} × ${qty}`} />
        <CartItemRow label="Customizations" value={`${milk} milk · ${size}`} />
        <CartItemRow label="Pickup Locker" value={locker.location} />
        <CartItemRow label="Est. Ready"    value="~8 minutes" accent divider={false} />
        <View style={styles.summaryTotal}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(totalCents)}</Text>
        </View>
      </Card>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232,201,154,0.1)',
    marginTop: 4,
  },
  totalLabel: { color: colors.creamMuted, fontSize: 13 },
  totalValue: { color: colors.accentLight, fontSize: 16, fontWeight: '700' },
  section: {
    color: 'rgba(232,201,154,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  error: { color: colors.danger, textAlign: 'center', paddingHorizontal: spacing.lg, marginTop: 8 },
});
