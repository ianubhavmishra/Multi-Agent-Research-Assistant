"""
Web Search Tool — Tavily API integration for real-time web searching.
Falls back to a simple httpx-based search if Tavily key is not available.
"""

import os
import httpx
from typing import List
from config import TAVILY_API_KEY, MAX_SEARCH_RESULTS
from tools.cache import cache


async def tavily_search(query: str, max_results: int = MAX_SEARCH_RESULTS) -> List[dict]:
    """
    Search the web using Tavily API (optimized for LLM consumption).
    Returns list of {title, url, content} dicts. Results are cached for 10 min.
    """
    # Check cache first
    cached = cache.cache_search(query)
    if cached is not None:
        print(f"[WebSearch] Cache hit for: {query[:50]}")
        return cached

    if not TAVILY_API_KEY:
        results = await _fallback_search(query)
        cache.set_search(query, results)
        return results

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": TAVILY_API_KEY,
                    "query": query,
                    "search_depth": "advanced",
                    "max_results": max_results,
                    "include_answer": True,
                    "include_raw_content": False,
                },
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data.get("results", []):
                results.append(
                    {
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "content": item.get("content", "")[:1000],
                    }
                )
            cache.set_search(query, results)
            return results

    except Exception as e:
        print(f"[WebSearch] Tavily error: {e}")
        results = await _fallback_search(query)
        cache.set_search(query, results)
        return results


async def _fallback_search(query: str) -> List[dict]:
    """
    Fallback search when Tavily is unavailable.
    Uses DuckDuckGo's instant answer API (no key required).
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": 1},
            )
            data = response.json()

            results = []
            # Abstract text
            if data.get("AbstractText"):
                results.append(
                    {
                        "title": data.get("Heading", "DuckDuckGo Abstract"),
                        "url": data.get("AbstractURL", ""),
                        "content": data["AbstractText"][:1000],
                    }
                )
            # Related topics
            for topic in data.get("RelatedTopics", [])[:4]:
                if isinstance(topic, dict) and topic.get("Text"):
                    results.append(
                        {
                            "title": topic.get("Text", "")[:80],
                            "url": topic.get("FirstURL", ""),
                            "content": topic.get("Text", "")[:500],
                        }
                    )
            return results

    except Exception as e:
        print(f"[WebSearch] Fallback search error: {e}")
        return [
            {
                "title": "Search Unavailable",
                "url": "",
                "content": f"Web search is currently unavailable. Error: {str(e)}",
            }
        ]
