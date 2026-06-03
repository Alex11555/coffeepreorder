// Tap a drink → customize Size/Milk/Extras + quantity → add to cart.
// The cart can hold several different drinks; checkout happens from CartScreen.
import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import OptionPill from '../components/OptionPill';
import QuantityStepper from '../components/QuantityStepper';

import { useCart } from '../context/CartContext';
import { colors, radius, spacing } from '../theme/colors';
import { formatPrice } from '../utils/format';

const SIZES = ['S', 'M', 'L'];
const MILKS = ['Whole', 'Oat', 'Almond', 'Soy'];
const EXTRAS = ['+ Shot', 'Vanilla', 'Caramel'];

// Size nudges the price a little (S −€0.30, M base, L +€0.40); extras €0.50 each.
const SIZE_DELTA = { S: -30, M: 0, L: 40 };
const EXTRA_CENTS = 50;

export default function OrderScreen({ route, navigation }) {
  const { product } = route.params;
  const { addItem, itemCount } = useCart();
  const [size, setSize] = useState('M');
  const [milk, setMilk] = useState('Whole');
  const [extras, setExtras] = useState([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const toggleExtra = useCallback((e) => {
    setExtras((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  }, []);

  const unitCents = useMemo(
    () => product.priceCents + (SIZE_DELTA[size] || 0) + extras.length * EXTRA_CENTS,
    [product, size, extras]
  );
  const total = unitCents * qty;

  const notes = useMemo(
    () =>
      [`Size: ${size}`, `Milk: ${milk}`, extras.length ? `Extras: ${extras.join(', ')}` : null]
        .filter(Boolean)
        .join(' · '),
    [size, milk, extras]
  );

  function handleAdd(goToCart) {
    addItem({ product, qty, size, milk, extras, notes, unitCents });
    if (goToCart) {
      navigation.navigate('Main', { screen: 'Cart' });
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
      navigation.goBack();
    }
  }

  return (
    <ScreenContainer>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <View style={styles.heroBlock}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.heroImage} />
        ) : (
          <Text style={styles.emoji}>{product.emoji || '☕'}</Text>
        )}
        <Text style={styles.name}>{product.name}</Text>
        {product.description ? <Text style={styles.desc}>{product.description}</Text> : null}
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

        <SectionLabel>Extras (+{formatPrice(EXTRA_CENTS)} each)</SectionLabel>
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
        <Text style={styles.totalLabel}>Item total</Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, gap: 10 }}>
        <Button
          title={added ? 'Added ✓' : 'Add to Cart'}
          subtitle={`${qty} × ${formatPrice(unitCents)}`}
          onPress={() => handleAdd(false)}
        />
        <Button
          title="Add & Go to Cart"
          variant="secondary"
          subtitle={itemCount > 0 ? `${itemCount} item${itemCount === 1 ? '' : 's'} already in cart` : 'Review and check out'}
          onPress={() => handleAdd(true)}
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
  heroImage: { width: 160, height: 160, borderRadius: 80, resizeMode: 'cover', backgroundColor: colors.surfaceAlt },
  name: { color: '#fdf8f2', fontSize: 24, fontWeight: '700', marginTop: 8 },
  desc: { color: 'rgba(232,201,154,0.5)', fontSize: 13, marginTop: 4 },
  customizer: { marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.lg, borderRadius: radius.lg },
  optLabel: {
    color: 'rgba(232,201,154,0.7)', fontSize: 11, fontWeight: '600',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 4,
  },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: 12,
    backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 20,
  },
  qtyLabel: { flex: 1, color: colors.cream, fontSize: 14, fontWeight: '500' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginTop: 12, marginBottom: 16,
  },
  totalLabel: { color: colors.creamMuted, fontSize: 14 },
  totalValue: { color: colors.accentLight, fontSize: 26, fontWeight: '700' },
});
