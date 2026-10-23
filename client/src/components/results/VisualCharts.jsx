import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { PieChart as PieIcon, BarChart3 } from 'lucide-react';

export default function VisualCharts({ metrics, claims = [] }) {
  if (!metrics) return null;

  // Chart 1: Claim Distribution Donut
  const distributionData = [
    { name: 'Supported', value: metrics.supportedClaims, color: '#10b981' },
    { name: 'Contradicted', value: metrics.contradictedClaims, color: '#f43f5e' },
    { name: 'Unverified', value: metrics.unverifiedClaims, color: '#f59e0b' },
  ].filter((item) => item.value > 0);

  // Chart 2: Per-claim NLI Confidence
  const confidenceData = claims.map((claim, idx) => ({
    name: `Claim ${idx + 1}`,
    confidence: Math.round(claim.confidence * 100),
    status: claim.status,
    text: claim.text,
  }));

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl shadow-xl text-xs">
          <span className="font-semibold text-white">{data.name}</span>: {data.value} claims
          <span className="text-slate-400 block text-[11px]">
            {Math.round((data.value / metrics.totalClaims) * 100)}% of total claims
          </span>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs max-w-xs space-y-1">
          <p className="font-semibold text-white">{data.name}</p>
          <p className="text-[11px] text-slate-300 line-clamp-2">"{data.text}"</p>
          <p className="text-emerald-400 font-mono text-[11px]">
            NLI Confidence: {data.confidence}% ({data.status})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Claim Verdict Distribution */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <PieIcon className="w-4 h-4 text-emerald-400" />
            Claim Classification Distribution
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            {metrics.totalClaims} Claims Evaluated
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                formatter={(val) => <span className="text-xs text-slate-300">{val}</span>} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Per-Claim Confidence Bar Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            NLI Model Confidence by Claim
          </h3>
          <span className="text-[11px] text-slate-500">
            Softmax entailment/contradiction peak
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={confidenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} unit="%" />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar 
                dataKey="confidence" 
                radius={[6, 6, 0, 0]}
                fill="#38bdf8"
              >
                {confidenceData.map((entry, index) => {
                  const fill = 
                    entry.status === 'supported' ? '#10b981' : 
                    entry.status === 'contradicted' ? '#f43f5e' : '#f59e0b';
                  return <Cell key={`bar-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
