import React from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

export default function StatusBadge({ status, size = 'md', showIcon = true }) {
  const normalized = (status || '').toLowerCase();

  const configs = {
    supported: {
      label: 'Supported',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
      icon: CheckCircle2,
      aria: 'Factually Supported claim with corroborating evidence',
    },
    contradicted: {
      label: 'Contradicted',
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400',
      icon: XCircle,
      aria: 'Factually Contradicted claim refuting the generation',
    },
    unverified: {
      label: 'Unverified',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400',
      icon: HelpCircle,
      aria: 'Unverified claim due to insufficient or missing evidence',
    },
  };

  const current = configs[normalized] || {
    label: status || 'Unknown',
    bg: 'bg-slate-700/30 text-slate-400 border-slate-600/30',
    dot: 'bg-slate-400',
    icon: HelpCircle,
    aria: 'Status unknown',
  };

  const IconComponent = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      role="status"
      aria-label={current.aria}
      className={`inline-flex items-center font-medium rounded-full border transition-all ${current.bg} ${sizeClasses[size]}`}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      {current.label}
    </span>
  );
}
