# Factual Reliability Scoring & System Evaluation Methodology

## 1. Overview & Academic Objectives

TrustLens-AI avoids black-box, ungrounded single-score evaluations. Instead, the platform decouples:
1. **Per-Response Reliability Summaries**: An empirical evidence corroboration audit for a single AI response based on its atomic decomposed claims.
2. **System-Performance Benchmark Metrics**: Standard machine learning evaluation (Precision, Recall, F1, Confusion Matrix) measuring the verification engine's accuracy against a manually labeled test dataset.

---

## 2. Per-Response Reliability Calculation

For any evaluated response decomposed into $N_{\text{total}}$ atomic claims:

### A. Categorical Counts & Proportions
Each claim is mapped to exactly one of three mutually exclusive classes:
- **Supported ($N_s$)**: Claims where retrieved evidence entails the claim with confidence $\ge 0.75$.
- **Contradicted ($N_c$)**: Claims where retrieved evidence refutes the claim with confidence $\ge 0.75$ (direct factual hallucinations).
- **Unverified ($N_u$)**: Claims where evidence is absent, irrelevant, below threshold, or conflicting.

The respective proportions are:
$$p_s = \frac{N_s}{N_{\text{total}}}, \quad p_c = \frac{N_c}{N_{\text{total}}}, \quad p_u = \frac{N_u}{N_{\text{total}}}$$

$$\sum (p_s + p_c + p_u) = 1.0 \quad \text{for } N_{\text{total}} > 0$$

### B. The Reliability Index ($RI$) Formula
$$\text{Reliability Index} = \begin{cases} 
100.0 & \text{if } N_{\text{total}} = 0 \\
\frac{N_s}{N_s + N_c + 0.5 \times N_u} \times 100 & \text{if } (N_s + N_c + 0.5 \times N_u) > 0 \\
0.0 & \text{otherwise}
\end{cases}$$

#### Rationale for Weighting & Denominator:
- **Numerator ($N_s$)**: Only factually substantiated claims contribute positively to reliability.
- **Full Contradiction Penalty ($1.0 \times N_c$)**: Confirmed hallucinations penalize the score at full strength.
- **Partial Unverified Weight ($0.5 \times N_u$)**: 
  - Treating Unverified as false ($1.0 \times N_u$) is methodologically invalid because the absence of evidence in a knowledge base does not prove falsehood.
  - Ignoring Unverified entirely (calculating $\frac{N_s}{N_s + N_c}$) dangerously incentivizes models to invent niche, obscure statements that cannot be checked.
  - Applying a $0.5$ penalty in the denominator balances these extremes: unverified statements reflect lack of evidence grounding without falsely labeling them as proven lies.

### C. Auxiliary Reliability Rates
- **Hallucination Rate ($HR$)**: $HR = \frac{N_c}{N_{\text{total}}}$ (Proportion of claims directly refuted).
- **Unverified Rate ($UR$)**: $UR = \frac{N_u}{N_{\text{total}}}$ (Proportion of claims lacking evidence).
- **Strict Accuracy ($SA$)**: $SA = \frac{N_s}{N_{\text{total}}} \times 100$ (Percentage of claims with strict empirical proof).

### D. Limitations & Caveats
1. **Not a Calibrated Probability of Truth**: The Reliability Index measures *degree of empirical evidence corroboration* against indexed sources, not a Bayesian posterior probability that the full response is universally true.
2. **Corpus Dependency**: If an indexed corpus lacks domain-specific knowledge, true claims may fall into the *Unverified* category.
3. **Discrete Claims vs. Holistic Pragmatics**: Evaluating atomic claims preserves fine-grained transparency, but does not capture conversational tone or narrative coherence.

---

## 3. System-Performance Benchmark Evaluation

To evaluate the reliability of the TrustLens verification pipeline itself, the system is evaluated against a curated ground-truth test dataset ($y_{\text{true}}$ vs $y_{\text{pred}}$).

### A. Multiclass Evaluation Protocol (3-Class)
- **Labels**: `['supported', 'contradicted', 'unverified']`
- **Confusion Matrix ($3 \times 3$)**:
  - $C_{i,j}$ counts samples where True Class $= i$ and Predicted Class $= j$.
- **Per-Class Metrics**:
  $$\text{Precision}_k = \frac{TP_k}{TP_k + FP_k}, \quad \text{Recall}_k = \frac{TP_k}{TP_k + FN_k}, \quad \text{F1}_k = 2 \times \frac{\text{Precision}_k \times \text{Recall}_k}{\text{Precision}_k + \text{Recall}_k}$$
- **Macro Average**:
  $$\text{Macro-F1} = \frac{1}{3} \sum_{k=1}^3 \text{F1}_k$$
  Treats each class equally, highlighting failures on rare or difficult classes (e.g. unverified/contradicted).
- **Weighted Average**:
  $$\text{Weighted-F1} = \sum_{k=1}^3 \left(\frac{\text{Support}_k}{N}\right) \text{F1}_k$$
- **Overall Accuracy**:
  $$\text{Accuracy} = \frac{\sum_k TP_k}{N}$$

### B. Binary Hallucination Detection Protocol
- **Target Positive Class**: `contradicted` (identifying factual hallucinations).
- **Metrics**:
  - **Precision**: $\frac{TP}{TP + FP}$ (Avoidance of false hallucination alarms).
  - **Recall (Sensitivity)**: $\frac{TP}{TP + FN}$ (Rate of successfully captured hallucinations).
  - **Specificity**: $\frac{TN}{TN + FP}$ (Rate of non-hallucinations correctly identified).
  - **F1-Score**: Harmonic mean of Precision and Recall.
  - **Balanced Accuracy**: $\frac{\text{Recall} + \text{Specificity}}{2}$.

---

## 4. Reference Benchmark Dataset

The system includes a 30-instance standardized benchmark dataset (`ml_service/data/benchmark_dataset.json`):
- **10 Supported Instances**: Covering geography, physics, astronomy, history, chemistry, biology, and computer science.
- **10 Contradicted Instances**: Blatant misconceptions, historical errors, and scientific hallucinations.
- **10 Unverified Instances**: Folklore, speculative astrobiology, unrecorded history, and untestable cosmological hypotheses.

Evaluated live via:
`GET /api/v1/metrics/benchmark/baseline-report`
