// One order's full state: assigned door, QR, status timeline, items.
// When READY, the customer can open the compartment with a button (or the QR).
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import OrderStatusBadge from '../components/OrderStatusBadge';
import StatusTimeline from '../components/StatusTimeline';
import QRDisplay from '../components/QRDisplay';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

import useOrderLive from '../utils/useOrderLive';
import { getItem } from '../utils/storage';
import { openDoor } from '../api/orders';
import { useCart } from '../context/CartContext';
import { colors, radius, spacing } from '../theme/colors';
import { formatPrice, formatStatus, formatTime, formatEta } from '../utils/format';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const { order, error, refresh } = useOrderLive(orderId);
  const [qrToken, setQrToken] = useState(null);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState('');
  const { clearActive } = useCart();

  useEffect(() => {
    (async () => {
      const t = await getItem(`qr_${orderId}`);
      setQrToken(t);
    })();
  }, [orderId]);

  const onOpen = useCallback(async () => {
    setOpenError('');
    try {
      setOpening(true);
      console.log('[open] calling openDoor...');
      await openDoor(orderId);
      console.log('[open] openDoor done, clearing active...');
      await clearActive();
      console.log('[open] all done');
    } catch (e) {
      console.log('[open] ERROR:', e.message, e);
      setOpenError(e.message || 'Could not open the door.');
    } finally {
      setOpening(false);
    }
  }, [orderId, clearActive]);

  if (!order) {
    return (
      <ScreenContainer>
        {error ? (
          <EmptyState icon="⚠️" title="Couldn't load order" message={error} />
        ) : (
          <Loading label="Loading order…" />
        )}
      </ScreenContainer>
    );
  }

  const eta = formatEta(order);
  const doorNo = order.locker?.number;
  const showQR = qrToken && (order.status === 'PAID' || order.status === 'PREPARING' || order.status === 'READY');
  const canOpen = order.status === 'READY';

  return (
    <ScreenContainer>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>{order.locker?.location || 'Coffee Counter'}</Text>
        <Text style={styles.subtitle}>{formatTime(order.createdAt)}</Text>
      </View>

      <Card style={styles.statusCard}>
        <OrderStatusBadge status={order.status} />
        <Text style={styles.statusText}>{formatStatus(order.status)}</Text>
        <Text style={styles.eta}>{eta.label}</Text>
        {eta.detail ? <Text style={styles.etaDetail}>{eta.detail}</Text> : null}
      </Card>

      <View style={styles.doorRow}>
        <Text style={styles.doorRowLabel}>Your door</Text>
        <Text style={styles.doorRowValue}>#{doorNo != null ? doorNo : '—'}</Text>
      </View>

      {showQR ? (
        <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
          <QRDisplay value={qrToken} size={200} />
          <Text style={styles.qrHint}>
            {order.status === 'READY'
              ? 'Scan this at the cabinet, or use the button below.'
              : 'You\'ll use this once your order is ready.'}
          </Text>
        </View>
      ) : null}

      {canOpen ? (
        <View style={styles.openWrap}>
          <Button
            title={opening ? 'Opening…' : `Open Door ${doorNo ?? ''}`}
            loading={opening}
            disabled={opening}
            onPress={() => {
              Alert.alert(
                'Open the door?',
                `This unlocks door ${doorNo}. Make sure you're at the cabinet.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Open', style: 'default', onPress: onOpen },
                ]
              );
            }}
          />
          {openError ? <Text style={styles.openError}>{openError}</Text> : null}
        </View>
      ) : null}

      <StatusTimeline current={order.status} />

      <Card style={styles.itemsCard}>
        <Text style={styles.heading}>Items</Text>
        {order.items.map((i) => (
          <View key={i.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{i.quantity}× {i.product?.name || 'Item'}</Text>
              {i.notes ? <Text style={styles.itemNotes}>{i.notes}</Text> : null}
            </View>
            <Text style={styles.itemPrice}>{formatPrice(i.priceCents * i.quantity)}</Text>
          </View>
        ))}
        <View style={[styles.itemRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(order.totalCents)}</Text>
        </View>
      </Card>

      {error ? <Text style={{ color: colors.danger, paddingHorizontal: spacing.lg }}>{error}</Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backText: { color: 'rgba(232,201,154,0.7)', fontSize: 14 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  title: { color: '#fdf8f2', fontSize: 22, fontWeight: '700' },
  subtitle: { color: colors.creamFaint, fontSize: 12, marginTop: 4 },
  statusCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, gap: 4 },
  statusText: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 4 },
  eta: { color: colors.accentLight, fontSize: 18, fontWeight: '700', marginTop: 4 },
  etaDetail: { color: colors.creamMuted, fontSize: 12 },
  doorRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: 'rgba(212,128,42,0.10)',
    borderWidth: 1, borderColor: 'rgba(212,128,42,0.25)',
    borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 18,
  },
  doorRowLabel: { color: colors.creamMuted, fontSize: 13 },
  doorRowValue: { color: colors.accentLight, fontSize: 22, fontWeight: '800' },
  qrHint: { color: colors.creamMuted, fontSize: 12, marginTop: 12, textAlign: 'center', paddingHorizontal: spacing.lg },
  openWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  openError: { color: colors.danger, fontSize: 12, marginTop: 8, textAlign: 'center' },
  itemsCard: { marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: radius.lg },
  heading: { color: colors.creamMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, alignItems: 'flex-start' },
  itemName: { color: colors.text, fontSize: 14 },
  itemNotes: { color: colors.creamFaint, fontSize: 11, marginTop: 2 },
  itemPrice: { color: colors.text, fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.sm },
  totalLabel: { color: colors.text, fontSize: 14, fontWeight: '700' },
  totalValue: { color: colors.accentLight, fontSize: 16, fontWeight: '800' },
});
