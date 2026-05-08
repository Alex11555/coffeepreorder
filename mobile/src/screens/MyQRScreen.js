// "My QR" tab — quick access to the active order's pickup QR.
// If there's nothing active, prompt the user to order something.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import QRDisplay from '../components/QRDisplay';
import OrderStatusBadge from '../components/OrderStatusBadge';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

import useOrderLive from '../utils/useOrderLive';
import { useCart } from '../context/CartContext';
import { getItem } from '../utils/storage';
import { colors, radius, spacing } from '../theme/colors';
import { formatEta } from '../utils/format';

export default function MyQRScreen({ navigation }) {
  const { activeOrderId, hydrated, clearActive } = useCart();
  const { order } = useOrderLive(activeOrderId);
  const [qrToken, setQrToken] = useState(null);

  useEffect(() => {
    if (!activeOrderId) { setQrToken(null); return; }
    (async () => setQrToken(await getItem(`qr_${activeOrderId}`)))();
  }, [activeOrderId]);

  // Once the order reaches a terminal state, drop the cached active id so
  // the empty state shows up next time the user lands on this tab.
  useEffect(() => {
    if (order && (order.status === 'PICKED_UP' || order.status === 'CANCELLED')) {
      clearActive();
    }
  }, [order, clearActive]);

  if (!hydrated) return null;

  if (!activeOrderId || !qrToken) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <Text style={styles.kicker}>Pickup</Text>
          <Text style={styles.title}>My QR Code</Text>
        </View>
        <EmptyState icon="⬛" title="No active QR" message="Place an order and your locker QR will appear here." />
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Button title="Browse the menu" onPress={() => navigation.navigate('Menu')} />
        </View>
      </ScreenContainer>
    );
  }

  const eta = order ? formatEta(order) : { label: '—', detail: '' };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.kicker}>Pickup</Text>
        <Text style={styles.title}>My QR Code</Text>
      </View>

      <View style={styles.qrWrap}>
        <QRDisplay value={qrToken} size={220} />
      </View>

      {order ? (
        <View style={styles.statusBox}>
          <OrderStatusBadge status={order.status} />
          <Text style={styles.eta}>{eta.label}</Text>
          {eta.detail ? <Text style={styles.etaDetail}>{eta.detail}</Text> : null}
        </View>
      ) : null}

      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
        <Button
          title="Open order details"
          variant="secondary"
          onPress={() => navigation.navigate('OrderDetail', { orderId: activeOrderId })}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  kicker: { color: colors.creamFaint, fontSize: 13 },
  title: { color: '#fdf8f2', fontSize: 22, fontWeight: '700', marginTop: 4 },
  qrWrap: { alignItems: 'center', paddingVertical: spacing.lg },
  statusBox: {
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(212,128,42,0.10)',
    borderWidth: 1, borderColor: 'rgba(212,128,42,0.25)',
    borderRadius: radius.md,
    padding: 16,
    gap: 6,
  },
  eta: { color: colors.accentLight, fontSize: 18, fontWeight: '700' },
  etaDetail: { color: colors.creamMuted, fontSize: 12 },
});
