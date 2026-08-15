import React from 'react';
import { Clock } from 'lucide-react';

export default function FreshnessBadge({ freshness, size = 'sm' }) {
  if (!freshness?.label) return null;

  const isToday = freshness.days_since_harvest === 0;
  const isYesterday = freshness.days_since_harvest === 1;

  return (
    <span
      className={`freshness-badge freshness-badge--${size} ${isToday ? 'freshness-badge--today' : ''} ${isYesterday ? 'freshness-badge--recent' : ''}`}
      title={freshness.notes || freshness.label}
    >
      <Clock size={size === 'lg' ? 14 : 12} />
      <span>{freshness.label}</span>
    </span>
  );
}
