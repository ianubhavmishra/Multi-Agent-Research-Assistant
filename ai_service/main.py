"""
Multi-Agent Research Assistant — FastAPI AI Service
Provides a streaming SSE endpoint that orchestrates the LangGraph multi-agent pipeline.
"""

import os
import json
import asyncio
import traceback
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

load_dotenv()

app = FastAPI(title="Multi-Agent AI Service", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request / Response Models ---
class ChatMessage(BaseModel):
    role: str
    content: str
    sources: Optional[List[dict]] = None


class ResearchRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


# --- SSE Helper ---
def sse_event(data: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(data)}\n\n"


# --- LangGraph Streaming Pipeline ---
async def agent_stream(query: str, history: list):
    """
    Runs the real LangGraph multi-agent pipeline and streams SSE events.
    Each agent node emits a status update, and the final answer is streamed token-by-token.
    """
    from agents.graph import research_graph

    # Prepare initial state
    initial_state = {
        "messages": [],
        "query": query,
        "plan": None,
        "rag_results": [],
        "web_results": [],
        "critic_notes": None,
        "final_answer": None,
        "sources": [],
        "current_agent": "",
        "iteration": 0,
        "needs_more_research": False,
    }

    # Add history as context
    for msg in history[-6:]:  # Last 6 messages for context window
        initial_state["messages"].append(
            {"role": msg.role, "content": msg.content}
        )

    try:
        # Run the graph and stream node-level updates
        last_agent = ""
        final_state = None
        print(f"[Pipeline] Starting for query: {query[:80]}...")

        async for event in research_graph.astream(
            initial_state,
            config={"recursion_limit": 15},
        ):
            # Each event is {node_name: state_update}
            for node_name, state_update in event.items():
                if node_name == "__end__":
                    continue

                current_agent = state_update.get("current_agent", node_name)
                print(f"[Pipeline] Agent completed: {current_agent}")

                # Emit agent status change
                if current_agent != last_agent:
                    yield sse_event(
                        {"type": "agent_status", "active_agents": [current_agent]}
                    )
                    last_agent = current_agent

                # Keep track of final state
                final_state = state_update

        # Stream the final answer token by token
        if final_state and final_state.get("final_answer"):
            yield sse_event({"type": "agent_status", "active_agents": ["synthesizer"]})
            await asyncio.sleep(0.1)

            answer = final_state["final_answer"]
            batch_size = 12  # Characters per SSE event (balance speed vs smoothness)
            for i in range(0, len(answer), batch_size):
                chunk = answer[i : i + batch_size]
                yield sse_event({"type": "token", "content": chunk})
                await asyncio.sleep(0.015)

            # Send sources
            sources = final_state.get("sources", [])
            if sources:
                yield sse_event({"type": "sources", "sources": sources})
        else:
            yield sse_event(
                {
                    "type": "token",
                    "content": "I apologize, but I wasn't able to generate a complete response. Please try again.",
                }
            )

    except Exception as e:
        error_msg = str(e)
        print(f"[Agent Stream Error] {error_msg}")
        traceback.print_exc()

        # Provide helpful error messages
        if "API key" in error_msg or "GOOGLE_API_KEY" in error_msg or "invalid" in error_msg.lower():
            yield sse_event(
                {
                    "type": "token",
                    "content": (
                        "## ⚠️ API Key Error\n\n"
                        "Your Gemini API key is missing or invalid. "
                        "Please set a valid `GOOGLE_API_KEY` in `ai_service/.env`.\n\n"
                        "Get a free key at: [Google AI Studio](https://aistudio.google.com/app/apikey)"
                    ),
                }
            )
        elif "quota" in error_msg.lower() or "rate" in error_msg.lower():
            yield sse_event(
                {
                    "type": "token",
                    "content": (
                        "## ⚠️ Rate Limit\n\n"
                        "You've hit the Gemini API free-tier rate limit. "
                        "Please wait a minute and try again."
                    ),
                }
            )
        else:
            yield sse_event(
                {
                    "type": "token",
                    "content": f"## ⚠️ Error\n\nAn error occurred during research:\n\n```\n{error_msg}\n```",
                }
            )

    finally:
        # Always clear agent status
        yield sse_event({"type": "agent_status", "active_agents": []})


# --- Endpoints ---
@app.get("/health")
async def health():
    from tools.cache import cache
    from config import LLM_MODEL, OLLAMA_BASE_URL
    return {
        "status": "ok",
        "service": "ai_service",
        "version": "0.3.0",
        "llm": LLM_MODEL,
        "ollama_url": OLLAMA_BASE_URL,
        "cache_stats": cache.stats(),
    }


@app.get("/api/cache/stats")
async def cache_stats():
    """Return cache statistics."""
    from tools.cache import cache
    return cache.stats()


@app.post("/api/cache/clear")
async def cache_clear():
    """Clear the search cache."""
    from tools.cache import cache
    cache.clear()
    return {"status": "cleared"}


@app.post("/api/research")
async def research(request: ResearchRequest):
    """
    Main research endpoint. Runs the LangGraph multi-agent pipeline
    and streams SSE events back to the client.
    """
    return StreamingResponse(
        agent_stream(request.message, request.history),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
