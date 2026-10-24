from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


ClaimStatusType = Literal["supported", "contradicted", "unverified"]


class ClaimItem(BaseModel):
    id: str = Field(..., description="Unique deterministic identifier for the claim")
    text: str = Field(..., description="Atomic factual claim text")
    sentence_index: Optional[int] = Field(None, description="Index of the sentence the claim originated from")


class EvidenceSnippet(BaseModel):
    id: str = Field(..., description="Evidence identifier")
    text: str = Field(..., description="Evidence snippet text used as premise")
    source_title: str = Field(..., description="Title or name of source document/article")
    source_url: Optional[str] = Field(None, description="URL or file reference path")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Semantic similarity score to the claim")


class ClaimVerificationResult(BaseModel):
    claim_id: str
    claim_text: str
    status: ClaimStatusType = Field(..., description="Supported, Contradicted, or Unverified")
    confidence: float = Field(..., ge=0.0, le=1.0, description="NLI model confidence score")
    evidence: Optional[EvidenceSnippet] = Field(None, description="Primary supporting/refuting evidence snippet")
    all_evidence_candidates: List[EvidenceSnippet] = Field(default_factory=list)
    explanation: str = Field(..., description="Academic justification for why this verdict was reached")


class ReliabilityMetrics(BaseModel):
    total_claims: int
    supported_claims: int
    contradicted_claims: int
    unverified_claims: int
    supported_proportion: float = Field(0.0, ge=0.0, le=1.0, description="Proportion of claims supported")
    contradicted_proportion: float = Field(0.0, ge=0.0, le=1.0, description="Proportion of claims contradicted")
    unverified_proportion: float = Field(0.0, ge=0.0, le=1.0, description="Proportion of claims unverified")
    reliability_index: float = Field(..., ge=0.0, le=100.0, description="Composite reliability score out of 100")
    hallucination_rate: float = Field(..., ge=0.0, le=1.0, description="Proportion of contradicted claims over total")
    unverified_rate: float = Field(0.0, ge=0.0, le=1.0, description="Proportion of unverified claims over total")
    strict_accuracy: float = Field(0.0, ge=0.0, le=100.0, description="Strict proportion of supported claims out of 100")
    formula_definition: Optional[Dict[str, str]] = Field(default=None, description="Explicit mathematical definitions")
    limitations_disclaimer: Optional[str] = Field(default=None, description="Academic limitations statement")


class EvaluationRequest(BaseModel):
    query: Optional[str] = Field(None, max_length=2000, description="The original prompt or question posed to the AI")
    response_text: str = Field(..., min_length=5, max_length=15000, description="The AI-generated response text to evaluate")
    use_web_search: bool = Field(True, description="Whether to query trusted external knowledge (e.g. Wikipedia)")
    reference_context: Optional[str] = Field(None, max_length=25000, description="Optional custom reference document text")


class EvaluationResponse(BaseModel):
    evaluation_id: str
    query: Optional[str] = None
    response_text: str
    claims: List[ClaimVerificationResult]
    metrics: ReliabilityMetrics
    evaluation_time_seconds: float
    timestamp: str
