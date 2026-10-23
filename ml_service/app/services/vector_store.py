"""ChromaDB Vector Store Manager for TrustLens AI."""

import os
import sys
import uuid
import datetime
from typing import List, Dict, Any, Optional

# Disable TensorFlow in sys.modules to prevent protobuf version collision in transformers
sys.modules['tensorflow'] = None

import chromadb
from chromadb.utils import embedding_functions
from app.services.chunker import chunker


class VectorStoreManager:
    """Manages persistent ChromaDB vector index for reference evidence documents."""

    def __init__(self, persist_directory: Optional[str] = None):
        if persist_directory is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            persist_directory = os.path.join(base_dir, "data", "chroma_db")

        os.makedirs(persist_directory, exist_ok=True)
        self.persist_directory = persist_directory

        # Initialize Chroma persistent client
        self.client = chromadb.PersistentClient(path=self.persist_directory)

        # Default embedding function: ONNX all-MiniLM-L6-v2
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()

        # Get or create collection with cosine similarity space
        self.collection = self.client.get_or_create_collection(
            name="trustlens_evidence",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )

        # In-memory document registry to track unique ingested sources
        self._sources_registry: Dict[str, Dict[str, Any]] = {}
        self._load_sources_from_collection()

    def _load_sources_from_collection(self):
        """Reconstructs sources registry from existing metadata in collection."""
        try:
            results = self.collection.get(include=["metadatas"])
            if results and results.get("metadatas"):
                for meta in results["metadatas"]:
                    doc_id = meta.get("doc_id")
                    if doc_id and doc_id not in self._sources_registry:
                        self._sources_registry[doc_id] = {
                            "doc_id": doc_id,
                            "title": meta.get("title", "Untitled Document"),
                            "url": meta.get("url"),
                            "chunk_count": 0,
                            "created_at": meta.get("created_at", datetime.datetime.utcnow().isoformat())
                        }
                    if doc_id:
                        self._sources_registry[doc_id]["chunk_count"] += 1
        except Exception:
            pass

    def ingest_document(
        self,
        title: str,
        content: str,
        url: Optional[str] = None,
        doc_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Chunks and indexes a reference document into ChromaDB."""
        if not doc_id:
            doc_id = f"doc_{uuid.uuid4().hex[:8]}"

        chunks = chunker.chunk_text(content, doc_id=doc_id, title=title, url=url)
        if not chunks:
            return {
                "doc_id": doc_id,
                "title": title,
                "url": url,
                "chunk_count": 0,
                "created_at": datetime.datetime.utcnow().isoformat()
            }

        now_iso = datetime.datetime.utcnow().isoformat()
        ids = [c["id"] for c in chunks]
        documents = [c["text"] for c in chunks]
        metadatas = [
            {
                "doc_id": doc_id,
                "title": title,
                "url": url or "",
                "chunk_index": c["chunk_index"],
                "char_start": c["char_start"],
                "char_end": c["char_end"],
                "created_at": now_iso
            }
            for c in chunks
        ]

        # Upsert into ChromaDB
        self.collection.upsert(ids=ids, documents=documents, metadatas=metadatas)

        # Update registry
        doc_info = {
            "doc_id": doc_id,
            "title": title,
            "url": url,
            "chunk_count": len(chunks),
            "created_at": now_iso
        }
        self._sources_registry[doc_id] = doc_info

        return doc_info

    def list_sources(self) -> List[Dict[str, Any]]:
        """Lists all ingested reference sources."""
        return list(self._sources_registry.values())

    def get_stats(self) -> Dict[str, int]:
        """Returns total documents and chunks indexed."""
        return {
            "total_documents": len(self._sources_registry),
            "total_chunks": self.collection.count()
        }

    def query_similar(
        self,
        query_text: str,
        top_k: int = 3,
        threshold: float = 0.55
    ) -> List[Dict[str, Any]]:
        """Queries the vector index for passages matching query_text."""
        total_chunks = self.collection.count()
        if total_chunks == 0 or not query_text.strip():
            return []

        n_results = min(top_k, total_chunks)
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results,
            include=["documents", "metadatas", "distances"]
        )

        matched_snippets = []
        if not results or not results.get("documents") or not results["documents"][0]:
            return []

        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0]
        ids = results["ids"][0]

        for chunk_id, doc_text, meta, dist in zip(ids, docs, metas, distances):
            # In cosine space: similarity = 1.0 - distance
            similarity = round(max(0.0, min(1.0, 1.0 - float(dist))), 4)
            if similarity >= threshold:
                matched_snippets.append({
                    "id": chunk_id,
                    "text": doc_text,
                    "source_title": meta.get("title", "Reference Corpus"),
                    "source_url": meta.get("url") or None,
                    "similarity_score": similarity,
                    "chunk_index": meta.get("chunk_index"),
                    "location": f"chunk {meta.get('chunk_index', 0)}"
                })

        return matched_snippets

    def clear(self):
        """Clears all records from collection (used for testing)."""
        try:
            self.client.delete_collection("trustlens_evidence")
        except Exception:
            pass
        self.collection = self.client.get_or_create_collection(
            name="trustlens_evidence",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )
        self._sources_registry.clear()


vector_store = VectorStoreManager()
