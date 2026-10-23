import React from 'react';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default', // 'emerald', 'rose', 'amber', 'blue', 'default'
  badge,
}) {
  const colorMap = {
    emerald: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/5',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      valColor: 'text-emerald-400',
    },
    rose: {
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/5',
      iconBg: 'bg-rose-500/10 text-rose-400',
      valColor: 'text-rose-400',
    },
    amber: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/5',
      iconBg: 'bg-amber-500/10 text-amber-400',
      valColor: 'text-amber-400',
    },
    blue: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5',
      iconBg: 'bg-blue-500/10 text-blue-400',
      valColor: 'text-blue-400',
    },
    default: {
      border: 'border-slate-800',
      bg: 'bg-slate-900/40',
      iconBg: 'bg-slate-800 text-slate-300',
      valColor: 'text-white',
    },
  };

  const scheme = colorMap[variant] || colorMap.default;

  return (
    <div className={`p-5 rounded-2xl border backdrop-blur-sm ${scheme.border} ${scheme.bg} flex flex-col justify-between transition-all hover:border-slate-700`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-xl ${scheme.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <div className={`text-2xl font-bold tracking-tight ${scheme.valColor}`}>
          {value}
        </div>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
