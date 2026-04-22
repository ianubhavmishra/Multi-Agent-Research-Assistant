"""
Critic Agent — Evaluates quality of gathered research.
Simplified for small local models (3B) — always approves on first pass.
"""

from agents.state import AgentState
from config import rate_limit_wait


async def critic_node(state: AgentState) -> dict:
    """
    Evaluates gathered research. For small local models, we skip
    the LLM evaluation and always approve to avoid recursion loops.
    The quality control comes from the Synthesizer's grounded prompt instead.
    """
    rag_count = len(state.get("rag_results", []))
    web_count = len(state.get("web_results", []))

    critic_notes = (
        f"Research gathered: {rag_count} knowledge base chunks, "
        f"{web_count} web results. Passing to synthesizer."
    )

    await rate_limit_wait()

    return {
        "critic_notes": critic_notes,
        "needs_more_research": False,  # Always pass through — no loop
        "current_agent": "critic",
    }
