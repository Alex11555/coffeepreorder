// Holds the current user + JWT and exposes signIn / signUp / signOut.
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setItem, getItem, deleteItem } from '../utils/storage';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

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
        }
      } catch {
        // token expired / invalid — clear it
        await deleteItem('authToken');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { token, user: u } = await authApi.signIn(email, password);
    await setItem('authToken', token);
    setUser(u);
    return u;
  }, []);

  const signUp = useCallback(async (email, password, name) => {
    const { token, user: u } = await authApi.signUp(email, password, name);
    await setItem('authToken', token);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    await deleteItem('authToken');
    setUser(null);
  }, []);

  const value = { user, loading, signIn, signUp, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
