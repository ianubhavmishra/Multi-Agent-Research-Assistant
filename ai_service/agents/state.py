"""
Agent State — Shared state schema for the LangGraph multi-agent pipeline.
All agents read from and write to this state as it flows through the graph.
"""

from typing import List, Annotated, Optional
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """
    Shared state passed between all agents in the graph.

    Fields:
        messages:       Chat history (user + assistant messages)
        query:          The original user query
        plan:           Supervisor's breakdown of sub-tasks
        rag_results:    Retrieved chunks from the knowledge base
        web_results:    Results from web search
        critic_notes:   Critic's evaluation and feedback
        final_answer:   The synthesized final response
        sources:        Collected citation sources
        current_agent:  Name of the currently active agent (for UI status)
        iteration:      Current graph iteration (for recursion control)
        needs_more_research: Flag set by critic if data is insufficient
    """

    messages: Annotated[list, add_messages]
    query: str
    plan: Optional[str]
    rag_results: List[dict]
    web_results: List[dict]
    critic_notes: Optional[str]
    final_answer: Optional[str]
    sources: List[dict]
    current_agent: str
    iteration: int
    needs_more_research: bool
