// Status pill matching the customer-app styling.
import React from 'react';

const STYLES = {
  PAID:      { bg: 'rgba(212,128,42,0.2)', fg: '#d4802a', label: 'New' },
  PREPARING: { bg: 'rgba(212,128,42,0.2)', fg: '#d4802a', label: 'Preparing' },
  READY:     { bg: 'rgba(76,175,125,0.2)', fg: '#4caf7d', label: 'Ready' },
  PICKED_UP: { bg: 'rgba(232,201,154,0.1)', fg: 'rgba(232,201,154,0.6)', label: 'Picked up' },
  CANCELLED: { bg: 'rgba(224,82,82,0.2)', fg: '#e05252', label: 'Cancelled' },
};

export default function StatusBadge({ status }) {
  const s = STYLES[status] || { bg: 'rgba(232,201,154,0.1)', fg: 'rgba(232,201,154,0.6)', label: status };
  return (
    <span style={{
      background: s.bg,
      color: s.fg,
      padding: '4px 12px',
      borderRadius: 999,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    }}>
      {s.label}
    </span>
  );
}
