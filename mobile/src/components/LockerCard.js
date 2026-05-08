// A selectable locker tile in the order screen's pickup picker.
import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

const ICONS = {
  'Main Lobby': '🏢',
  'Floor 3': '🏬',
  'Rooftop': '🚫',
  'Cafeteria': '🍽️',
  'East Wing': '🚪',
  'West Exit': '🏃',
};

function iconFor(locker) {
  if (ICONS[locker.location]) return ICONS[locker.location];
  return locker.status === 'OFFLINE' ? '🚫' : '📦';
}

function distanceFor(locker) {
  // Stand-in for real distance — derived deterministically from locker number.
  const n = locker.number || 0;
  return `${30 + ((n * 30) % 220)}m`;
}

export default function LockerCard({ locker, selected, onPress }) {
  const disabled = locker.status !== 'AVAILABLE';
  const tagText = disabled ? (locker.status === 'OCCUPIED' ? 'Full' : 'Busy') : 'Available';
  const tagPos = !disabled;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        styles.card,
        selected && styles.selected,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.icon}>{iconFor(locker)}</Text>
      <Text style={styles.name} numberOfLines={1}>{locker.location}</Text>
      <Text style={styles.dist}>{distanceFor(locker)}</Text>
      <View style={[styles.tag, tagPos ? styles.tagOk : styles.tagBad]}>
        <Text style={[styles.tagText, tagPos ? { color: colors.success } : { color: colors.danger }]}>
          {tagText}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '31.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(212,128,42,0.12)',
  },
  disabled: { opacity: 0.35 },
  icon: { fontSize: 22, marginBottom: 4 },
  name: { color: colors.text, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  dist: { color: colors.creamFaint, fontSize: 10 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  tagOk: { backgroundColor: 'rgba(76,175,125,0.2)' },
  tagBad: { backgroundColor: 'rgba(224,82,82,0.2)' },
  tagText: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});
