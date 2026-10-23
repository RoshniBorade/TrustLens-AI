import React, { useState } from 'react';
import { ExternalLink, Filter, Search, Eye } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function ClaimsTable({ claims = [], onInspectClaim }) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClaims = claims.filter((claim) => {
    const matchesFilter = filter === 'all' || claim.status === filter;
    const matchesSearch = 
      claim.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (claim.explanation || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: claims.length,
    supported: claims.filter((c) => c.status === 'supported').length,
    contradicted: claims.filter((c) => c.status === 'contradicted').length,
    unverified: claims.filter((c) => c.status === 'unverified').length,
  };

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden space-y-4 p-6">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Claim-Level Verification Breakdown
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click 'Inspect' on any claim to view the exact retrieved premise and NLI softmax scores.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Claims', count: counts.all },
            { id: 'supported', label: 'Supported', count: counts.supported, color: 'text-emerald-400' },
            { id: 'contradicted', label: 'Contradicted', count: counts.contradicted, color: 'text-rose-400' },
            { id: 'unverified', label: 'Unverified', count: counts.unverified, color: 'text-amber-400' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 ${tab.color || 'text-slate-300'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4 min-w-[260px]">Atomic Factual Claim</th>
              <th className="py-3 px-4 w-32">Verdict</th>
              <th className="py-3 px-4 w-28">NLI Conf.</th>
              <th className="py-3 px-4 min-w-[240px]">Retrieved Evidence Snippet</th>
              <th className="py-3 px-4 w-24 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredClaims.length > 0 ? (
              filteredClaims.map((claim, idx) => (
                <tr
                  key={claim.id || idx}
                  className="hover:bg-slate-800/40 transition group"
                >
                  <td className="py-3.5 px-4 text-center text-slate-500 font-mono">
                    {idx + 1}
                  </td>

                  <td className="py-3.5 px-4 text-slate-200 font-medium leading-relaxed">
                    {claim.text}
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={claim.status} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {Math.round(claim.confidence * 100)}%
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 leading-relaxed">
                    {claim.evidence ? (
                      <div className="space-y-1">
                        <p className="line-clamp-2 text-slate-300 italic">
                          "{claim.evidence.text}"
                        </p>
                        <span className="text-[10px] text-emerald-400/90 font-medium flex items-center gap-1">
                          Source: {claim.evidence.sourceTitle}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">
                        No matching premise found
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onInspectClaim(claim)}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    >
                      <Eye className="w-3 h-3 text-emerald-400" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No claims matched the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
