"use client";

import Link from "next/link";
import { useState } from "react";

type ResearchResponse = {
  draft: unknown;
  searchCount: number;
  reasoning?: string;
};

export default function ResearchPage() {
  const [name, setName] = useState("");
  const [hint, setHint] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [searchCount, setSearchCount] = useState<number | null>(null);
  const [researching, setResearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(false);

  const handleResearch = async () => {
    if (!name.trim() || researching) return;
    setResearching(true);
    setError(null);
    setDraft(null);
    setReasoning(null);
    setSearchCount(null);
    setSavedPath(null);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, hint }),
      });
      const data: ResearchResponse & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setDraft(JSON.stringify(data.draft, null, 2));
      setSearchCount(data.searchCount);
      setReasoning(data.reasoning ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setResearching(false);
    }
  };

  const handleSave = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setError(null);
    try {
      const person = JSON.parse(draft);
      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person, overwrite }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.issues) {
          const summary = data.issues
            .map(
              (i: { path: (string | number)[]; message: string }) =>
                `• ${i.path.join(".") || "(root)"}: ${i.message}`
            )
            .join("\n");
          throw new Error(`${data.error}\n\n${summary}`);
        }
        throw new Error(data.error ?? "Request failed");
      }
      setSavedPath(data.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-[1400px] mx-auto space-y-6">
      <header>
        <Link
          href="/"
          className="text-xs text-neutral-500 hover:text-neutral-900"
        >
          ← back to map
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">
          research a person
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Name a founder, investor, or operator. Claude (with web search) drafts
          a structured record. You review, edit, save.
        </p>
      </header>

      <section className="space-y-3 p-5 border border-neutral-200 rounded-xl bg-white">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block mb-1.5">
            Person&apos;s name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., James Hawkins"
            className="w-full p-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            disabled={researching}
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block mb-1.5">
            Optional hint (tier, archetype, known facts, disambiguation)
          </label>
          <textarea
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="e.g., tier: tier1-admired · co-founder of PostHog · started in sales · UK-based"
            className="w-full p-3 border border-neutral-300 rounded-lg text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-neutral-900"
            disabled={researching}
          />
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-xs text-neutral-500">
            ≈8 web searches max · roughly $0.50–$1.50 per run (Opus 4.7).
          </span>
          <button
            onClick={handleResearch}
            disabled={researching || !name.trim()}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
          >
            {researching ? "Researching… (60–180s)" : "Research"}
          </button>
        </div>
      </section>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 whitespace-pre-wrap font-mono text-xs">
          {error}
        </div>
      )}

      {draft && (
        <section className="space-y-3 p-5 border border-neutral-200 rounded-xl bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Draft · review before saving
              </h2>
              {searchCount !== null && (
                <p className="text-xs text-neutral-500 mt-1">
                  Used {searchCount} web search
                  {searchCount === 1 ? "" : "es"}. Edit the JSON freely — it
                  validates against the schema on save.
                </p>
              )}
            </div>
            {!savedPath ? (
              <div className="flex flex-col gap-1 items-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-40 text-sm font-medium"
                >
                  {saving ? "Saving…" : "Accept & save"}
                </button>
                <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <input
                    type="checkbox"
                    checked={overwrite}
                    onChange={(e) => setOverwrite(e.target.checked)}
                  />
                  overwrite if exists
                </label>
              </div>
            ) : (
              <Link
                href="/"
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-sm font-medium"
              >
                View on timeline →
              </Link>
            )}
          </div>
          {savedPath && (
            <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-3">
              ✓ Saved to <code className="text-xs">{savedPath}</code>
            </div>
          )}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            className="w-full p-4 border border-neutral-300 rounded-lg font-mono text-xs leading-relaxed min-h-[600px] resize-y focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </section>
      )}

      {reasoning && (
        <details className="p-4 border border-neutral-200 rounded-xl bg-neutral-50">
          <summary className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 cursor-pointer">
            Claude&apos;s reasoning + search trace (debug)
          </summary>
          <pre className="mt-3 text-xs whitespace-pre-wrap text-neutral-700 max-h-[400px] overflow-y-auto">
            {reasoning}
          </pre>
        </details>
      )}
    </div>
  );
}
