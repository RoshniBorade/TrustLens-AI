"""Claim Extraction Service for TrustLens AI.

Extracts atomic, verifiable factual statements from AI-generated responses.
Filters out conversational pleasantries, stylistic boilerplate, and pure opinions.
Decomposes compound statements while preserving numbers, dates, named entities,
and semantic qualifiers.
"""

import re
import time
from typing import List, Tuple, Optional
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import wordnet

# Ensure required NLTK resources are available
for resource in ["punkt", "punkt_tab", "averaged_perceptron_tagger", "averaged_perceptron_tagger_eng", "wordnet"]:
    try:
        if "punkt" in resource:
            nltk.data.find(f"tokenizers/{resource}")
        elif "tagger" in resource:
            nltk.data.find(f"taggers/{resource}")
        else:
            nltk.data.find(f"corpora/{resource}")
    except LookupError:
        nltk.download(resource, quiet=True)

# Common auxiliary, linking, and domain verbs to complement POS tagger
COMMON_VERBS = {
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "can", "could", "will", "would", "shall", "should",
    "may", "might", "must", "travels", "orbits", "discovered", "founded",
    "created", "invented", "composed", "wrote", "directed", "born", "died",
    "won", "scored", "built", "designed", "located", "situated", "contains",
    "consists", "includes", "measures", "weighs", "spans", "reaches", "serves",
    "became", "remains", "produces", "causes", "leads", "killed", "cured",
    "covers", "started", "ended", "released", "derived", "stands"
}

# Regex patterns for conversational filler, greetings, and closings
CONVERSATIONAL_GREETINGS = [
    r"^(?:hello|hi|hey|greetings|dear user|good morning|good afternoon|good evening)[!,.: ]*",
    r"^(?:how are you(?: doing)?(?: today)?)[?!., ]*",
    r"^(?:sure|certainly|of course|gladly|absolutely|definitely)[!,.]*\s*(?:i(?:'d| would)? (?:be (?:happy|glad)|love) to help(?: you)?(?: with that)?)?[!,.: ]*",
    r"^(?:i(?:'d| would)? (?:be (?:happy|glad)|love) to help(?: you)?(?: with that)?)[!,.: ]*",
    r"^(?:here (?:is|are) (?:the|some|a few) (?:details|information|facts|answers|points|summary))[!,.: ]*",
    r"^(?:as an ai|as a language model|as an assistant)[^.]*[!,.: ]*",
]

CONVERSATIONAL_CLOSINGS = [
    r"^(?:i hope\b)",
    r"^(?:feel free to (?:ask|reach out))",
    r"^(?:let me know if you (?:need|have|require))",
    r"^(?:thanks for (?:asking|reaching out)|thank you)[!,.: ]*$",
    r"^(?:have a (?:great|wonderful|good|nice) (?:day|time|week|weekend))[!,.: ]*$",
]

# Patterns for purely subjective opinion statements without factual assertions
OPINION_PREFIXES = [
    r"^(?:in my (?:personal )?opinion|in my view|to my mind|personally,?\s*i (?:think|believe|feel))\b",
    r"^(?:i (?:personally )?(?:think|believe|feel|prefer)|it seems to me that)\s+(?:it is|this is|they are)\s+(?:great|wonderful|awesome|cool|amazing|bad|terrible|interesting)[.!]?$",
]

# Numerical and Temporal pattern recognizers
NUMERICAL_REGEX = re.compile(
    r"\b(?:\d+(?:,\d{3})*(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|"
    r"eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|"
    r"thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|trillion)"
    r"(?:\s*(?:%|percent|kg|km|m|cm|mm|miles?|meters?|feet|inches|pounds|lbs|seconds?|minutes?|hours?|days?|years?|dollars?|USD|\$|€|£|degrees?|celsius|fahrenheit))?\b",
    re.IGNORECASE
)

TEMPORAL_REGEX = re.compile(
    r"\b(?:(?:in|on|since|during|by|around|circa|after|before)\s+)?"
    r"(?:\b(?:1[4-9]\d{2}|20\d{2}|2100)\b|"
    r"(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*(?:\d{4})?|"
    r"\d{1,2}(?:st|nd|rd|th)?\s+century(?:\s+BC|\s+AD|\s+BCE|\s+CE)?|"
    r"(?:BC|BCE|AD|CE))\b",
    re.IGNORECASE
)


