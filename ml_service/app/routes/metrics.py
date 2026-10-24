"""Metrics API Routes for TrustLens AI.

Provides endpoints for:
1. Response Reliability Summary calculation
2. Benchmark dataset evaluation and reporting
"""

import logging
from typing import List
from fastapi import APIRouter, status, HTTPException
from app.schemas.metrics_schemas import (
    CalculateSummaryRequest,
    ResponseReliabilitySummary,
    BenchmarkEvaluationRequest,
    BenchmarkReport,
    BenchmarkSample,
)
from app.services.metrics_calculator import calculate_response_reliability
from app.services.benchmark_evaluator import benchmark_evaluator

logger = logging.getLogger("trustlens.metrics_routes")

router = APIRouter(prefix="/api/v1/metrics", tags=["Metrics & Benchmarking"])


@router.post(
    "/calculate-summary",
    response_model=ResponseReliabilitySummary,
    status_code=status.HTTP_200_OK,
    summary="Calculate response reliability summary from raw claim statuses",
    description="Computes counts, proportions, Reliability Index, Hallucination Rate, and explicit formula definitions."
)
async def calculate_summary_endpoint(payload: CalculateSummaryRequest):
    try:
        summary = calculate_response_reliability(payload.claims)
        return summary
    except Exception as exc:
        logger.error(f"Failed to calculate summary: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to calculate reliability summary: {str(exc)}"
        )


@router.get(
    "/benchmark/reference-dataset",
    response_model=List[BenchmarkSample],
    status_code=status.HTTP_200_OK,
    summary="Get curated reference benchmark dataset",
    description="Returns the 30 manually labeled test samples across supported, contradicted, and unverified domains."
)
async def get_reference_dataset():
    samples = benchmark_evaluator.load_reference_dataset()
    return samples


@router.get(
    "/benchmark/baseline-report",
    response_model=BenchmarkReport,
    status_code=status.HTTP_200_OK,
    summary="Run and retrieve baseline benchmark report",
    description="Evaluates the reference dataset with DeBERTa NLI and returns real measured precision, recall, F1, and confusion matrix."
)
async def get_baseline_report():
    try:
        report = benchmark_evaluator.evaluate_dataset(run_live_nli=True)
        return report
    except Exception as exc:
        logger.error(f"Benchmark evaluation failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Benchmark evaluation failed: {str(exc)}"
        )


@router.post(
    "/benchmark/evaluate",
    response_model=BenchmarkReport,
    status_code=status.HTTP_200_OK,
    summary="Evaluate custom or reference benchmark dataset",
    description="Runs precision/recall/F1/confusion matrix evaluation on provided test dataset."
)
async def evaluate_benchmark_endpoint(payload: BenchmarkEvaluationRequest):
    try:
        report = benchmark_evaluator.evaluate_dataset(
            samples=payload.samples,
            run_live_nli=payload.run_live_nli
        )
        return report
    except Exception as exc:
        logger.error(f"Custom benchmark evaluation failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Benchmark evaluation failed: {str(exc)}"
        )
