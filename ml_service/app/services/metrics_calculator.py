"""Metrics Calculator Service for TrustLens AI.

Provides transparent calculation of:
1. Individual Response Reliability Summaries (counts, proportions, RI, explicit formulas)
2. System-Performance Benchmark Metrics (confusion matrix, precision, recall, F1, binary hallucination detection)
"""

import math
from typing import List, Dict, Any, Optional, Sequence
from app.schemas.metrics_schemas import (
    ResponseReliabilitySummary,
    ClassPerformanceMetrics,
    ConfusionMatrixData,
    BinaryDetectionMetrics,
    BenchmarkReport,
)

FORMULA_DEFINITIONS = {
    "reliability_index": "N_supported / (N_supported + N_contradicted + 0.5 * N_unverified) * 100",
    "hallucination_rate": "N_contradicted / N_total",
    "unverified_rate": "N_unverified / N_total",
    "strict_accuracy": "N_supported / N_total * 100",
    "supported_proportion": "N_supported / N_total",
    "contradicted_proportion": "N_contradicted / N_total",
    "unverified_proportion": "N_unverified / N_total",
}

LIMITATIONS_DISCLAIMER = (
    "The Reliability Index is an empirical grounding metric measuring evidence corroboration. "
    "It is NOT a calibrated Bayesian probability of absolute truth. Unverified claims represent "
    "an absence of confirming or refuting evidence within retrieved corpora and must not be treated as falsehoods."
)


def calculate_response_reliability(claims: Sequence[Any]) -> ResponseReliabilitySummary:
    """Calculates factual reliability summary for an individual evaluated response."""
    total = len(claims)
    n_supported = 0
    n_contradicted = 0
    n_unverified = 0

    for item in claims:
        # Extract status from string, dict, or object attribute
        if isinstance(item, str):
            status = item.lower().strip()
        elif isinstance(item, dict):
            status = str(item.get("status", "unverified")).lower().strip()
        else:
            status = str(getattr(item, "status", "unverified")).lower().strip()

        if status == "supported":
            n_supported += 1
        elif status == "contradicted":
            n_contradicted += 1
        else:
            n_unverified += 1

    if total == 0:
        return ResponseReliabilitySummary(
            total_claims=0,
            supported_count=0,
            contradicted_count=0,
            unverified_count=0,
            supported_proportion=0.0,
            contradicted_proportion=0.0,
            unverified_proportion=0.0,
            reliability_index=100.0,
            hallucination_rate=0.0,
            unverified_rate=0.0,
            strict_accuracy=100.0,
            formula_definition=FORMULA_DEFINITIONS,
            limitations_disclaimer=LIMITATIONS_DISCLAIMER,
        )

    p_s = round(n_supported / total, 4)
    p_c = round(n_contradicted / total, 4)
    p_u = round(n_unverified / total, 4)

    # Reliability Index formula with partial unverified penalty
    denom = n_supported + n_contradicted + (0.5 * n_unverified)
    if denom > 0:
        reliability_index = round((n_supported / denom) * 100.0, 2)
    else:
        reliability_index = 0.0

    hallucination_rate = p_c
    unverified_rate = p_u
    strict_acc = round((n_supported / total) * 100.0, 2)

    return ResponseReliabilitySummary(
        total_claims=total,
        supported_count=n_supported,
        contradicted_count=n_contradicted,
        unverified_count=n_unverified,
        supported_proportion=p_s,
        contradicted_proportion=p_c,
        unverified_proportion=p_u,
        reliability_index=reliability_index,
        hallucination_rate=hallucination_rate,
        unverified_rate=unverified_rate,
        strict_accuracy=strict_acc,
        formula_definition=FORMULA_DEFINITIONS,
        limitations_disclaimer=LIMITATIONS_DISCLAIMER,
    )


