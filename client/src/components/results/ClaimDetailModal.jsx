import React from 'react';
import { 
  ExternalLink, 
  BookOpen, 
  Brain, 
  HelpCircle, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  Link2
} from 'lucide-react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';

export default function ClaimDetailModal({ isOpen, onClose, claim }) {
  if (!claim) return null;

  const nliScores = claim.nliScores || {
    entailment: claim.status === 'supported' ? claim.confidence : 0.05,
    neutral: claim.status === 'unverified' ? claim.confidence : 0.1,
    contradiction: claim.status === 'contradicted' ? claim.confidence : 0.05,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Claim Verification & Evidence Audit"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Claim Header & Verdict */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Atomic Proposition ID: {claim.id}
            </span>
            <StatusBadge status={claim.status} size="sm" />
          </div>
          <p className="text-sm font-semibold text-white leading-relaxed">
            "{claim.text}"
          </p>
        </div>

        {/* NLI Softmax Distribution */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-purple-400" />
              NLI Cross-Encoder Probabilities (DeBERTa-v3):
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              Confidence: {Math.round(claim.confidence * 100)}%
            </span>
          </div>

          <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs">
            {/* Entailment Bar */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-emerald-400 font-medium">Entailment (Supported)</span>
                <span className="font-mono text-slate-300">
                  {(nliScores.entailment * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${nliScores.entailment * 100}%` }}
                />
              </div>
            </div>

            {/* Neutral Bar */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-amber-400 font-medium">Neutral (Unverified)</span>
                <span className="font-mono text-slate-300">
                  {(nliScores.neutral * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${nliScores.neutral * 100}%` }}
                />
              </div>
            </div>

            {/* Contradiction Bar */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-rose-400 font-medium">Contradiction (Refuted)</span>
                <span className="font-mono text-slate-300">
                  {(nliScores.contradiction * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${nliScores.contradiction * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Explainability Reasoning */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Explainable Verification Rationale
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            {claim.explanation}
          </p>
        </div>

        {/* Primary Evidence Provenance */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-400" />
            Retrieved Ground-Truth Premise & Vector Similarity
          </span>

          {claim.evidence ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <blockquote className="border-l-2 border-emerald-500 pl-3 text-xs text-slate-200 italic leading-relaxed">
                "{claim.evidence.text}"
              </blockquote>

              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Source Provenance
                  </span>
                  <span className="font-medium text-slate-300 block">
                    {claim.evidence.sourceTitle}
                  </span>
                  {claim.evidence.sourceType && (
                    <span className="text-[10px] text-slate-400">
                      Type: {claim.evidence.sourceType}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Retrieval Similarity</span>
                    <span className="text-xs font-mono text-blue-400 font-semibold">
                      {Math.round(claim.evidence.similarityScore * 100)}%
                    </span>
                  </div>

                  {claim.evidence.sourceUrl && (
                    <a
                      href={claim.evidence.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                      title="Open source URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-500 space-y-1">
              <p>No sufficiently similar premise was retrieved from the knowledge index.</p>
              <p className="text-[11px] text-amber-400/80">
                In accordance with academic rigor, this assertion is labeled <strong>Unverified</strong> rather than penalized as a hallucination.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
