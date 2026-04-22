"""
Configuration module — LLM setup via Ollama (local, no rate limits).

Model Strategy (8GB RAM Optimized):
  - qwen2.5:3b for ALL agents (~2GB RAM, fast, capable)
  - nomic-embed-text for vector embeddings (~274MB)
  - No API keys needed, no rate limits, fully offline
"""

import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

# Ollama runs locally — no API key needed for LLM
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

# Keep Gemini key as optional fallback for embeddings
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Ollama settings
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5:3b")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")

# No rate limit delay needed for local Ollama
RATE_LIMIT_DELAY = 0.1  # minimal delay just for UI status updates


async def rate_limit_wait():
    """Minimal delay for UI agent-status rendering."""
    await asyncio.sleep(RATE_LIMIT_DELAY)


# --- LLM Instances (Ollama — local) ---

def get_pro_llm(temperature: float = 0.3):
    """Local Ollama model — used for Supervisor, Critic, Synthesizer."""
    from langchain_ollama import ChatOllama
    return ChatOllama(
        model=LLM_MODEL,
        base_url=OLLAMA_BASE_URL,
        temperature=temperature,
        num_predict=4096,
    )


def get_flash_llm(temperature: float = 0.2):
    """Local Ollama model — used for Researcher, Web Searcher."""
    from langchain_ollama import ChatOllama
    return ChatOllama(
        model=LLM_MODEL,
        base_url=OLLAMA_BASE_URL,
        temperature=temperature,
        num_predict=2048,
    )


def get_embeddings():
    """Local Ollama embeddings via nomic-embed-text."""
    from langchain_ollama import OllamaEmbeddings
    return OllamaEmbeddings(
        model=EMBED_MODEL,
        base_url=OLLAMA_BASE_URL,
    )


# --- Constants ---
FAISS_INDEX_PATH = os.path.join(os.path.dirname(__file__), "vector_store")
KNOWLEDGE_BASE_PATH = os.path.join(os.path.dirname(__file__), "knowledge_base")
MAX_SEARCH_RESULTS = 5
MAX_RAG_CHUNKS = 5
MAX_GRAPH_RECURSION = 10
