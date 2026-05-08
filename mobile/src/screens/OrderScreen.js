// Tap a drink → land here. Customize Size/Milk/Extras, set quantity,
// pick a locker, then proceed to Payment.
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import OptionPill from '../components/OptionPill';
import LockerCard from '../components/LockerCard';
import QuantityStepper from '../components/QuantityStepper';
import Loading from '../components/Loading';

import { fetchLockers } from '../api/lockers';
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

  const [lockers, setLockers] = useState([]);
  const [lockersLoading, setLockersLoading] = useState(true);
  const [lockerId, setLockerId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchLockers();
        if (cancelled) return;
        setLockers(data);
        const firstFree = data.find((l) => l.status === 'AVAILABLE');
        if (firstFree) setLockerId(firstFree.id);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load lockers');
      } finally {
        if (!cancelled) setLockersLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleExtra = useCallback((e) => {
    setExtras((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  }, []);

  const total = useMemo(() => product.priceCents * qty, [product, qty]);

  const selectedLocker = lockers.find((l) => l.id === lockerId);
  const canCheckout = !!selectedLocker;

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

      <View style={{ paddingHorizontal: spacing.lg, marginBottom: 14 }}>
        <Text style={styles.lockerHeader}>🗄️  Choose pickup locker</Text>
        {lockersLoading ? (
          <Loading label="Checking lockers…" />
        ) : (
          <View style={styles.lockerGrid}>
            {lockers.map((l) => (
              <LockerCard
                key={l.id}
                locker={l}
                selected={lockerId === l.id}
                onPress={() => setLockerId(l.id)}
              />
            ))}
          </View>
        )}
        {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Button
          title="Proceed to Checkout"
          subtitle={canCheckout ? 'Tap to review your order' : 'Pick an available locker first'}
          disabled={!canCheckout}
          onPress={() =>
            navigation.navigate('Payment', {
              product,
              qty,
              size,
              milk,
              extras,
              locker: selectedLocker,
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
  lockerHeader: { color: colors.cream, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  lockerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
