// One order card on the dashboard.
//
// For active orders (PAID/PREPARING/READY): shows the state-machine action
// button(s) — "Start Preparing" / "Mark Ready" / "Cancel".
// For finalised orders (PICKED_UP): renders a compact card with just a
// trash icon in the header so the barista can clear it from the board.
import React, { useState } from 'react';

import StatusBadge from './StatusBadge.jsx';
import { formatPrice, shortId, timeAgo } from '../utils/format.js';

const NEXT = {
  PAID:      { label: 'Start Preparing', target: 'PREPARING', tone: 'warn' },
  PREPARING: { label: 'Mark Ready',      target: 'READY',     tone: 'go' },
  READY:     { label: 'Awaiting pickup', target: null,        tone: 'idle' },
};

export default function OrderCard({ order, onStatusChange, onDelete }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const action = NEXT[order.status];
  const isPickedUp = order.status === 'PICKED_UP';

  async function bump(target) {
    if (!target || busy) return;
    setBusy(true);
    setError('');
    try {
      await onStatusChange(order.id, target);
    } catch (e) {
      setError(e.message || 'Failed to update');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (busy) return;
    if (!onDelete) return;
    if (!confirm('Delete this order from the board?')) return;
    setBusy(true);
    setError('');
    try {
      await onDelete(order.id);
    } catch (e) {
      setError(e.message || 'Failed to delete');
      setBusy(false);
    }
    // No need to reset busy on success — card disappears from view.
  }

  return (
    <article style={{ ...S.card, ...(isPickedUp ? S.cardDim : null) }}>
      <header style={S.header}>
        <div>
          <div style={S.id}>{shortId(order.id)}</div>
          <div style={S.age}>{timeAgo(order.createdAt)}</div>
        </div>
        <div style={S.headerRight}>
          <StatusBadge status={order.status} />
          {isPickedUp && onDelete ? (
            <button
              style={S.iconBtn}
              onClick={handleDelete}
              disabled={busy}
              title="Delete this order"
              aria-label="Delete this order"
            >
              ✕
            </button>
          ) : null}
        </div>
      </header>

      <div style={S.body}>
        {order.items.map((it) => (
          <div key={it.id} style={S.itemRow}>
            <span style={S.qty}>{it.quantity}×</span>
            <span style={S.itemEmoji}>{it.product?.emoji || '☕'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.itemName}>{it.product?.name || 'Item'}</div>
              {it.notes ? <div style={S.itemNotes}>{it.notes}</div> : null}
            </div>
            <span style={S.itemPrice}>{formatPrice(it.priceCents * it.quantity)}</span>
          </div>
        ))}
      </div>

      <footer style={S.footer}>
        <div style={S.meta}>
          <div style={S.metaRow}>
            <span style={S.metaLabel}>Customer</span>
            <span style={S.metaValue}>{order.user?.name || order.user?.email || '—'}</span>
          </div>
          <div style={S.metaRow}>
            <span style={S.metaLabel}>Locker</span>
            <span style={S.metaValue}>#{order.locker?.number} · {order.locker?.location}</span>
          </div>
          <div style={S.metaRow}>
            <span style={S.metaLabel}>Total</span>
            <span style={S.metaValue}>{formatPrice(order.totalCents)}</span>
          </div>
        </div>

        {!isPickedUp ? (
          <div style={S.actionRow}>
            {action?.target ? (
              <button
                style={{ ...S.actionBtn, ...(action.tone === 'go' ? S.actionGo : S.actionWarn) }}
                onClick={() => bump(action.target)}
                disabled={busy}
              >
                {busy ? 'Updating…' : action.label}
              </button>
            ) : (
              <div style={S.actionIdle}>{action?.label || ''}</div>
            )}
            {order.status !== 'READY' ? (
              <button
                style={S.cancelBtn}
                onClick={() => {
                  if (confirm('Cancel this order? This refunds the locker.')) bump('CANCELLED');
                }}
                disabled={busy}
              >
                Cancel
              </button>
            ) : null}
          </div>
        ) : null}

        {error ? <div style={S.error}>{error}</div> : null}
      </footer>
    </article>
  );
}

const S = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  cardDim: { opacity: 0.85 },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '14px 16px',
    borderBottom: '1px solid var(--border)',
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  id: { fontWeight: 700, fontSize: 13, letterSpacing: 2, color: 'var(--accent-light)' },
  age: { fontSize: 11, color: 'var(--cream-faint)', marginTop: 2 },
  iconBtn: {
    background: 'transparent',
    color: 'var(--cream-muted)',
    border: '1px solid var(--border-strong)',
    width: 26, height: 26,
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  itemRow: { display: 'flex', alignItems: 'center', gap: 10 },
  qty: {
    minWidth: 28,
    background: 'var(--surface-alt)',
    color: 'var(--cream)',
    fontSize: 12, fontWeight: 700,
    textAlign: 'center',
    padding: '4px 6px',
    borderRadius: 6,
  },
  itemEmoji: { fontSize: 22 },
  itemName: { color: 'var(--text)', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemNotes: { color: 'var(--cream-muted)', fontSize: 11, marginTop: 2 },
  itemPrice: { color: 'var(--cream)', fontSize: 13, fontWeight: 600 },
  footer: { padding: 14, borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)' },
  meta: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 },
  metaRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12 },
  metaLabel: { color: 'var(--cream-muted)' },
  metaValue: { color: 'var(--text)', fontWeight: 600 },
  actionRow: { display: 'flex', gap: 8 },
  actionBtn: {
    flex: 1,
    border: 'none',
    borderRadius: 10,
    padding: '12px 14px',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  actionWarn: { background: 'linear-gradient(135deg,#d4802a,#f0a940)', color: '#1a0a04' },
  actionGo:   { background: 'linear-gradient(135deg,#3a9e68,#4caf7d)', color: 'white' },
  actionIdle: {
    flex: 1, background: 'var(--cream-ghost)', color: 'var(--cream-muted)',
    padding: '12px 14px', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 600,
  },
  cancelBtn: {
    background: 'transparent', color: 'var(--cream-muted)',
    border: '1px solid var(--border-strong)',
    padding: '0 14px', borderRadius: 10, fontSize: 12,
  },
  error: { color: 'var(--danger)', fontSize: 12, marginTop: 8 },
};
