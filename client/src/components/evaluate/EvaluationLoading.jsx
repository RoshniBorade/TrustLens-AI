import React, { useState, useEffect } from 'react';
import { FileCheck2, Search, Brain, ShieldCheck } from 'lucide-react';

export default function EvaluationLoading() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Decomposing response into atomic factual claims...', icon: FileCheck2 },
    { label: 'Querying vector index & external knowledge bases...', icon: Search },
    { label: 'Executing transformer NLI premise-hypothesis inference...', icon: Brain },
    { label: 'Synthesizing Reliability Index & traceability metrics...', icon: ShieldCheck },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-lg mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="relative w-16 h-16 mx-auto">
        <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain className="w-6 h-6 text-emerald-400 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold text-white">
          Evaluating AI Response Factuality
        </h3>
        <p className="text-xs text-slate-400">
          Running linguistic decomposition and inference models...
        </p>
      </div>

      <div className="space-y-3 text-left bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 text-xs transition-opacity ${
                isCurrent ? 'text-emerald-400 font-medium' : isDone ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <StepIcon className={`w-4 h-4 shrink-0 ${isCurrent ? 'animate-bounce text-emerald-400' : ''}`} />
              <span className="truncate">{step.label}</span>
              {isDone && <span className="ml-auto text-[10px] text-emerald-500">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
