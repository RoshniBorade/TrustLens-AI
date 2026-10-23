/**
 * TrustLens-AI - Synthetic Mock Evaluation Datasets
 * 
 * IMPORTANT ACADEMIC NOTICE:
 * These records represent PRE-CALIBRATED SYNTHETIC TEST CASES strictly used for UI development,
 * interaction design, and visual verification. They are NOT genuine model inference outputs.
 * In Phase 4 & 5, these will be replaced with live outputs from the FastAPI NLI engine.
 */

export const MOCK_DISCLAIMER = {
  isMock: true,
  label: "DEMONSTRATION MOCK DATA",
  warning: "This view is rendered using synthetic UI fixtures for academic design verification.",
};

export const MOCK_EVALUATIONS = [
  {
    id: "eval-mock-001",
    isMock: true,
    timestamp: "2026-10-23T10:15:00Z",
    query: "Summarize the discovery of Penicillin and its clinical adoption.",
    responseText: "Alexander Fleming discovered penicillin in 1928 at St. Mary's Hospital in London. He was awarded the Nobel Prize in Medicine in 1945 alongside Howard Florey and Ernst Chain. Fleming immediately developed large-scale mass manufacturing techniques that enabled its deployment across Europe in 1930.",
    modelName: "GPT-4 / LLM Generation Sample (Demonstration)",
    metrics: {
      totalClaims: 3,
      supportedClaims: 2,
      contradictedClaims: 1,
      unverifiedClaims: 0,
      reliabilityIndex: 66.7, // Formula: 2 / (2 + 1 + 0.5*0) * 100 = 66.7%
      hallucinationRate: 0.33,
      avgConfidence: 0.94,
    },
    claims: [
      {
        id: "claim-101",
        sentenceIndex: 1,
        text: "Alexander Fleming discovered penicillin in 1928 at St. Mary's Hospital in London.",
        status: "supported",
        confidence: 0.98,
        explanation: "The premise directly entails the discovery year (1928) and institutional affiliation (St. Mary's Hospital, London).",
        evidence: {
          id: "ev-01",
          sourceTitle: "Alexander Fleming Discovery of Penicillin - Science History Institute",
          sourceUrl: "https://www.sciencehistory.org/historical-profile/alexander-fleming",
          sourceType: "Historical Archive",
          similarityScore: 0.94,
          text: "In September 1928, after returning from vacation to his laboratory at St. Mary's Hospital in London, Alexander Fleming found that a culture of Staphylococcus aureus was contaminated with Penicillium notatum fungus.",
        },
        alternativeCandidates: [
          {
            id: "ev-01b",
            sourceTitle: "Nobel Lectures, Physiology or Medicine 1942-1962",
            similarityScore: 0.88,
            text: "The discovery of penicillin happened in the Inoculation Department of St. Mary's Hospital in autumn 1928.",
          }
        ],
        nliScores: {
          entailment: 0.98,
          neutral: 0.015,
          contradiction: 0.005,
        }
      },
      {
        id: "claim-102",
        sentenceIndex: 2,
        text: "He was awarded the Nobel Prize in Medicine in 1945 alongside Howard Florey and Ernst Chain.",
        status: "supported",
        confidence: 0.97,
        explanation: "Verified against the official Nobel Foundation records confirming the 1945 joint physiology prize.",
        evidence: {
          id: "ev-02",
          sourceTitle: "The Nobel Prize in Physiology or Medicine 1945",
          sourceUrl: "https://www.nobelprize.org/prizes/medicine/1945/summary/",
          sourceType: "Nobel Media Database",
          similarityScore: 0.96,
          text: "The Nobel Prize in Physiology or Medicine 1945 was awarded jointly to Sir Alexander Fleming, Ernst Boris Chain and Sir Howard Walter Florey 'for the discovery of penicillin and its curative effect in various infectious diseases'.",
        },
        alternativeCandidates: [],
        nliScores: {
          entailment: 0.97,
          neutral: 0.02,
          contradiction: 0.01,
        }
      },
      {
        id: "claim-103",
        sentenceIndex: 3,
        text: "Fleming immediately developed large-scale mass manufacturing techniques that enabled its deployment across Europe in 1930.",
        status: "contradicted",
        confidence: 0.91,
        explanation: "Factual Contradiction: Historical records establish that Fleming was unable to stabilize or mass-produce penicillin; industrial deep-tank fermentation was developed over a decade later in the US (1941-1944) by Florey, Chain, Heatley, and Peoria USDA Labs.",
        evidence: {
          id: "ev-03",
          sourceTitle: "Discovery and Development of Penicillin - American Chemical Society National Historic Chemical Landmarks",
          sourceUrl: "https://www.acs.org/education/whatischemistry/landmarks/penicillin.html",
          sourceType: "Peer-Reviewed Scientific History",
          similarityScore: 0.89,
          text: "Fleming could not isolate penicillin or produce enough to test its therapeutic value in humans, and clinical development halted until 1939 when Florey and Chain began their work. Mass production techniques were only perfected in Peoria, Illinois during World War II in 1943.",
        },
        alternativeCandidates: [],
        nliScores: {
          entailment: 0.02,
          neutral: 0.07,
          contradiction: 0.91,
        }
      }
    ]
  },
  {
    id: "eval-mock-002",
    isMock: true,
    timestamp: "2026-10-23T11:40:00Z",
    query: "What is the James Webb Space Telescope's orbit and primary mirror configuration?",
    responseText: "The James Webb Space Telescope orbits the Sun at the Second Lagrange Point (L2), approximately 1.5 million kilometers from Earth. Its primary mirror consists of 18 hexagonal beryllium segments coated in vapor-deposited gold. In November 2024, NASA astronauts executed an emergency spacewalk to replace a damaged micro-meteoroid sensor.",
    modelName: "Claude 3.5 Sonnet / Sample Output",
    metrics: {
      totalClaims: 3,
      supportedClaims: 2,
      contradictedClaims: 0,
      unverifiedClaims: 1,
      reliabilityIndex: 80.0, // Formula: 2 / (2 + 0 + 0.5*1) * 100 = 80.0%
      hallucinationRate: 0.0,
      avgConfidence: 0.93,
    },
    claims: [
      {
        id: "claim-201",
        sentenceIndex: 1,
        text: "The James Webb Space Telescope orbits the Sun at the Second Lagrange Point (L2), approximately 1.5 million kilometers from Earth.",
        status: "supported",
        confidence: 0.99,
        explanation: "Corroborated by NASA astrophysics flight trajectory data for the Sun-Earth L2 halo orbit.",
        evidence: {
          id: "ev-201",
          sourceTitle: "NASA Goddard Space Flight Center - JWST Orbit",
          sourceUrl: "https://webb.nasa.gov/content/about/orbit.html",
          sourceType: "Space Agency Documentation",
          similarityScore: 0.97,
          text: "Webb does not orbit the Earth; it orbits the Sun around the second Sun-Earth Lagrange point (L2), which is approximately 1.5 million kilometers (1 million miles) away from Earth.",
        },
        alternativeCandidates: [],
        nliScores: { entailment: 0.99, neutral: 0.008, contradiction: 0.002 }
      },
      {
        id: "claim-202",
        sentenceIndex: 2,
        text: "Its primary mirror consists of 18 hexagonal beryllium segments coated in vapor-deposited gold.",
        status: "supported",
        confidence: 0.96,
        explanation: "Directly matches optical design specifications: 18 hexagonal beryllium segments with vapor-deposited gold coating.",
        evidence: {
          id: "ev-202",
          sourceTitle: "NASA Webb Telescope - Optical Telescope Element",
          sourceUrl: "https://webb.nasa.gov/content/observatory/ote/mirrors/index.html",
          sourceType: "Technical Specification",
          similarityScore: 0.95,
          text: "The primary mirror is made of 18 hexagonal mirror segments of gold-plated beryllium, each 1.32 meters in diameter.",
        },
        alternativeCandidates: [],
        nliScores: { entailment: 0.96, neutral: 0.03, contradiction: 0.01 }
      },
      {
        id: "claim-203",
        sentenceIndex: 3,
        text: "In November 2024, NASA astronauts executed an emergency spacewalk to replace a damaged micro-meteoroid sensor.",
        status: "unverified",
        confidence: 0.72,
        explanation: "Unverified Premise: The James Webb Space Telescope operates 1.5 million kilometers away and was designed without crew servicing capability. No record of crewed flights or spacewalks to L2 exists in NASA mission records.",
        evidence: null,
        alternativeCandidates: [],
        nliScores: { entailment: 0.03, neutral: 0.72, contradiction: 0.25 }
      }
    ]
  },
  {
    id: "eval-mock-003",
    isMock: true,
    timestamp: "2026-10-23T14:10:00Z",
    query: "Explain the architecture of the Transformer model in deep learning.",
    responseText: "The Transformer was introduced in the 2017 paper Attention Is All You Need by Vaswani et al. It eliminates recurrent neural network loops, relying entirely on self-attention mechanisms. The original architecture uses an encoder-decoder framework with sinusoidal positional encodings.",
    modelName: "Academic Textbook Sample",
    metrics: {
      totalClaims: 3,
      supportedClaims: 3,
      contradictedClaims: 0,
      unverifiedClaims: 0,
      reliabilityIndex: 100.0,
      hallucinationRate: 0.0,
      avgConfidence: 0.98,
    },
    claims: [
      {
        id: "claim-301",
        sentenceIndex: 1,
        text: "The Transformer was introduced in the 2017 paper Attention Is All You Need by Vaswani et al.",
        status: "supported",
        confidence: 0.99,
        explanation: "Verified by seminal 2017 NeurIPS proceedings.",
        evidence: {
          id: "ev-301",
          sourceTitle: "Attention Is All You Need - NeurIPS 2017",
          sourceUrl: "https://arxiv.org/abs/1706.03762",
          sourceType: "Academic Paper",
          similarityScore: 0.98,
          text: "Vaswani et al. (2017) introduced the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism.",
        },
        alternativeCandidates: [],
        nliScores: { entailment: 0.99, neutral: 0.005, contradiction: 0.005 }
      },
      {
        id: "claim-302",
        sentenceIndex: 2,
        text: "It eliminates recurrent neural network loops, relying entirely on self-attention mechanisms.",
        status: "supported",
        confidence: 0.97,
        explanation: "Confirmed by transformer architectural specifications.",
        evidence: {
          id: "ev-302",
          sourceTitle: "Deep Learning with PyTorch",
          sourceUrl: "https://pytorch.org",
          sourceType: "Textbook",
          similarityScore: 0.93,
          text: "Transformers dispense with recurrence and convolutions entirely, allowing for significantly more parallelization during training.",
        },
        alternativeCandidates: [],
        nliScores: { entailment: 0.97, neutral: 0.02, contradiction: 0.01 }
      },
      {
        id: "claim-303",
        sentenceIndex: 3,
        text: "The original architecture uses an encoder-decoder framework with sinusoidal positional encodings.",
        status: "supported",
        confidence: 0.98,
        explanation: "Verified against Section 3.5 of Vaswani et al. regarding sinusoidal positional embeddings.",
        evidence: {
          id: "ev-303",
          sourceTitle: "Attention Is All You Need, Section 3.5",
          sourceUrl: "https://arxiv.org/abs/1706.03762",
          sourceType: "Academic Paper",
          similarityScore: 0.96,
          text: "In this work, we use sine and cosine functions of different frequencies for positional encodings in the encoder and decoder stacks.",
        },
        alternativeCandidates: [],
        nliScores: { entailment: 0.98, neutral: 0.01, contradiction: 0.01 }
      }
    ]
  }
];

