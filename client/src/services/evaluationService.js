/**
 * Evaluation Service Abstraction Layer
 * 
 * DESIGN PRINCIPLE:
 * Strictly separates mock development fixtures from live API calls.
 * UI components interact with this service rather than directly querying raw fixtures.
 */
import { MOCK_EVALUATIONS } from '../mock/mockEvaluations';
import api from './api';

// Currently set to TRUE for frontend development as requested in current phase
export const IS_MOCK_MODE = true;

const LOCAL_STORAGE_KEY = 'trustlens_evaluation_history';

/**
 * Retrieves the evaluation history.
 * In mock mode: loads seeded synthetic evaluations combined with any locally executed runs.
 */
export async function getEvaluationHistory() {
  if (IS_MOCK_MODE) {
    // Artificial latency for realistic async state testing
    await new Promise((resolve) => setTimeout(resolve, 300));
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    const storedRuns = local ? JSON.parse(local) : [];
    // Combine mock base with local runs, deduplicated by ID
    const combined = [...storedRuns];
    MOCK_EVALUATIONS.forEach((mock) => {
      if (!combined.some((item) => item.id === mock.id)) {
        combined.push(mock);
      }
    });
    return combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Live API Call (For Phase 4)
  const response = await api.get('/evaluations');
  return response.data;
}

/**
 * Triggers an evaluation run.
 * In mock mode: matches against benchmark presets or synthesizes a claim breakdown fixture.
 */
export async function runEvaluation({ query, responseText, useWebSearch = true }) {
  if (IS_MOCK_MODE) {
    // Realistic multi-stage delay simulation (1.2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Try finding an existing mock match or build a realistic synthetic evaluation
    const matched = MOCK_EVALUATIONS.find(
      (m) => m.query.toLowerCase() === (query || '').toLowerCase() || 
             m.responseText.slice(0, 30) === responseText.slice(0, 30)
    );

    const result = matched ? {
      ...matched,
      id: `eval-run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isMock: true,
      query: query || matched.query,
      responseText,
    } : {
      id: `eval-run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isMock: true,
      query: query || "Ad-hoc User Submission",
      responseText,
      modelName: "Custom User Input (Demo Mode)",
      metrics: {
        totalClaims: 2,
        supportedClaims: 1,
        contradictedClaims: 0,
        unverifiedClaims: 1,
        reliabilityIndex: 66.7,
        hallucinationRate: 0.0,
        avgConfidence: 0.89,
      },
      claims: [
        {
          id: `claim-${Date.now()}-1`,
          sentenceIndex: 1,
          text: responseText.split('.')[0] || responseText,
          status: "supported",
          confidence: 0.94,
          explanation: "Supported by preliminary knowledge graph retrieval (Demo heuristic).",
          evidence: {
            id: `ev-${Date.now()}-1`,
            sourceTitle: "Synthetic Demonstration Reference",
            sourceUrl: "https://en.wikipedia.org",
            sourceType: "Web Knowledge Base",
            similarityScore: 0.91,
            text: "Corroborating factual proposition identified in demonstration corpus.",
          },
          alternativeCandidates: [],
          nliScores: { entailment: 0.94, neutral: 0.04, contradiction: 0.02 }
        },
        {
          id: `claim-${Date.now()}-2`,
          sentenceIndex: 2,
          text: responseText.split('.')[1] || "Secondary proposition extracted from submission.",
          status: "unverified",
          confidence: 0.65,
          explanation: "Unverified: Insufficient evidence available in mock demonstration index.",
          evidence: null,
          alternativeCandidates: [],
          nliScores: { entailment: 0.15, neutral: 0.65, contradiction: 0.20 }
        }
      ]
    };

    // Save to local storage history
    const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = existing ? JSON.parse(existing) : [];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([result, ...parsed]));

    return result;
  }

  // Live Pipeline Call (Phase 4)
  const response = await api.post('/evaluations', { query, responseText, useWebSearch });
  return response.data;
}
