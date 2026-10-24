"""FastAPI Route for Robustness Testing and Benchmark Evaluation."""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException

from app.services.robustness_tester import robustness_tester

logger = logging.getLogger("trustlens.routes.robustness")

router = APIRouter(prefix="/api/v1/robustness", tags=["Robustness & Benchmarking"])

EXP_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "experiments"
)
RESULTS_PATH = os.path.join(EXP_DIR, "experiment_results.json")
CONFIG_PATH = os.path.join(EXP_DIR, "robustness_config.json")
FAILURES_PATH = os.path.join(EXP_DIR, "failure_analysis.json")


@router.get("/dataset")
def get_robustness_dataset() -> Dict[str, Any]:
    """Returns the 40-sample curated robustness evaluation dataset with category metadata."""
    try:
        dataset = robustness_tester.load_dataset()
        categories = {}
        for sample in dataset:
            cat = sample["category"]
            categories[cat] = categories.get(cat, 0) + 1

        return {
            "total_samples": len(dataset),
            "category_distribution": categories,
            "samples": dataset
        }
    except Exception as e:
        logger.error(f"Failed to load dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results")
def get_latest_results() -> Dict[str, Any]:
    """Returns the latest persisted evaluation metrics, baseline comparisons, and failure logs."""
    if not os.path.exists(RESULTS_PATH):
        raise HTTPException(
            status_code=404,
            detail="No experiment results found. Run POST /api/v1/robustness/run to execute evaluation."
        )

    try:
        with open(RESULTS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        logger.error(f"Failed to read results: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/failures")
def get_failure_analysis() -> List[Dict[str, Any]]:
    """Returns categorized failure cases and root-cause diagnostics."""
    if not os.path.exists(FAILURES_PATH):
        raise HTTPException(status_code=404, detail="No failure analysis log found.")

    try:
        with open(FAILURES_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/run")
def run_evaluation() -> Dict[str, Any]:
    """Executes live evaluation across the 40 robustness samples and updates persisted outputs."""
    try:
        dataset = robustness_tester.load_dataset()
        extraction_res = robustness_tester.evaluate_claim_extraction(dataset)
        retrieval_res = robustness_tester.evaluate_retrieval(dataset)
        full_metrics, base_metrics, failure_cases, cat_stats = robustness_tester.evaluate_verification(dataset)

        os.makedirs(EXP_DIR, exist_ok=True)
        results_payload = {
            "total_samples": len(dataset),
            "claim_extraction": {
                "precision": extraction_res["precision"],
                "recall": extraction_res["recall"],
                "f1_score": extraction_res["f1_score"]
            },
            "evidence_retrieval": retrieval_res,
            "claim_verification_full_pipeline": full_metrics,
            "claim_verification_baseline": base_metrics,
            "per_category_breakdown": cat_stats,
            "failure_analysis_summary": {
                "total_failures": len(failure_cases),
                "failure_rate": round(len(failure_cases) / len(dataset), 4),
                "failures": failure_cases
            }
        }

        with open(RESULTS_PATH, "w", encoding="utf-8") as f:
            json.dump(results_payload, f, indent=2)

        with open(FAILURES_PATH, "w", encoding="utf-8") as f:
            json.dump(failure_cases, f, indent=2)

        return results_payload
    except Exception as e:
        logger.error(f"Evaluation run failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
