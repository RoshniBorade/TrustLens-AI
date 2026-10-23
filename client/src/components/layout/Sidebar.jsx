import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  History, 
  Cpu, 
  BookOpen, 
  ChevronRight,
  FlaskConical
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, hasCurrentResults }) {
  const navItems = [
    {
      id: 'overview',
      label: 'Project Overview',
      subtitle: 'Objectives & Formulas',
      icon: BookOpen,
    },
    {
      id: 'evaluate',
      label: 'Evaluate Response',
      subtitle: 'Input Workbench',
      icon: Sparkles,
    },
    {
      id: 'results',
      label: 'Reliability Report',
      subtitle: 'Claims & Analytics',
      icon: FileText,
      disabled: !hasCurrentResults,
      badge: hasCurrentResults ? 'Active' : null,
    },
    {
      id: 'history',
      label: 'Evaluation History',
      subtitle: 'Audit Logs & Runs',
      icon: History,
    },
    {
      id: 'architecture',
      label: 'Cluster Health',
      subtitle: 'Services & APIs',
      icon: Cpu,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">TrustLens</span>
              <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">BTech AI-DS Project</p>
          </div>
        </div>

        {/* Mock Mode Academic Banner */}
        <div className="mt-5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="text-[11px]">
            <span className="font-semibold text-amber-300 block">UI Mock Mode</span>
            <span className="text-amber-200/70 text-[10px] leading-tight block">
              Pre-calibrated UI fixtures active
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isDisabled = item.disabled;

            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && onSelectTab(item.id)}
                disabled={isDisabled}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-emerald-600/15 text-emerald-300 border border-emerald-500/30 font-medium shadow-sm'
                    : isDisabled
                    ? 'text-slate-600 cursor-not-allowed opacity-50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div className="truncate">
                    <span className="text-xs block leading-tight">{item.label}</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">{item.subtitle}</span>
                  </div>
                </div>

                {item.badge ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 mx-4 mb-4 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-300">Academic Demonstration</p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Hallucination Detection via NLI Premise Verification
        </p>
      </div>
    </aside>
  );
}
