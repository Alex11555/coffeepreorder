// Sign-in screen, dark-themed to match the rest of the app.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme/colors';

export default function SignInScreen({ navigation }) {
  const { signIn } = useAuth();
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
    try {
      setSubmitting(true);
      await signIn(email.trim().toLowerCase(), password);
    } catch (e) {
      setError(e.message || 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer keyboard contentStyle={styles.content}>
      <View style={styles.brand}>
        <Text style={styles.logo}>☕</Text>
        <Text style={styles.brandName}>Brew</Text>
        <Text style={styles.brandTagline}>Pre-order, skip the line.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to start your order.</Text>

        <View style={{ height: spacing.lg }} />

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
          autoComplete="password"
          placeholder="••••••••"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ height: spacing.lg }} />
        <Button title="Sign in" onPress={onSubmit} loading={submitting} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to Brew?</Text>
          <Pressable onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.footerLink}>Create an account</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  brand: { alignItems: 'center', marginBottom: spacing.lg },
  logo: { fontSize: 56 },
  brandName: { fontSize: 28, fontWeight: '800', color: '#fdf8f2', letterSpacing: 1, marginTop: 4 },
  brandTagline: { color: colors.creamMuted, fontSize: 13, marginTop: 4 },
  form: { gap: 0 },
  title: { fontSize: 22, fontWeight: '700', color: '#fdf8f2' },
  subtitle: { fontSize: 13, color: colors.creamMuted, marginTop: 4 },
  error: { color: colors.danger, textAlign: 'center', marginTop: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  footerText: { color: colors.creamMuted },
  footerLink: { color: colors.accentLight, fontWeight: '700' },
});
