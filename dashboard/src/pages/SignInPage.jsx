// Staff sign-in. Backend rejects non-staff accounts; we also gate locally.
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email and password required.');
      return;
    }
    try {
      setSubmitting(true);
      await signIn(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={S.wrap}>
      <form style={S.card} onSubmit={onSubmit}>
        <div style={S.brand}>
          <div style={S.logo}>☕</div>
          <div>
            <div style={S.brandName}>Brew · Barista</div>
            <div style={S.tagline}>Live order dashboard</div>
          </div>
        </div>

        <h1 style={S.title}>Welcome back</h1>
        <p style={S.subtitle}>Sign in with your staff credentials.</p>

        <label style={S.label}>Email</label>
        <input
          style={S.input}
          type="email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="barista@coffee.app"
        />

        <label style={S.label}>Password</label>
        <input
          style={S.input}
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {error ? <div style={S.error}>{error}</div> : null}

        <button style={S.cta} type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={S.hint}>
          Default seeded staff: <code>barista@coffee.app</code> / <code>barista1234</code>
        </div>
      </form>
    </div>
  );
}

const S = {
  wrap: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
    background: 'radial-gradient(circle at 20% 0%, rgba(212,128,42,0.18), transparent 50%), var(--bg)',
  },
  card: {
    width: '100%', maxWidth: 420,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 18,
    padding: 28,
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 },
  logo: {
    width: 48, height: 48, borderRadius: 12,
    background: 'linear-gradient(135deg,#4a2010,#6b3520)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24,
  },
  brandName: { fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 700, color: '#fdf8f2' },
  tagline: { fontSize: 12, color: 'var(--cream-muted)', marginTop: 2 },
  title: { fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, margin: '4px 0 0' },
  subtitle: { color: 'var(--cream-muted)', fontSize: 13, marginTop: 0, marginBottom: 16 },
  label: {
    fontSize: 11, fontWeight: 700, color: 'var(--cream-muted)',
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8,
  },
  input: {
    background: 'var(--bg)',
    color: 'var(--text)',
    border: '1px solid var(--border-strong)',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 14,
    outline: 'none',
  },
  cta: {
    marginTop: 16,
    background: 'linear-gradient(135deg,#d4802a,#f0a940)',
    color: '#1a0a04',
    border: 'none',
    borderRadius: 12,
    padding: 14,
    fontWeight: 700,
    fontSize: 14,
  },
  error: {
    color: 'var(--danger)', fontSize: 12, marginTop: 8,
    textAlign: 'center',
  },
  hint: {
    color: 'var(--cream-faint)',
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
  },
};
