// "Active order" context.
//
// The new design is single-item per checkout (tap drink → customize → pay),
// so we don't need a multi-item cart. What we DO need is to remember the
// currently-active order id + raw QR token so the "My QR" tab can show it.
//
// We intentionally keep the legacy filename + hook name to minimize churn
// across the screens that import it.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { setItem, getItem, deleteItem } from '../utils/storage';

const CartContext = createContext(null);

const ACTIVE_ID_KEY = 'activeOrderId';
// SecureStore only allows alphanumerics + `.` `-` `_`, so no colons.
const qrKey = (id) => `qr_${id}`;

export function CartProvider({ children }) {
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeQrToken, setActiveQrToken] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore on boot.
  useEffect(() => {
    (async () => {
      const id = await getItem(ACTIVE_ID_KEY);
      if (id) {
        const token = await getItem(qrKey(id));
        setActiveOrderId(id);
        setActiveQrToken(token);
      }
      setHydrated(true);
    })();
  }, []);

  const setActive = useCallback(async (orderId, qrToken) => {
    await setItem(ACTIVE_ID_KEY, orderId);
    if (qrToken) await setItem(qrKey(orderId), qrToken);
    setActiveOrderId(orderId);
    setActiveQrToken(qrToken);
  }, []);

  const clearActive = useCallback(async () => {
    if (activeOrderId) await deleteItem(qrKey(activeOrderId));
    await deleteItem(ACTIVE_ID_KEY);
    setActiveOrderId(null);
    setActiveQrToken(null);
  }, [activeOrderId]);

  const value = { activeOrderId, activeQrToken, hydrated, setActive, clearActive };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
