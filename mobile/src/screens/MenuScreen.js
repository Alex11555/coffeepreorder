// Menu — greeting, hero banner, category filter, two-column drink grid.
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import Greeting from '../components/Greeting';
import HeroBanner from '../components/HeroBanner';
import Pill from '../components/Pill';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { FadeInView } from '../components/anim';

import { fetchMenu } from '../api/menu';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme/colors';

const ALL = 'All';

export default function MenuScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState(ALL);
  const { user } = useAuth();

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await fetchMenu();
      setProducts(data);
    } catch (e) {
      setError(e.message || 'Failed to load menu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => {
    const seen = new Set();
    products.forEach((p) => p.category && seen.add(p.category));
    return [ALL, ...seen];
  }, [products]);

  const filtered = useMemo(() => {
    if (category === ALL) return products;
    return products.filter((p) => p.category === category);
  }, [products, category]);

  const featured = products[0];

  if (loading) return <Loading label="Loading menu…" />;

  return (
    <ScreenContainer
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
    >
      <FadeInView>
        <Greeting user={user} />
      </FadeInView>

      {featured ? (
        <FadeInView delay={60}>
          <HeroBanner
            tag="☕ Featured"
            title={`${featured.name}\nfor today`}
            subtitle={featured.description}
            emoji={featured.emoji || '☕'}
          />
        </FadeInView>
      ) : null}

      <Text style={styles.section}>Our Menu</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        {categories.map((c) => (
          <Pill key={c} label={c} active={c === category} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {filtered.length === 0 ? (
        <EmptyState title="Menu is empty" message="Run the seed script to load products." />
      ) : (
        <View style={styles.grid}>
          {filtered.map((p, i) => (
            <FadeInView
              key={`${category}-${p.id}`}
              delay={100 + Math.min(i, 8) * 55}
              style={[styles.cell, i % 2 === 0 ? { paddingRight: 7 } : { paddingLeft: 7 }]}
            >
              <ProductCard
                product={p}
                onPress={() => navigation.navigate('Order', { product: p })}
              />
            </FadeInView>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    fontSize: 18,
    color: colors.cream,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    fontWeight: '700',
  },
  pillRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg - 7,
  },
  cell: { width: '50%', marginBottom: 14 },
  error: { color: colors.danger, paddingHorizontal: spacing.lg },
});
