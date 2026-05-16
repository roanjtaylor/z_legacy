"use client";

import { useState } from "react";

export function AskBox({
  focusPersonId,
  onClear,
}: {
  focusPersonId?: string;
  onClear?: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, focusPersonId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="space-y-3 p-5 border border-neutral-200 rounded-xl bg-white">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          Ask Claude
        </h3>
        {focusPersonId && (
          <div className="text-xs text-neutral-600 flex items-center gap-2">
            focus: <span className="font-medium">{focusPersonId}</span>
            {onClear && (
              <button
                onClick={onClear}
                className="text-neutral-400 hover:text-neutral-900"
                aria-label="Clear focus"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g., What did Tier-1 founders do at age 21 that I should consider this year?"
        className="w-full p-3 border border-neutral-300 rounded-lg text-sm min-h-[90px] resize-y focus:outline-none focus:ring-2 focus:ring-neutral-900"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-500">
          Cmd/Ctrl + Enter to send.
        </span>
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </div>
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}
      {answer && (
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}