export const BENCHMARK_PRESETS = [
  {
    id: "preset-penicillin",
    title: "Penicillin Adoption (Historical Contradiction)",
    category: "History & Science",
    query: "Summarize the discovery of Penicillin and its clinical adoption.",
    responseText: "Alexander Fleming discovered penicillin in 1928 at St. Mary's Hospital in London. He was awarded the Nobel Prize in Medicine in 1945 alongside Howard Florey and Ernst Chain. Fleming immediately developed large-scale mass manufacturing techniques that enabled its deployment across Europe in 1930.",
    mockRefId: "eval-mock-001"
  },
  {
    id: "preset-jwst",
    title: "JWST Orbit & Servicing (Unverified Claim)",
    category: "Astrophysics",
    query: "What is the James Webb Space Telescope's orbit and primary mirror configuration?",
    responseText: "The James Webb Space Telescope orbits the Sun at the Second Lagrange Point (L2), approximately 1.5 million kilometers from Earth. Its primary mirror consists of 18 hexagonal beryllium segments coated in vapor-deposited gold. In November 2024, NASA astronauts executed an emergency spacewalk to replace a damaged micro-meteoroid sensor.",
    mockRefId: "eval-mock-002"
  },
  {
    id: "preset-transformer",
    title: "Transformer Architecture (Fully Grounded)",
    category: "Machine Learning",
    query: "Explain the architecture of the Transformer model in deep learning.",
    responseText: "The Transformer was introduced in the 2017 paper Attention Is All You Need by Vaswani et al. It eliminates recurrent neural network loops, relying entirely on self-attention mechanisms. The original architecture uses an encoder-decoder framework with sinusoidal positional encodings.",
    mockRefId: "eval-mock-003"
  }
];
