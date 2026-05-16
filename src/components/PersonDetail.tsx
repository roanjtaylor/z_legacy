"use client";

import type { Person, Tier } from "@/lib/types";

const TIER_LABELS: Record<
  Tier,
  { label: string; cls: string }
> = {
  "tier1-admired": {
    label: "Tier 1 · admired",
    cls: "bg-sky-100 text-sky-800",
  },
  "tier2-cautionary": {
    label: "Tier 2 · cautionary",
    cls: "bg-red-100 text-red-800",
  },
  "adjacent-benchmark": {
    label: "Adjacent · benchmark",
    cls: "bg-purple-100 text-purple-800",
  },
};

export function PersonDetail({
  person,
  onAsk,
  onClose,
}: {
  person: Person;
  onAsk: (personId: string) => void;
  onClose: () => void;
}) {
  const tierInfo = TIER_LABELS[person.tier];

  return (
    <aside className="space-y-5 p-5 border border-neutral-200 rounded-xl bg-white h-fit sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
      <header>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-semibold">{person.name}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span
            className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded font-medium ${tierInfo.cls}`}
          >
            {tierInfo.label}
          </span>
          {person.confidence !== "high" && (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
              data: {person.confidence}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          {person.birthYear ?? "?"} · {person.countryOfOrigin}
          {person.currentCountry &&
            person.currentCountry !== person.countryOfOrigin && (
              <> · now in {person.currentCountry}</>
            )}
        </p>
        <p className="text-xs text-neutral-600 italic mt-2">
          arc: {person.archetypeArc.join(" → ")}
        </p>
      </header>

      <Section title="Current status">
        <p className="text-sm">{person.outcomes.currentStatus}</p>
        {person.outcomes.estNetWorthUsd && (
          <p className="text-xs text-neutral-500 mt-1">
            Est. net worth:{" "}
            {typeof person.outcomes.estNetWorthUsd === "number"
              ? `$${person.outcomes.estNetWorthUsd.toLocaleString()}`
              : person.outcomes.estNetWorthUsd}
          </p>
        )}
      </Section>

      <Section title="Education">
        <ul className="space-y-2">
          {person.education.map((ed, i) => (
            <li key={i}>
              <div className="text-sm font-medium">{ed.school}</div>
              <div className="text-xs text-neutral-500">
                {ed.degree ?? "—"} · {ed.startYear ?? "?"}–{ed.endYear ?? "?"}
              </div>
              {ed.notes && (
                <div className="text-xs text-neutral-600 mt-1 italic">
                  {ed.notes}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Career steps">
        <ol className="space-y-3 relative border-l border-neutral-200 pl-4">
          {person.careerSteps.map((step, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full bg-neutral-400" />
              <div className="text-sm font-medium">
                {step.role}
                <span className="font-normal text-neutral-600"> · {step.company}</span>
              </div>
              <div className="text-xs text-neutral-500">
                [{step.archetype}] · {step.startYear ?? "?"}–
                {step.endYear ?? "now"}
                {step.estAgeStart !== null && (
                  <>
                    {" "}
                    · age {step.estAgeStart}–{step.estAgeEnd ?? "now"}
                  </>
                )}
              </div>
              {step.lessons.length > 0 && (
                <ul className="mt-1 text-xs text-neutral-700 list-disc list-inside space-y-0.5">
                  {step.lessons.map((l, j) => (
                    <li key={j}>{l}</li>
                  ))}
                </ul>
              )}
              {step.notes && (
                <p className="text-xs text-neutral-500 mt-1 italic">
                  {step.notes}
                </p>
              )}
            </li>
          ))}
        </ol>
      </Section>

      {person.lessons.length > 0 && (
        <Section title="Lessons">
          <ul className="space-y-2 list-disc list-inside text-sm">
            {person.lessons.map((l, i) => (
              <li key={i}>
                {l.lesson}
                {l.source && (
                  <span className="text-xs text-neutral-500"> — {l.source}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Sources">
        <ul className="space-y-1 text-xs">
          {person.sources.map((s, i) => (
            <li key={i}>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-neutral-900"
                >
                  {s.title}
                </a>
              ) : (
                s.title
              )}
              <span className="text-neutral-400 ml-2">[{s.type}]</span>
            </li>
          ))}
        </ul>
      </Section>

      {person.notes && (
        <Section title="Notes">
          <p className="text-xs italic text-neutral-700">{person.notes}</p>
        </Section>
      )}

      <button
        onClick={() => onAsk(person.id)}
        className="w-full px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-sm font-medium"
      >
        Ask Claude about this person
      </button>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
        {title}
      </h3>
      {children}
    </section>
  );
}
