"""
Researcher Agent — Queries the FAISS knowledge base using RAG.
"""

from langchain_core.messages import HumanMessage
from agents.state import AgentState
from tools.rag import rag_tool
from config import get_flash_llm, rate_limit_wait

RESEARCHER_PROMPT = """Generate 2 short search queries to find information about this topic. One per line, no numbering.

Topic: {query}
"""


async def researcher_node(state: AgentState) -> dict:
    """Queries the FAISS vector store for relevant knowledge base chunks."""
    query = state["query"]

    # Use LLM to generate search queries
    llm = get_flash_llm()
    response = await llm.ainvoke(
        [HumanMessage(content=RESEARCHER_PROMPT.format(query=query))]
    )

    search_queries = [q.strip().strip('"').strip("'").strip('-').strip('*').strip() 
                      for q in response.content.strip().split("\n") if q.strip()]
    await rate_limit_wait()

    if not search_queries:
        search_queries = [query]

    # Search the vector store
    all_results = []
    seen_chunks = set()
    for sq in search_queries[:2]:
        results = rag_tool.search(sq, top_k=3)
        for r in results:
            chunk_key = r["content"][:100]
            if chunk_key not in seen_chunks:
                seen_chunks.add(chunk_key)
                all_results.append(r)

    return {
        "rag_results": all_results[:5],
        "current_agent": "researcher",
    }
