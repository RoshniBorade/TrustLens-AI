import React, { useState } from 'react';
import { 
  Sparkles, 
  BookMarked, 
  Globe, 
  FileText, 
  RotateCcw, 
  HelpCircle,
  FlaskConical,
  Info
} from 'lucide-react';
import { BENCHMARK_PRESETS } from '../../mock/mockEvaluations';

export default function EvaluationForm({ onRunEvaluation, isLoading }) {
  const [query, setQuery] = useState('');
  const [responseText, setResponseText] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [referenceContext, setReferenceContext] = useState('');
  const [showRefInput, setShowRefInput] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSelectPreset = (preset) => {
    setQuery(preset.query);
    setResponseText(preset.responseText);
    setValidationError('');
  };

  const handleClear = () => {
    setQuery('');
    setResponseText('');
    setReferenceContext('');
    setValidationError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!responseText.trim()) {
      setValidationError('Please enter or paste an AI-generated response text to evaluate.');
      return;
    }
    if (responseText.trim().length < 15) {
      setValidationError('The response text is too short to extract testable claims (minimum 15 characters).');
      return;
    }
    setValidationError('');
    onRunEvaluation({
      query: query.trim(),
      responseText: responseText.trim(),
      useWebSearch,
      referenceContext: showRefInput ? referenceContext.trim() : null,
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Benchmark Presets Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <BookMarked className="w-4 h-4 text-emerald-400" />
            Quick Benchmark Presets (Ideal for Guide Demonstrations):
          </span>
          <span className="text-[11px] text-slate-500">
            Click to auto-populate test cases
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {BENCHMARK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition group"
            >
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
                {preset.category}
              </span>
              <span className="text-xs font-medium text-slate-200 group-hover:text-white line-clamp-1 mt-0.5 block">
                {preset.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
        {/* Synthetic Mock Notice */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>UI Development Mode:</strong> Submitting will render high-fidelity demonstration evaluation reports.
          </span>
        </div>

        {/* Query / Prompt Input */}
        <div className="space-y-1.5">
          <label htmlFor="eval-query" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Original Prompt / Question (Optional)</span>
            <span className="text-[11px] text-slate-500 font-normal">Provides context for claim resolution</span>
          </label>
          <input
            id="eval-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Summarize the discovery of Penicillin and its clinical adoption..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-emerald-500/60 transition"
          />
        </div>

        {/* AI-Generated Response Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="eval-response" className="text-xs font-semibold text-slate-300">
              AI-Generated Response to Evaluate <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-slate-500">
              {responseText.length} characters &bull; ~{responseText.split('.').filter(Boolean).length} sentences
            </span>
          </div>
          <textarea
            id="eval-response"
            rows={5}
            value={responseText}
            onChange={(e) => {
              setResponseText(e.target.value);
              if (validationError) setValidationError('');
            }}
            placeholder="Paste the generated response text here. The system will extract discrete claims, search for evidence, and evaluate each proposition..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-emerald-500/60 transition leading-relaxed resize-y"
          />
        </div>

        {/* Optional Reference Document Accordion */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowRefInput(!showRefInput)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>{showRefInput ? 'Hide' : 'Add'} Custom Reference Corpus (Optional)</span>
            </button>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
              <input
                type="checkbox"
                checked={useWebSearch}
                onChange={(e) => setUseWebSearch(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Query Wikipedia / Open Knowledge
              </span>
            </label>
          </div>

          {showRefInput && (
            <textarea
              rows={3}
              value={referenceContext}
              onChange={(e) => setReferenceContext(e.target.value)}
              placeholder="Paste reference text or document context here. The evidence retriever will index this text and match it against extracted claims..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-emerald-500/60 transition leading-relaxed mt-2"
            />
          )}
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {validationError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading || (!query && !responseText)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl hover:bg-slate-800 transition disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Form
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Decomposing & Evaluating Claims...' : 'Run Reliability Evaluation'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