class ClaimExtractor:
    """Atomic Claim Extraction pipeline using rule-based NLP and POS-tag analysis."""

    def __init__(self):
        self._greetings_re = [re.compile(p, re.IGNORECASE) for p in CONVERSATIONAL_GREETINGS]
        self._closings_re = [re.compile(p, re.IGNORECASE) for p in CONVERSATIONAL_CLOSINGS]
        self._opinions_re = [re.compile(p, re.IGNORECASE) for p in OPINION_PREFIXES]

    def clean_text(self, text: str) -> str:
        """Normalizes Markdown formatting, list markers, and whitespace."""
        if not text:
            return ""
        # Remove markdown headers (#, ##, etc.)
        cleaned = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)
        # Normalize list markers (e.g. "1. ", "* ", "- ") to simple sentences
        cleaned = re.sub(r"^\s*(?:[\*\-\+]|\d+[\.\)])\s+", "", cleaned, flags=re.MULTILINE)
        # Normalize bold/italic markdown markers while keeping content
        cleaned = re.sub(r"\*\*([^*]+)\*\*", r"\1", cleaned)
        cleaned = re.sub(r"\*([^*]+)\*", r"\1", cleaned)
        # Normalize multi-whitespace
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        return cleaned.strip()

    def is_conversational_or_opinion(self, text: str) -> bool:
        """Determines if a sentence is purely greeting, sign-off, question, or non-factual opinion."""
        stripped = text.strip()
        if not stripped or len(stripped) < 4:
            return True

        # Interrogative sentences are questions, not factual claims
        if stripped.endswith("?") or re.match(r"^(?:how|what|why|when|where|who|whom|which|is|are|can|could|would|should|do|does|did)\s+", stripped, re.IGNORECASE):
            return True

        for pattern in self._greetings_re:
            if pattern.search(stripped):
                match = pattern.match(stripped)
                if match and len(match.group(0).strip()) >= len(stripped) - 5:
                    return True

        for pattern in self._closings_re:
            if pattern.search(stripped):
                return True

        for pattern in self._opinions_re:
            if pattern.search(stripped):
                return True

        return False

    def segment_sentences(self, text: str) -> List[str]:
        """Splits input into clean sentences while preserving abbreviations."""
        cleaned = self.clean_text(text)
        if not cleaned:
            return []

        # Split on explicit newlines first to honor list items
        paragraphs = [p.strip() for p in cleaned.split("\n") if p.strip()]
        valid_sentences = []

        for p in paragraphs:
            raw_sentences = sent_tokenize(p)
            for s in raw_sentences:
                s_clean = s.strip()
                if s_clean and len(s_clean) > 3:
                    valid_sentences.append(s_clean)

        return valid_sentences

    def decompose_compound_sentence(self, sentence: str) -> List[str]:
        """Splits compound sentences joined by conjunctions into atomic clauses if independent."""
        # Check if sentence has a semicolon
        if ";" in sentence:
            parts = [p.strip() for p in sentence.split(";") if p.strip()]
            if len(parts) > 1 and all(self._has_verb(p) for p in parts):
                sub_claims = []
                for p in parts:
                    sub_claims.extend(self.decompose_compound_sentence(p))
                return sub_claims

        # Split on coordinating conjunctions: ", and ", ", but ", ", while ", ", whereas "
        pattern = r",\s+(?:and|but|while|whereas|although)\s+"
        parts = re.split(pattern, sentence, flags=re.IGNORECASE)
        if len(parts) > 1:
            if all(self._has_verb(p) for p in parts):
                first_subject = self._extract_subject(parts[0])
                resolved_parts = []
                for idx, part in enumerate(parts):
                    part_clean = part.strip()
                    if idx > 0 and first_subject:
                        words = part_clean.split()
                        if words and self._is_verb(words[0]):
                            part_clean = f"{first_subject} {part_clean}"
                    resolved_parts.append(part_clean)
                return resolved_parts

        return [sentence]

    def _has_verb(self, text: str) -> bool:
        """Checks if the clause contains at least one verb using POS tags and verb vocab."""
        words = word_tokenize(text)
        if not words:
            return False

        tags = nltk.pos_tag(words)
        for w, tag in tags:
            w_lower = w.lower()
            if tag.startswith("VB"):
                return True
            if w_lower in COMMON_VERBS:
                return True
            try:
                if wordnet.synsets(w_lower, pos=wordnet.VERB):
                    return True
            except Exception:
                pass

        return False

    def _is_verb(self, word: str) -> bool:
        """Checks if a single word acts as a verb."""
        w_lower = word.lower()
        if w_lower in COMMON_VERBS:
            return True
        tags = nltk.pos_tag([word])
        if tags and tags[0][1].startswith("VB"):
            return True
        try:
            return bool(wordnet.synsets(w_lower, pos=wordnet.VERB))
        except Exception:
            return False

    def _extract_subject(self, clause: str) -> Optional[str]:
        """Extracts the leading noun phrase/subject of a clause."""
        words = word_tokenize(clause)
        tags = nltk.pos_tag(words)
        subj_tokens = []
        for word, tag in tags:
            if tag.startswith("NN") or tag in ["PRP", "DT", "JJ"]:
                subj_tokens.append(word)
            elif tag.startswith("VB") or word.lower() in COMMON_VERBS:
                break
            else:
                if subj_tokens:
                    break
        if subj_tokens:
            return " ".join(subj_tokens)
        return None

    def classify_claim_type(self, text: str) -> Tuple[str, bool]:
        """Classifies claim as numerical, temporal, or general factual.
        Returns (claim_type, has_entities).
        """
        has_temporal = bool(TEMPORAL_REGEX.search(text))
        has_numerical = bool(NUMERICAL_REGEX.search(text))

        words = word_tokenize(text)
        tags = nltk.pos_tag(words)
        has_named_entities = any(tag in ["NNP", "NNPS"] for _, tag in tags)

        has_entities = has_temporal or has_numerical or has_named_entities

        if has_temporal:
            return "temporal", has_entities
        elif has_numerical:
            return "numerical", has_entities
        else:
            return "factual", has_entities

    def is_valid_factual_claim(self, claim: str) -> bool:
        """Validates that a statement contains an assertion (verb + subject/object)."""
        stripped = claim.strip()
        if len(stripped) < 8:
            return False

        if self.is_conversational_or_opinion(stripped):
            return False

        # Must contain at least one verb
        if not self._has_verb(stripped):
            return False

        words = stripped.split()
        if len(words) < 3:
            return False

        return True

    def extract_claims(self, response_text: str, question: Optional[str] = None) -> List[dict]:
        """Extracts atomic factual claims from AI response text."""
        if not response_text or not response_text.strip():
            return []

        sentences = self.segment_sentences(response_text)
        claims = []
        claim_counter = 1

        for sent_idx, raw_sentence in enumerate(sentences):
            # Skip conversational boilerplate and questions
            if self.is_conversational_or_opinion(raw_sentence):
                continue

            # Check if sentence starts with conversational greeting but has factual content
            sentence_to_process = raw_sentence
            for g_pattern in self._greetings_re:
                m = g_pattern.match(sentence_to_process)
                if m and len(m.group(0)) < len(sentence_to_process):
                    sentence_to_process = sentence_to_process[m.end():].lstrip(" ,.:!\n")
                    break

            if not sentence_to_process or not self._has_verb(sentence_to_process):
                continue

            # Decompose compound statements
            decomposed_clauses = self.decompose_compound_sentence(sentence_to_process)

            for clause in decomposed_clauses:
                clean_claim = clause.strip().rstrip(".,;:")
                if not self.is_valid_factual_claim(clean_claim):
                    continue

                claim_type, has_entities = self.classify_claim_type(clean_claim)
                claim_id = f"claim-{claim_counter:02d}"
                claim_counter += 1

                claims.append({
                    "id": claim_id,
                    "text": clean_claim,
                    "original_sentence": raw_sentence,
                    "sentence_index": sent_idx,
                    "claim_type": claim_type,
                    "has_entities": has_entities
                })

        return claims


# Global singleton instance
claim_extractor = ClaimExtractor()
