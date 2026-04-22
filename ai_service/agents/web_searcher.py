"""
Web Searcher Agent — Searches the web for current, public information.
"""

from langchain_core.messages import HumanMessage
from agents.state import AgentState
from tools.web_search import tavily_search
from config import get_flash_llm, rate_limit_wait

WEB_SEARCH_PROMPT = """Generate 1 focused web search query for this topic. Return ONLY the search query, nothing else.

Topic: {query}
"""


async def web_searcher_node(state: AgentState) -> dict:
    """Searches the web for relevant public information."""
    query = state["query"]

    # Generate focused search query
    llm = get_flash_llm()
    response = await llm.ainvoke(
        [HumanMessage(content=WEB_SEARCH_PROMPT.format(query=query))]
    )

    search_query = response.content.strip().strip('"').strip("'").split("\n")[0].strip()
    await rate_limit_wait()

    if not search_query:
        search_query = query

    # Execute web search
    all_results = []
    try:
        results = await tavily_search(search_query, max_results=3)
        all_results.extend(results)
    except Exception as e:
        print(f"[Web Search Error] {e}")

    # Collect sources for citation
    sources = [
        {"title": r.get("title", "Web Source"), "url": r["url"]}
        for r in all_results
        if r.get("url")
    ]

    return {
        "web_results": all_results[:5],
        "sources": state.get("sources", []) + sources,
        "current_agent": "web_searcher",
    }
