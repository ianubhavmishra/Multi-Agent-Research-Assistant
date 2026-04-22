"""
RAG Tool — FAISS vector store for document retrieval.
Uses lazy initialization to avoid blocking server startup.
"""

import os
import faiss
import numpy as np
from typing import List, Optional
from config import FAISS_INDEX_PATH, KNOWLEDGE_BASE_PATH, MAX_RAG_CHUNKS


class RAGTool:
    """Manages a FAISS vector store for retrieval-augmented generation."""

    def __init__(self):
        self.index: Optional[faiss.IndexFlatL2] = None
        self.documents: List[dict] = []
        self._initialized = False
        self._embeddings = None

    def _get_embeddings(self):
        """Lazy load embeddings to avoid slow import-time initialization."""
        if self._embeddings is None:
            from config import get_embeddings
            print("[RAG] Initializing Ollama embeddings...")
            self._embeddings = get_embeddings()
            print("[RAG] Embeddings ready")
        return self._embeddings

    def _ensure_initialized(self):
        """Initialize index on first use, not on import."""
        if self._initialized:
            return
        self._initialized = True
        self._load_or_create_index()

    def _load_or_create_index(self):
        """Load existing FAISS index or create a new one."""
        index_file = os.path.join(FAISS_INDEX_PATH, "index.faiss")
        docs_file = os.path.join(FAISS_INDEX_PATH, "documents.npy")

        if os.path.exists(index_file) and os.path.exists(docs_file):
            self.index = faiss.read_index(index_file)
            self.documents = np.load(docs_file, allow_pickle=True).tolist()
            print(f"[RAG] Loaded FAISS index with {self.index.ntotal} vectors")
        else:
            self._ingest_knowledge_base()

    def _ingest_knowledge_base(self):
        """Load and index all .txt and .md files from knowledge_base/."""
        if not os.path.exists(KNOWLEDGE_BASE_PATH):
            os.makedirs(KNOWLEDGE_BASE_PATH, exist_ok=True)
            sample_path = os.path.join(KNOWLEDGE_BASE_PATH, "sample.md")
            with open(sample_path, "w", encoding="utf-8") as f:
                f.write(
                    "# Multi-Agent Research Assistant\n\n"
                    "This is a sample knowledge base document. Add your own .txt or .md files "
                    "to the `ai_service/knowledge_base/` directory.\n\n"
                    "## How RAG Works\n\n"
                    "1. Documents are split into overlapping chunks.\n"
                    "2. Each chunk is embedded into a vector.\n"
                    "3. Vectors are stored in FAISS for fast similarity search.\n"
                    "4. User queries are compared against the index.\n"
                    "5. Top-k similar chunks are returned as context.\n"
                )
            print("[RAG] Created sample knowledge base document")

        chunks = []
        for filename in os.listdir(KNOWLEDGE_BASE_PATH):
            if filename.endswith((".txt", ".md")):
                filepath = os.path.join(KNOWLEDGE_BASE_PATH, filename)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                file_chunks = self._chunk_text(content, filename)
                chunks.extend(file_chunks)

        if not chunks:
            print("[RAG] No documents found in knowledge base")
            return

        print(f"[RAG] Indexing {len(chunks)} chunks...")
        self._build_index(chunks)

    def _chunk_text(self, text: str, source: str, chunk_size: int = 500, overlap: int = 100) -> List[dict]:
        """Split text into overlapping chunks."""
        chunks = []
        start = 0
        chunk_id = 0
        while start < len(text):
            end = start + chunk_size
            chunk_content = text[start:end]
            if chunk_content.strip():
                chunks.append({
                    "content": chunk_content.strip(),
                    "source": source,
                    "chunk_id": f"{source}_{chunk_id}",
                })
                chunk_id += 1
            start += chunk_size - overlap
        return chunks

    def _build_index(self, chunks: List[dict]):
        """Create FAISS index from document chunks."""
        try:
            embeddings = self._get_embeddings()
            texts = [c["content"] for c in chunks]
            print(f"[RAG] Embedding {len(texts)} chunks (this may take a moment)...")
            vectors = embeddings.embed_documents(texts)
            vectors_np = np.array(vectors, dtype="float32")

            dimension = vectors_np.shape[1]
            self.index = faiss.IndexFlatL2(dimension)
            self.index.add(vectors_np)
            self.documents = chunks

            # Persist to disk
            os.makedirs(FAISS_INDEX_PATH, exist_ok=True)
            faiss.write_index(self.index, os.path.join(FAISS_INDEX_PATH, "index.faiss"))
            np.save(
                os.path.join(FAISS_INDEX_PATH, "documents.npy"),
                np.array(chunks, dtype=object),
            )
            print(f"[RAG] Built FAISS index: {self.index.ntotal} vectors, dim={dimension}")
        except Exception as e:
            print(f"[RAG] Error building index: {e}")
            self.index = None
            self.documents = []

    def search(self, query: str, top_k: int = MAX_RAG_CHUNKS) -> List[dict]:
        """Search the vector store for relevant chunks."""
        self._ensure_initialized()

        if self.index is None or self.index.ntotal == 0:
            return []

        try:
            embeddings = self._get_embeddings()
            query_vector = embeddings.embed_query(query)
            query_np = np.array([query_vector], dtype="float32")

            distances, indices = self.index.search(query_np, min(top_k, self.index.ntotal))

            results = []
            for i, idx in enumerate(indices[0]):
                if idx < len(self.documents) and idx >= 0:
                    doc = self.documents[idx]
                    results.append({
                        "content": doc["content"],
                        "source": doc["source"],
                        "score": float(distances[0][i]),
                    })
            return results
        except Exception as e:
            print(f"[RAG] Search error: {e}")
            return []

    def add_documents(self, texts: List[str], source: str = "uploaded"):
        """Add new documents to the index at runtime."""
        self._ensure_initialized()
        chunks = []
        for text in texts:
            chunks.extend(self._chunk_text(text, source))
        if chunks and self.index is not None:
            embeddings = self._get_embeddings()
            new_vectors = embeddings.embed_documents([c["content"] for c in chunks])
            new_np = np.array(new_vectors, dtype="float32")
            self.index.add(new_np)
            self.documents.extend(chunks)
            faiss.write_index(self.index, os.path.join(FAISS_INDEX_PATH, "index.faiss"))
            np.save(
                os.path.join(FAISS_INDEX_PATH, "documents.npy"),
                np.array(self.documents, dtype=object),
            )


# Singleton — no work done until .search() is called
rag_tool = RAGTool()
