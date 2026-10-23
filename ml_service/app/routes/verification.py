"""Verification API Routes for TrustLens AI."""

import logging
from fastapi import APIRouter, status, HTTPException
from app.schemas.contracts import EvaluationRequest, EvaluationResponse
from app.services.verification_orchestrator import orchestrator

logger = logging.getLogger("trustlens.verification_routes")

router = APIRouter(prefix="/api/v1", tags=["Verification"])


@router.post(
    "/verify",
    response_model=EvaluationResponse,
    status_code=status.HTTP_200_OK,
    summary="Run full atomic claim extraction, evidence retrieval, and NLI verification",
    description="Decomposes AI response into atomic claims, retrieves evidence, performs DeBERTa NLI inference, and calculates the Reliability Index."
)
@router.post(
    "/evaluations/verify",
    response_model=EvaluationResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False
)
async def verify_endpoint(payload: EvaluationRequest):
    """Executes the factual verification pipeline."""
    try:
        response = orchestrator.evaluate_response(payload)
        return response
    except Exception as exc:
        logger.error(f"Evaluation pipeline failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification pipeline failed: {str(exc)}"
        )
