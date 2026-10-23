"""Unit tests for NLI Verifier and 3-way status aggregation."""

import pytest
from app.services.nli_verifier import NLIVerifier


@pytest.fixture(scope="module")
def verifier():
    return NLIVerifier()


def test_nli_supported_claim(verifier):
    """Verifies that an entailing evidence snippet produces 'supported' status."""
    claim = "Alexander Fleming discovered penicillin in 1928."
    evidence = [{
        "id": "ev-1",
        "text": "In 1928, Scottish scientist Alexander Fleming successfully discovered penicillin at St Mary's Hospital in London.",
        "source_title": "History of Medicine",
        "source_url": "https://example.org/penicillin",
        "similarity_score": 0.92
    }]

    result = verifier.verify_claim(claim, evidence)
    assert result["status"] == "supported"
    assert result["confidence"] >= 0.65
    assert result["evidence"]["source_title"] == "History of Medicine"
    assert "Supported:" in result["explanation"]


def test_nli_contradicted_claim(verifier):
    """Verifies that a refuting evidence snippet produces 'contradicted' status."""
    claim = "Alexander Fleming discovered penicillin in 1999."
    evidence = [{
        "id": "ev-1",
        "text": "Alexander Fleming discovered penicillin in 1928 at St Mary's Hospital in London.",
        "source_title": "History of Medicine",
        "source_url": "https://example.org/penicillin",
        "similarity_score": 0.88
    }]

    result = verifier.verify_claim(claim, evidence)
    assert result["status"] == "contradicted"
    assert result["confidence"] >= 0.65
    assert "Contradicted:" in result["explanation"]


def test_nli_absent_evidence_unverified(verifier):
    """Verifies that absent evidence produces 'unverified' with zero confidence."""
    claim = "Mars has underground oceans of liquid hydrogen."
    evidence = []

    result = verifier.verify_claim(claim, evidence)
    assert result["status"] == "unverified"
    assert result["confidence"] == 0.0
    assert result["evidence"] is None
    assert "Unverified: No corroborating" in result["explanation"]


def test_nli_inconclusive_evidence_unverified(verifier):
    """Verifies that neutral/tangential evidence produces 'unverified' status."""
    claim = "Albert Einstein loved eating strawberry ice cream every Sunday."
    evidence = [{
        "id": "ev-1",
        "text": "Albert Einstein was a theoretical physicist widely acknowledged to be one of the greatest physicists of all time.",
        "source_title": "Biography of Einstein",
        "source_url": "https://example.org/einstein",
        "similarity_score": 0.60
    }]

    result = verifier.verify_claim(claim, evidence)
    assert result["status"] == "unverified"
    assert "Inconclusive" in result["explanation"]


def test_nli_conflicting_evidence_aggregation(verifier):
    """Verifies that conflicting sources (one supports, one refutes) yield 'unverified' with conflict explanation."""
    claim = "The ancient city was completely abandoned by the year 1200."
    evidence = [
        {
            "id": "ev-support",
            "text": "Archaeological records confirm the ancient city was completely abandoned by 1200.",
            "source_title": "Archaeology Journal 2018",
            "source_url": "https://example.org/archaeology-2018",
            "similarity_score": 0.85
        },
        {
            "id": "ev-contradict",
            "text": "Excavations in 2022 revealed continuous human settlement in the city well into the 14th century.",
            "source_title": "Recent Dig Excavations 2022",
            "source_url": "https://example.org/dig-2022",
            "similarity_score": 0.82
        }
    ]

    result = verifier.verify_claim(claim, evidence)
    assert result["status"] == "unverified"
    assert "Conflicting Sources" in result["explanation"]
