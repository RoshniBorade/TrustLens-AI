"""Unit tests for the Reliability Scoring and Evaluation Metrics module.

Covers:
1. Empty responses (0 claims)
2. 100% Supported responses
3. 100% Contradicted responses
4. 100% Unverified responses
5. Mixed claim distributions with exact proportions
6. Multiclass Confusion Matrix, Precision, Recall, and F1 calculations
7. Macro and Weighted Averaging
8. Binary Hallucination Detection (positive_class = contradicted)
9. Zero-division guards and edge cases
10. Benchmark dataset loading and live evaluation
"""

import pytest
from app.services.metrics_calculator import (
    calculate_response_reliability,
    calculate_benchmark_metrics,
)
from app.services.benchmark_evaluator import benchmark_evaluator


def test_empty_response_metrics():
    """Empty response with 0 claims must return 0 counts and 100% reliability index with safe defaults."""
    summary = calculate_response_reliability([])
    assert summary.total_claims == 0
    assert summary.supported_count == 0
    assert summary.contradicted_count == 0
    assert summary.unverified_count == 0
    assert summary.supported_proportion == 0.0
    assert summary.contradicted_proportion == 0.0
    assert summary.unverified_proportion == 0.0
    assert summary.reliability_index == 100.0
    assert summary.hallucination_rate == 0.0
    assert summary.unverified_rate == 0.0
    assert "reliability_index" in summary.formula_definition
    assert "calibrated" in summary.limitations_disclaimer


def test_all_supported_response():
    """100% supported claims must yield RI=100.0, HR=0.0, UR=0.0, p_s=1.0."""
    claims = ["supported", "supported", "supported", "supported"]
    summary = calculate_response_reliability(claims)
    assert summary.total_claims == 4
    assert summary.supported_count == 4
    assert summary.contradicted_count == 0
    assert summary.unverified_count == 0
    assert summary.supported_proportion == 1.0
    assert summary.contradicted_proportion == 0.0
    assert summary.unverified_proportion == 0.0
    assert summary.reliability_index == 100.0
    assert summary.hallucination_rate == 0.0
    assert summary.strict_accuracy == 100.0


def test_all_contradicted_response():
    """100% contradicted claims must yield RI=0.0, HR=1.0, UR=0.0, p_c=1.0."""
    claims = ["contradicted", "contradicted", "contradicted"]
    summary = calculate_response_reliability(claims)
    assert summary.total_claims == 3
    assert summary.supported_count == 0
    assert summary.contradicted_count == 3
    assert summary.unverified_count == 0
    assert summary.supported_proportion == 0.0
    assert summary.contradicted_proportion == 1.0
    assert summary.unverified_proportion == 0.0
    assert summary.reliability_index == 0.0
    assert summary.hallucination_rate == 1.0
    assert summary.strict_accuracy == 0.0


def test_all_unverified_response():
    """100% unverified claims must yield RI=0.0, HR=0.0, UR=1.0, p_u=1.0."""
    claims = ["unverified", "unverified"]
    summary = calculate_response_reliability(claims)
    assert summary.total_claims == 2
    assert summary.supported_count == 0
    assert summary.contradicted_count == 0
    assert summary.unverified_count == 2
    assert summary.supported_proportion == 0.0
    assert summary.contradicted_proportion == 0.0
    assert summary.unverified_proportion == 1.0
    assert summary.reliability_index == 0.0
    assert summary.hallucination_rate == 0.0
    assert summary.unverified_rate == 1.0


def test_mixed_claim_distribution():
    """Mixed claims: 3 supported, 1 contradicted, 2 unverified.
    Total = 6.
    p_s = 3/6 = 0.5
    p_c = 1/6 = 0.1667
    p_u = 2/6 = 0.3333
    denom = 3 + 1 + 0.5 * 2 = 5.0
    RI = (3 / 5.0) * 100 = 60.0%
    """
    claims = [
        {"status": "supported"},
        {"status": "supported"},
        {"status": "supported"},
        {"status": "contradicted"},
        {"status": "unverified"},
        {"status": "unverified"},
    ]
    summary = calculate_response_reliability(claims)
    assert summary.total_claims == 6
    assert summary.supported_count == 3
    assert summary.contradicted_count == 1
    assert summary.unverified_count == 2
    assert summary.supported_proportion == 0.5
    assert summary.contradicted_proportion == 0.1667
    assert summary.unverified_proportion == 0.3333
    assert summary.reliability_index == 60.0
    assert summary.hallucination_rate == 0.1667
    assert summary.unverified_rate == 0.3333
    # Proportions must sum to approx 1.0
    total_prop = summary.supported_proportion + summary.contradicted_proportion + summary.unverified_proportion
    assert round(total_prop, 2) == 1.0


