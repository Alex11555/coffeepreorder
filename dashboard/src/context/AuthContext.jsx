// Auth context — stores the JWT in localStorage and exposes the staff user.
//
// On boot, if a token is present we hit /api/auth/me to (a) check it's still
// valid and (b) make sure the user has role=STAFF. Anything else is treated
// as logged-out.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { signIn as apiSignIn, fetchMe } from '../api/auth.js';

const AuthContext = createContext(null);

const TOKEN_KEY = 'authToken';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) { setHydrating(false); return; }
      try {
        const me = await fetchMe();
        if (me.role !== 'STAFF') {
          localStorage.removeItem(TOKEN_KEY);
        } else {
          setUser(me);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setHydrating(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { token, user: u } = await apiSignIn(email, password);
    if (u.role !== 'STAFF') {
      throw new Error('This account is not a staff account.');
    }
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, hydrating, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
