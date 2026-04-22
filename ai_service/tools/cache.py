"""
In-memory cache with TTL — lightweight Redis alternative.
Caches web search results and LLM responses to avoid repeat calls.
"""

import time
import hashlib
from typing import Any, Optional


class MemoryCache:
    """Simple TTL-based in-memory cache."""

    def __init__(self, default_ttl: int = 300):
        self._cache: dict = {}
        self._default_ttl = default_ttl  # 5 minutes default

    def _make_key(self, prefix: str, data: str) -> str:
        """Create a short hash key from prefix + data."""
        h = hashlib.md5(data.encode()).hexdigest()[:12]
        return f"{prefix}:{h}"

    def get(self, key: str) -> Optional[Any]:
        """Get value if key exists and hasn't expired."""
        if key in self._cache:
            entry = self._cache[key]
            if time.time() < entry["expires"]:
                return entry["value"]
            else:
                del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Store a value with TTL (seconds)."""
        self._cache[key] = {
            "value": value,
            "expires": time.time() + (ttl or self._default_ttl),
        }

    def cache_search(self, query: str) -> Optional[list]:
        """Check if web search results are cached."""
        key = self._make_key("search", query.lower().strip())
        return self.get(key)

    def set_search(self, query: str, results: list, ttl: int = 600):
        """Cache web search results (10 min default)."""
        key = self._make_key("search", query.lower().strip())
        self.set(key, results, ttl)

    def stats(self) -> dict:
        """Return cache statistics."""
        now = time.time()
        active = sum(1 for v in self._cache.values() if now < v["expires"])
        return {"total_keys": len(self._cache), "active_keys": active}

    def clear(self):
        """Clear all cached entries."""
        self._cache.clear()


# Singleton cache instance
cache = MemoryCache(default_ttl=300)
