import React from 'react';
import { ShieldCheck, Activity, HelpCircle } from 'lucide-react';

export default function Header({ activeTab, onOpenDocs, backendHealthy }) {
  const titles = {
    overview: {
      title: 'Platform Overview & Methodology',
      subtitle: 'Theoretical framework, mathematical metrics, and architectural data flow.',
    },
    evaluate: {
      title: 'Response Evaluation Workbench',
      subtitle: 'Submit an AI response for claim decomposition and evidence-grounded verification.',
    },
    results: {
      title: 'Reliability & Hallucination Audit Report',
      subtitle: 'Claim-level verification breakdown, NLI confidence, and evidence citations.',
    },
    history: {
      title: 'Audit Trail & Evaluation History',
      subtitle: 'Browse and inspect past reliability evaluations and claim assessments.',
    },
    architecture: {
      title: 'Cluster Topology & Service Health',
      subtitle: 'Real-time telemetry and API contracts across React, Express, and FastAPI.',
    },
  };

  const current = titles[activeTab] || titles.overview;

  return (
    <header className="px-8 py-5 border-b border-slate-800 bg-slate-950/60 backdrop-blur sticky top-0 z-30 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          {current.title}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {current.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend health indicator badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${backendHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${backendHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="text-slate-400 text-[11px]">
            API Backend: <strong className={backendHealthy ? 'text-emerald-400' : 'text-amber-400'}>{backendHealthy ? 'Connected' : 'Offline'}</strong>
          </span>
        </div>

        {/* Documentation Link */}
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>FastAPI Docs</span>
        </a>
      </div>
    </header>
  );
}
