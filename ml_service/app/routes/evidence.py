"""Evidence Ingestion and Retrieval Endpoints for TrustLens AI."""

import time
import logging
from typing import List
from fastapi import APIRouter, status, HTTPException
from app.schemas.evidence_schemas import (
    IngestDocumentRequest,
    IngestDocumentResponse,
    IngestedDocumentInfo,
    ClaimRetrievalRequest,
    ClaimRetrievalResult,
    EvidenceRetrievalResponse,
)
from app.services.vector_store import vector_store
from app.services.evidence_retriever import evidence_retriever

logger = logging.getLogger("trustlens.evidence_routes")

router = APIRouter(prefix="/api/v1/evidence", tags=["Evidence Retrieval"])


@router.post(
    "/ingest",
    response_model=IngestDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a reference document into local vector store"
)
async def ingest_document_endpoint(payload: IngestDocumentRequest):
    """Chunks and indexes a reference text document into ChromaDB."""
    try:
        doc_info = vector_store.ingest_document(
            title=payload.title,
            content=payload.content,
            url=payload.url,
            doc_id=payload.doc_id
        )
        stats = vector_store.get_stats()
        return IngestDocumentResponse(
            success=True,
            document=IngestedDocumentInfo(**doc_info),
            total_indexed_documents=stats["total_documents"],
            total_indexed_chunks=stats["total_chunks"]
        )
    except Exception as exc:
        logger.error(f"Ingestion failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document ingestion failed: {str(exc)}"
        )


@router.get(
    "/sources",
    response_model=List[IngestedDocumentInfo],
    summary="List all indexed reference documents in vector store"
)
async def list_sources_endpoint():
    """Returns list of all reference sources currently indexed."""
    sources = vector_store.list_sources()
    return [IngestedDocumentInfo(**s) for s in sources]


@router.post(
    "/retrieve",
    response_model=EvidenceRetrievalResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve evidence passages separately for each claim"
)
async def retrieve_evidence_endpoint(payload: ClaimRetrievalRequest):
    """Performs per-claim semantic evidence retrieval across vector index and Wikipedia."""
    start_time = time.time()
    try:
        claims_input = [{"id": c.id, "text": c.text} for c in payload.claims]
        raw_results = evidence_retriever.retrieve_for_claims(
            claims=claims_input,
            use_web_search=payload.use_web_search,
            top_k=payload.top_k,
            similarity_threshold=payload.similarity_threshold
        )

        results = [ClaimRetrievalResult(**r) for r in raw_results]
        claims_with_evidence = sum(1 for r in results if r.has_evidence)
        duration_ms = round((time.time() - start_time) * 1000, 2)

        return EvidenceRetrievalResponse(
            success=True,
            total_claims_evaluated=len(results),
            claims_with_evidence=claims_with_evidence,
            results=results,
            retrieval_time_ms=duration_ms
        )
    except Exception as exc:
        logger.error(f"Retrieval failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evidence retrieval failed: {str(exc)}"
        )
