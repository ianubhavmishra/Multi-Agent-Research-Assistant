"""
Synthesizer Agent — Compiles all research into a final answer with citations.
"""

from langchain_core.messages import HumanMessage
from agents.state import AgentState
from config import get_pro_llm, rate_limit_wait

SYNTHESIZER_PROMPT = """You are a research assistant. Using ONLY the data provided below, write a clear and comprehensive answer to the user's question. Use markdown formatting with headings and bullet points.

If a source URL is available, cite it inline like [Source](url). Do not make up information.

## Question
{query}

## Research Data
{research_data}

## Answer
"""


async def synthesizer_node(state: AgentState) -> dict:
    """Synthesizes all research data into a final markdown response."""
    query = state["query"]

    # Combine all research data into one block
    parts = []

    for r in state.get("rag_results", []):
        source = r.get("source", "Knowledge Base")
        parts.append(f"[{source}]: {r['content']}")

    for r in state.get("web_results", []):
        title = r.get("title", "Web")
        url = r.get("url", "")
        content = r.get("content", "")
        if url:
            parts.append(f"[{title}]({url}): {content}")
        else:
            parts.append(f"[{title}]: {content}")

    research_data = "\n\n".join(parts) if parts else "No research data was found."

    llm = get_pro_llm(temperature=0.4)
    response = await llm.ainvoke(
        [HumanMessage(content=SYNTHESIZER_PROMPT.format(
            query=query,
            research_data=research_data,
        ))]
    )

    await rate_limit_wait()

    # Deduplicate sources
    seen = set()
    unique_sources = []
    for s in state.get("sources", []):
        if s.get("url") and s["url"] not in seen:
            seen.add(s["url"])
            unique_sources.append(s)

    return {
        "final_answer": response.content,
        "sources": unique_sources,
        "current_agent": "synthesizer",
    }
