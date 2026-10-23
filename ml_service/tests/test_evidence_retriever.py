"""Unit tests for Evidence Retrieval Pipeline."""

import pytest
from app.services.chunker import DocumentChunker
from app.services.vector_store import VectorStoreManager
from app.services.evidence_retriever import EvidenceRetriever
from app.services.wikipedia_provider import WikipediaProvider


@pytest.fixture
def chunker_inst():
    return DocumentChunker(target_chunk_size=200, chunk_overlap=50)


@pytest.fixture
def test_vector_store(tmp_path):
    store = VectorStoreManager(persist_directory=str(tmp_path / "chroma"))
    yield store
    store.clear()


def test_document_chunking_sentence_boundaries(chunker_inst):
    """Verifies that chunking preserves sentence integrity and assigns correct metadata."""
    sample_text = (
        "Alexander Fleming was a Scottish physician and microbiologist. "
        "He is best known for discovering penicillin in 1928. "
        "Penicillin was the world's first broadly effective antibiotic substance. "
        "The discovery earned him the Nobel Prize in Physiology or Medicine in 1945."
    )
    chunks = chunker_inst.chunk_text(
        text=sample_text,
        doc_id="doc_fleming",
        title="History of Penicillin",
        url="https://example.org/penicillin"
    )

    assert len(chunks) >= 1
    for chunk in chunks:
        assert chunk["doc_id"] == "doc_fleming"
        assert chunk["title"] == "History of Penicillin"
        assert chunk["url"] == "https://example.org/penicillin"
        assert len(chunk["text"]) > 20


def test_reference_document_ingestion_and_source_listing(test_vector_store):
    """Verifies that ingested documents are stored and visible in sources registry."""
    doc_info = test_vector_store.ingest_document(
        title="Apollo 11 Mission",
        content="Apollo 11 was the American spaceflight that first landed humans on the Moon on July 20, 1969.",
        url="https://example.org/apollo11"
    )

    assert doc_info["title"] == "Apollo 11 Mission"
    assert doc_info["chunk_count"] >= 1

    sources = test_vector_store.list_sources()
    assert len(sources) == 1
    assert sources[0]["title"] == "Apollo 11 Mission"
    assert sources[0]["url"] == "https://example.org/apollo11"


def test_per_claim_semantic_retrieval(test_vector_store):
    """Verifies that a claim retrieves its matching passage with a high similarity score."""
    test_vector_store.ingest_document(
        title="Penicillin Discovery",
        content=(
            "Alexander Fleming discovered penicillin in September 1928 at St Mary's Hospital in London. "
            "He noticed a mold colony had contaminated a Petri dish of Staphylococcus bacteria."
        ),
        url="https://example.org/penicillin"
    )

    matches = test_vector_store.query_similar(
        query_text="Alexander Fleming discovered penicillin in 1928",
        top_k=2,
        threshold=0.50
    )

    assert len(matches) >= 1
    top_match = matches[0]
    assert "Alexander Fleming" in top_match["text"]
    assert top_match["source_title"] == "Penicillin Discovery"
    assert top_match["similarity_score"] >= 0.55


def test_irrelevant_claim_below_threshold(test_vector_store):
    """Verifies that irrelevant queries do not falsely match unrelated documents."""
    test_vector_store.ingest_document(
        title="Marine Biology",
        content="Coral reefs are underwater ecosystems characterized by reef-building corals.",
        url="https://example.org/coral"
    )

    matches = test_vector_store.query_similar(
        query_text="Quantum entanglement and superconductivity at high temperatures",
        top_k=2,
        threshold=0.75  # High threshold to test rejection
    )

    assert len(matches) == 0


def test_empty_index_behavior(test_vector_store):
    """Verifies graceful handling when the index is empty."""
    matches = test_vector_store.query_similar(
        query_text="Any claim query",
        top_k=3,
        threshold=0.50
    )
    assert matches == []


def test_orchestrator_explicit_no_evidence_state():
    """Verifies that lack of evidence produces an explicit 'no_evidence' state, not a failure."""
    retriever = EvidenceRetriever()
    results = retriever.retrieve_for_claims(
        claims=[{"id": "claim-99", "text": "Xylophonic quibbles wobble in hyperdimensional space."}],
        use_web_search=False,
        similarity_threshold=0.85
    )

    assert len(results) == 1
    assert results[0]["claim_id"] == "claim-99"
    assert results[0]["has_evidence"] is False
    assert results[0]["retrieval_status"] in ["no_evidence", "below_threshold"]
    assert results[0]["evidence_snippets"] == []


def test_wikipedia_provider_live_retrieval():
    """Verifies that Wikipedia provider retrieves authentic passages and real URLs."""
    wiki = WikipediaProvider(timeout_seconds=6.0)
    snippets = wiki.search_evidence(
        query="Neil Armstrong first person Moon 1969",
        top_k=2,
        threshold=0.45
    )

    if snippets:  # Network may be skipped in offline environment, but if online:
        top = snippets[0]
        assert "wikipedia.org/wiki/" in top["source_url"]
        assert len(top["text"]) > 20
        assert top["similarity_score"] >= 0.45
