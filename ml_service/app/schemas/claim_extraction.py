"""Pydantic contracts for claim extraction API."""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field

ClaimType = Literal["factual", "numerical", "temporal"]


class ClaimExtractionRequest(BaseModel):
    question: Optional[str] = Field(None, description="Original question or prompt given to the AI")
    response_text: str = Field(..., min_length=0, description="The AI-generated response text to decompose into claims")


class ExtractedClaim(BaseModel):
    id: str = Field(..., description="Deterministic, unique claim identifier (e.g. claim-01)")
    text: str = Field(..., description="Atomic, self-contained factual claim")
    original_sentence: str = Field(..., description="Original sentence from which the claim was extracted")
    sentence_index: int = Field(..., description="0-based index of the original sentence in the response")
    claim_type: ClaimType = Field("factual", description="Category of factual claim: factual, numerical, or temporal")
    has_entities: bool = Field(False, description="Whether entities, numbers, or dates were identified in the claim")


class ClaimExtractionResponse(BaseModel):
    success: bool = Field(True, description="Indicates if extraction completed successfully")
    question: Optional[str] = Field(None, description="Echo of original question if provided")
    total_claims: int = Field(..., description="Total count of atomic factual claims extracted")
    original_sentence_count: int = Field(..., description="Total sentences analyzed from response text")
    claims: List[ExtractedClaim] = Field(default_factory=list, description="List of atomic claims")
    extraction_time_ms: float = Field(..., description="Processing latency in milliseconds")
