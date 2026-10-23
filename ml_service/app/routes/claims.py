"""Claim extraction API endpoints for TrustLens AI."""

import time
import logging
from fastapi import APIRouter, status, HTTPException
from app.schemas.claim_extraction import (
    ClaimExtractionRequest,
    ClaimExtractionResponse,
    ExtractedClaim,
)
from app.services.claim_extractor import claim_extractor

logger = logging.getLogger("trustlens.claims")

router = APIRouter(prefix="/api/v1", tags=["Claims"])


@router.post(
    "/extract-claims",
    response_model=ClaimExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract atomic factual claims from AI response",
    description="Decomposes response text into atomic, verifiable factual statements while filtering non-factual filler."
)
@router.post(
    "/claims/extract",
    response_model=ClaimExtractionResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False
)
async def extract_claims_endpoint(payload: ClaimExtractionRequest):
    """Processes question and AI response, returning structured atomic factual claims."""
    start_time = time.time()
    try:
        raw_text = payload.response_text or ""
        total_sentences = len(claim_extractor.segment_sentences(raw_text)) if raw_text.strip() else 0

        raw_claims = claim_extractor.extract_claims(raw_text, question=payload.question)
        claims = [ExtractedClaim(**c) for c in raw_claims]

        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(
            f"Extracted {len(claims)} claims from {total_sentences} sentences in {duration_ms}ms"
        )

        return ClaimExtractionResponse(
            success=True,
            question=payload.question,
            total_claims=len(claims),
            original_sentence_count=total_sentences,
            claims=claims,
            extraction_time_ms=duration_ms
        )
    except Exception as exc:
        logger.error(f"Error during claim extraction: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract claims: {str(exc)}"
        )
