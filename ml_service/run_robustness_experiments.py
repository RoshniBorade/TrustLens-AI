"""CLI Reproducibility Runner for TrustLens AI Robustness Experiments.

Executes end-to-end evaluation, logs metrics live, and persists:
- experiments/robustness_config.json
- experiments/predictions_full_pipeline.json
- experiments/predictions_baseline.json
- experiments/experiment_results.json
"""

import os
import sys
import json
import time
import datetime

# Ensure ml_service app is on path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.services.robustness_tester import robustness_tester

EXP_DIR = os.path.join(BASE_DIR, "experiments")
os.makedirs(EXP_DIR, exist_ok=True)


def main():
    print("=" * 70)
    print("  TrustLens AI: Reproducible Robustness & Evaluation Benchmark Runner")
    print("=" * 70)

    start_time = time.time()
    timestamp = datetime.datetime.utcnow().isoformat()

    # 1. Load Dataset
    print("\n[1/5] Loading 40-sample curated robustness test dataset...")
    dataset = robustness_tester.load_dataset()
    print(f"  Loaded {len(dataset)} samples across 8 stress categories.")

    # 2. Save Experiment Configuration
    config = {
        "experiment_name": "TrustLens_Robustness_Evaluation_v1",
        "timestamp": timestamp,
        "nli_model": "cross-encoder/nli-deberta-v3-small",
        "nli_label_mapping": {0: "contradiction", 1: "entailment", 2: "neutral"},
        "support_threshold": 0.65,
        "contradiction_threshold": 0.65,
        "embedding_model": "all-MiniLM-L6-v2 (ONNX)",
        "vector_db": "ChromaDB (cosine space)",
        "retrieval_top_k": 3,
        "retrieval_similarity_threshold": 0.55,
        "baseline_retriever": "Lexical Keyword Overlap (Jaccard token matching)",
        "hardware": "CPU (Optimized Torch 4-thread execution)",
        "random_seed": 42
    }
    config_file = os.path.join(EXP_DIR, "robustness_config.json")
    with open(config_file, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    print(f"  Configuration saved to {config_file}")

    # 3. Evaluate Claim Extraction
    print("\n[2/5] Evaluating Atomic Claim Extraction Service...")
    extraction_results = robustness_tester.evaluate_claim_extraction(dataset)
    print(f"  Gold Claims:      {extraction_results['total_gold_claims']}")
    print(f"  Extracted Claims: {extraction_results['total_extracted_claims']}")
    print(f"  True Positives:   {extraction_results['true_positive_matches']}")
    print(f"  Precision:        {extraction_results['precision'] * 100:.2f}%")
    print(f"  Recall:           {extraction_results['recall'] * 100:.2f}%")
    print(f"  F1-Score:         {extraction_results['f1_score'] * 100:.2f}%")

    # 4. Evaluate Evidence Retrieval (Full vs Baseline)
    print("\n[3/5] Evaluating Evidence Retrieval (Semantic vs Lexical Baseline)...")
    retrieval_results = robustness_tester.evaluate_retrieval(dataset)
    sem = retrieval_results["semantic_pipeline"]
    lex = retrieval_results["lexical_baseline"]
    print(f"  Semantic Vector Retrieval -> Hit@1: {sem['hit_at_1']*100:.1f}%, Hit@3: {sem['hit_at_3']*100:.1f}%, MRR: {sem['mrr']:.4f}")
    print(f"  Lexical Keyword Baseline  -> Hit@1: {lex['hit_at_1']*100:.1f}%, Hit@3: {lex['hit_at_3']*100:.1f}%, MRR: {lex['mrr']:.4f}")

    # 5. Live NLI Claim Verification (Full vs Baseline)
    print("\n[4/5] Executing Live NLI Claim Verification (DeBERTa-v3 cross-encoder)...")
    full_metrics, base_metrics, failure_cases, category_stats = robustness_tester.evaluate_verification(dataset)

    print(f"\n--- Verification Performance ---")
    print(f"  Full Semantic Pipeline Accuracy: {full_metrics['accuracy'] * 100:.2f}%")
    print(f"  Lexical Baseline Accuracy:       {base_metrics['accuracy'] * 100:.2f}%")
    print(f"  Full Pipeline Macro F1:          {full_metrics['macro_avg']['f1_score'] * 100:.2f}%")
    print(f"  Baseline Macro F1:               {base_metrics['macro_avg']['f1_score'] * 100:.2f}%")

    # Binary Hallucination Detection
    bin_f = full_metrics["binary_hallucination_detection"]
    bin_b = base_metrics["binary_hallucination_detection"]
    print(f"\n--- Binary Hallucination Detection (Positive = Contradicted) ---")
    print(f"  Full Pipeline -> Precision: {bin_f['precision']*100:.1f}%, Recall: {bin_f['recall']*100:.1f}%, F1: {bin_f['f1_score']*100:.1f}%")
    print(f"  Baseline      -> Precision: {bin_b['precision']*100:.1f}%, Recall: {bin_b['recall']*100:.1f}%, F1: {bin_b['f1_score']*100:.1f}%")

    # 6. Save Predictions and Results
    print("\n[5/5] Persisting Predictions, Metric Outputs and Failure Logs...")
    predictions_full_file = os.path.join(EXP_DIR, "predictions_full_pipeline.json")
    with open(predictions_full_file, "w", encoding="utf-8") as f:
        json.dump(category_stats, f, indent=2)

    failures_file = os.path.join(EXP_DIR, "failure_analysis.json")
    with open(failures_file, "w", encoding="utf-8") as f:
        json.dump(failure_cases, f, indent=2)

    results_payload = {
        "timestamp": timestamp,
        "elapsed_seconds": round(time.time() - start_time, 2),
        "total_samples": len(dataset),
        "claim_extraction": {
            "precision": extraction_results["precision"],
            "recall": extraction_results["recall"],
            "f1_score": extraction_results["f1_score"],
            "gold_claims": extraction_results["total_gold_claims"],
            "extracted_claims": extraction_results["total_extracted_claims"],
            "matched_claims": extraction_results["true_positive_matches"]
        },
        "evidence_retrieval": retrieval_results,
        "claim_verification_full_pipeline": full_metrics,
        "claim_verification_baseline": base_metrics,
        "per_category_breakdown": category_stats,
        "failure_analysis_summary": {
            "total_failures": len(failure_cases),
            "failure_rate": round(len(failure_cases) / len(dataset), 4),
            "failures": failure_cases
        }
    }

    results_file = os.path.join(EXP_DIR, "experiment_results.json")
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(results_payload, f, indent=2)

    print(f"  Saved Full Results to {results_file}")
    print(f"  Saved Failure Diagnostics ({len(failure_cases)} cases) to {failures_file}")
    print(f"\nAll experiments completed successfully in {time.time() - start_time:.2f} seconds.")
    print("=" * 70)


if __name__ == "__main__":
    main()
