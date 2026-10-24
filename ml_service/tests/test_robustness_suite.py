"""Automated Test Suite for Robustness & Evaluation Benchmark Module."""

import pytest
import os
import json
from app.services.robustness_tester import (
    robustness_tester,
    tokenize_words,
    compute_token_jaccard
)

EXPECTED_CATEGORIES = [
    "supported_factual",
    "contradicted_hallucination",
    "insufficient_evidence",
    "paraphrased",
    "numerical_temporal",
    "noisy_ambiguous",
    "long_multiclaim",
    "conflicting_evidence"
]


class TestRobustnessDataset:
    """Validates structural integrity and balance of the 40-sample benchmark dataset."""

    def test_dataset_exists_and_loads(self):
        dataset = robustness_tester.load_dataset()
        assert len(dataset) == 40, f"Expected 40 samples, got {len(dataset)}"

    def test_category_distribution_is_balanced(self):
        dataset = robustness_tester.load_dataset()
        cat_counts = {}
        for sample in dataset:
            cat = sample["category"]
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

        for cat in EXPECTED_CATEGORIES:
            assert cat in cat_counts, f"Category '{cat}' missing from dataset"
            assert cat_counts[cat] == 5, f"Category '{cat}' has {cat_counts[cat]} samples; expected 5"

    def test_sample_schema_completeness(self):
        dataset = robustness_tester.load_dataset()
        valid_labels = {"supported", "contradicted", "unverified"}

        for s in dataset:
            assert "id" in s and s["id"].startswith("rob-")
            assert "category" in s
            assert "claim_text" in s and len(s["claim_text"]) > 5
            assert "expected_label" in s and s["expected_label"] in valid_labels
            assert "split" in s and s["split"] == "test"
            assert "sources" in s and len(s["sources"]) >= 1

    def test_conflicting_samples_have_opposing_sources(self):
        dataset = robustness_tester.load_dataset()
        conflicts = [s for s in dataset if s["category"] == "conflicting_evidence"]
        assert len(conflicts) == 5

        for c in conflicts:
            assert len(c["sources"]) >= 2, f"Sample {c['id']} must provide at least 2 conflicting sources"
            assert c["expected_label"] == "unverified"


class TestHelperFunctions:
    """Tests tokenization and lexical overlap utilities."""

    def test_tokenize_words(self):
        text = "The Sun is at the center of the Solar System, 1945!"
        tokens = tokenize_words(text)
        assert "sun" in tokens
        assert "center" in tokens
        assert "solar" in tokens
        assert "system" in tokens
        assert "1945" in tokens
        assert "the" not in tokens  # Stopword removed

    def test_compute_token_jaccard_identical(self):
        sim = compute_token_jaccard("Paris is capital of France", "France capital is Paris")
        assert sim == 1.0

    def test_compute_token_jaccard_disjoint(self):
        sim = compute_token_jaccard("apple orange banana", "cat dog elephant")
        assert sim == 0.0

    def test_compute_token_jaccard_partial(self):
        sim = compute_token_jaccard("Jupiter is the largest planet", "Saturn is a large planet")
        assert 0.0 < sim < 1.0


class TestEvaluationFunctions:
    """Tests evaluation computation logic across pipeline stages."""

    def test_claim_extraction_evaluation(self):
        # Test on a small slice of 5 samples
        dataset = robustness_tester.load_dataset()[:5]
        res = robustness_tester.evaluate_claim_extraction(dataset)

        assert "precision" in res
        assert "recall" in res
        assert "f1_score" in res
        assert res["total_gold_claims"] >= 5
        assert res["precision"] >= 0.80
        assert res["recall"] >= 0.80

    def test_retrieval_evaluation(self):
        dataset = robustness_tester.load_dataset()[:8]
        res = robustness_tester.evaluate_retrieval(dataset)

        assert "semantic_pipeline" in res
        assert "lexical_baseline" in res
        sem = res["semantic_pipeline"]
        lex = res["lexical_baseline"]

        assert 0.0 <= sem["hit_at_1"] <= 1.0
        assert 0.0 <= sem["hit_at_3"] <= 1.0
        assert 0.0 <= sem["mrr"] <= 1.0
        assert 0.0 <= lex["hit_at_1"] <= 1.0

    def test_failure_diagnosis_logic(self):
        v_res = {
            "nli_scores": {"contradiction": 0.05, "entailment": 0.40, "neutral": 0.55},
            "evidence": {"text": "Some evidence"}
        }
        diagnosis = robustness_tester._diagnose_failure(
            ground_truth="supported",
            predicted="unverified",
            confidence=0.55,
            category="supported_factual",
            v_res=v_res
        )
        assert "mode" in diagnosis
        assert "cause" in diagnosis
        assert "Threshold Boundary Attenuation" in diagnosis["mode"]
