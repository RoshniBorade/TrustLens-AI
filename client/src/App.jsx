import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Server, 
  Cpu, 
  Database, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  ExternalLink,
  Layers,
  FileCheck2,
  Search,
  Brain
} from 'lucide-react';
import { fetchServerHealth, fetchApiStatus } from './services/api';

export default function App() {
  const [healthData, setHealthData] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const [health, status] = await Promise.all([
        fetchServerHealth(),
        fetchApiStatus(),
      ]);
      setHealthData(health);
      setApiStatus(status);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to query backend health:', err);
      setError(err.message || 'Cannot reach application server at port 5000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                TrustLens <span className="text-emerald-400">AI</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Foundation v1.0
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                AI Reliability & Hallucination Evaluation Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadHealth}
              disabled={loading}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition"
            >
              FastAPI Docs
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Banner Alert if error */}
        {error && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-300">Backend Communication Warning</p>
              <p className="text-xs mt-1 text-amber-200/80">{error}</p>
              <p className="text-xs mt-1 text-slate-400">
                Ensure the Express server is running on port 5000 (<code className="text-emerald-400 font-mono">npm run dev:server</code>).
              </p>
            </div>
          </div>
        )}

        {/* System Architecture Connectivity Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Multi-Service Cluster Health
              </h2>
              <p className="text-xs text-slate-400">
                Real-time operational verification of microservice endpoints and persistent datastores.
              </p>
            </div>
            {lastChecked && (
              <span className="text-xs text-slate-500">
                Last checked: {lastChecked}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Card 1: Frontend Client */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">Frontend UI</h3>
                <p className="text-xs text-slate-400 mt-0.5">Vite + React.js + Tailwind</p>
              </div>
              <div className="pt-2 border-t border-slate-700/40 text-xs text-slate-400 flex justify-between">
                <span>Port:</span>
                <span className="font-mono text-slate-200">5173</span>
              </div>
            </div>

            {/* Card 2: Express Backend */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Server className="w-5 h-5" />
                </div>
                {healthData ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    Offline
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">Application Backend</h3>
                <p className="text-xs text-slate-400 mt-0.5">Node.js + Express.js API</p>
              </div>
              <div className="pt-2 border-t border-slate-700/40 text-xs text-slate-400 flex justify-between">
                <span>Port / Uptime:</span>
                <span className="font-mono text-slate-200">
                  5000 ({healthData ? `${healthData.uptime_seconds}s` : '--'})
                </span>
              </div>
            </div>

            {/* Card 3: Python ML Service */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Cpu className="w-5 h-5" />
                </div>
                {healthData?.components?.ml_service?.connected ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Disconnected
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">AI / ML Engine</h3>
                <p className="text-xs text-slate-400 mt-0.5">Python + FastAPI + PyTorch</p>
              </div>
              <div className="pt-2 border-t border-slate-700/40 text-xs text-slate-400 flex justify-between">
                <span>Latency:</span>
                <span className="font-mono text-slate-200">
                  {healthData?.components?.ml_service?.latency_ms !== undefined 
                    ? `${healthData.components.ml_service.latency_ms}ms` 
                    : '--'}
                </span>
              </div>
            </div>

            {/* Card 4: MongoDB */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                  <Database className="w-5 h-5" />
                </div>
                {healthData?.components?.database?.connected ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Standby
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">MongoDB Datastore</h3>
                <p className="text-xs text-slate-400 mt-0.5">Evaluation Reports & Audit</p>
              </div>
              <div className="pt-2 border-t border-slate-700/40 text-xs text-slate-400 flex justify-between">
                <span>Port:</span>
                <span className="font-mono text-slate-200">27017</span>
              </div>
            </div>
          </div>
        </section>

        {/* Architectural Contracts & Pipeline Blueprint */}
        <section className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Evaluation Pipeline Blueprint (Phased Roadmap)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Structured workflow designed for verifiable, explainable AI hallucination detection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                Claim Extraction
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Decomposes compound AI paragraphs into testable, discrete atomic factual claims.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-blue-400" />
                Hybrid Retrieval
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Retrieves verified premise candidates from vector indexes and trusted knowledge sources.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-purple-400" />
                NLI Verification
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluates premise-hypothesis pairs with transformers: Supported, Contradicted, or Unverified.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Explainable Scoring
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Synthesizes mathematical Reliability Index ($RI$) with traceable evidence provenance.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500">
        TrustLens AI &bull; BTech Major Project &bull; Built with FastAPI, Express, React, & Transformers
      </footer>
    </div>
  );
}
