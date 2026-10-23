"""Pydantic contracts for document ingestion and evidence retrieval."""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class IngestDocumentRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Document title or filename")
    content: str = Field(..., min_length=10, description="Full text content of document")
    url: Optional[str] = Field(None, description="Optional URL or file reference path")
    doc_id: Optional[str] = Field(None, description="Optional custom unique document identifier")


class IngestedDocumentInfo(BaseModel):
    doc_id: str
    title: str
    url: Optional[str] = None
    chunk_count: int
    created_at: str


class IngestDocumentResponse(BaseModel):
    success: bool = True
    document: IngestedDocumentInfo
    total_indexed_documents: int
    total_indexed_chunks: int


class EvidenceSnippetModel(BaseModel):
    id: str = Field(..., description="Unique snippet identifier")
    text: str = Field(..., description="Relevant text passage snippet")
    source_title: str = Field(..., description="Title or filename of the source document")
    source_url: Optional[str] = Field(None, description="Source URL or reference path")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Relevance similarity score (0.0 to 1.0)")
    chunk_index: Optional[int] = Field(None, description="Index of chunk within source document")
    location: Optional[str] = Field(None, description="Chunk location or character span")


class ClaimRetrievalItem(BaseModel):
    id: str = Field(..., description="Claim identifier e.g. claim-01")
    text: str = Field(..., description="Atomic claim statement to find evidence for")


class ClaimRetrievalRequest(BaseModel):
    claims: List[ClaimRetrievalItem] = Field(..., min_length=1, description="List of atomic claims to verify")
    use_web_search: bool = Field(True, description="Whether to query Wikipedia in addition to local corpus")
    top_k: int = Field(3, ge=1, le=10, description="Maximum number of evidence snippets per claim")
    similarity_threshold: float = Field(0.55, ge=0.0, le=1.0, description="Minimum similarity score required to accept evidence")


class ClaimRetrievalResult(BaseModel):
    claim_id: str
    claim_text: str
    has_evidence: bool = Field(..., description="True if at least one snippet met the similarity threshold")
    retrieval_status: Literal["evidence_found", "no_evidence", "below_threshold"]
    evidence_snippets: List[EvidenceSnippetModel] = Field(default_factory=list)
    sources_queried: List[str] = Field(default_factory=list)


class EvidenceRetrievalResponse(BaseModel):
    success: bool = True
    total_claims_evaluated: int
    claims_with_evidence: int
    results: List[ClaimRetrievalResult]
    retrieval_time_ms: float
