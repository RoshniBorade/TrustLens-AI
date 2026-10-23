"""Evidence Retrieval Orchestrator for TrustLens AI."""

import time
import logging
from typing import List, Dict, Any
from app.services.vector_store import vector_store
from app.services.wikipedia_provider import wikipedia_provider

logger = logging.getLogger("trustlens.retriever")


class EvidenceRetriever:
    """Orchestrates per-claim evidence retrieval across local corpus and Wikipedia."""

    def __init__(self):
        self.vector_store = vector_store
        self.wiki_provider = wikipedia_provider

    def retrieve_for_claims(
        self,
        claims: List[Dict[str, str]],
        use_web_search: bool = True,
        top_k: int = 3,
        similarity_threshold: float = 0.55
    ) -> List[Dict[str, Any]]:
        """Retrieves evidence snippets separately for each extracted claim."""
        claim_results = []

        for claim in claims:
            claim_id = claim.get("id", "claim-unknown")
            claim_text = claim.get("text", "").strip()

            if not claim_text:
                claim_results.append({
                    "claim_id": claim_id,
                    "claim_text": claim_text,
                    "has_evidence": False,
                    "retrieval_status": "no_evidence",
                    "evidence_snippets": [],
                    "sources_queried": []
                })
                continue

            sources_queried = ["Local Vector Corpus"]
            # 1. Query local vector index
            local_snippets = self.vector_store.query_similar(
                query_text=claim_text,
                top_k=top_k,
                threshold=similarity_threshold
            )

            wiki_snippets = []
            if use_web_search:
                sources_queried.append("Wikipedia API")
                # 2. Query Wikipedia
                wiki_snippets = self.wiki_provider.search_evidence(
                    query=claim_text,
                    top_k=top_k,
                    threshold=similarity_threshold
                )

            # 3. Merge and deduplicate snippets by text
            merged_snippets = []
            seen_texts = set()

            for s in local_snippets + wiki_snippets:
                # Text fingerprint
                norm_text = " ".join(s["text"].lower().split())[:80]
                if norm_text not in seen_texts:
                    seen_texts.add(norm_text)
                    merged_snippets.append(s)

            # 4. Sort by similarity score descending
            merged_snippets.sort(key=lambda x: x["similarity_score"], reverse=True)
            top_snippets = merged_snippets[:top_k]

            # 5. Check if relevant evidence was found
            has_evidence = len(top_snippets) > 0 and top_snippets[0]["similarity_score"] >= similarity_threshold
            retrieval_status = "evidence_found" if has_evidence else "below_threshold"

            claim_results.append({
                "claim_id": claim_id,
                "claim_text": claim_text,
                "has_evidence": has_evidence,
                "retrieval_status": retrieval_status,
                "evidence_snippets": top_snippets if has_evidence else [],
                "sources_queried": sources_queried
            })

        return claim_results


evidence_retriever = EvidenceRetriever()
