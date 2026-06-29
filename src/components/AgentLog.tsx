"use client";

import React, { useEffect, useRef } from "react";

export interface LogEntry {
  time: string;
  agent: string;
  message: string;
  level: "info" | "ok" | "warn" | "error";
}

interface AgentLogProps {
  logs: LogEntry[];
}

const AGENT_COLORS: Record<string, string> = {
  "cmo-orchestrator": "#a78bfa",
  "content-drafter": "#14b8a6",
  "visual-prompt-gen": "#f59e0b",
  "slides-maker": "#3b82f6",
  "publisher-agent": "#22c55e",
  "school-outreach": "#f97316",
  system: "#64748b",
};

const LEVEL_COLORS: Record<LogEntry["level"], string> = {
  info: "#94a3b8",
  ok: "#22c55e",
  warn: "#f59e0b",
  error: "#ef4444",
};

const LEVEL_PREFIX: Record<LogEntry["level"], string> = {
  info: "»",
  ok: "✓",
  warn: "⚠",
  error: "✗",
};

export default function AgentLog({ logs }: AgentLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "var(--bg)",
        padding: "8px",
        fontFamily: "monospace",
        fontSize: "11px",
      }}
    >
      {logs.length === 0 ? (
        <div style={{ color: "var(--text3)", padding: "8px", textAlign: "center" }}>
          — no logs yet —
        </div>
      ) : (
        logs.map((entry, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "8px",
              padding: "2px 4px",
              borderRadius: "2px",
              marginBottom: "1px",
              background: entry.level === "error" ? "rgba(239,68,68,0.06)" : "transparent",
            }}
          >
            <span style={{ color: "var(--text3)", minWidth: "70px", flexShrink: 0 }}>
              {entry.time}
            </span>
            <span
              style={{
                color: LEVEL_COLORS[entry.level],
                minWidth: "12px",
                flexShrink: 0,
              }}
            >
              {LEVEL_PREFIX[entry.level]}
            </span>
            <span
              style={{
                color: AGENT_COLORS[entry.agent] || "#94a3b8",
                minWidth: "130px",
                flexShrink: 0,
              }}
            >
              [{entry.agent}]
            </span>
            <span style={{ color: LEVEL_COLORS[entry.level], flex: 1 }}>
              {entry.message}
            </span>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
