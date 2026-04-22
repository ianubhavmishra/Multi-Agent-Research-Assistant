"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import AgentStatus from "./components/AgentStatus";
import ChatSidebar from "./components/ChatSidebar";
import {
  HiOutlineSparkles,
  HiOutlineBolt,
  HiOutlineGlobeAlt,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

const AI_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const SUGGESTED_QUERIES = [
  "Explain how transformers work in NLP with recent advancements",
  "Compare React, Vue, and Svelte for large-scale applications",
  "What are the latest breakthroughs in quantum computing?",
  "Summarize the key ideas from 'Thinking, Fast and Slow'",
];

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgents, setActiveAgents] = useState([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Save message to backend
  const saveMessage = async (sid, msg) => {
    try {
      await fetch(`${BACKEND_URL}/api/sessions/${sid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg),
      });
    } catch {}
  };

  // Create a new session
  const createSession = async (title) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      return data.session?.id;
    } catch {
      return crypto.randomUUID();
    }
  };

  // Load a session
  const loadSession = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions/${id}`);
      const data = await res.json();
      if (data.session) {
        setMessages(data.session.messages || []);
        setSessionId(id);
      }
    } catch {}
  };

  // New chat
  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setStreamingContent("");
    setActiveAgents([]);
  };

  const handleSend = async (content) => {
    const userMessage = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setActiveAgents([]);
    setStreamingContent("");

    // Create session if needed
    let sid = sessionId;
    if (!sid) {
      sid = await createSession(content.slice(0, 60));
      setSessionId(sid);
    }

    // Save user message
    await saveMessage(sid, userMessage);

    try {
      const response = await fetch(`${AI_URL}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: messages.slice(-10),
        }),
      });

      if (!response.ok) throw new Error("Backend request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let sources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            switch (parsed.type) {
              case "agent_status":
                setActiveAgents(parsed.active_agents || []);
                break;
              case "token":
                accumulated += parsed.content;
                setStreamingContent(accumulated);
                break;
              case "sources":
                sources = parsed.sources || [];
                break;
              case "error":
                accumulated += `\n\n> ⚠️ Error: ${parsed.message}`;
                setStreamingContent(accumulated);
                break;
              default:
                break;
            }
          } catch {
            // Non-JSON SSE line, ignore
          }
        }
      }

      // Finalize the assistant message
      const assistantMsg = { role: "assistant", content: accumulated, sources };
      setMessages((prev) => [...prev, assistantMsg]);
      setStreamingContent("");
      setActiveAgents([]);

      // Save assistant message
      await saveMessage(sid, assistantMsg);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg = {
        role: "assistant",
        content: "Sorry, I encountered an error connecting to the AI service. Please make sure all services are running.",
      };
      setMessages((prev) => [...prev, errorMsg]);
      await saveMessage(sid, errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = messages.length === 0 && !streamingContent;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <ChatSidebar
        currentSessionId={sessionId}
        onSelectSession={loadSession}
        onNewChat={handleNewChat}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--accent-glow)]">
              <HiOutlineSparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[var(--foreground)]">
                Research Assistant
              </h1>
              <p className="text-xs text-[var(--muted)]">
                Multi-Agent · RAG · Web Search
              </p>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-[var(--accent-glow)]">
                <HiOutlineSparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Multi-Agent Research Assistant
              </h2>
              <p className="text-sm text-[var(--muted)] max-w-md mb-8">
                Ask me anything. I use multiple AI agents to plan, research,
                verify, and synthesize accurate answers with citations.
              </p>

              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {[
                  { icon: HiOutlineBolt, label: "Multi-Agent Planning" },
                  { icon: HiOutlineGlobeAlt, label: "Web Search" },
                  { icon: HiOutlineShieldCheck, label: "Fact Verification" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]"
                  >
                    <Icon className="w-3.5 h-3.5 text-[var(--accent-light)]" />
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                {SUGGESTED_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-left text-xs p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)] hover:shadow-lg hover:shadow-[var(--accent-glow)] transition-all duration-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
              ))}

              {streamingContent && (
                <ChatMessage
                  message={{ role: "assistant", content: streamingContent }}
                />
              )}

              {isLoading && <AgentStatus activeAgents={activeAgents} />}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input */}
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
