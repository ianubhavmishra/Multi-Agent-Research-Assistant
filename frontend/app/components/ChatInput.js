"use client";

import { useState, useRef } from "react";
import { HiOutlinePaperAirplane } from "react-icons/hi2";

export default function ChatInput({ onSend, isLoading }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  };

  return (
    <div className="border-t border-[var(--border)] glass">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-4">
        <div className="relative flex items-end gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3 glow-ring transition-all duration-300 hover:border-[var(--border-glow)]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... research, analyze, compare..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] max-h-40 leading-relaxed"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-r from-[var(--accent)] to-indigo-700 flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--accent-glow)] transition-all duration-200 active:scale-90"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
            ) : (
              <HiOutlinePaperAirplane className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-[var(--muted)] mt-2 select-none">
          Multi-Agent Research Assistant · Powered by Ollama + LangGraph
        </p>
      </form>
    </div>
  );
}
