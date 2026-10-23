import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ProjectOverview from './components/overview/ProjectOverview';
import EvaluationForm from './components/evaluate/EvaluationForm';
import EvaluationLoading from './components/evaluate/EvaluationLoading';
import ResultsReport from './components/results/ResultsReport';
import EvaluationHistory from './components/history/EvaluationHistory';
import ClusterArchitecture from './components/architecture/ClusterArchitecture';
import { runEvaluation } from './services/evaluationService';
import { fetchServerHealth } from './services/api';
import { MOCK_EVALUATIONS } from './mock/mockEvaluations';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  // Initialize with seed evaluation 001 so the user can immediately inspect results if desired
  const [currentReport, setCurrentReport] = useState(MOCK_EVALUATIONS[0]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  // Poll server health on load
  useEffect(() => {
    const checkServer = async () => {
      try {
        const health = await fetchServerHealth();
        setBackendHealthy(health.status === 'healthy' || health.status === 'degraded');
      } catch (err) {
        setBackendHealthy(false);
      }
    };
    checkServer();
  }, []);

  const handleRunEvaluation = async (formData) => {
    setIsEvaluating(true);
    setGlobalError(null);
    try {
      const result = await runEvaluation(formData);
      setCurrentReport(result);
      setActiveTab('results');
    } catch (err) {
      console.error('Evaluation run failed:', err);
      setGlobalError(err.message || 'Evaluation failed. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSelectHistoryReport = (report) => {
    if (report) {
      setCurrentReport(report);
      setActiveTab('results');
    } else {
      setActiveTab('evaluate');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setGlobalError(null);
          setActiveTab(tab);
        }}
        hasCurrentResults={!!currentReport}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          backendHealthy={backendHealthy}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {globalError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <span>{globalError}</span>
              <button
                onClick={() => setGlobalError(null)}
                className="text-rose-400 hover:text-white font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {isEvaluating ? (
            <EvaluationLoading />
          ) : (
            <>
              {activeTab === 'overview' && (
                <ProjectOverview onStartEvaluation={() => setActiveTab('evaluate')} />
              )}

              {activeTab === 'evaluate' && (
                <EvaluationForm
                  onRunEvaluation={handleRunEvaluation}
                  isLoading={isEvaluating}
                />
              )}

              {activeTab === 'results' && (
                <ResultsReport
                  report={currentReport}
                  onNewEvaluation={() => setActiveTab('evaluate')}
                />
              )}

              {activeTab === 'history' && (
                <EvaluationHistory onSelectReport={handleSelectHistoryReport} />
              )}

              {activeTab === 'architecture' && (
                <ClusterArchitecture />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
