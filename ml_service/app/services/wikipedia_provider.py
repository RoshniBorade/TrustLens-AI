"""Wikipedia REST API Provider for Live Evidence Retrieval."""

import re
import logging
from typing import List, Dict, Any, Optional
import httpx
from nltk.tokenize import sent_tokenize
import numpy as np
from app.services.vector_store import vector_store

logger = logging.getLogger("trustlens.wikipedia")

WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"
USER_AGENT = "TrustLensAI/1.0 (academic research project; student: Roshni Borade; contact: roshani@trustlens.edu)"


class WikipediaProvider:
    """Retrieves real Wikipedia article passages with authentic canonical URLs."""

    def __init__(self, timeout_seconds: float = 6.0):
        self.timeout = timeout_seconds

    def search_evidence(
        self,
        query: str,
        top_k: int = 3,
        threshold: float = 0.55
    ) -> List[Dict[str, Any]]:
        """Searches Wikipedia for an extracted claim and returns scored passage snippets."""
        clean_query = query.strip()
        if not clean_query:
            return []

        try:
            # 1. Search Wikipedia for top matching articles
            articles = self._search_articles(clean_query, limit=2)
            if not articles:
                return []

            candidate_passages = []

            # 2. Fetch extracts for each article
            for title in articles:
                extract = self._get_article_extract(title)
                if not extract:
                    continue

                canonical_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
                # Split extract into sentences
                sentences = sent_tokenize(extract)
                # Form 1-2 sentence coherent candidate passages
                for i in range(0, len(sentences), 2):
                    passage = " ".join(sentences[i:i+2]).strip()
                    if len(passage) > 30:
                        candidate_passages.append({
                            "title": title,
                            "url": canonical_url,
                            "text": passage
                        })

            if not candidate_passages:
                return []

            # 3. Compute semantic similarity between query and candidates using Chroma's embedder
            query_emb = vector_store.embedding_fn([clean_query])[0]
            passage_texts = [p["text"] for p in candidate_passages]
            passage_embs = vector_store.embedding_fn(passage_texts)

            # Cosine similarity calculation
            q_norm = np.linalg.norm(query_emb)
            results = []
            for idx, p in enumerate(candidate_passages):
                p_emb = passage_embs[idx]
                p_norm = np.linalg.norm(p_emb)
                if q_norm > 0 and p_norm > 0:
                    sim = float(np.dot(query_emb, p_emb) / (q_norm * p_norm))
                else:
                    sim = 0.0

                sim_rounded = round(max(0.0, min(1.0, sim)), 4)
                if sim_rounded >= threshold:
                    results.append({
                        "id": f"wiki_{p['title'].replace(' ', '_')}_{idx}",
                        "text": p["text"],
                        "source_title": f"Wikipedia: {p['title']}",
                        "source_url": p["url"],
                        "similarity_score": sim_rounded,
                        "chunk_index": idx,
                        "location": f"Wikipedia article: {p['title']}"
                    })

            # Sort descending by similarity
            results.sort(key=lambda x: x["similarity_score"], reverse=True)
            return results[:top_k]

        except Exception as exc:
            logger.warning(f"Wikipedia search failed for '{clean_query}': {exc}")
            return []

    def _search_articles(self, query: str, limit: int = 2) -> List[str]:
        """Queries Wikipedia search API."""
        params = {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "utf8": 1,
            "format": "json",
            "srlimit": limit
        }
        headers = {"User-Agent": USER_AGENT}
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.get(WIKIPEDIA_API_URL, params=params, headers=headers)
            if resp.status_code != 200:
                return []
            data = resp.json()
            search_items = data.get("query", {}).get("search", [])
            return [item["title"] for item in search_items if "title" in item]

    def _get_article_extract(self, title: str) -> Optional[str]:
        """Fetches introductory plain-text extract for Wikipedia article."""
        params = {
            "action": "query",
            "prop": "extracts",
            "exintro": 1,
            "explaintext": 1,
            "titles": title,
            "format": "json"
        }
        headers = {"User-Agent": USER_AGENT}
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.get(WIKIPEDIA_API_URL, params=params, headers=headers)
            if resp.status_code != 200:
                return None
            data = resp.json()
            pages = data.get("query", {}).get("pages", {})
            for _, page_info in pages.items():
                if "extract" in page_info:
                    return page_info["extract"]
        return None


wikipedia_provider = WikipediaProvider()
