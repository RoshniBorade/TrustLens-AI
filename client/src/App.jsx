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
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'evaluate', 'results', 'history', 'architecture'].includes(hash)) {
        return hash;
      }
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  // Initialize with seed evaluation 001 so the user can immediately inspect results if desired
  const [currentReport, setCurrentReport] = useState(MOCK_EVALUATIONS[0]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  // Sync activeTab with URL hash for deep linking
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'evaluate', 'results', 'history', 'architecture'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const changeTab = (tab) => {
    setGlobalError(null);
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

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
      changeTab('results');
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
      changeTab('results');
    } else {
      changeTab('evaluate');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={changeTab}
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
                <ProjectOverview onStartEvaluation={() => changeTab('evaluate')} />
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
                  onNewEvaluation={() => changeTab('evaluate')}
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
