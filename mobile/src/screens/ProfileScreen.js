// Profile — account header, loyalty snapshot, active order (live), past
// orders, and sign out. This screen absorbed the old "Orders" tab so the
// bottom bar stays uncluttered.
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import OrderListItem from '../components/OrderListItem';
import OrderStatusBadge from '../components/OrderStatusBadge';

import { fetchOrders } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useOrderLive from '../utils/useOrderLive';
import { colors, radius, spacing } from '../theme/colors';
import { formatPrice, formatEta } from '../utils/format';

const ACTIVE = new Set(['PAID', 'PREPARING', 'READY']);
const SHORT_ID = (id) => 'BRW-' + (id || '').slice(-4).toUpperCase();

export default function ProfileScreen({ navigation }) {
  const { user, signOut, refreshUser } = useAuth();
  const { activeOrderId, clearActive } = useCart();
  const { order: liveActive } = useOrderLive(activeOrderId);

  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch {
      // keep what we have
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); refreshUser?.(); }, [load, refreshUser]));

  async function onSignOut() {
    await clearActive();
    await signOut();
  }

  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase();
  const loyalty = user?.loyalty;

  // Active order: prefer the live-polled one if still active.
  const liveActiveStillActive = liveActive && ACTIVE.has(liveActive.status) ? liveActive : null;
  const active = liveActiveStillActive || orders.find((o) => ACTIVE.has(o.status));
  const past = orders.filter((o) => !active || o.id !== active.id);

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      {/* Account header */}
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.name || 'Coffee lover'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      {/* Loyalty snapshot — tappable, goes to Rewards */}
      {loyalty ? (
        <Pressable onPress={() => navigation.navigate('Rewards')}>
          <Card style={[styles.card, styles.loyaltyCard]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.loyaltyTier}>{loyalty.tier?.emoji} {loyalty.tier?.name} member</Text>
              <Text style={styles.loyaltySub}>{loyalty.lifetimePoints} lifetime · tap for rewards →</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.loyaltyBalance}>{loyalty.points}</Text>
              <Text style={styles.loyaltySub}>points</Text>
            </View>
          </Card>
        </Pressable>
      ) : null}

      {/* Active order */}
      {active ? (
        <>
          <Text style={styles.section}>Active order</Text>
          <Pressable onPress={() => navigation.navigate('OrderDetail', { orderId: active.id })}>
            <Card style={styles.activeCard}>
              <View style={styles.activeTop}>
                <Text style={styles.activeId}>{SHORT_ID(active.id)}</Text>
                <OrderStatusBadge status={active.status} />
              </View>
              <View style={styles.activeBody}>
                <Text style={styles.activeEmoji}>{active.items?.[0]?.product?.emoji || '☕'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeName}>
                    {active.items?.[0]?.product?.name || 'Order'}
                    {active.items?.length > 1 ? ` +${active.items.length - 1}` : ''}
                  </Text>
                  <Text style={styles.activeEta}>{formatEta(active).label}</Text>
                </View>
                <Text style={styles.activeChevron}>→</Text>
              </View>
            </Card>
          </Pressable>
        </>
      ) : null}

      {/* Past orders */}
      <Text style={styles.section}>Order history</Text>
      <View style={{ paddingHorizontal: spacing.lg }}>
        {past.length === 0 ? (
          <Text style={styles.emptyMuted}>No past orders yet.</Text>
        ) : (
          past.map((o) => (
            <OrderListItem
              key={o.id}
              order={o}
              onPress={() => navigation.navigate('OrderDetail', { orderId: o.id })}
            />
          ))
        )}
      </View>

      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
        <Button title="Sign out" variant="secondary" onPress={onSignOut} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.textInverse, fontSize: 24, fontWeight: '800' },
  name: { color: '#fdf8f2', fontSize: 20, fontWeight: '700' },
  email: { color: colors.creamMuted, fontSize: 13, marginTop: 2 },
  card: { marginHorizontal: spacing.lg },
  loyaltyCard: {
    flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md,
    borderWidth: 1, borderColor: 'rgba(212,128,42,0.3)',
    backgroundColor: 'rgba(212,128,42,0.08)',
  },
  loyaltyTier: { color: colors.text, fontSize: 16, fontWeight: '700' },
  loyaltyBalance: { color: colors.accentLight, fontSize: 24, fontWeight: '900' },
  loyaltySub: { color: colors.creamMuted, fontSize: 12, marginTop: 2 },
  section: {
    color: 'rgba(232,201,154,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', paddingHorizontal: spacing.lg, marginBottom: 10, marginTop: spacing.sm,
  },
  activeCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: 16, borderRadius: radius.lg,
    borderWidth: 1, borderColor: 'rgba(212,128,42,0.25)',
  },
  activeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  activeId: { color: colors.accentLight, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  activeBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activeEmoji: { fontSize: 32 },
  activeName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  activeEta: { color: colors.accentLight, fontSize: 13, fontWeight: '700', marginTop: 2 },
  activeChevron: { color: colors.creamMuted, fontSize: 18 },
  emptyMuted: { color: colors.creamFaint, fontSize: 13 },
});
