import React from 'react';
import { Layers } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Layers,
  title = "No Data Found",
  description = "No evaluation records are currently available.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-xs font-medium px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
