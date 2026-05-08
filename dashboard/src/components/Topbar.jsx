// Persistent top bar with brand mark, live indicator, and sign-out.
import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar({ live }) {
  const { user, signOut } = useAuth();
  return (
    <header style={S.bar}>
      <div style={S.brand}>
        <span style={S.logo}>☕</span>
        <div>
          <div style={S.name}>Brew · Barista</div>
          <div style={S.tagline}>Live order dashboard</div>
        </div>
      </div>
      <div style={S.right}>
        <div style={S.liveBox}>
          <span className={`dot ${live ? 'live' : ''}`} />
          <span style={S.liveText}>{live ? 'Connected' : 'Offline'}</span>
        </div>
        {user ? (
          <div style={S.user}>
            <div style={S.userName}>{user.name || user.email}</div>
            <button style={S.signOut} onClick={signOut}>Sign out</button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

const S = {
  bar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 28px',
    background: 'rgba(26,10,4,0.85)',
    borderBottom: '1px solid var(--border)',
    backdropFilter: 'blur(10px)',
    position: 'sticky', top: 0, zIndex: 5,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 14 },
  logo: { fontSize: 28 },
  name: { fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 700, color: '#fdf8f2', letterSpacing: 0.4 },
  tagline: { fontSize: 11, color: 'var(--cream-muted)' },
  right: { display: 'flex', gap: 18, alignItems: 'center' },
  liveBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 12px',
    background: 'var(--surface)',
    borderRadius: 999,
    border: '1px solid var(--border)',
  },
  liveText: { fontSize: 11, color: 'var(--cream-muted)', letterSpacing: 0.4, textTransform: 'uppercase' },
  user: { display: 'flex', alignItems: 'center', gap: 12 },
  userName: { fontSize: 13, color: 'var(--cream)' },
  signOut: {
    background: 'transparent', color: 'var(--cream-muted)', border: '1px solid var(--border-strong)',
    padding: '6px 12px', borderRadius: 8, fontSize: 12,
  },
};