def calculate_benchmark_metrics(
    y_true: Sequence[str],
    y_pred: Sequence[str],
    labels: Optional[List[str]] = None,
    evaluation_protocol: str = "3-class multiclass + binary hallucination detection",
) -> BenchmarkReport:
    """Computes academic benchmark metrics from true and predicted label sequences."""
    import datetime

    if len(y_true) != len(y_pred):
        raise ValueError(f"Length mismatch: len(y_true)={len(y_true)} != len(y_pred)={len(y_pred)}")

    if labels is None:
        labels = ["supported", "contradicted", "unverified"]

    n_samples = len(y_true)
    label_to_idx = {l: i for i, l in enumerate(labels)}
    num_classes = len(labels)

    # Initialize Confusion Matrix [rows = true, cols = pred]
    cm = [[0 for _ in range(num_classes)] for _ in range(num_classes)]

    for yt, yp in zip(y_true, y_pred):
        yt_norm = str(yt).lower().strip()
        yp_norm = str(yp).lower().strip()
        if yt_norm in label_to_idx and yp_norm in label_to_idx:
            cm[label_to_idx[yt_norm]][label_to_idx[yp_norm]] += 1

    # Per-Class Metrics
    per_class: Dict[str, ClassPerformanceMetrics] = {}
    total_tp = 0

    for i, lbl in enumerate(labels):
        tp = cm[i][i]
        fp = sum(cm[r][i] for r in range(num_classes) if r != i)
        fn = sum(cm[i][c] for c in range(num_classes) if c != i)
        support = sum(cm[i][c] for c in range(num_classes))
        total_tp += tp

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        per_class[lbl] = ClassPerformanceMetrics(
            precision=round(prec, 4),
            recall=round(rec, 4),
            f1_score=round(f1, 4),
            support=support,
        )

    # Accuracy
    accuracy = round(total_tp / n_samples, 4) if n_samples > 0 else 0.0

    # Macro Averages (unweighted mean)
    macro_p = sum(m.precision for m in per_class.values()) / num_classes if num_classes > 0 else 0.0
    macro_r = sum(m.recall for m in per_class.values()) / num_classes if num_classes > 0 else 0.0
    macro_f1 = sum(m.f1_score for m in per_class.values()) / num_classes if num_classes > 0 else 0.0

    macro_avg = ClassPerformanceMetrics(
        precision=round(macro_p, 4),
        recall=round(macro_r, 4),
        f1_score=round(macro_f1, 4),
        support=n_samples,
    )

    # Weighted Averages (weighted by support)
    weighted_p = sum(m.precision * m.support for m in per_class.values()) / n_samples if n_samples > 0 else 0.0
    weighted_r = sum(m.recall * m.support for m in per_class.values()) / n_samples if n_samples > 0 else 0.0
    weighted_f1 = sum(m.f1_score * m.support for m in per_class.values()) / n_samples if n_samples > 0 else 0.0

    weighted_avg = ClassPerformanceMetrics(
        precision=round(weighted_p, 4),
        recall=round(weighted_r, 4),
        f1_score=round(weighted_f1, 4),
        support=n_samples,
    )

    # Binary Hallucination Detection (Positive class = "contradicted")
    target_pos = "contradicted"
    bin_tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == target_pos and yp == target_pos)
    bin_fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt != target_pos and yp == target_pos)
    bin_tn = sum(1 for yt, yp in zip(y_true, y_pred) if yt != target_pos and yp != target_pos)
    bin_fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == target_pos and yp != target_pos)

    bin_prec = bin_tp / (bin_tp + bin_fp) if (bin_tp + bin_fp) > 0 else 0.0
    bin_rec = bin_tp / (bin_tp + bin_fn) if (bin_tp + bin_fn) > 0 else 0.0
    bin_spec = bin_tn / (bin_tn + bin_fp) if (bin_tn + bin_fp) > 0 else 0.0
    bin_f1 = (2 * bin_prec * bin_rec) / (bin_prec + bin_rec) if (bin_prec + bin_rec) > 0 else 0.0
    bin_bal_acc = (bin_rec + bin_spec) / 2.0

    binary_metrics = BinaryDetectionMetrics(
        positive_class=target_pos,
        true_positives=bin_tp,
        false_positives=bin_fp,
        true_negatives=bin_tn,
        false_negatives=bin_fn,
        precision=round(bin_prec, 4),
        recall=round(bin_rec, 4),
        specificity=round(bin_spec, 4),
        f1_score=round(bin_f1, 4),
        balanced_accuracy=round(bin_bal_acc, 4),
    )

    cm_data = ConfusionMatrixData(
        labels=labels,
        matrix=cm,
        row_labels=[f"True: {l}" for l in labels],
        col_labels=[f"Pred: {l}" for l in labels],
    )

    return BenchmarkReport(
        total_samples=n_samples,
        accuracy=accuracy,
        per_class=per_class,
        macro_avg=macro_avg,
        weighted_avg=weighted_avg,
        confusion_matrix=cm_data,
        binary_hallucination_detection=binary_metrics,
        evaluation_protocol=evaluation_protocol,
        disclaimer="Benchmark metrics reflect performance against labeled reference test instances under standard NLI decision boundaries.",
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    )
