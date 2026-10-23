import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Calendar, 
  Brain, 
  ExternalLink, 
  FlaskConical, 
  ArrowLeft,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import SummaryCards from './SummaryCards';
import VisualCharts from './VisualCharts';
import ClaimsTable from './ClaimsTable';
import ClaimDetailModal from './ClaimDetailModal';
import EmptyState from '../common/EmptyState';

export default function ResultsReport({ report, onNewEvaluation }) {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!report) {
    return (
      <EmptyState
        icon={FileText}
        title="No Active Evaluation Report"
        description="Submit an AI response from the workbench or select an item from Evaluation History to view results."
        actionLabel="Go to Evaluation Workbench"
        onAction={onNewEvaluation}
      />
    );
  }

  const handleCopySummary = () => {
    const text = `TrustLens-AI Reliability Report
ID: ${report.id}
Reliability Index: ${report.metrics?.reliabilityIndex?.toFixed(1)}%
Supported: ${report.metrics?.supportedClaims}
Contradicted: ${report.metrics?.contradictedClaims}
Unverified: ${report.metrics?.unverifiedClaims}
Tested Prompt: ${report.query}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in duration-200">
      {/* Top Banner: Synthetic Mock Notice */}
      {report.isMock && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Academic Demonstration Notice:</strong> This audit report is generated using pre-calibrated synthetic test fixtures for UI development and verification.
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
            Synthetic Mock
          </span>
        </div>
      )}

      {/* Report Context Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-medium">
              Run: {report.id}
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {new Date(report.timestamp).toLocaleString()}
            </span>
            {report.modelName && (
              <span className="text-slate-400 font-mono text-[11px]">
                Target: {report.modelName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={onNewEvaluation}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Evaluation</span>
            </button>
          </div>
        </div>

        {/* Query & Evaluated Response Accordion */}
        <div className="space-y-3">
          {report.query && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Submitted Prompt:
              </span>
              <p className="text-xs font-medium text-slate-200">
                {report.query}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Evaluated AI Response Text:
            </span>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed italic">
              "{report.responseText}"
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards metrics={report.metrics} />

      {/* Visual Analytics with Recharts */}
      <VisualCharts metrics={report.metrics} claims={report.claims} />

      {/* Claims Breakdown Table */}
      <ClaimsTable
        claims={report.claims}
        onInspectClaim={(claim) => setSelectedClaim(claim)}
      />

      {/* Detailed Claim Evidence Modal */}
      <ClaimDetailModal
        isOpen={!!selectedClaim}
        onClose={() => setSelectedClaim(null)}
        claim={selectedClaim}
      />
    </div>
  );
}
