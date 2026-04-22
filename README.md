# 🔬 Multi-Agent Research Assistant

> 🚧 **Work in Progress / Prototype Phase**
> 
> This project is currently in the active development phase and serves as an initial prototype. Expect ongoing architectural refinements, major UI/UX enhancements, and new features to be rolled out. The current implementation demonstrates the core multi-agent pipeline and capabilities.

An experimental research assistant powered by multiple AI agents that collaborate to plan, research, verify, and synthesize accurate answers with citations.

![Architecture](https://img.shields.io/badge/Architecture-Multi--Agent-blue)
![LLM](https://img.shields.io/badge/LLM-Ollama%20(Local)-green)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016-black)
![Backend](https://img.shields.io/badge/Backend-Express%20%2B%20FastAPI-yellow)

## ✨ Features

- **Multi-Agent Pipeline** — 5 specialized AI agents collaborate via LangGraph
- **RAG (Retrieval-Augmented Generation)** — FAISS vector store with local document embedding
- **Web Search** — Tavily API + DuckDuckGo fallback for real-time info
- **Chat History** — Persistent conversations with session management
- **Search Caching** — In-memory TTL cache to avoid redundant API calls
- **Streaming SSE** — Real-time agent status & response streaming
- **Fully Local** — Runs on 8GB RAM using Ollama (no cloud API required)

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js Frontend                    │
│              (Chat UI + Sidebar + SSE Client)           │
└───────────────────────────┬─────────────────────────────┘
                            │ SSE Stream
┌───────────────────────────▼─────────────────────────────┐
│                  FastAPI AI Service (:8000)             │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │Supervisor│→ │Researcher│→ │Web Search│               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       │             │             │                     │
│  ┌────▼─────┐  ┌─────▼────┐  ┌─────▼────┐               │
│  │  Critic  │← │  FAISS   │  │ Tavily / │               │
│  └────┬─────┘  │  Vector  │  │ DDG API  │               │
│       │        │  Store   │  └──────────┘               │
│  ┌────▼──────┐ └──────────┘                             │
│  │Synthesizer│                                          │
│  └───────────┘                                          │
└─────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│               Express Backend (:5000)                   │
│           (Chat History + Session API)                  │
└─────────────────────────────────────────────────────────┘
```

## 🤖 Agent Pipeline

| Agent | Role | Description |
|-------|------|-------------|
| **Supervisor** | Planning | Analyzes query, creates research plan |
| **Researcher** | RAG Search | Queries FAISS knowledge base |
| **Web Searcher** | Live Search | Fetches real-time info from the web |
| **Critic** | Quality Gate | Validates research completeness |
| **Synthesizer** | Final Answer | Compiles findings into cited markdown |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **Ollama** ([Install](https://ollama.com/download))

### 1. Pull Ollama Models

```bash
ollama pull qwen2.5:3b         # LLM (2GB)
ollama pull nomic-embed-text    # Embeddings (274MB)
```

### 2. Setup AI Service

```bash
cd ai_service
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
```

Create `ai_service/.env`:
```env
TAVILY_API_KEY=your_key_here   # Optional — falls back to DuckDuckGo
```

### 3. Setup Backend

```bash
cd backend
npm install
```

### 4. Setup Frontend

```bash
cd frontend
npm install
```

### 5. Run Everything

Open 3 terminals:

```bash
# Terminal 1 — AI Service
cd ai_service && venv\Scripts\activate && python main.py

# Terminal 2 — Backend
cd backend && npm run dev

# Terminal 3 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:3000** 🎉

## 📁 Project Structure

```
Multi-Agent Assistant/
├── frontend/                  # Next.js 16 + Tailwind CSS
│   ├── app/
│   │   ├── page.js           # Main chat page with sidebar
│   │   ├── layout.js         # Root layout
│   │   ├── globals.css       # Design system
│   │   └── components/
│   │       ├── ChatMessage.js   # Message renderer (markdown)
│   │       ├── ChatInput.js     # Input bar
│   │       ├── AgentStatus.js   # Agent progress indicators
│   │       └── ChatSidebar.js   # Session management sidebar
│   └── package.json
│
├── backend/                   # Express.js API
│   ├── server.js             # REST API for chat history
│   ├── chatStore.js          # JSON file-based persistence
│   └── package.json
│
├── ai_service/                # Python FastAPI + LangGraph
│   ├── main.py               # FastAPI app + SSE streaming
│   ├── config.py             # Ollama LLM config
│   ├── agents/
│   │   ├── state.py          # AgentState TypedDict
│   │   ├── graph.py          # LangGraph wiring
│   │   ├── supervisor.py     # Planner agent
│   │   ├── researcher.py     # RAG agent
│   │   ├── web_searcher.py   # Web search agent
│   │   ├── critic.py         # Quality evaluator
│   │   └── synthesizer.py    # Final answer compiler
│   ├── tools/
│   │   ├── rag.py            # FAISS vector store
│   │   ├── web_search.py     # Tavily + DuckDuckGo
│   │   └── cache.py          # In-memory TTL cache
│   ├── knowledge_base/       # Drop .txt/.md files here for RAG
│   └── requirements.txt
│
└── README.md
```

## ⚙️ Configuration

### Environment Variables

| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `OLLAMA_BASE_URL` | AI Service | `http://localhost:11434` | Ollama server URL |
| `LLM_MODEL` | AI Service | `qwen2.5:3b` | Ollama model name |
| `EMBED_MODEL` | AI Service | `nomic-embed-text` | Embedding model |
| `TAVILY_API_KEY` | AI Service | _(empty)_ | Optional web search API key |
| `PORT` | Backend | `5000` | Express API port |
| `NEXT_PUBLIC_API_URL` | Frontend | `http://localhost:8000` | FastAPI URL |
| `NEXT_PUBLIC_BACKEND_URL` | Frontend | `http://localhost:5000` | Express URL |

### Using a Different LLM

Edit `ai_service/.env` or set env vars:
```env
LLM_MODEL=llama3.2:3b        # Or any Ollama model
EMBED_MODEL=nomic-embed-text
```

### Adding Knowledge Base Documents

Drop `.txt` or `.md` files into `ai_service/knowledge_base/`. They'll be automatically chunked, embedded, and indexed on next startup.

## 🧠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, Tailwind CSS, react-icons, react-markdown |
| **Backend** | Express.js, JSON file store |
| **AI Service** | FastAPI, LangGraph, LangChain |
| **LLM** | Ollama (qwen2.5:3b) |
| **Embeddings** | Ollama (nomic-embed-text) |
| **Vector DB** | FAISS (local, in-process) |
| **Web Search** | Tavily API / DuckDuckGo |

## 📝 License

MIT
