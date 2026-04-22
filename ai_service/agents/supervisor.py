"""
Supervisor Agent — Analyzes the query and creates an execution plan.
"""

from langchain_core.messages import HumanMessage
from agents.state import AgentState
from config import get_pro_llm, rate_limit_wait

SUPERVISOR_PROMPT = """Create a brief research plan for this query. List 3 key points to investigate.

Query: {query}

Plan:"""


async def supervisor_node(state: AgentState) -> dict:
    """Analyzes the user query and produces a research plan."""
    llm = get_pro_llm(temperature=0.2)
    query = state["query"]

    response = await llm.ainvoke(
        [HumanMessage(content=SUPERVISOR_PROMPT.format(query=query))]
    )

    plan = response.content
    await rate_limit_wait()

    return {
        "plan": plan,
        "current_agent": "supervisor",
        "iteration": state.get("iteration", 0) + 1,
    }
