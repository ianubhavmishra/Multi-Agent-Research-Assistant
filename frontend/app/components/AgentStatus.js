"use client";

import { useState, useEffect } from "react";
import {
  HiOutlineCog6Tooth,
  HiOutlineMagnifyingGlass,
  HiOutlineBookOpen,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiCheck,
} from "react-icons/hi2";

const AGENT_STEPS = [
  {
    key: "supervisor",
    label: "Planning research strategy",
    icon: HiOutlineCog6Tooth,
    color: "text-indigo-400",
    bg: "bg-indigo-500/15",
    ring: "ring-indigo-500/30",
    gradient: "from-indigo-500 to-indigo-600",
  },
  {
    key: "researcher",
    label: "Searching knowledge base",
    icon: HiOutlineBookOpen,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    ring: "ring-emerald-500/30",
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    key: "web_searcher",
    label: "Searching the web",
    icon: HiOutlineMagnifyingGlass,
    color: "text-sky-400",
    bg: "bg-sky-500/15",
    ring: "ring-sky-500/30",
    gradient: "from-sky-500 to-sky-600",
  },
  {
    key: "critic",
    label: "Verifying information",
    icon: HiOutlineShieldCheck,
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    ring: "ring-amber-500/30",
    gradient: "from-amber-500 to-amber-600",
  },
  {
    key: "synthesizer",
    label: "Writing final answer",
    icon: HiOutlineDocumentText,
    color: "text-purple-400",
    bg: "bg-purple-500/15",
    ring: "ring-purple-500/30",
    gradient: "from-purple-500 to-purple-600",
  },
];

export default function AgentStatus({ activeAgents }) {
  const [completedAgents, setCompletedAgents] = useState(new Set());
  const [currentAgent, setCurrentAgent] = useState(null);

  useEffect(() => {
    if (!activeAgents || activeAgents.length === 0) return;

    const newAgent = activeAgents[0];

    // Mark previous agent as completed
    if (currentAgent && currentAgent !== newAgent) {
      setCompletedAgents((prev) => new Set([...prev, currentAgent]));
    }

    setCurrentAgent(newAgent);
  }, [activeAgents, currentAgent]);

  // Reset when not loading
  useEffect(() => {
    if (!activeAgents || activeAgents.length === 0) {
      setCompletedAgents(new Set());
      setCurrentAgent(null);
    }
  }, [activeAgents]);

  if (!activeAgents || activeAgents.length === 0) return null;

  return (
    <div className="animate-fade-in-up mx-1">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-1">
        {AGENT_STEPS.map((step, idx) => {
          const isCompleted = completedAgents.has(step.key);
          const isActive = currentAgent === step.key;
          const isPending = !isCompleted && !isActive;
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? `${step.bg} animate-slide-in-left`
                  : isCompleted
                  ? "opacity-60"
                  : "opacity-25"
              }`}
            >
              {/* Status icon */}
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? "bg-emerald-500/20 text-emerald-400"
                    : isActive
                    ? `bg-gradient-to-br ${step.gradient} text-white shadow-lg animate-pulse`
                    : "bg-[var(--surface-2)] text-[var(--muted)]"
                }`}
              >
                {isCompleted ? (
                  <HiCheck className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive
                    ? step.color
                    : isCompleted
                    ? "text-[var(--muted-light)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {step.label}
              </span>

              {/* Active dots */}
              {isActive && (
                <span className="flex gap-0.5 ml-auto">
                  {[0, 0.15, 0.3].map((delay) => (
                    <span
                      key={delay}
                      className={`w-1 h-1 rounded-full ${step.color.replace("text-", "bg-")} animate-pulse-dot`}
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </span>
              )}

              {/* Completed check */}
              {isCompleted && (
                <span className="ml-auto text-[10px] text-emerald-400/60">
                  Done
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
