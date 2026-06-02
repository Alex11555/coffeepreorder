// Profile — current user + sign out, dark-theme styled.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Button from '../components/Button';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { colors, spacing } from '../theme/colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { clearActive } = useCart();

  async function onSignOut() {
    await clearActive();
    await signOut();
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.kicker}>Account</Text>
        <Text style={styles.title}>Your profile</Text>
      </View>

      {user?.loyalty ? (
        <Card style={[styles.card, styles.loyaltyCard]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.loyaltyTier}>
              {user.loyalty.tier?.emoji} {user.loyalty.tier?.name} member
            </Text>
            <Text style={styles.loyaltySub}>{user.loyalty.lifetimePoints} lifetime points</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.loyaltyBalance}>{user.loyalty.points}</Text>
            <Text style={styles.loyaltySub}>points</Text>
          </View>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Field label="Name"  value={user?.name || '—'} />
        <Field label="Email" value={user?.email} />
        <Field label="Role"  value={user?.role} />
      </Card>

      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
        <Button title="Sign out" variant="secondary" onPress={onSignOut} />
      </View>
    </ScreenContainer>
  );
}

function Field({ label, value }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  kicker: { color: colors.creamFaint, fontSize: 13 },
  title: { color: '#fdf8f2', fontSize: 22, fontWeight: '700', marginTop: 4 },
  card: { marginHorizontal: spacing.lg, gap: 4 },
  loyaltyCard: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: 'rgba(212,128,42,0.3)',
    backgroundColor: 'rgba(212,128,42,0.08)',
  },
  loyaltyTier: { color: colors.text, fontSize: 16, fontWeight: '700' },
  loyaltyBalance: { color: colors.accentLight, fontSize: 24, fontWeight: '900' },
  loyaltySub: { color: colors.creamMuted, fontSize: 12, marginTop: 2 },
  label: { color: colors.creamMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 4 },
});
