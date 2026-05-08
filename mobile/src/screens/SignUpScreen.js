// Create-account screen, dark-themed.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme/colors';

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit() {
    setError('');
    if (!email || !password) {
      setError('Email and password required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    try {
      setSubmitting(true);
      await signUp(email.trim().toLowerCase(), password, name.trim() || undefined);
    } catch (e) {
      setError(e.message || 'Sign up failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer keyboard contentStyle={styles.content}>
      <View style={styles.brand}>
        <Text style={styles.logo}>☕</Text>
        <Text style={styles.brandName}>Brew</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Order ahead, skip the line.</Text>

        <View style={{ height: spacing.lg }} />

        <Input label="Name (optional)" value={name} onChangeText={setName} placeholder="Alex" />
        <View style={{ height: spacing.md }} />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <View style={{ height: spacing.md }} />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ height: spacing.lg }} />
        <Button title="Create account" onPress={onSubmit} loading={submitting} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { fontSize: 56 },
  brandName: { fontSize: 28, fontWeight: '800', color: '#fdf8f2', letterSpacing: 1, marginTop: 4 },
  form: { gap: 0 },
  title: { fontSize: 22, fontWeight: '700', color: '#fdf8f2' },
  subtitle: { fontSize: 13, color: colors.creamMuted, marginTop: 4 },
  error: { color: colors.danger, textAlign: 'center', marginTop: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  footerText: { color: colors.creamMuted },
  footerLink: { color: colors.accentLight, fontWeight: '700' },
});
