# Reproducible Robustness-Testing & Evaluation Framework

This document outlines the evaluation methodology, dataset provenance, annotation standards, and experimental protocols for the **TrustLens AI** platform.

---

## 1. Dataset Origin & Curation Methodology

The TrustLens Robustness Evaluation Suite (`ml_service/data/robustness_dataset.json`) is a hand-annotated, high-fidelity benchmark constructed specifically to evaluate the failure modes and stress boundaries of factual claim extraction, dense semantic retrieval, and Natural Language Inference (NLI) verification.

### Domain Distribution
The dataset spans core academic domains:
- **Astronomy & Physics** (cosmology, planetary bodies, physical constants, thermodynamics)
- **Life Sciences & Chemistry** (molecular biology, cellular physiology, chemical composition)
- **World History & Politics** (chronologies, wartime treaties, geopolitical entities)
- **Geography & Earth Sciences** (elevations, river lengths, tectonic processes)
- **Computer Science & Technology** (protocols, kernels, web history)
- **Public Policy & Economics** (labor economics, epidemiological evidence)

---

## 2. Test Condition Categories (8 Classes, 5 Samples Each)

The 40 benchmark samples are partitioned into 8 stress-testing categories:

| Category Key | Focus Area | Stress Condition Evaluated |
|---|---|---|
| `supported_factual` | Factual Entailment | Standard factual propositions with canonical textbook evidence. |
| `contradicted_hallucination` | Hallucination Detection | Blatant factual inversions, anatomical errors, and geographic displacements. |
| `insufficient_evidence` | Epistemic Restraint | Obscure folklore, speculative theories, or unverifiable claims where evidence is absent. |
| `paraphrased` | Semantic Invariance | Complex syntactic transformations (passive voice, participial phrases, synonyms). |
| `numerical_temporal` | Precision & Tolerance | Exact years, atomic numbers, and elevation measurements with subtle and gross errors. |
| `noisy_ambiguous` | Conversational Robustness | Sentences with LLM preambles, opinion disclaimers ("I think"), and conversational pleasantries. |
| `long_multiclaim` | Decomposition & Multi-Hop | Multi-sentence paragraphs containing compound propositions with mixed factual validity. |
| `conflicting_evidence` | Conflict Resolution | Multiple retrieved sources presenting diametrically opposed claims. |

---

## 3. Annotation Guidelines & Decision Rules

### 3.1 Three-Class Classification Taxonomy
1. **Supported (`supported`)**:
   - The reference evidence directly entails the core proposition of the claim.
   - Minor syntactic or stylistic paraphrasing is acceptable if the semantic meaning is invariant.
   - For numerical claims, all specified numerical quantities, units, and dates must match the evidence within acceptable rounding bounds.
2. **Contradicted (`contradicted`)**:
   - The reference evidence directly refutes the claim or asserts an incompatible, mutually exclusive fact (e.g., claiming the Titanic completed its maiden voyage when evidence documents its sinking).
   - A claim asserting a specific false entity or number when evidence proves another is marked contradicted.
3. **Unverified (`unverified`)**:
   - The retrieved evidence does not contain sufficient factual information to confirm or refute the claim.
   - Absences of evidence, speculative scientific conjectures, and legendary myths with no archeological or empirical proof MUST be assigned `unverified`.
   - **Conflicting Sources Rule**: If multiple credible retrieved sources present mutually incompatible claims (one entailing and one refuting), the aggregate status MUST resolve to `unverified`, accompanied by an explicit multi-source conflict warning.

### 3.2 Numerical Tolerance Protocol
- Dates and historical years require exact integer equivalence (e.g., World War II end in 1945; 1985 is contradicted).
- Scientific constants require adherence to standard significant figures.

---

## 4. Train / Validation / Test Separation

- **Pure Evaluation Split (`split: "test"`)**:
  - All 40 items in this dataset are held-out evaluation instances.
  - No model training, fine-tuning, or hyperparameter optimization (such as threshold tuning) was performed on these instances.
  - All verification decisions are made zero-shot using the frozen `cross-encoder/nli-deberta-v3-small` checkpoint and the pre-computed ONNX embedding model (`all-MiniLM-L6-v2`).

---

## 5. Limitations of the Dataset

1. **Sample Size**: 40 samples provide targeted diagnostic coverage across diverse failure modes, but do not represent a large-scale statistical corpus like FEVER or VitaminC.
2. **Linguistic Scope**: English-language only; non-English syntax or multi-lingual cross-lingual transfers are not represented.
3. **Domain Bias**: Samples focus predominantly on STEM and verifiable historical facts with ground truth documented in encyclopedic corpora (Wikipedia). Highly subjective, legal, or dynamic real-time domains are outside this evaluation suite.\n