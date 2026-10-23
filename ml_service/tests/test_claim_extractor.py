"""Unit tests for ClaimExtractor service."""

import pytest
from app.services.claim_extractor import ClaimExtractor


@pytest.fixture
def extractor():
    return ClaimExtractor()


def test_simple_factual_statement(extractor):
    """Verifies standard simple factual statement extraction."""
    text = "The Mona Lisa was painted by Leonardo da Vinci."
    claims = extractor.extract_claims(text)
    assert len(claims) == 1
    assert claims[0]["id"] == "claim-01"
    assert "Mona Lisa" in claims[0]["text"]
    assert "Leonardo da Vinci" in claims[0]["text"]
    assert claims[0]["has_entities"] is True
    assert claims[0]["claim_type"] in ["factual", "temporal"]


def test_compound_statement_decomposition(extractor):
    """Verifies that compound sentences with coordinate clauses are split into atomic claims."""
    text = "The Pacific Ocean is the largest ocean on Earth, and it covers more than 30% of the planet's surface."
    claims = extractor.extract_claims(text)
    assert len(claims) == 2
    assert "Pacific Ocean" in claims[0]["text"]
    assert "covers more than 30%" in claims[1]["text"]


def test_numerical_claim_classification(extractor):
    """Verifies that claims containing numerical values and measurements are classified properly."""
    text = "Mount Everest has an official elevation of 8,848 meters above sea level."
    claims = extractor.extract_claims(text)
    assert len(claims) == 1
    assert claims[0]["claim_type"] == "numerical"
    assert "8,848" in claims[0]["text"]
    assert "meters" in claims[0]["text"]
    assert claims[0]["has_entities"] is True


def test_temporal_claim_classification(extractor):
    """Verifies that claims containing years, dates, or eras are classified as temporal."""
    text = "In 1969, Neil Armstrong became the first person to walk on the Moon."
    claims = extractor.extract_claims(text)
    assert len(claims) == 1
    assert claims[0]["claim_type"] == "temporal"
    assert "1969" in claims[0]["text"]
    assert "Neil Armstrong" in claims[0]["text"]


def test_no_factual_claims_conversational(extractor):
    """Verifies that pure greetings, closings, and non-factual text yield zero claims."""
    text = "Hello! How are you doing today? I hope you are having a wonderful time. Thank you!"
    claims = extractor.extract_claims(text)
    assert len(claims) == 0


def test_pure_opinion_filtered(extractor):
    """Verifies that subjective personal opinions without factual basis are filtered out."""
    text = "In my personal opinion, this is the most awesome thing ever."
    claims = extractor.extract_claims(text)
    assert len(claims) == 0


def test_empty_and_whitespace_inputs(extractor):
    """Verifies graceful handling of empty string, whitespace, and None."""
    assert extractor.extract_claims("") == []
    assert extractor.extract_claims("   \n\t  ") == []
    assert extractor.extract_claims(None) == []


def test_mixed_conversational_and_factual_response(extractor):
    """Verifies extraction of real facts while discarding conversational pleasantries in LLM responses."""
    text = (
        "Hello! I would be glad to help you with that.\n\n"
        "1. Penicillin was discovered by Alexander Fleming in 1928.\n"
        "2. It was derived from Penicillium notatum mold.\n\n"
        "I hope this helps! Feel free to ask if you have more questions."
    )
    claims = extractor.extract_claims(text)
    assert len(claims) == 2
    assert "Alexander Fleming" in claims[0]["text"]
    assert "1928" in claims[0]["text"]
    assert "Penicillium" in claims[1]["text"]
    # Check stable sequential IDs
    assert claims[0]["id"] == "claim-01"
    assert claims[1]["id"] == "claim-02"


def test_qualifier_preservation(extractor):
    """Verifies that critical qualifiers like 'approximately' or 'first' are preserved."""
    text = "Light travels at approximately 300,000 kilometers per second in a vacuum."
    claims = extractor.extract_claims(text)
    assert len(claims) == 1
    assert "approximately" in claims[0]["text"].lower()
    assert "300,000" in claims[0]["text"]
