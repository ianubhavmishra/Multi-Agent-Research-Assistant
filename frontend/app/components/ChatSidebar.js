"use client";

import { useState, useEffect } from "react";
import {
  HiOutlinePlusCircle,
  HiOutlineTrash,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function ChatSidebar({ currentSessionId, onSelectSession, onNewChat }) {
  const [sessions, setSessions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentSessionId]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`${BACKEND_URL}/api/sessions/${id}`, { method: "DELETE" });
      fetchSessions();
      if (id === currentSessionId) onNewChat();
    } catch {}
  };

  return (
    <>
      {/* Toggle button for mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 z-[60] p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition lg:hidden"
        aria-label="Toggle sidebar"
      >
        <HiOutlineChatBubbleLeftRight className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative top-0 left-0 h-full w-64 bg-[var(--background)] border-r border-[var(--border)] z-50 flex flex-col transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)]">
          <button
            onClick={() => { onNewChat(); setIsOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-purple-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-[var(--accent-glow)]"
          >
            <HiOutlinePlusCircle className="w-4 h-4" />
            New Research
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-[var(--muted)] text-center mt-8 px-4">
              No conversations yet. Start a new research query!
            </p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => { onSelectSession(s.id); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition group flex items-center gap-2 ${
                  s.id === currentSessionId
                    ? "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--accent)]/30"
                    : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                }`}
              >
                <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate flex-1">{s.title}</span>
                <span
                  onClick={(e) => handleDelete(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 transition"
                >
                  <HiOutlineTrash className="w-3 h-3" />
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)] text-center">
          <p className="text-[10px] text-[var(--muted)]">
            Powered by Ollama · LangGraph
          </p>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
