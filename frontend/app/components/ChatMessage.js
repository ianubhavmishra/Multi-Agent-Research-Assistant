"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  HiOutlineUser,
  HiOutlineSparkles,
  HiOutlineGlobeAlt,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 animate-fade-in-up ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--accent-glow)] mt-1">
          <HiOutlineSparkles className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
          isUser
            ? "bg-gradient-to-br from-[var(--accent)] to-indigo-700 text-white rounded-br-md shadow-lg shadow-[var(--accent-glow)]"
            : "bg-[var(--surface)] border border-[var(--border)] rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <div className="prose-chat text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Sources / Citations */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5 mb-2.5">
              <HiOutlineGlobeAlt className="w-3.5 h-3.5 text-[var(--accent-light)]" />
              <p className="text-[11px] text-[var(--muted)] font-semibold uppercase tracking-widest">
                Sources ({message.sources.length})
              </p>
            </div>
            <div className="space-y-1.5">
              {message.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 text-xs px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-3)] transition-all duration-200"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-md bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent-light)] text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-[var(--muted-light)] group-hover:text-[var(--foreground)] truncate transition-colors">
                    {source.title || new URL(source.url).hostname}
                  </span>
                  <HiOutlineArrowTopRightOnSquare className="w-3 h-3 text-[var(--muted)] group-hover:text-[var(--accent-light)] transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center mt-1">
          <HiOutlineUser className="w-4 h-4 text-[var(--muted)]" />
        </div>
      )}
    </div>
  );
}
