# Empirical Evaluation & Robustness-Testing Report

This document reports the live-measured performance, comparative baseline analysis, and failure diagnostics of the **TrustLens AI** verification pipeline evaluated against the 40-sample multi-category robustness suite.

---

## 1. Experimental Setup & Reproducibility Parameters

All measurements were obtained through deterministic execution of the reproducibility runner (`ml_service/run_robustness_experiments.py`) on held-out reference test instances.

- **NLI Model**: `cross-encoder/nli-deberta-v3-small` (Apache 2.0 / MIT)
- **Label Mapping**: `0: contradiction, 1: entailment, 2: neutral`
- **Decision Thresholds**:
  - Support: Entailment $\ge 0.65$ and Contradiction $< 0.65$
  - Contradict: Contradiction $\ge 0.65$ and Entailment $< 0.65$
  - Unverified (Conflict): Entailment $\ge 0.65$ and Contradiction $\ge 0.65$
  - Unverified (Inconclusive): Neutral dominant or neither threshold reached
- **Embedding Model**: `all-MiniLM-L6-v2` (ONNX runtime)
- **Vector Index**: ChromaDB with Cosine Space ($hnsw:space = cosine$)
- **Retrieval Threshold**: Cosine similarity $\ge 0.55$, Top-$k = 3$
- **Baseline Configuration**: Non-semantic lexical keyword overlap (Jaccard token matching) without dense embeddings or multi-source conflict resolution
- **Hardware & Environment**: CPU (Torch 4-thread execution), Python 3.12.7

---

## 2. Stage-by-Stage Performance Measurement

### 2.1 Stage 1: Atomic Claim Extraction
Evaluates the rule-based heuristic extractor's ability to isolate atomic factual propositions from complex compound sentences, multi-sentence paragraphs, and conversational preambles.

| Metric | Measured Value |
|---|---|
| Total Annotated Gold Claims | **50** |
| Total Extracted Claims | **51** |
| True Positive Claim Matches | **48** |
| Precision | **94.12%** |
| Recall | **96.00%** |
| **F1-Score** | **95.05%** |

### 2.2 Stage 2: Evidence Retrieval (Full Pipeline vs Baseline)
Evaluates top-$k$ retrieval accuracy in locating the gold reference evidence passage across the indexed corpus.

| Retrieval Approach | Hit@1 | Hit@3 | Mean Reciprocal Rank (MRR) |
|---|---|---|---|
| **Semantic Vector Retrieval (Ours)** | **100.0%** (40/40) | **100.0%** (40/40) | **1.0000** |
| **Lexical Keyword Baseline** | **87.5%** (35/40) | **100.0%** (40/40) | **0.9333** |
| **Relative Performance Delta** | **+12.5%** | **0.0%** | **+0.0667** |

*Key finding*: Dense semantic embeddings successfully resolved heavy syntactic paraphrases (e.g., *"biome spans extensively across"* $\rightarrow$ *"covers most of the Amazon basin"*) where exact keyword overlap dropped to near zero.

---

## 3. End-to-End Verification Performance vs Baseline

### 3.1 Overall Verification Metrics

| Evaluation Metric | Full Semantic Pipeline | Lexical Baseline | Delta (Gain) |
|---|---|---|---|
| **Overall Accuracy** | **80.00%** (32/40) | **67.50%** (27/40) | **+12.50%** |
| **Macro Precision** | **76.07%** | 62.14% | **+13.93%** |
| **Macro Recall** | **80.09%** | 67.82% | **+12.27%** |
| **Macro F1-Score** | **76.17%** | 63.99% | **+12.18%** |
| **Weighted F1-Score** | **80.20%** | 65.53% | **+14.67%** |

### 3.2 Per-Class Performance Breakdown

| Ground Truth Class | Support | Full Precision | Full Recall | Full F1 | Baseline Precision | Baseline Recall | Baseline F1 |
|---|---|---|---|---|---|---|---|
| **Supported** | 21 | **100.00%** | 85.71% | **92.31%** | 76.19% | 76.19% | 76.19% |
| **Contradicted** | 8 | **61.54%** | **100.00%** | **76.19%** | 72.73% | 100.00% | 84.21% |
| **Unverified** | 11 | **66.67%** | 54.55% | **60.00%** | 37.50% | 27.27% | 31.58% |

---

## 4. Multiclass 3x3 Confusion Matrices

### 4.1 Full Semantic Pipeline Confusion Matrix

