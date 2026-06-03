// Holds the current user + JWT and exposes signIn / signUp / signOut.
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setItem, getItem, deleteItem } from '../utils/storage';
import * as authApi from '../api/auth';
import { registerForPush } from '../utils/push';

const AuthContext = createContext(null);

// Ask for permission, get the Expo token, and send it to the server.
// Best-effort — never blocks login if it fails (e.g. Expo Go / no permission).
async function syncPushToken() {
  try {
    const token = await registerForPush();
    if (token) await authApi.registerPushToken(token);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On boot: try to restore session.
  useEffect(() => {
    (async () => {
      try {
        const token = await getItem('authToken');
        if (token) {
          const me = await authApi.fetchMe();
          setUser(me);
          syncPushToken();
        }
      } catch {
        // token expired / invalid — clear it
        await deleteItem('authToken');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Pull fresh user (incl. loyalty points/tier) from /me.
  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.fetchMe();
      setUser(me);
      return me;
    } catch {
      return null;
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { token } = await authApi.signIn(email, password);
    await setItem('authToken', token);
    // /me includes loyalty; signin response doesn't.
    const me = await authApi.fetchMe();
    setUser(me);
    syncPushToken();
    return me;
  }, []);

  const signUp = useCallback(async (email, password, name) => {
    const { token } = await authApi.signUp(email, password, name);
    await setItem('authToken', token);
    const me = await authApi.fetchMe();
    setUser(me);
    syncPushToken();
    return me;
  }, []);

  const signOut = useCallback(async () => {
    // Clear the token server-side so a signed-out device stops getting pushes.
    try { await authApi.registerPushToken(null); } catch {}
    await deleteItem('authToken');
    setUser(null);
  }, []);

  const value = { user, loading, signIn, signUp, signOut, refreshUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
