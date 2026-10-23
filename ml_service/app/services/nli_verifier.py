"""Natural Language Inference (NLI) Verifier for TrustLens AI.

Model: cross-encoder/nli-deberta-v3-small
Label Mapping: 0 -> contradiction, 1 -> entailment, 2 -> neutral
License: Apache 2.0 / MIT
"""

import sys
import logging
from typing import List, Dict, Any, Optional

# Disable TensorFlow in sys.modules to prevent protobuf version collision in transformers
sys.modules['tensorflow'] = None

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

logger = logging.getLogger("trustlens.nli_verifier")

MODEL_NAME = "cross-encoder/nli-deberta-v3-small"
LABEL_MAPPING = {0: "contradiction", 1: "entailment", 2: "neutral"}
SUPPORT_THRESHOLD = 0.65
CONTRADICTION_THRESHOLD = 0.65


class NLIVerifier:
    """Evaluates premise-hypothesis pairs and aggregates evidence into factual verdicts."""

    def __init__(self, model_name: str = MODEL_NAME):
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        """Loads model and tokenizer onto CPU with optimized threads."""
        try:
            logger.info(f"Loading NLI model: {self.model_name}...")
            torch.set_num_threads(4)
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self.model.eval()
            self.is_loaded = True
            logger.info("NLI model successfully loaded and ready for inference.")
        except Exception as exc:
            logger.error(f"Failed to load NLI model: {exc}", exc_info=True)
            self.is_loaded = False

    def predict_pair(self, premise: str, hypothesis: str) -> Dict[str, float]:
        """Runs NLI cross-encoder inference for a single premise-hypothesis pair."""
        if not self.is_loaded:
            self._load_model()

        inputs = self.tokenizer(
            [[premise, hypothesis]],
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt"
        )

        with torch.no_grad():
            logits = self.model(**inputs).logits
            probs = torch.softmax(logits, dim=1)[0].tolist()

        return {
            "contradiction": round(probs[0], 4),
            "entailment": round(probs[1], 4),
            "neutral": round(probs[2], 4)
        }

    def verify_claim(
        self,
        claim_text: str,
        evidence_snippets: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Verifies a claim against retrieved evidence snippets with conflict detection.
        
        Returns verdict: 'supported' | 'contradicted' | 'unverified',
        primary evidence, all candidates with NLI scores, and academic explanation.
        """
        # Case 1: No evidence was retrieved or evidence was below retrieval threshold
        if not evidence_snippets:
            return {
                "status": "unverified",
                "confidence": 0.0,
                "evidence": None,
                "all_evidence_candidates": [],
                "nli_scores": {"entailment": 0.0, "neutral": 1.0, "contradiction": 0.0},
                "explanation": "Unverified: No corroborating or refuting evidence was found in the indexed reference corpus or external sources."
            }

        evaluated_candidates = []
        max_entailment = 0.0
        best_support_snippet = None
        max_contradiction = 0.0
        best_contradict_snippet = None
        dominant_neutral_snippet = None
        max_neutral = 0.0

        for snippet in evidence_snippets:
            premise = snippet.get("text", "")
            if not premise.strip():
                continue

            nli = self.predict_pair(premise=premise, hypothesis=claim_text)
            candidate = {
                "id": snippet.get("id", "ev-snippet"),
                "text": snippet.get("text", ""),
                "source_title": snippet.get("source_title", "Unknown Source"),
                "source_url": snippet.get("source_url"),
                "similarity_score": snippet.get("similarity_score", 0.0),
                "nli_scores": nli
            }
            evaluated_candidates.append(candidate)

            if nli["entailment"] > max_entailment:
                max_entailment = nli["entailment"]
                best_support_snippet = candidate

            if nli["contradiction"] > max_contradiction:
                max_contradiction = nli["contradiction"]
                best_contradict_snippet = candidate

            if nli["neutral"] > max_neutral:
                max_neutral = nli["neutral"]
                dominant_neutral_snippet = candidate

        # Case 2: Conflicting evidence detected across retrieved sources
        if max_entailment >= SUPPORT_THRESHOLD and max_contradiction >= CONTRADICTION_THRESHOLD:
            return {
                "status": "unverified",
                "confidence": round((max_entailment + max_contradiction) / 2.0, 4),
                "evidence": best_support_snippet,
                "all_evidence_candidates": evaluated_candidates,
                "nli_scores": {"entailment": max_entailment, "neutral": max_neutral, "contradiction": max_contradiction},
                "explanation": (
                    f"Unverified (Conflicting Sources): Retrieved sources present opposing assertions. "
                    f"'{best_support_snippet['source_title']}' entails the claim (score: {max_entailment:.2f}), "
                    f"while '{best_contradict_snippet['source_title']}' contradicts it (score: {max_contradiction:.2f})."
                )
            }

        # Case 3: Supported by evidence
        if max_entailment >= SUPPORT_THRESHOLD and max_contradiction < CONTRADICTION_THRESHOLD:
            snippet_excerpt = best_support_snippet['text'][:120] + "..." if len(best_support_snippet['text']) > 120 else best_support_snippet['text']
            return {
                "status": "supported",
                "confidence": max_entailment,
                "evidence": best_support_snippet,
                "all_evidence_candidates": evaluated_candidates,
                "nli_scores": best_support_snippet["nli_scores"],
                "explanation": f"Supported: Corroborated with {max_entailment * 100:.1f}% confidence by {best_support_snippet['source_title']}: \"{snippet_excerpt}\""
            }

        # Case 4: Contradicted by evidence
        if max_contradiction >= CONTRADICTION_THRESHOLD and max_entailment < SUPPORT_THRESHOLD:
            snippet_excerpt = best_contradict_snippet['text'][:120] + "..." if len(best_contradict_snippet['text']) > 120 else best_contradict_snippet['text']
            return {
                "status": "contradicted",
                "confidence": max_contradiction,
                "evidence": best_contradict_snippet,
                "all_evidence_candidates": evaluated_candidates,
                "nli_scores": best_contradict_snippet["nli_scores"],
                "explanation": f"Contradicted: Refuted with {max_contradiction * 100:.1f}% confidence by {best_contradict_snippet['source_title']}: \"{snippet_excerpt}\""
            }

        # Case 5: Neutral or inconclusive evidence
        primary_snippet = dominant_neutral_snippet or (evaluated_candidates[0] if evaluated_candidates else None)
        return {
            "status": "unverified",
            "confidence": max_neutral if primary_snippet else 0.0,
            "evidence": primary_snippet,
            "all_evidence_candidates": evaluated_candidates,
            "nli_scores": primary_snippet["nli_scores"] if primary_snippet else {"entailment": 0.0, "neutral": 1.0, "contradiction": 0.0},
            "explanation": f"Unverified (Inconclusive): Retrieved evidence does not contain sufficient direct factual entailment or contradiction to verify this assertion."
        }


nli_verifier = NLIVerifier()