```
                    Predicted:
               Supported  Contradicted  Unverified  | Total
True Supported     18           0            3      |   21
True Contradicted   0           8            0      |    8
True Unverified     0           5            6      |   11
---------------------------------------------------+-----
Total Predicted    18          13            9      |   40
```

- **Zero False Contradictions for True Facts**: The system never labeled an actually supported claim as contradicted (0/21). When unsure, it safely attenuated to `unverified` (3/21).
- **100% Hallucination Recall**: All 8 actually contradicted statements were caught with zero false negatives (8/8).

### 4.2 Baseline Confusion Matrix (Without Semantic Retrieval)

```
                    Predicted:
               Supported  Contradicted  Unverified  | Total
True Supported     16           0            5      |   21
True Contradicted   0           8            0      |    8
True Unverified     5           3            3      |   11
---------------------------------------------------+-----
Total Predicted    21          11            8      |   40
```

---

## 5. Performance by Robustness Stress Category

Performance measured across all 8 stress categories (5 samples each):

| Robustness Category | Full Pipeline Accuracy | Baseline Accuracy | Delta | Primary Failure Mode |
|---|---|---|---|---|
| `contradicted_hallucination` | **100.0%** (5/5) | **100.0%** (5/5) | 0.0% | None (Flawless detection) |
| `noisy_ambiguous` | **100.0%** (5/5) | **100.0%** (5/5) | 0.0% | None (Preamble cleanly stripped) |
| `supported_factual` | **80.0%** (4/5) | **80.0%** (4/5) | 0.0% | Threshold Boundary Attenuation |
| `paraphrased` | **80.0%** (4/5) | **40.0%** (2/5) | **+40.0%** | Lexical overlap misses syntax variations |
| `numerical_temporal` | **80.0%** (4/5) | **80.0%** (4/5) | 0.0% | Subtle temporal boundary |
| `long_multiclaim` | **80.0%** (4/5) | **80.0%** (4/5) | 0.0% | Speculative claim marked contradicted |
| `insufficient_evidence` | **60.0%** (3/5) | **60.0%** (3/5) | 0.0% | Negative polarity in evidence |
| `conflicting_evidence` | **60.0%** (3/5) | **0.0%** (0/5) | **+60.0%** | Baseline lacks multi-source conflict logic |

---

## 6. Binary Hallucination Detection (Positive = Contradicted)

Focusing on the specific task of identifying AI hallucinations (contradicted claims):

| Metric | Full Semantic Pipeline | Lexical Baseline |
|---|---|---|
| True Positives ($TP$) | **8** | 8 |
| False Positives ($FP$) | **5** | 3 |
| True Negatives ($TN$) | **27** | 29 |
| False Negatives ($FN$) | **0** | 0 |
| **Sensitivity / Recall** | **100.00%** | 100.00% |
| **Specificity** | **84.38%** | 90.62% |
| **Precision** | **61.54%** | 72.73% |
| **F1-Score** | **76.19%** | 84.21% |
| **Balanced Accuracy** | **92.19%** | 95.31% |

*Interpretation*: The full pipeline prioritized high recall (zero missed hallucinations) over precision. All 5 false positives were unverified/speculative claims whose evidence contained strong negative assertions (e.g. *"no space probe has ever found fossils"*).

---

## 7. Visual Charts

### 7.1 Accuracy Comparison: Full Pipeline vs Baseline

```
Category                     Full Pipeline         Baseline
contradicted_hallucination  [====================] 100%   [====================] 100%
noisy_ambiguous             [====================] 100%   [====================] 100%
supported_factual           [================]    80%    [================]    80%
paraphrased                 [================]    80%    [========]            40%  (+40% gain)
numerical_temporal          [================]    80%    [================]    80%
long_multiclaim             [================]    80%    [================]    80%
insufficient_evidence       [============]        60%    [============]        60%
conflicting_evidence        [============]        60%    []                     0%  (+60% gain)
--------------------------------------------------------------------------------------
OVERALL ACCURACY            [================]    80.0%  [=============]       67.5%
```

---

## 8. Detailed Failure Analysis

Out of 40 evaluation instances, the full pipeline exhibited 8 misclassifications. Below is the systematic diagnostic breakdown:

### Case 1: Threshold Boundary Attenuation (`rob-sup-01`)
- **Claim**: *"The Sun is at the center of the Solar System, and all planets orbit around it."*
- **Ground Truth**: `supported` | **Predicted**: `unverified`
- **Model Output**: Entailment: 0.0100, Neutral: 0.9897, Contradiction: 0.0003
- **Root Cause**: The evidence sentence included complex peripheral clauses (*"gravitationally bound system of the Sun and the objects that orbit it"*). The cross-encoder assigned high probability to Neutral (0.9897), failing to exceed the 0.65 entailment threshold.
- **Academic Insight**: Safe failure mode — the model attenuated to Unverified rather than hallucinating a false contradiction.

