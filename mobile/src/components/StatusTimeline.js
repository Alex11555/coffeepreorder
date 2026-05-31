// Vertical progress timeline used on the live tracking screen.
//
// `current` is one of: PAID, PREPARING, READY, PICKED_UP.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/colors';

const STEPS = [
  { key: 'PAID',      icon: '✓',  title: 'Order Received', sub: 'Payment confirmed' },
  { key: 'PREPARING', icon: '☕', title: 'Being Prepared', sub: 'Barista is on it' },
  { key: 'READY',     icon: '📦', title: 'Placed in Locker', sub: 'Ready for pickup' },
  { key: 'PICKED_UP', icon: '🎉', title: 'Picked Up',       sub: 'Enjoy your coffee' },
];

const ORDER = ['PAID', 'PREPARING', 'READY', 'PICKED_UP'];

function stateOf(stepKey, current) {
  const ci = ORDER.indexOf(current);
  const si = ORDER.indexOf(stepKey);
  if (si < ci) return 'done';
  if (si === ci) {
    // PICKED_UP is the terminal state — when we're on it, it's "done", not
    // "in progress" (there's nothing further to do).
    if (stepKey === 'PICKED_UP') return 'done';
    return 'active';
  }
  return 'pending';
}

export default function StatusTimeline({ current }) {
  const ci = ORDER.indexOf(current);
  const fillPct = ci <= 0 ? 0 : (ci / (ORDER.length - 1)) * 100;
  return (
    <View style={styles.wrap}>
      <View style={styles.track} />
      <View style={[styles.fill, { height: `${fillPct}%` }]} />
      {STEPS.map((s) => {
        const state = stateOf(s.key, current);
        return (
          <View key={s.key} style={styles.row}>
            <View
              style={[
                styles.dot,
                state === 'done' && styles.dotDone,
                state === 'active' && styles.dotActive,
                state === 'pending' && styles.dotPending,
              ]}
            >
              <Text
                style={[
                  styles.dotIcon,
                  state === 'pending' && { color: colors.creamGhost },
                ]}
              >
                {s.icon}
              </Text>
            </View>
            <View style={styles.text}>
              <Text style={[styles.title, state === 'pending' && { color: colors.creamGhost, fontWeight: '400' }]}>
                {s.title}
              </Text>
              <Text
                style={[
                  styles.sub,
                  state === 'done' && { color: colors.success },
                  state === 'active' && { color: colors.accent },
                  state === 'pending' && { color: colors.creamGhost },
                ]}
              >
                {state === 'done' ? 'Completed' : state === 'active' ? 'In progress…' : '—'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, position: 'relative' },
  track: {
    position: 'absolute',
    left: spacing.lg + 14, top: 14, bottom: 14,
    width: 2,
    backgroundColor: 'rgba(232,201,154,0.1)',
  },
  fill: {
    position: 'absolute',
    left: spacing.lg + 14, top: 14,
    width: 2,
    backgroundColor: colors.accent,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingBottom: 20, position: 'relative', zIndex: 1 },
  dot: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: colors.surface,
  },
  dotDone:    { borderColor: colors.success, backgroundColor: colors.success },
  dotActive:  { borderColor: colors.accent },
  dotPending: { borderColor: colors.creamGhost },
  dotIcon:    { fontSize: 13, color: colors.text },
  text: { paddingTop: 4 },
  title: { color: colors.text, fontSize: 14, fontWeight: '600' },
  sub: { fontSize: 11, marginTop: 2 },
});
