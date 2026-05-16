"use client";

import Link from "next/link";
import { useState } from "react";

type DiscoveredName = {
  name: string;
  context: string;
  suggestedId: string;
};

type BatchResult = {
  name: string;
  ok: boolean;
  id?: string;
  path?: string;
  skipped?: boolean;
  reason?: string;
  searchCount?: number;
};

const EXAMPLE_QUERIES = [
  "Under-known European founders aged 25-35 who raised $20M+ Series A in 2020-2024, weighted toward UK and Ireland",
  "Y Combinator European alumni from S20 onwards who built SaaS or developer-tools companies",
  "Atomico portfolio founders post-2020 whose paths started in engineering before founding",
  "European AI founders post-2022 who have prior experience at a VC firm or accelerator",
  "Founders from EF (Entrepreneur First) cohorts who built dev-tools or B2B SaaS",
];

export default function DiscoverPage() {
  const [step, setStep] = useState<
    "query" | "review" | "researching" | "done"
  >("query");
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(15);
  const [overwrite, setOverwrite] = useState(false);
  const [names, setNames] = useState<DiscoveredName[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [discoverSearchCount, setDiscoverSearchCount] = useState<number | null>(
    null
  );
  const [results, setResults] = useState<BatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const handleDiscover = async () => {
    if (!query.trim() || working) return;
    setWorking(true);
    setError(null);
    setNames([]);
    setSelected(new Set());
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Discovery failed");
      const ns: DiscoveredName[] = data.names ?? [];
      setNames(ns);
      setSelected(new Set(ns.map((n) => n.suggestedId)));
      setDiscoverSearchCount(data.searchCount);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setWorking(false);
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleResearch = async () => {
    if (working) return;
    const items = names
      .filter((n) => selected.has(n.suggestedId))
      .map((n) => ({ name: n.name, hint: n.context }));
    if (items.length === 0) {
      setError("Select at least one person to research");
      return;
    }
    setWorking(true);
    setError(null);
    setResults([]);
    setStep("researching");
    try {
      const res = await fetch("/api/research-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, overwrite }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Batch failed");
      setResults(data.results ?? []);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep("review");
    } finally {
      setWorking(false);
    }
  };

  const reset = () => {
    setStep("query");
    setNames([]);
    setSelected(new Set());
    setResults([]);
    setError(null);
    setDiscoverSearchCount(null);
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
          discover people
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Bulk-find under-known successful founders/investors matching a query.
          Light-touch research (~$0.15–$0.30 per person, 30-60s each, processed
          3 at a time). Auto-saved with{" "}
          <code className="text-xs">confidence: medium</code>.
        </p>
      </header>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 whitespace-pre-wrap font-mono text-xs">
          {error}
        </div>
      )}

      {/* STEP 1: query */}
      {step === "query" && (
        <section className="space-y-3 p-5 border border-neutral-200 rounded-xl bg-white">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block mb-1.5">
              Discovery query
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe the kind of people you want to surface…"
              className="w-full p-3 border border-neutral-300 rounded-lg text-sm min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-neutral-900"
              disabled={working}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block mb-1.5">
              Example queries (click to use)
            </label>
            <ul className="space-y-1.5 text-xs">
              {EXAMPLE_QUERIES.map((q, i) => (
                <li key={i}>
                  <button
                    onClick={() => setQuery(q)}
                    className="text-left text-neutral-700 hover:text-neutral-900 hover:underline"
                  >
                    · {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between gap-3 pt-2">
            <label className="text-xs text-neutral-700 flex items-center gap-2">
              <span>Target count:</span>
              <input
                type="number"
                min={3}
                max={30}
                value={count}
                onChange={(e) =>
                  setCount(
                    Math.max(3, Math.min(30, Number(e.target.value) || 15))
                  )
                }
                className="w-16 p-1.5 border border-neutral-300 rounded text-center"
                disabled={working}
              />
            </label>
            <button
              onClick={handleDiscover}
              disabled={working || !query.trim()}
              className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40 text-sm font-medium"
            >
              {working ? "Discovering… (30-90s)" : "Discover names"}
            </button>
          </div>
        </section>
      )}

      {/* STEP 2: review names */}
      {step === "review" && (
        <section className="space-y-3 p-5 border border-neutral-200 rounded-xl bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Discovered {names.length} candidates ·{" "}
                {selected.size} selected
              </h2>
              {discoverSearchCount !== null && (
                <p className="text-xs text-neutral-500 mt-1">
                  Used {discoverSearchCount} web search
                  {discoverSearchCount === 1 ? "" : "es"} to assemble this list.
                  Uncheck any you don&apos;t want before bulk research.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1 items-end">
              <button
                onClick={handleResearch}
                disabled={working || selected.size === 0}
                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-40 text-sm font-medium whitespace-nowrap"
              >
                Research selected ({selected.size}) · ~$
                {(selected.size * 0.2).toFixed(2)}
              </button>
              <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                />
                overwrite existing
              </label>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() =>
                setSelected(new Set(names.map((n) => n.suggestedId)))
              }
              className="text-neutral-700 hover:text-neutral-900 underline"
            >
              select all
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-neutral-700 hover:text-neutral-900 underline"
            >
              clear
            </button>
            <button
              onClick={reset}
              className="text-neutral-700 hover:text-neutral-900 underline"
            >
              new query
            </button>
          </div>
          <ul className="space-y-1.5 mt-2">
            {names.map((n) => (
              <li
                key={n.suggestedId}
                className="flex items-start gap-3 p-2.5 border border-neutral-200 rounded-lg hover:bg-neutral-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(n.suggestedId)}
                  onChange={() => toggle(n.suggestedId)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{n.name}</div>
                  <div className="text-xs text-neutral-600 mt-0.5">
                    {n.context}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    {n.suggestedId}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* STEP 3: researching */}
      {step === "researching" && (
        <section className="p-10 border border-neutral-200 rounded-xl bg-white text-center space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          <h2 className="text-lg font-medium">Researching in batches of 3…</h2>
          <p className="text-sm text-neutral-600">
            Approximately {Math.ceil((selected.size * 45) / 3 / 60)} minute
            {Math.ceil((selected.size * 45) / 3 / 60) === 1 ? "" : "s"}{" "}
            remaining for {selected.size} people. Don&apos;t close this tab.
          </p>
        </section>
      )}

      {/* STEP 4: done */}
      {step === "done" && (
        <section className="space-y-3 p-5 border border-neutral-200 rounded-xl bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium">
                Done · {results.filter((r) => r.ok).length} saved,{" "}
                {results.filter((r) => r.skipped).length} skipped,{" "}
                {results.filter((r) => !r.ok && !r.skipped).length} failed
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                All saved with <code>confidence: medium</code>. Re-research any
                individual at full depth via{" "}
                <Link href="/research" className="underline">
                  /research
                </Link>
                .
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/"
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-sm font-medium"
              >
                View on timeline →
              </Link>
              <button
                onClick={reset}
                className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-sm font-medium"
              >
                Discover more
              </button>
            </div>
          </div>
          <ul className="space-y-1.5 mt-2">
            {results.map((r, i) => (
              <li
                key={i}
                className={`p-2.5 border rounded-lg text-sm ${
                  r.ok
                    ? "border-green-200 bg-green-50"
                    : r.skipped
                    ? "border-amber-200 bg-amber-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {r.ok ? "✓" : r.skipped ? "⊘" : "✗"} {r.name}
                  </span>
                  {r.id && (
                    <span className="text-xs font-mono text-neutral-500">
                      {r.id}
                    </span>
                  )}
                </div>
                {r.reason && (
                  <div className="text-xs text-neutral-700 mt-1">
                    {r.reason}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
