// Tap a drink → land here. Customize Size/Milk/Extras, set quantity,
// then proceed to Payment. The pickup compartment is assigned automatically
// by the server at checkout (single cabinet, 4 doors), so there's no locker
// picker anymore.
import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import OptionPill from '../components/OptionPill';
import QuantityStepper from '../components/QuantityStepper';

import { colors, radius, spacing } from '../theme/colors';
import { formatPrice } from '../utils/format';

const SIZES = ['S', 'M', 'L'];
const MILKS = ['Whole', 'Oat', 'Almond', 'Soy'];
const EXTRAS = ['+ Shot', 'Vanilla', 'Caramel'];

export default function OrderScreen({ route, navigation }) {
  const { product } = route.params;
  const [size, setSize] = useState('M');
  const [milk, setMilk] = useState('Whole');
  const [extras, setExtras] = useState([]);
  const [qty, setQty] = useState(1);

  const toggleExtra = useCallback((e) => {
    setExtras((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  }, []);

  const total = useMemo(() => product.priceCents * qty, [product, qty]);

  return (
    <ScreenContainer>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <View style={styles.heroBlock}>
        <Text style={styles.emoji}>{product.emoji || '☕'}</Text>
        <Text style={styles.name}>{product.name}</Text>
        {product.description ? (
          <Text style={styles.desc}>{product.description}</Text>
        ) : null}
      </View>

      <Card style={styles.customizer}>
        <SectionLabel>Size</SectionLabel>
        <View style={styles.optRow}>
          {SIZES.map((s) => (
            <OptionPill key={s} label={s} selected={size === s} onPress={() => setSize(s)} />
          ))}
        </View>

        <SectionLabel>Milk</SectionLabel>
        <View style={styles.optRow}>
          {MILKS.map((m) => (
            <OptionPill key={m} label={m} selected={milk === m} onPress={() => setMilk(m)} />
          ))}
        </View>

        <SectionLabel>Extras</SectionLabel>
        <View style={styles.optRow}>
          {EXTRAS.map((e) => (
            <OptionPill key={e} label={e} selected={extras.includes(e)} onPress={() => toggleExtra(e)} />
          ))}
        </View>
      </Card>

      <View style={styles.qtyRow}>
        <Text style={styles.qtyLabel}>Quantity</Text>
        <QuantityStepper value={qty} onChange={setQty} />
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
      </View>

      <View style={styles.pickupNote}>
        <Text style={styles.pickupEmoji}>🗄️</Text>
        <Text style={styles.pickupText}>
          A pickup door is assigned automatically when you pay. You'll see your
          door number and QR right after checkout.
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Button
          title="Proceed to Checkout"
          subtitle="Tap to review your order"
          onPress={() =>
            navigation.navigate('Payment', {
              product,
              qty,
              size,
              milk,
              extras,
            })
          }
        />
      </View>
    </ScreenContainer>
  );
}

function SectionLabel({ children }) {
  return <Text style={styles.optLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backText: { color: 'rgba(232,201,154,0.7)', fontSize: 14 },
  heroBlock: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  emoji: { fontSize: 72 },
  name: { color: '#fdf8f2', fontSize: 24, fontWeight: '700', marginTop: 8 },
  desc: { color: 'rgba(232,201,154,0.5)', fontSize: 13, marginTop: 4 },
  customizer: { marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.lg, borderRadius: radius.lg },
  optLabel: {
    color: 'rgba(232,201,154,0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  qtyLabel: { flex: 1, color: colors.cream, fontSize: 14, fontWeight: '500' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: 12,
    marginBottom: 12,
  },
  totalLabel: { color: colors.creamMuted, fontSize: 14 },
  totalValue: { color: colors.accentLight, fontSize: 26, fontWeight: '700' },
  pickupNote: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: 16,
    backgroundColor: 'rgba(212,128,42,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212,128,42,0.22)',
    borderRadius: radius.md,
    padding: 14,
  },
  pickupEmoji: { fontSize: 24 },
  pickupText: { flex: 1, color: colors.creamMuted, fontSize: 12, lineHeight: 17 },
});
