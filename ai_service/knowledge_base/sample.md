# Multi-Agent Research Assistant

This is a sample knowledge base document. You can add your own .txt or .md files to the `ai_service/knowledge_base/` directory. They will be automatically chunked, embedded using Gemini's text-embedding-004 model, and indexed in FAISS for retrieval-augmented generation.

## How RAG Works

1. Documents are split into overlapping chunks of ~500 characters.
2. Each chunk is embedded into a 768-dimensional vector.
3. Vectors are stored in a FAISS index for fast similarity search.
4. When a user asks a question, the query is embedded and compared against the index.
5. The top-k most similar chunks are returned as context for the LLM.
