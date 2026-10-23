import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { getEvaluationHistory } from '../../services/evaluationService';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';

export default function EvaluationHistory({ onSelectReport }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getEvaluationHistory();
      setHistoryList(data);
    } catch (err) {
      console.error('Failed to load evaluation history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = historyList.filter((item) => {
    const q = (item.query || '').toLowerCase();
    const r = (item.responseText || '').toLowerCase();
    const s = searchTerm.toLowerCase();
    return q.includes(s) || r.includes(s) || item.id.includes(s);
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* History Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            Evaluation Audit Trail
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit history of past evaluation runs, claim distributions, and reliability metrics.
          </p>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search evaluations by prompt or text..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-emerald-500/60 transition"
          />
        </div>
      </div>

      {/* History List Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
          Loading past evaluation records...
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((item) => {
            const ri = item.metrics?.reliabilityIndex ?? 0;
            const riColor = ri >= 80 ? 'text-emerald-400' : ri >= 50 ? 'text-amber-400' : 'text-rose-400';

            return (
              <div
                key={item.id}
                onClick={() => onSelectReport(item)}
                className="p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 min-w-0 max-w-2xl">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {item.id}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    {item.isMock && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Synthetic Benchmark
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white transition line-clamp-1">
                    {item.query || "Ad-hoc Text Submission"}
                  </h4>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    "{item.responseText}"
                  </p>
                </div>

                <div className="flex items-center gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 justify-between sm:justify-end">
                  {/* Reliability Score */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Reliability Index
                    </span>
                    <span className={`text-lg font-bold font-mono ${riColor}`}>
                      {ri.toFixed(1)}%
                    </span>
                  </div>

                  {/* Claim counts mini badge */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20" title="Supported">
                      {item.metrics?.supportedClaims ?? 0} S
                    </span>
                    <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20" title="Contradicted">
                      {item.metrics?.contradictedClaims ?? 0} C
                    </span>
                    <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20" title="Unverified">
                      {item.metrics?.unverifiedClaims ?? 0} U
                    </span>
                  </div>

                  <button className="p-2 rounded-xl bg-slate-800 group-hover:bg-emerald-600 text-slate-400 group-hover:text-white transition">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={History}
          title="No Past Evaluations Found"
          description="Submit an evaluation using the input workbench or select a benchmark preset to generate report history."
          actionLabel="Open Evaluation Workbench"
          onAction={() => onSelectReport(null)}
        />
      )}
    </div>
  );
}
