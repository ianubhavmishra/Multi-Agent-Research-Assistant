"""
LangGraph Multi-Agent Graph — Defines the execution flow between agents.

Flow:
  Supervisor → [Researcher + Web Searcher] → Critic → (loop if needed) → Synthesizer
"""

from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.supervisor import supervisor_node
from agents.researcher import researcher_node
from agents.web_searcher import web_searcher_node
from agents.critic import critic_node
from agents.synthesizer import synthesizer_node


def should_continue_after_critic(state: AgentState) -> str:
    """
    After the Critic evaluates, decide whether to:
    - Loop back to research (if data is insufficient and under recursion limit)
    - Proceed to synthesis (if data is sufficient)
    """
    if state.get("needs_more_research", False) and state.get("iteration", 0) < 3:
        return "research_again"
    return "synthesize"


def build_research_graph() -> StateGraph:
    """
    Constructs the multi-agent LangGraph.

    Graph structure:
        supervisor → researcher → web_searcher → critic
            ↑                                        |
            └──────── (if needs more research) ──────┘
                                                     |
                                                     ↓
                                                synthesizer → END
    """
    graph = StateGraph(AgentState)

    # Add all agent nodes
    graph.add_node("supervisor", supervisor_node)
    graph.add_node("researcher", researcher_node)
    graph.add_node("web_searcher", web_searcher_node)
    graph.add_node("critic", critic_node)
    graph.add_node("synthesizer", synthesizer_node)

    # Define edges (execution flow)
    graph.set_entry_point("supervisor")
    graph.add_edge("supervisor", "researcher")
    graph.add_edge("researcher", "web_searcher")
    graph.add_edge("web_searcher", "critic")

    # Conditional edge after critic
    graph.add_conditional_edges(
        "critic",
        should_continue_after_critic,
        {
            "research_again": "researcher",  # Loop back
            "synthesize": "synthesizer",     # Proceed to final answer
        },
    )

    graph.add_edge("synthesizer", END)

    return graph.compile()


# Compiled graph — ready to invoke
research_graph = build_research_graph()
