// Order placed → success state with the assigned compartment, scannable QR,
// and (once READY) an "Open Door" button that pops the solenoid via the backend.
// Polls live so it flips to "Ready!" the moment the barista marks it ready.
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import QRDisplay from '../components/QRDisplay';
import Button from '../components/Button';
import Loading from '../components/Loading';

import useOrderLive from '../utils/useOrderLive';
import { openDoor } from '../api/orders';
import { useCart } from '../context/CartContext';
import { colors, radius, spacing } from '../theme/colors';
import { formatEta } from '../utils/format';

const STEPS = [
  ['1', 'Wait for the "Ready" notification'],
  ['2', 'Walk up to the coffee cabinet'],
  ['3', 'Tap "Open Door" or scan your QR — the door pops open ☕'],
];

const SHORT_ID = (id) => 'BRW-' + (id || '').slice(-4).toUpperCase();

export default function QRCodeScreen({ route, navigation }) {
  const { orderId, qrToken } = route.params;
  const { order, error, refresh } = useOrderLive(orderId);
  const { clearActive } = useCart();
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState('');

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
        {error ? <Text style={{ color: colors.danger, padding: spacing.lg }}>{error}</Text> : <Loading label="Loading order…" />}
      </ScreenContainer>
    );
  }

  const eta = formatEta(order);
  const isReady = order.status === 'READY';
  const isDone = order.status === 'PICKED_UP';
  const doorNo = order.locker?.number;

  return (
    <ScreenContainer>
      <View style={styles.center}>
        <View style={[styles.checkBubble, isReady && { backgroundColor: '#3a9e68' }]}>
          <Text style={styles.checkText}>{isDone ? '🎉' : '✓'}</Text>
        </View>
        <Text style={styles.title}>{isReady ? 'Ready for Pickup!' : isDone ? 'All Done!' : 'Order Placed!'}</Text>
        <Text style={styles.subtitle}>{eta.detail || 'Your coffee is being prepared ☕'}</Text>

        <View style={styles.doorBadge}>
          <Text style={styles.doorLabel}>YOUR DOOR</Text>
          <Text style={styles.doorNumber}>{doorNo != null ? doorNo : '—'}</Text>
          <Text style={styles.doorSub}>{order.locker?.location || 'Coffee Counter'}</Text>
        </View>

        {!isDone ? (
          <View style={{ marginTop: 8, marginBottom: 14 }}>
            <QRDisplay value={qrToken} size={180} />
          </View>
        ) : null}

        <View style={styles.idBox}>
          <Text style={styles.idLabel}>Order ID</Text>
          <Text style={styles.idValue}>{SHORT_ID(order.id)}</Text>
        </View>

        {isReady ? (
          <View style={{ width: '100%', marginBottom: 12 }}>
            <Button
              title={opening ? 'Opening…' : `Open Door ${doorNo ?? ''}`}
              subtitle="Pops the lock & marks collected"
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

        {!isReady && !isDone ? (
          <View style={{ width: '100%', marginBottom: 16 }}>
            {STEPS.map(([n, t]) => (
              <View key={n} style={styles.stepRow}>
                <View style={styles.stepDot}><Text style={styles.stepDotText}>{n}</Text></View>
                <Text style={styles.stepText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Button
          title="Track My Order"
          subtitle={isReady ? 'See live status & details' : `Live status: ${eta.label}`}
          variant="secondary"
          onPress={() => navigation.replace('OrderDetail', { orderId: order.id })}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  checkBubble: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#4caf7d',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#4caf7d', shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  checkText: { fontSize: 30, color: 'white' },
  title: { color: '#fdf8f2', fontSize: 22, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  subtitle: { color: 'rgba(232,201,154,0.5)', fontSize: 13, textAlign: 'center' },
  doorBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,128,42,0.12)',
    borderWidth: 1, borderColor: 'rgba(212,128,42,0.3)',
    borderRadius: radius.lg,
    paddingVertical: 14, paddingHorizontal: 40,
    marginTop: 16, marginBottom: 6,
  },
  doorLabel: { color: colors.creamFaint, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  doorNumber: { color: colors.accentLight, fontSize: 48, fontWeight: '800', lineHeight: 54 },
  doorSub: { color: colors.creamMuted, fontSize: 12 },
  idBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 8, paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  idLabel: { color: colors.creamFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  idValue: { color: colors.accentLight, fontSize: 16, fontWeight: '700', letterSpacing: 3 },
  openError: { color: colors.danger, fontSize: 12, marginTop: 8, textAlign: 'center' },
  stepRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(232,201,154,0.06)',
  },
  stepDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  stepDotText: { color: colors.accentLight, fontSize: 11, fontWeight: '700' },
  stepText: { color: colors.creamMuted, fontSize: 12, lineHeight: 18, flex: 1 },
});
