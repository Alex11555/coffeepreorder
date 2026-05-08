// Tile in the menu grid — large emoji on a tinted top half, info + add CTA below.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../theme/colors';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product, onPress }) {
  return (
    <Pressable
      onPress={() => onPress?.(product)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <LinearGradient
        colors={[colors.surfaceAlt, '#3a1a0a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.imageWrap}
      >
        <Text style={styles.emoji}>{product.emoji || '☕'}</Text>
      </LinearGradient>
      <View style={styles.body}>
        <Text style={styles.name}>{product.name}</Text>
        {product.description ? (
          <Text style={styles.desc} numberOfLines={2}>{product.description}</Text>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.price}>{formatPrice(product.priceCents)}</Text>
          <View style={styles.addBtn}>
            <Text style={styles.addText}>+</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 0,
  },
  imageWrap: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 52 },
  body: { padding: spacing.md },
  name: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
  desc: { fontSize: 11, color: 'rgba(232,201,154,0.5)', lineHeight: 15, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { color: colors.accentLight, fontSize: 15, fontWeight: '700' },
  addBtn: {
    width: 26,
    height: 26,
    backgroundColor: colors.accent,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: colors.textInverse, fontSize: 16, fontWeight: '700', lineHeight: 18 },
});
