// Order placed → success state with the scannable QR + locker info + steps.
// Polls the order via useOrderLive so it flips to "Ready!" the moment the
// barista marks it ready in the dashboard. Also gives the customer a one-tap
// "I picked up my order" button once the order is READY.
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import QRDisplay from '../components/QRDisplay';
import Button from '../components/Button';
import Loading from '../components/Loading';

import useOrderLive from '../utils/useOrderLive';
import { confirmPickup } from '../api/orders';
import { useCart } from '../context/CartContext';
import { colors, radius, spacing } from '../theme/colors';
import { formatEta } from '../utils/format';

const STEPS = [
  ['1', 'Head to your chosen locker once you get a notification'],
  ['2', 'Open the app and show the QR code to the scanner'],
  ['3', 'The locker opens automatically — enjoy your coffee ☕'],
];

const SHORT_ID = (id) => 'BRW-' + (id || '').slice(-4).toUpperCase();

export default function QRCodeScreen({ route, navigation }) {
  const { orderId, qrToken } = route.params;
  const { order, error } = useOrderLive(orderId);
  const { clearActive } = useCart();
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const onConfirmPickup = useCallback(async () => {
    setConfirmError('');
    try {
      setConfirming(true);
      await confirmPickup(orderId);
      await clearActive();
    } catch (e) {
      setConfirmError(e.message || 'Could not confirm pickup.');
    } finally {
      setConfirming(false);
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

  return (
    <ScreenContainer>
      <View style={styles.center}>
        <View style={[styles.checkBubble, isReady && { backgroundColor: '#3a9e68' }]}>
          <Text style={styles.checkText}>{isDone ? '🎉' : '✓'}</Text>
        </View>
        <Text style={styles.title}>{isReady ? 'Ready for Pickup!' : isDone ? 'All Done!' : 'Order Placed!'}</Text>
        <Text style={styles.subtitle}>{eta.detail || 'Your coffee is being prepared ☕'}</Text>

        {!isDone ? (
          <View style={{ marginTop: 20, marginBottom: 14 }}>
            <QRDisplay value={qrToken} size={200} />
          </View>
        ) : null}

        <View style={styles.idBox}>
          <Text style={styles.idLabel}>Order ID</Text>
          <Text style={styles.idValue}>{SHORT_ID(order.id)}</Text>
        </View>

        <View style={styles.lockerBox}>
          <Text style={styles.lockerEmoji}>🗄️</Text>
          <View>
            <Text style={styles.lockerName}>{order.locker?.location} Locker</Text>
            <Text style={styles.lockerHint}>
              {isReady ? 'Tap the button below once you have your coffee' : 'Present QR code to scan & unlock'}
            </Text>
          </View>
        </View>

        {!isReady ? (
          <View style={{ width: '100%', marginBottom: 16 }}>
            {STEPS.map(([n, t]) => (
              <View key={n} style={styles.stepRow}>
                <View style={styles.stepDot}><Text style={styles.stepDotText}>{n}</Text></View>
                <Text style={styles.stepText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {isReady ? (
          <View style={{ width: '100%', marginBottom: 12 }}>
            <Button
              title={confirming ? 'Confirming…' : 'I picked up my order'}
              subtitle="Mark this order complete"
              loading={confirming}
              disabled={confirming}
              onPress={() => {
                Alert.alert(
                  'Confirm pickup',
                  'Mark this order as collected? This will close it out.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Yes, picked up', style: 'default', onPress: onConfirmPickup },
                  ]
                );
              }}
            />
            {confirmError ? <Text style={styles.confirmError}>{confirmError}</Text> : null}
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
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#4caf7d',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#4caf7d', shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  checkText: { fontSize: 32, color: 'white' },
  title: { color: '#fdf8f2', fontSize: 22, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  subtitle: { color: 'rgba(232,201,154,0.5)', fontSize: 13, textAlign: 'center' },
  idBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 10, paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 14,
  },
  idLabel: { color: colors.creamFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  idValue: { color: colors.accentLight, fontSize: 18, fontWeight: '700', letterSpacing: 3 },
  lockerBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(212,128,42,0.10)',
    borderWidth: 1, borderColor: 'rgba(212,128,42,0.25)',
    borderRadius: radius.md,
    paddingVertical: 14, paddingHorizontal: 20,
    width: '100%',
    marginBottom: 16,
  },
  lockerEmoji: { fontSize: 28 },
  lockerName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  lockerHint: { color: colors.creamMuted, fontSize: 12 },
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
  confirmError: { color: colors.danger, fontSize: 12, marginTop: 8, textAlign: 'center' },
});
