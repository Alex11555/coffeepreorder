// Cart + active-order context.
//
// Two responsibilities:
//   1. CART — a list of line items (different drinks, each with its own
//      size/milk/extras/quantity). Lets the customer order several coffees in
//      ONE order. Persisted to storage so it survives app restarts.
//   2. ACTIVE ORDER — after checkout, remembers the active order id + QR token
//      so the "My QR" tab can show it.
//
// We keep the legacy hook name `useCart` so existing imports don't break.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setItem, getItem, deleteItem } from '../utils/storage';

const CartContext = createContext(null);

const ACTIVE_ID_KEY = 'activeOrderId';
const CART_KEY = 'cartItems';
// SecureStore only allows alphanumerics + `.` `-` `_`, so no colons.
const qrKey = (id) => `qr_${id}`;

// A stable id for a cart line (so two identical drinks can coexist or merge).
let lineSeq = 0;
const newLineId = () => `${Date.now()}_${lineSeq++}`;

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ lineId, product, qty, size, milk, extras, notes, unitCents }]
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeQrToken, setActiveQrToken] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore on boot.
  useEffect(() => {
    (async () => {
      try {
        const rawCart = await getItem(CART_KEY);
        if (rawCart) setItems(JSON.parse(rawCart));
      } catch {}
      const id = await getItem(ACTIVE_ID_KEY);
      if (id) {
        const token = await getItem(qrKey(id));
        setActiveOrderId(id);
        setActiveQrToken(token);
      }
      setHydrated(true);
    })();
  }, []);

  // Persist cart whenever it changes (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    setItem(CART_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, hydrated]);

  // Add a configured drink to the cart. If an identical line (same product +
  // same options) exists, just bump its quantity.
  const addItem = useCallback((line) => {
    setItems((prev) => {
      const match = prev.find(
        (it) =>
          it.product.id === line.product.id &&
          it.size === line.size &&
          it.milk === line.milk &&
          JSON.stringify(it.extras) === JSON.stringify(line.extras)
      );
      if (match) {
        return prev.map((it) =>
          it.lineId === match.lineId ? { ...it, qty: it.qty + line.qty } : it
        );
      }
      return [...prev, { ...line, lineId: newLineId() }];
    });
  }, []);

  const updateQty = useCallback((lineId, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((it) => it.lineId !== lineId)
        : prev.map((it) => (it.lineId === lineId ? { ...it, qty } : it))
    );
  }, []);

  const removeItem = useCallback((lineId) => {
    setItems((prev) => prev.filter((it) => it.lineId !== lineId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotalCents = useMemo(
    () => items.reduce((sum, it) => sum + it.unitCents * it.qty, 0),
    [items]
  );
  const itemCount = useMemo(
    () => items.reduce((sum, it) => sum + it.qty, 0),
    [items]
  );

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

  const value = {
    // cart
    items, addItem, updateQty, removeItem, clearCart,
    subtotalCents, itemCount,
    // active order
    activeOrderId, activeQrToken, hydrated, setActive, clearActive,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
