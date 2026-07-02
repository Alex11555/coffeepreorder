// Tile in the menu grid — real product photo on top (emoji fallback),
// info + add CTA below. Spring-scales on press.
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressScale } from './anim';
import { colors, radius, spacing } from '../theme/colors';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product, onPress }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = product.imageUrl && !imgFailed;

  return (
    <PressScale
      onPress={() => onPress?.(product)}
      to={0.95}
      style={styles.card}
    >
      {showImage ? (
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <LinearGradient
          colors={[colors.surfaceAlt, '#3a1a0a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.imageWrap}
        >
          <Text style={styles.emoji}>{product.emoji || '☕'}</Text>
        </LinearGradient>
      )}
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
    </PressScale>
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
  image: {
    height: 110,
    width: '100%',
    resizeMode: 'cover',
    backgroundColor: colors.surfaceAlt,
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