### Case 2: Negative Evidence Assertion (`rob-unv-01`)
- **Claim**: *"Fossilized microscopic fungi have been discovered beneath the methane dunes of Saturn's moon Titan."*
- **Ground Truth**: `unverified` | **Predicted**: `contradicted`
- **Model Output**: Contradiction: 0.9970, Entailment: 0.0000, Neutral: 0.0029
- **Root Cause**: The reference evidence stated: *"...no space probe or scientific mission has ever detected fossils or biological organisms on Titan."* The cross-encoder interpreted *"no probe has ever detected"* as a direct refutation of *"have been discovered"*, triggering a Contradicted verdict with 99.7% confidence.

### Case 3: Cryptid Negative Evidence (`rob-unv-03`)
- **Claim**: *"A living plesiosaur family currently thrives in the depths of Loch Ness in Scotland."*
- **Ground Truth**: `unverified` | **Predicted**: `contradicted`
- **Model Output**: Contradiction: 0.9949, Entailment: 0.0000, Neutral: 0.0050
- **Root Cause**: The reference evidence stated *"...sightings remain unproven by environmental DNA and sonar investigations..."* The NLI model penalized *"currently thrives"* as mutually exclusive with negative eDNA findings.

### Case 4: Semantic Lexical Divergence (`rob-par-04`)
- **Claim**: *"The Amazon biome spans extensively across the northern portion of the South American continent."*
- **Ground Truth**: `supported` | **Predicted**: `unverified`
- **Model Output**: Neutral: 0.9804, Entailment: 0.0127, Contradiction: 0.0069
- **Root Cause**: The model struggled with the vocabulary substitution of *"biome spans extensively across"* vs evidence *"covers most of the Amazon basin"*, falling back to Neutral (0.9804).

### Case 5: Historical Consequence Clause (`rob-num-01`)
- **Claim**: *"World War II officially concluded in the year 1945 following the surrender of Axis powers."*
- **Ground Truth**: `supported` | **Predicted**: `unverified`
- **Model Output**: Neutral: 0.9716, Entailment: 0.0282, Contradiction: 0.0002
- **Root Cause**: The qualification *"following the surrender of Axis powers"* caused the cross-encoder to withhold direct entailment because the reference passage mentioned the formal signing date (Sept 2, 1945) without explicit lexical match on *"surrender of Axis powers"*.

### Case 6: Speculative Biological Claim (`rob-lng-04`)
- **Claim**: *"Fish communicate using telepathic quantum brainwaves."*
- **Ground Truth**: `unverified` | **Predicted**: `contradicted`
- **Model Output**: Contradiction: 0.9968, Neutral: 0.0030, Entailment: 0.0002
- **Root Cause**: Evidence stating *"telepathic quantum communication is unsupported by biological science"* was strongly weighted as a contradiction by the DeBERTa-v3 cross-encoder.

### Cases 7 & 8: Multi-Source Asymmetric Confidence (`rob-cnf-04`, `rob-cnf-05`)
- **Claims**: Richard III murder order (`rob-cnf-04`) and Minimum Wage unemployment impact (`rob-cnf-05`).
- **Ground Truth**: `unverified` (due to historical/economic debate) | **Predicted**: `contradicted`
- **Root Cause**: In multi-source conflict resolution, the contradictory source produced a 0.99 confidence score while the supporting source's score was slightly below the 0.65 support threshold. Consequently, the asymmetric conflict rule resolved to Contradicted rather than mutual conflict.

---

## 9. Limitations of the Experiment

1. **Test Set Scale ($N=40$)**: The 40 hand-annotated instances provide rigorous diagnostic insights into failure categories, but sample variances are higher than in large 10,000-sample automated benchmarks.
2. **Model Parameter Footprint**: `cross-encoder/nli-deberta-v3-small` (44M parameters) was selected for low-latency CPU feasibility. Larger models (`deberta-v3-large` or fine-tuned LLMs) would likely improve lexical abstraction on complex paraphrases.
3. **Monolingual Focus**: All test samples and reference evidence passages are exclusively in English.
4. **Deterministic Wikipedia Ingestion**: Evidence was retrieved from factual encyclopedic sources; performance on domain-specific corpora (e.g., biomedical clinical notes or legal contracts) was not tested.\n