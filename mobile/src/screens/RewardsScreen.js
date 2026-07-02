// Rewards — loyalty tier, points balance, progress to next tier, and the
// full tier benefits table.
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Loading from '../components/Loading';
import { FadeInView } from '../components/anim';

import { fetchLoyalty } from '../api/auth';
import { TIERS, tierForPoints, nextTier, tierProgress } from '../utils/loyalty';
import { colors, radius, spacing } from '../theme/colors';
import { formatPrice } from '../utils/format';

// Progress bar that sweeps from 0 to `progress` when it appears.
function AnimatedBar({ progress }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, {
      toValue: progress,
      duration: 900,
      delay: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width % can't ride the native driver
    }).start();
  }, [width, progress]);

  const w = width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { width: w }]} />
    </View>
  );
}

export default function RewardsScreen() {
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchLoyalty();
      setLoyalty(data);
    } catch {
      // ignore — show what we have
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading && !loyalty) return <Loading label="Loading rewards…" />;

  const lifetime = loyalty?.lifetimePoints || 0;
  const balance = loyalty?.points || 0;
  const tier = tierForPoints(lifetime);
  const next = nextTier(lifetime);
  const progress = tierProgress(lifetime);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.kicker}>Loyalty</Text>
        <Text style={styles.title}>Rewards</Text>
      </View>

      {/* Tier hero card */}
      <FadeInView>
        <LinearGradient
          colors={[tier.color, '#1a0a04']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroEmoji}>{tier.emoji}</Text>
          <Text style={styles.heroTier}>{tier.name} Member</Text>
          <Text style={styles.heroBalance}>{balance}</Text>
          <Text style={styles.heroBalanceLabel}>points · worth {formatPrice(balance)}</Text>
        </LinearGradient>
      </FadeInView>

      {/* Progress to next tier */}
      <FadeInView delay={80}>
        <Card style={styles.progressCard}>
          {next ? (
            <>
              <View style={styles.progressTop}>
                <Text style={styles.progressLabel}>{tier.name}</Text>
                <Text style={styles.progressLabel}>{next.emoji} {next.name}</Text>
              </View>
              <AnimatedBar progress={progress} />
              <Text style={styles.progressHint}>
                {next.min - lifetime} more lifetime points to reach {next.name}
              </Text>
            </>
          ) : (
            <Text style={styles.maxedOut}>💎 You've reached the top tier. Enjoy the perks!</Text>
          )}
        </Card>
      </FadeInView>

      {/* How it works */}
      <Text style={styles.section}>How it works</Text>
      <Card style={styles.infoCard}>
        <Text style={styles.infoLine}>• Earn <Text style={styles.b}>1 point per €0.10</Text> spent.</Text>
        <Text style={styles.infoLine}>• Higher tiers earn faster and get automatic discounts.</Text>
        <Text style={styles.infoLine}>• <Text style={styles.b}>100 points = €1.00 off</Text> — redeem at checkout.</Text>
      </Card>

      {/* Tier benefits table */}
      <Text style={styles.section}>Tiers & benefits</Text>
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xl }}>
        {TIERS.map((t, i) => {
          const isCurrent = t.key === tier.key;
          return (
            <FadeInView key={t.key} delay={160 + i * 70}>
              <View style={[styles.tierRow, isCurrent && styles.tierRowActive]}>
                <Text style={styles.tierEmoji}>{t.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tierName}>
                    {t.name}{isCurrent ? '  • you' : ''}
                  </Text>
                  <Text style={styles.tierMeta}>
                    {t.min}+ pts · {t.multiplier}× earning
                    {t.discountPct > 0 ? ` · ${t.discountPct}% off` : ''}
                  </Text>
                </View>
              </View>
            </FadeInView>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  kicker: { color: colors.creamFaint, fontSize: 13 },
  title: { color: '#fdf8f2', fontSize: 22, fontWeight: '700', marginTop: 4 },
  hero: {
    marginHorizontal: spacing.lg, borderRadius: radius.lg, padding: 24,
    alignItems: 'center', marginBottom: spacing.md,
  },
  heroEmoji: { fontSize: 40 },
  heroTier: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 6, letterSpacing: 0.5 },
  heroBalance: { color: '#fff', fontSize: 48, fontWeight: '900', marginTop: 10 },
  heroBalanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  progressCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: 16, borderRadius: radius.lg },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: colors.creamMuted, fontSize: 12, fontWeight: '700' },
  barTrack: { height: 8, backgroundColor: 'rgba(232,201,154,0.12)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: colors.accent, borderRadius: 4 },
  progressHint: { color: colors.creamFaint, fontSize: 12, marginTop: 8 },
  maxedOut: { color: colors.accentLight, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  section: {
    color: 'rgba(232,201,154,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', paddingHorizontal: spacing.lg, marginBottom: 10, marginTop: 4,
  },
  infoCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: 16, borderRadius: radius.lg, gap: 8 },
  infoLine: { color: colors.cream, fontSize: 13, lineHeight: 19 },
  b: { color: colors.accentLight, fontWeight: '800' },
  tierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  tierRowActive: { borderColor: colors.accent, backgroundColor: 'rgba(212,128,42,0.10)' },
  tierEmoji: { fontSize: 26 },
  tierName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  tierMeta: { color: colors.creamMuted, fontSize: 12, marginTop: 2 },
});
