import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Cpu, 
  Database, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Code2,
  ExternalLink
} from 'lucide-react';
import { fetchServerHealth } from '../../services/api';

export default function ClusterArchitecture() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchServerHealth();
      setHealth(data);
    } catch (err) {
      setError(err.message || 'Cannot connect to Express backend at port 5000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Cluster Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            Microservice Cluster Topology
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Decoupled multi-tier services powering the TrustLens evaluation engine.
          </p>
        </div>

        <button
          onClick={checkHealth}
          disabled={loading}
          className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Ping Services</span>
        </button>
      </div>

      {/* Service Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Node 1: Frontend */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Port 5173
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-slate-200 text-sm">React Client</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Vite + Tailwind + Recharts</p>
          </div>
          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
            UI state, chart rendering, and user workbench.
          </p>
        </div>

        {/* Node 2: Express Server */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Port 5000
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-slate-200 text-sm">Express API</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Node.js Application Server</p>
          </div>
          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
            Audit logging, JWT security, and ML orchestration.
          </p>
        </div>

        {/* Node 3: Python FastAPI */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Port 8000
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-slate-200 text-sm">FastAPI ML Engine</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">PyTorch + DeBERTa NLI</p>
          </div>
          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
            Claim parsing, vector retrieval, and NLI inference.
          </p>
        </div>

        {/* Node 4: MongoDB */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-green-500/10 text-green-400">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Port 27017
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-slate-200 text-sm">MongoDB</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Evaluation Datastore</p>
          </div>
          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
            Persistent audit records and test benchmarks.
          </p>
        </div>
      </div>

      {/* Live Cluster Response Details */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-emerald-400" />
            Live Health Telemetry Payload (/health):
          </span>
          {health?.components?.ml_service?.latency_ms !== undefined && (
            <span className="text-xs font-mono text-emerald-400">
              Node ↔ Python Latency: {health.components.ml_service.latency_ms}ms
            </span>
          )}
        </div>

        {error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        ) : (
          <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800/80">
            {health ? JSON.stringify(health, null, 2) : 'Pinging cluster services...'}
          </pre>
        )}
      </div>
    </div>
  );
}
