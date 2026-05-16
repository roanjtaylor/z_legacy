"use client";

import Link from "next/link";
import { useState } from "react";
import type { MyProfile, Person } from "@/lib/types";
import { AskBox } from "./AskBox";
import { CareerTimeline } from "./CareerTimeline";
import { PersonDetail } from "./PersonDetail";

export function Main({
  people,
  profile,
}: {
  people: Person[];
  profile: MyProfile;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [askFocus, setAskFocus] = useState<string | null>(null);

  const selected = selectedId
    ? people.find((p) => p.id === selectedId) ?? null
    : null;

  const tier1Count = people.filter((p) => p.tier === "tier1-admired").length;
  const tier2Count = people.filter((p) => p.tier === "tier2-cautionary").length;
  const adjacentCount = people.filter(
    (p) => p.tier === "adjacent-benchmark"
  ).length;

  return (
    <div className="min-h-screen p-6 max-w-[1700px] mx-auto space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            career-mapper
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            A guardrail for {profile.name}&apos;s career planning. Surfacing
            patterns, not prescriptions. As of {profile.asOfDate}.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-neutral-500 space-x-3">
            <span>
              <strong className="text-sky-700">{tier1Count}</strong> tier-1
            </span>
            <span>
              <strong className="text-red-700">{tier2Count}</strong> tier-2
            </span>
            <span>
              <strong className="text-purple-700">{adjacentCount}</strong>{" "}
              adjacent
            </span>
          </div>
          <Link
            href="/discover"
            className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-xs font-medium"
          >
            Discover
          </Link>
          <Link
            href="/research"
            className="px-3 py-1.5 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-xs font-medium"
          >
            + Add one
          </Link>
        </div>
      </header>

      <section>
        <CareerTimeline
          people={people}
          selectedId={selectedId ?? undefined}
          onSelect={(id) =>
            setSelectedId((prev) => (prev === id ? null : id))
          }
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
        <div className="space-y-4">
          <AskBox
            focusPersonId={askFocus ?? undefined}
            onClear={() => setAskFocus(null)}
          />
          <Legend />
          <SuggestedQuestions />
        </div>
        {selected && (
          <PersonDetail
            person={selected}
            onAsk={(id) => setAskFocus(id)}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="p-4 border border-neutral-200 rounded-xl bg-white space-y-2 text-xs">
      <div className="font-semibold uppercase tracking-wider text-neutral-500 text-[10px]">
        Legend
      </div>
      <LegendRow color="#0ea5e9" dash={undefined} weight={3}>
        <strong>Tier 1</strong> — proven paths worth decoding
      </LegendRow>
      <LegendRow color="#dc2626" dash="6 4" weight={2}>
        <strong>Tier 2</strong> — cautionary outliers (do NOT pattern-match)
      </LegendRow>
      <LegendRow color="#a855f7" dash="2 3" weight={2}>
        <strong>Adjacent</strong> — different model, useful as comparison
      </LegendRow>
    </div>
  );
}

function LegendRow({
  color,
  dash,
  weight,
  children,
}: {
  color: string;
  dash?: string;
  weight: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <svg width="40" height="6" aria-hidden>
        <line
          x1="0"
          y1="3"
          x2="40"
          y2="3"
          stroke={color}
          strokeWidth={weight}
          strokeDasharray={dash}
        />
      </svg>
      <span>{children}</span>
    </div>
  );
}

function SuggestedQuestions() {
  const qs = [
    "What did Tier-1 founders do at age 21 that I should consider this year?",
    "Compare Sam Altman's path to Max Junestrand's — which mechanics translate to my situation, and which don't?",
    "If I take the Cambridge MPhil route, what does the data say about my career trajectory vs going straight to a top tech seat?",
    "What's the cost of switching from Builder to Founder vs Hustler to Founder, based on the corpus?",
  ];
  return (
    <div className="p-4 border border-neutral-200 rounded-xl bg-white space-y-2 text-xs">
      <div className="font-semibold uppercase tracking-wider text-neutral-500 text-[10px]">
        Try asking
      </div>
      <ul className="space-y-1.5 list-disc list-inside text-neutral-700">
        {qs.map((q, i) => (
          <li key={i}>{q}</li>
        ))}
      </ul>
    </div>
  );
}
