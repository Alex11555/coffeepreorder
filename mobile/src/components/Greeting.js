// Top-of-menu greeting: time-aware "Good morning/afternoon/evening" plus a
// LIVE weather emoji + temperature (best-effort, falls back to a time emoji).
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/colors';
import useWeather from '../utils/useWeather';

// Greeting word + a sensible fallback emoji based on the hour.
function timeGreeting(h) {
  if (h < 12) return { word: 'Good morning', emoji: '☀️' };
  if (h < 18) return { word: 'Good afternoon', emoji: '☕' };
  return { word: 'Good evening', emoji: '🌙' };
}

export default function Greeting({ user }) {
  const initial = (user?.name || user?.email || '👤').trim()[0]?.toUpperCase();
  const weather = useWeather();

  // Re-render every minute so the greeting word flips at noon/6pm without
  // needing the screen to remount.
  const [hour, setHour] = useState(new Date().getHours());
  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const { word, emoji: fallbackEmoji } = timeGreeting(hour);
  // Prefer the real weather emoji; fall back to the time-of-day one.
  const emoji = weather?.emoji || fallbackEmoji;
  const temp = weather?.tempC != null ? `  ${weather.tempC}°` : '';

  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.kicker}>{word} {emoji}{temp}</Text>
        <Text style={styles.title}>What'll it be?</Text>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial || '👤'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  kicker: { color: colors.creamMuted, fontSize: 13, fontWeight: '300' },
  title: { color: '#f5ede0', fontSize: 22, fontWeight: '700', marginTop: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, color: colors.cream, fontWeight: '700' },
});
