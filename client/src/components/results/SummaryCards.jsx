import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertTriangle,
  Scale
} from 'lucide-react';
import MetricCard from '../common/MetricCard';

export default function SummaryCards({ metrics }) {
  if (!metrics) return null;

  const {
    totalClaims = 0,
    supportedClaims = 0,
    contradictedClaims = 0,
    unverifiedClaims = 0,
    reliabilityIndex = 0,
    hallucinationRate = 0,
  } = metrics;

  // Reliability Index styling
  const getIndexVariant = (score) => {
    if (score >= 80) return 'emerald';
    if (score >= 50) return 'amber';
    return 'rose';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Primary Card: Reliability Index */}
      <MetricCard
        title="Reliability Index"
        value={`${reliabilityIndex.toFixed(1)}%`}
        subtitle="Formula: N_s / (N_s + N_c + 0.5*N_u)"
        icon={ShieldCheck}
        variant={getIndexVariant(reliabilityIndex)}
        badge={reliabilityIndex >= 80 ? 'High' : reliabilityIndex >= 50 ? 'Moderate' : 'Low'}
      />

      {/* Card 2: Total Claims */}
      <MetricCard
        title="Total Atomic Claims"
        value={totalClaims}
        subtitle="Extracted discrete propositions"
        icon={Scale}
        variant="default"
      />

      {/* Card 3: Supported */}
      <MetricCard
        title="Supported"
        value={supportedClaims}
        subtitle={totalClaims ? `${Math.round((supportedClaims / totalClaims) * 100)}% of claims verified` : "Entailed by verified evidence"}
        icon={CheckCircle2}
        variant="emerald"
      />

      {/* Card 4: Contradicted (Hallucinations) */}
      <MetricCard
        title="Contradicted"
        value={contradictedClaims}
        subtitle={totalClaims ? `${Math.round((contradictedClaims / totalClaims) * 100)}% refuted assertions` : "Direct factual hallucinations"}
        icon={XCircle}
        variant="rose"
        badge={contradictedClaims > 0 ? 'Hallucination' : 'None'}
      />

      {/* Card 5: Unverified */}
      <MetricCard
        title="Unverified"
        value={unverifiedClaims}
        subtitle={totalClaims ? `${Math.round((unverifiedClaims / totalClaims) * 100)}% inconclusive evidence` : "Missing corroborating premise"}
        icon={HelpCircle}
        variant="amber"
      />
    </div>
  );
}
