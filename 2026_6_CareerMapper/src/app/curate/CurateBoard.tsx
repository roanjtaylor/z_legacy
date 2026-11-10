"use client";

import { useMemo, useState } from "react";
import type { ResearchLinks } from "@/lib/types";

type Row = {
  id: string;
  name: string;
  imageUrl: string | null;
  confidence: "high" | "medium" | "low";
  countryOfOrigin: string;
  researchLinks: ResearchLinks;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function CurateBoard({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [filter, setFilter] = useState<"all" | "missing" | "done">("all");

  const stats = useMemo(() => {
    const total = rows.length;
    const done = rows.filter((r) => isDone(r.researchLinks)).length;
    return { total, done, missing: total - done };
  }, [rows]);

  const visible = rows.filter((r) => {
    if (filter === "missing") return !isDone(r.researchLinks);
    if (filter === "done") return isDone(r.researchLinks);
    return true;
  });

  function update(id: string, links: ResearchLinks) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, researchLinks: links } : r))
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4 text-sm">
        <div className="text-neutral-700">
          <strong>{stats.done}</strong> / {stats.total} have links
          {stats.missing > 0 && (
            <span className="ml-1 text-neutral-500">
              · {stats.missing} missing
            </span>
          )}
        </div>
        <div className="ml-auto flex gap-1 rounded-md border border-neutral-200 p-1">
          {(["all", "missing", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-2 py-1 text-xs ${
                filter === f
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visible.map((r) => (
          <CurateCard key={r.id} row={r} onChange={(l) => update(r.id, l)} />
        ))}
      </div>
    </div>
  );
}

function isDone(l: ResearchLinks): boolean {
  return Boolean(l.linkedin && l.company && l.others.length > 0);
}

function CurateCard({
  row,
  onChange,
}: {
  row: Row;
  onChange: (l: ResearchLinks) => void;
}) {
  const [draft, setDraft] = useState<ResearchLinks>(row.researchLinks);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const done = isDone(draft);

  function patch(p: Partial<ResearchLinks>) {
    setDraft((d) => ({ ...d, ...p }));
    if (state === "saved") setState("idle");
  }

  async function save() {
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, researchLinks: draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Save failed");
      setState("saved");
      onChange(draft);
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div
      className={`rounded-lg border p-4 ${
        done ? "border-emerald-300 bg-emerald-50/30" : "border-neutral-200"
      }`}
    >
      <div className="mb-3 flex items-start gap-3">
        {row.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.imageUrl}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-xs text-neutral-500">
            {row.name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{row.name}</div>
          <div className="text-xs text-neutral-500">
            {row.countryOfOrigin} · confidence: {row.confidence}
          </div>
        </div>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${
            done
              ? "bg-emerald-100 text-emerald-700"
              : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {done ? "ready" : "missing"}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <LabeledInput
          label="LinkedIn"
          placeholder="https://linkedin.com/in/..."
          value={draft.linkedin ?? ""}
          onChange={(v) => patch({ linkedin: v || null })}
        />
        <LabeledInput
          label="Company / About"
          placeholder="https://company.com/about"
          value={draft.company ?? ""}
          onChange={(v) => patch({ company: v || null })}
        />
        <OthersField
          others={draft.others}
          onChange={(others) => patch({ others })}
        />
        <LabeledInput
          label="Cluster tags"
          placeholder="ef-2021, legal-tech, ni-founder"
          value={draft.cluster}
          onChange={(v) => patch({ cluster: v })}
        />
        <LabeledInput
          label="Hint"
          placeholder="One-line context for the researcher"
          value={draft.hint}
          onChange={(v) => patch({ hint: v })}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={save}
          disabled={state === "saving"}
          className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {state === "saving" ? "Saving…" : "Save"}
        </button>
        {state === "saved" && (
          <span className="text-xs text-emerald-700">Saved</span>
        )}
        {state === "error" && (
          <span className="text-xs text-red-600">{error}</span>
        )}
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-neutral-200 px-2 py-1 text-sm outline-none focus:border-neutral-400"
      />
    </label>
  );
}

function OthersField({
  others,
  onChange,
}: {
  others: string[];
  onChange: (v: string[]) => void;
}) {
  const rows = others.length === 0 ? [""] : others;
  return (
    <div>
      <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wide text-neutral-500">
        Other links (Crunchbase, Sifted, podcast, Wikipedia…)
      </span>
      <div className="space-y-1">
        {rows.map((val, i) => (
          <input
            key={i}
            type="text"
            value={val}
            onChange={(e) => {
              const next = [...rows];
              next[i] = e.target.value;
              onChange(next.filter((s) => s.trim().length > 0));
            }}
            placeholder="https://..."
            className="w-full rounded border border-neutral-200 px-2 py-1 text-sm outline-none focus:border-neutral-400"
          />
        ))}
        <button
          type="button"
          onClick={() => onChange([...rows.filter(Boolean), ""])}
          className="text-[11px] text-neutral-500 hover:text-neutral-800"
        >
          + add another
        </button>
      </div>
    </div>
  );
}
