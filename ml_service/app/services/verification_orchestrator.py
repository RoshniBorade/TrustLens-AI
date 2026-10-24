"""Verification Orchestrator for TrustLens AI.

Coordinates claim extraction, evidence retrieval, and NLI verification,
computing composite academic Reliability Metrics.
"""

import time
import uuid
import datetime
import logging
from typing import Dict, Any, Optional

from app.schemas.contracts import (
    EvaluationRequest,
    EvaluationResponse,
    ClaimVerificationResult,
    ReliabilityMetrics,
    EvidenceSnippet
)
from app.services.claim_extractor import claim_extractor
from app.services.evidence_retriever import evidence_retriever
from app.services.vector_store import vector_store
from app.services.nli_verifier import nli_verifier
from app.services.metrics_calculator import calculate_response_reliability

logger = logging.getLogger("trustlens.orchestrator")


class VerificationOrchestrator:
    """Executes the complete factual evaluation pipeline."""

    def evaluate_response(self, request: EvaluationRequest) -> EvaluationResponse:
        """Executes full evaluation: claim extraction -> retrieval -> NLI verification."""
        start_time = time.time()
        eval_id = f"eval-{uuid.uuid4().hex[:10]}"

        # 1. Ingest optional custom reference context
        if request.reference_context and request.reference_context.strip():
            try:
                vector_store.ingest_document(
                    title=f"User Reference Document ({eval_id})",
                    content=request.reference_context.strip(),
                    doc_id=f"user_ref_{eval_id}"
                )
            except Exception as e:
                logger.warning(f"Could not ingest reference context: {e}")

        # 2. Extract atomic claims
        raw_claims = claim_extractor.extract_claims(
            response_text=request.response_text,
            question=request.query
        )

        # 3. If zero claims extracted (e.g. pure greeting/conversational)
        if not raw_claims:
            duration = round(time.time() - start_time, 3)
            return EvaluationResponse(
                evaluation_id=eval_id,
                query=request.query,
                response_text=request.response_text,
                claims=[],
                metrics=ReliabilityMetrics(
                    total_claims=0,
                    supported_claims=0,
                    contradicted_claims=0,
                    unverified_claims=0,
                    reliability_index=100.0,
                    hallucination_rate=0.0
                ),
                evaluation_time_seconds=duration,
                timestamp=datetime.datetime.utcnow().isoformat()
            )

        # 4. Retrieve evidence per claim
        claims_input = [{"id": c["id"], "text": c["text"]} for c in raw_claims]
        retrieval_results = evidence_retriever.retrieve_for_claims(
            claims=claims_input,
            use_web_search=request.use_web_search,
            top_k=3,
            similarity_threshold=0.55
        )

        # Build retrieval lookup map
        retrieval_map = {r["claim_id"]: r.get("evidence_snippets", []) for r in retrieval_results}

        # 5. Run NLI verification on every claim
        verified_claims = []
        n_supported = 0
        n_contradicted = 0
        n_unverified = 0

        for claim in raw_claims:
            claim_id = claim["id"]
            claim_text = claim["text"]
            snippets = retrieval_map.get(claim_id, [])

            v_result = nli_verifier.verify_claim(
                claim_text=claim_text,
                evidence_snippets=snippets
            )

            status = v_result["status"]
            if status == "supported":
                n_supported += 1
            elif status == "contradicted":
                n_contradicted += 1
            else:
                n_unverified += 1

            # Format primary evidence snippet
            primary_ev = None
            if v_result.get("evidence"):
                ev_data = v_result["evidence"]
                primary_ev = EvidenceSnippet(
                    id=ev_data.get("id", "ev-1"),
                    text=ev_data.get("text", ""),
                    source_title=ev_data.get("source_title", "Unknown Source"),
                    source_url=ev_data.get("source_url"),
                    similarity_score=ev_data.get("similarity_score", 0.0)
                )

            all_candidates = []
            for cand in v_result.get("all_evidence_candidates", []):
                all_candidates.append(EvidenceSnippet(
                    id=cand.get("id", "cand-1"),
                    text=cand.get("text", ""),
                    source_title=cand.get("source_title", "Unknown Source"),
                    source_url=cand.get("source_url"),
                    similarity_score=cand.get("similarity_score", 0.0)
                ))

            verified_claims.append(ClaimVerificationResult(
                claim_id=claim_id,
                claim_text=claim_text,
                status=status,
                confidence=v_result["confidence"],
                evidence=primary_ev,
                all_evidence_candidates=all_candidates,
                explanation=v_result["explanation"]
            ))

        # 6. Calculate composite Reliability Metrics using transparent calculator
        summary = calculate_response_reliability(verified_claims)

        metrics = ReliabilityMetrics(
            total_claims=summary.total_claims,
            supported_claims=summary.supported_count,
            contradicted_claims=summary.contradicted_count,
            unverified_claims=summary.unverified_count,
            supported_proportion=summary.supported_proportion,
            contradicted_proportion=summary.contradicted_proportion,
            unverified_proportion=summary.unverified_proportion,
            reliability_index=summary.reliability_index,
            hallucination_rate=summary.hallucination_rate,
            unverified_rate=summary.unverified_rate,
            strict_accuracy=summary.strict_accuracy,
            formula_definition=summary.formula_definition,
            limitations_disclaimer=summary.limitations_disclaimer,
        )

        duration = round(time.time() - start_time, 3)

        return EvaluationResponse(
            evaluation_id=eval_id,
            query=request.query,
            response_text=request.response_text,
            claims=verified_claims,
            metrics=metrics,
            evaluation_time_seconds=duration,
            timestamp=datetime.datetime.utcnow().isoformat()
        )


orchestrator = VerificationOrchestrator()
