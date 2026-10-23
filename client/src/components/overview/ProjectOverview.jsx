import React from 'react';
import { 
  ShieldCheck, 
  Brain, 
  Search, 
  FileCheck2, 
  AlertTriangle, 
  Layers, 
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calculator
} from 'lucide-react';

export default function ProjectOverview({ onStartEvaluation }) {
  return (
    <div className="space-y-8 max-w-5xl">
      {/* Hero Card */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>AI Safety & Factuality Research</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Verifiable, Evidence-Grounded <br />
            <span className="text-emerald-400">Hallucination Evaluation</span> Platform
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Large Language Models generate highly fluent yet factually untruthful statements. 
            <strong> TrustLens-AI</strong> moves beyond arbitrary single-number judgments by decomposing AI responses 
            into atomic claims, retrieving corroborating premises from authoritative knowledge bases, and applying 
            transformer-based Natural Language Inference (NLI) to provide transparent, explainable reliability audits.
          </p>

          <div className="pt-2 flex items-center gap-4">
            <button
              onClick={onStartEvaluation}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-lg shadow-emerald-600/20"
            >
              <span>Launch Evaluation Workbench</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition"
            >
              Inspect ML OpenAPI Spec
            </a>
          </div>
        </div>

        {/* Subtle decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 3-Way Classification Principle */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            The 3-Way Classification Principle
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            An essential academic design requirement: missing evidence must never be conflated with contradiction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Supported
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The retrieved evidence passage strictly entails the atomic proposition with high NLI confidence ($\ge 0.85$).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-rose-500/30 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <XCircle className="w-5 h-5" />
              Contradicted
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Authoritative evidence directly refutes the claim (e.g. conflicting dates, entities, or numerical figures).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <HelpCircle className="w-5 h-5" />
              Unverified
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              No corroborating or refuting premise passes the similarity threshold. Preserves scientific integrity.
            </p>
          </div>
        </div>
      </section>

      {/* Mathematical Formulation */}
      <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Mathematical Reliability Formulation
            </h3>
            <p className="text-xs text-slate-400">
              Documented calculation formula preventing black-box percentage fabrication.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800/80 overflow-x-auto space-y-2">
          <div className="text-emerald-400 font-bold">
            Reliability Index (RI) = [ N_supported / (N_supported + N_contradicted + α * N_unverified) ] × 100
          </div>
          <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
            Where:
            <br />• N_supported = count of factually entailed propositions
            <br />• N_contradicted = count of refuted propositions (direct hallucinations)
            <br />• N_unverified = count of claims lacking conclusive evidence
            <br />• α = 0.5 (empirical penalty weight representing epistemic uncertainty)
          </div>
        </div>
      </section>
    </div>
  );
}
