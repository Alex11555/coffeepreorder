// Primary CTA — gradient amber pill with optional subtitle, plus a quieter
// secondary variant for back/cancel actions.
import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../theme/colors';

export default function Button({
  title,
  subtitle,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost'
  loading = false,
  disabled = false,
  style,
}) {
  const isDisabled = disabled || loading;
  const Inner = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textInverse : colors.cream} />
      ) : (
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.title, variant === 'primary' ? styles.titleOnAccent : styles.titleOnSurface]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, variant === 'primary' ? styles.subOnAccent : styles.subOnSurface]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        style={({ pressed }) => [styles.shell, isDisabled && styles.disabled, pressed && styles.pressed, style]}
      >
        <LinearGradient
          colors={[colors.accent, colors.accentLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryFill}
        >
          {Inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.shell,
        styles.secondary,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {Inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.md,
    overflow: 'hidden',
    width: '100%',
  },
  primaryFill: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: 'rgba(232,201,154,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
  title: { fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  titleOnAccent: { color: colors.textInverse },
  titleOnSurface: { color: colors.cream },
  subtitle: { fontSize: 11, marginTop: 2, opacity: 0.75 },
  subOnAccent: { color: colors.textInverse },
  subOnSurface: { color: colors.cream },
});
