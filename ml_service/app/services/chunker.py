"""Document Chunking Service with Sentence Boundary Preservation."""

from typing import List, Dict, Any
from nltk.tokenize import sent_tokenize


class DocumentChunker:
    """Chunks documents into semantic passages while respecting sentence boundaries."""

    def __init__(self, target_chunk_size: int = 400, chunk_overlap: int = 80):
        self.target_chunk_size = target_chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str, doc_id: str, title: str, url: str = None) -> List[Dict[str, Any]]:
        """Splits text into overlapping chunks, preserving sentence integrity."""
        cleaned = text.strip()
        if not cleaned:
            return []

        sentences = sent_tokenize(cleaned)
        chunks = []
        current_chunk_sentences = []
        current_length = 0
        chunk_idx = 0
        char_offset = 0

        for sentence in sentences:
            sentence_clean = sentence.strip()
            if not sentence_clean:
                continue

            current_chunk_sentences.append(sentence_clean)
            current_length += len(sentence_clean) + 1

            if current_length >= self.target_chunk_size:
                chunk_text = " ".join(current_chunk_sentences)
                chunks.append({
                    "id": f"{doc_id}_chunk_{chunk_idx:03d}",
                    "text": chunk_text,
                    "doc_id": doc_id,
                    "title": title,
                    "url": url,
                    "chunk_index": chunk_idx,
                    "char_start": char_offset,
                    "char_end": char_offset + len(chunk_text),
                })
                chunk_idx += 1
                char_offset += len(chunk_text)

                # Keep last sentence for overlap context
                if len(current_chunk_sentences) > 1:
                    current_chunk_sentences = current_chunk_sentences[-1:]
                    current_length = len(current_chunk_sentences[0])
                else:
                    current_chunk_sentences = []
                    current_length = 0

        # Residual sentences at end of document
        if current_chunk_sentences:
            chunk_text = " ".join(current_chunk_sentences)
            if not chunks or chunk_text != chunks[-1]["text"]:
                chunks.append({
                    "id": f"{doc_id}_chunk_{chunk_idx:03d}",
                    "text": chunk_text,
                    "doc_id": doc_id,
                    "title": title,
                    "url": url,
                    "chunk_index": chunk_idx,
                    "char_start": char_offset,
                    "char_end": char_offset + len(chunk_text),
                })

        return chunks


chunker = DocumentChunker()
