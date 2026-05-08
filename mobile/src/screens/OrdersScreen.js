// Orders tab — current order with live status + ETA + timeline,
// then the past-orders list below.
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import ScreenContainer from '../components/ScreenContainer';
import OrderListItem from '../components/OrderListItem';
import OrderStatusBadge from '../components/OrderStatusBadge';
import StatusTimeline from '../components/StatusTimeline';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

import { fetchOrders } from '../api/orders';
import useOrderLive from '../utils/useOrderLive';
import { useCart } from '../context/CartContext';
import { colors, radius, spacing } from '../theme/colors';
import { formatEta } from '../utils/format';

const ACTIVE = new Set(['PAID', 'PREPARING', 'READY']);
const SHORT_ID = (id) => 'BRW-' + (id || '').slice(-4).toUpperCase();

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { activeOrderId } = useCart();

  // Live polling of the active order so the active card updates.
  const { order: liveActive } = useOrderLive(activeOrderId);

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await fetchOrders();
      setOrders(data);
    } catch (e) {
      setError(e.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loading label="Loading your orders…" />;

  // Prefer the live-polled version of the active order if available.
  const active = liveActive || orders.find((o) => ACTIVE.has(o.status));
  const past = orders.filter((o) => !active || o.id !== active.id);

  return (
    <ScreenContainer
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>My Orders</Text>
        <Text style={styles.title}>Order Status</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {active ? (
        <ActiveOrderBlock
          order={active}
          onOpen={() => navigation.navigate('OrderDetail', { orderId: active.id })}
        />
      ) : (
        <EmptyState icon="☕" title="No active orders" message="Place an order from the menu!" />
      )}

      <Text style={styles.section}>Past Orders</Text>
      {past.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={styles.emptyMuted}>No past orders yet.</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
          {past.map((o) => (
            <OrderListItem
              key={o.id}
              order={o}
              onPress={() => navigation.navigate('OrderDetail', { orderId: o.id })}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

function ActiveOrderBlock({ order, onOpen }) {
  const eta = formatEta(order);
  const item = order.items?.[0];
  return (
    <>
      <View style={styles.activeCard}>
        <View style={styles.activeHeader}>
          <Text style={styles.idText}>{SHORT_ID(order.id)}</Text>
          <OrderStatusBadge status={order.status} />
        </View>
        <View style={styles.activeBody}>
          <Text style={styles.activeEmoji}>{item?.product?.emoji || '☕'}</Text>
          <View>
            <Text style={styles.activeName}>{item?.product?.name || 'Order'}</Text>
            <Text style={styles.activeMeta}>{order.locker?.location}</Text>
          </View>
        </View>
        <Text style={styles.tapHint} onPress={onOpen}>Tap for QR & details →</Text>
      </View>

      <View style={styles.etaCard}>
        <Text style={{ fontSize: 28 }}>⏱️</Text>
        <View>
          <Text style={styles.etaKicker}>Estimated Ready In</Text>
          <Text style={styles.etaValue}>{eta.label}</Text>
          <Text style={styles.etaDetail}>{eta.detail}</Text>
        </View>
      </View>

      <StatusTimeline current={order.status} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  kicker: { color: colors.creamFaint, fontSize: 13 },
  title: { color: '#fdf8f2', fontSize: 22, fontWeight: '700', marginTop: 4 },
  section: {
    color: colors.creamFaint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1,
    fontWeight: '700', marginBottom: 10, marginTop: 16, paddingHorizontal: spacing.lg,
  },
  emptyMuted: { color: colors.creamFaint, fontSize: 13 },
  activeCard: {
    marginHorizontal: spacing.lg, marginTop: 14,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16,
    borderWidth: 1, borderColor: 'rgba(212,128,42,0.2)',
  },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  idText: { color: colors.accentLight, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  activeBody: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  activeEmoji: { fontSize: 36 },
  activeName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  activeMeta: { color: colors.creamFaint, fontSize: 11, marginTop: 2 },
  tapHint: { color: colors.creamMuted, fontSize: 11, marginTop: 12 },
  etaCard: {
    flexDirection: 'row', gap: 14, alignItems: 'center',
    marginHorizontal: spacing.lg, marginVertical: 12,
    backgroundColor: 'rgba(212,128,42,0.10)',
    borderWidth: 1, borderColor: 'rgba(212,128,42,0.25)',
    borderRadius: radius.md, padding: 16,
  },
  etaKicker: { color: 'rgba(232,201,154,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  etaValue: { color: colors.accentLight, fontSize: 20, fontWeight: '700' },
  etaDetail: { color: colors.creamMuted, fontSize: 11 },
  error: { color: colors.danger, paddingHorizontal: spacing.lg },
});