def test_multiclass_benchmark_perfect_predictions():
    """When y_true == y_pred, all precision/recall/F1/accuracy should equal 1.0."""
    y_true = ["supported", "contradicted", "unverified", "supported", "contradicted"]
    y_pred = ["supported", "contradicted", "unverified", "supported", "contradicted"]

    report = calculate_benchmark_metrics(y_true, y_pred)
    assert report.total_samples == 5
    assert report.accuracy == 1.0
    assert report.macro_avg.precision == 1.0
    assert report.macro_avg.recall == 1.0
    assert report.macro_avg.f1_score == 1.0
    assert report.weighted_avg.f1_score == 1.0

    # Diagonal confusion matrix
    cm = report.confusion_matrix.matrix
    assert cm[0][0] == 2  # supported
    assert cm[1][1] == 2  # contradicted
    assert cm[2][2] == 1  # unverified


def test_multiclass_benchmark_with_errors():
    """Test precision, recall, and confusion matrix with controlled errors."""
    y_true = ["supported", "supported", "contradicted", "unverified"]
    y_pred = ["supported", "unverified", "contradicted", "unverified"]

    report = calculate_benchmark_metrics(y_true, y_pred)
    assert report.total_samples == 4
    assert report.accuracy == 0.75

    # Supported: TP=1, FP=0, FN=1 -> Prec=1.0, Rec=0.5, F1=0.6667
    sup = report.per_class["supported"]
    assert sup.precision == 1.0
    assert sup.recall == 0.5
    assert sup.support == 2

    # Contradicted: TP=1, FP=0, FN=0 -> Prec=1.0, Rec=1.0, F1=1.0
    con = report.per_class["contradicted"]
    assert con.precision == 1.0
    assert con.recall == 1.0

    # Unverified: TP=1, FP=1 (supported pred as unv), FN=0 -> Prec=0.5, Rec=1.0
    unv = report.per_class["unverified"]
    assert unv.precision == 0.5
    assert unv.recall == 1.0


def test_binary_hallucination_metrics():
    """Verify binary hallucination metrics with explicit positive class = contradicted."""
    # True: 2 contradicted, 2 non-contradicted
    # Pred: 1 true contradicted, 1 missed (FN), 1 false alarm (FP), 1 true negative (TN)
    y_true = ["contradicted", "contradicted", "supported", "unverified"]
    y_pred = ["contradicted", "unverified",   "contradicted", "unverified"]

    report = calculate_benchmark_metrics(y_true, y_pred)
    bin_m = report.binary_hallucination_detection

    assert bin_m.positive_class == "contradicted"
    assert bin_m.true_positives == 1
    assert bin_m.false_negatives == 1
    assert bin_m.false_positives == 1
    assert bin_m.true_negatives == 1
    assert bin_m.precision == 0.5
    assert bin_m.recall == 0.5
    assert bin_m.specificity == 0.5
    assert bin_m.f1_score == 0.5


def test_zero_division_safety():
    """Test extreme zero-division case where a class is never predicted and never present."""
    y_true = ["supported", "supported"]
    y_pred = ["supported", "supported"]

    report = calculate_benchmark_metrics(y_true, y_pred)
    assert report.per_class["contradicted"].precision == 0.0
    assert report.per_class["contradicted"].recall == 0.0
    assert report.per_class["contradicted"].f1_score == 0.0
    assert report.per_class["contradicted"].support == 0


def test_reference_benchmark_dataset_loaded():
    """Ensure the 30 curated benchmark samples load and have balanced categories."""
    samples = benchmark_evaluator.load_reference_dataset()
    assert len(samples) == 30

    supported = [s for s in samples if s.ground_truth == "supported"]
    contradicted = [s for s in samples if s.ground_truth == "contradicted"]
    unverified = [s for s in samples if s.ground_truth == "unverified"]

    assert len(supported) == 10
    assert len(contradicted) == 10
    assert len(unverified) == 10
