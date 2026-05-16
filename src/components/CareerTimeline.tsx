"use client";

import { useMemo, useState } from "react";
import { scaleLinear, scalePoint } from "d3-scale";
import type { Archetype, Era, Person } from "@/lib/types";
import { ARCHETYPE_LANES, ERAS, eraOfYear } from "@/lib/types";

const WIDTH = 1200;
const MARGIN = { top: 28, right: 40, bottom: 44, left: 110 };
const AGE_MIN = 15;
const AGE_MAX = 55;
const CURRENT_YEAR = 2026;
const YOU_AGE = 21;
const LANE_HEIGHT = 56;
const PANEL_HEIGHT =
  MARGIN.top + ARCHETYPE_LANES.length * LANE_HEIGHT + MARGIN.bottom;
const SUB_LANE_SPACING = 3; // px between parallel person tracks within a lane

const ERA_META: Record<Era, { label: string; blurb: string; tint: string }> = {
  "pre-pc": {
    label: "Pre-PC",
    blurb: "Mainframe / industrial — pre-1980",
    tint: "#f5f5f4",
  },
  pc: {
    label: "PC era",
    blurb: "1980–1994 · personal computers, early software",
    tint: "#fef3c7",
  },
  web: {
    label: "Web / dot-com",
    blurb: "1995–2006 · the web, dot-com, early SaaS",
    tint: "#dbeafe",
  },
  "mobile-cloud": {
    label: "Mobile + Cloud",
    blurb: "2007–2018 · iPhone, AWS, mobile-first SaaS",
    tint: "#dcfce7",
  },
  "ai-revolution": {
    label: "AI revolution",
    blurb: "2019–present · transformers, GPT, frontier labs",
    tint: "#fae8ff",
  },
};

function effectiveBirthYear(p: Person): number | null {
  if (p.birthYear !== null) return p.birthYear;
  for (const s of p.careerSteps) {
    if (s.startYear !== null && s.estAgeStart !== null) {
      return s.startYear - s.estAgeStart;
    }
  }
  const fs = p.careerSteps.find(
    (s) => s.archetype === "Founder" && s.startYear !== null
  );
  if (fs?.startYear) return fs.startYear - 28;
  const any = p.careerSteps.find((s) => s.startYear !== null);
  if (any?.startYear) return any.startYear - 28;
  return null;
}

function flagshipEra(p: Person): Era | null {
  const founders = p.careerSteps.filter(
    (s) => s.archetype === "Founder" && s.startYear !== null
  );
  const pick =
    founders.length > 0
      ? founders[founders.length - 1]
      : [...p.careerSteps]
          .reverse()
          .find((s) => s.startYear !== null) ?? null;
  if (!pick || pick.startYear === null) return null;
  const end = pick.endYear ?? CURRENT_YEAR;
  const mid = Math.floor((pick.startYear + Math.min(end, CURRENT_YEAR)) / 2);
  return eraOfYear(mid);
}

// Always prefer year-derived ages when we have birth + startYear.
// This keeps step transitions vertical (Student endAge == Founder startAge
// when the years match), instead of diagonal due to estAgeStart off-by-ones.
type Seg = { startAge: number; endAge: number; archetype: Archetype };

function segmentsFor(p: Person, birth: number | null): Seg[] {
  const segs: Seg[] = [];
  for (const step of p.careerSteps) {
    let startAge: number | null = null;
    let endAge: number | null = null;
    if (birth !== null && step.startYear !== null) {
      startAge = step.startYear - birth;
      endAge = step.endYear !== null ? step.endYear - birth : null;
    } else if (step.estAgeStart !== null) {
      startAge = step.estAgeStart;
      endAge = step.estAgeEnd;
    }
    if (startAge === null) continue;
    const open = step.endYear === null && endAge === null;
    const effEnd = open
      ? birth !== null
        ? Math.min(CURRENT_YEAR - birth, AGE_MAX)
        : startAge + 1
      : endAge ?? startAge;
    segs.push({
      startAge,
      endAge: Math.max(effEnd, startAge),
      archetype: step.archetype,
    });
  }
  return segs;
}

// Build a stair-step SVG path:
//   For each segment: horizontal at archetype-Y from startAge to endAge.
//   For each transition i → i+1: horizontal continuation on prev lane until
//   ageStart_{i+1}, then a vertical jump to the next lane.
function stairPath(
  segs: Seg[],
  xScale: (n: number) => number,
  yFor: (a: Archetype) => number
): string {
  if (segs.length === 0) return "";
  const parts: string[] = [];
  parts.push(`M ${xScale(segs[0].startAge)} ${yFor(segs[0].archetype)}`);
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    parts.push(`L ${xScale(s.endAge)} ${yFor(s.archetype)}`);
    const next = segs[i + 1];
    if (next) {
      // bridge any gap on current lane, then vertical to next lane
      if (next.startAge !== s.endAge) {
        parts.push(`L ${xScale(next.startAge)} ${yFor(s.archetype)}`);
      }
      parts.push(`L ${xScale(next.startAge)} ${yFor(next.archetype)}`);
    }
  }
  return parts.join(" ");
}

// Stable distinct color per person within a panel.
function colorFor(index: number, total: number): string {
  const hue = Math.round((index * 360) / Math.max(total, 1));
  return `hsl(${hue} 70% 42%)`;
}

export function CareerTimeline({
  people,
  selectedId,
  onSelect,
}: {
  people: Person[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const grouped = useMemo(() => {
    const groups = new Map<Era, Person[]>();
    for (const p of people) {
      const era = flagshipEra(p);
      if (!era) continue;
      if (!groups.has(era)) groups.set(era, []);
      groups.get(era)!.push(p);
    }
    return groups;
  }, [people]);

  const orderedEras: Era[] = ERAS.map((e) => e.id).filter((id) =>
    grouped.has(id)
  );

  // Default to AI revolution if present, otherwise the era with most people.
  const defaultEra = useMemo<Era>(() => {
    if (grouped.has("ai-revolution")) return "ai-revolution";
    let best: Era = orderedEras[0] ?? "ai-revolution";
    let bestN = -1;
    for (const e of orderedEras) {
      const n = grouped.get(e)?.length ?? 0;
      if (n > bestN) {
        bestN = n;
        best = e;
      }
    }
    return best;
  }, [grouped, orderedEras]);

  const [activeEra, setActiveEra] = useState<Era>(defaultEra);
  const safeActive = orderedEras.includes(activeEra) ? activeEra : defaultEra;
  const activePeople = grouped.get(safeActive) ?? [];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div
        role="tablist"
        className="flex flex-wrap gap-1 border-b border-neutral-200 bg-neutral-50 px-2 pt-2"
      >
        {orderedEras.map((era) => {
          const meta = ERA_META[era];
          const count = grouped.get(era)?.length ?? 0;
          const isActive = era === safeActive;
          return (
            <button
              key={era}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveEra(era)}
              className={
                "px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition " +
                (isActive
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-800")
              }
              style={isActive ? { background: meta.tint } : undefined}
            >
              {meta.label}
              <span className="ml-1.5 text-neutral-500 font-normal">
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <EraPanel
        key={safeActive}
        era={safeActive}
        people={activePeople}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </div>
  );
}

function EraPanel({
  era,
  people,
  selectedId,
  onSelect,
}: {
  era: Era;
  people: Person[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const meta = ERA_META[era];

  // Stable order (by id) so colors and stagger don't jump on rerenders.
  const ordered = useMemo(
    () => [...people].sort((a, b) => a.id.localeCompare(b.id)),
    [people]
  );
  const n = ordered.length;

  const xScale = scaleLinear()
    .domain([AGE_MIN, AGE_MAX])
    .range([MARGIN.left, WIDTH - MARGIN.right]);

  const yScale = scalePoint<Archetype>()
    .domain(ARCHETYPE_LANES)
    .range([MARGIN.top, PANEL_HEIGHT - MARGIN.bottom])
    .padding(0.5);

  // Within each lane, person i gets a sub-lane offset so lines run parallel.
  const offsetFor = (i: number) => (i - (n - 1) / 2) * SUB_LANE_SPACING;

  const tracks = useMemo(
    () =>
      ordered.map((p, i) => {
        const birth = effectiveBirthYear(p);
        const segs = segmentsFor(p, birth);
        return {
          person: p,
          birth,
          segs,
          color: colorFor(i, n),
          offset: offsetFor(i),
          index: i,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ordered, n]
  );

  const ageTicks: number[] = [];
  for (let a = AGE_MIN; a <= AGE_MAX; a += 5) ageTicks.push(a);

  return (
    <div>
      <div
        className="px-4 py-2 flex items-baseline justify-between gap-3 border-b border-neutral-200"
        style={{ background: meta.tint }}
      >
        <div className="flex items-baseline gap-3 min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
            {meta.label}
          </h3>
          <span className="text-xs text-neutral-600 truncate">
            {meta.blurb}
          </span>
        </div>
        <span className="text-xs text-neutral-500 shrink-0">
          {n} {n === 1 ? "founder" : "founders"}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${PANEL_HEIGHT}`}
        className="w-full block"
        preserveAspectRatio="xMidYMid meet"
      >
        {ARCHETYPE_LANES.map((arch) => (
          <g key={arch}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={yScale(arch)!}
              y2={yScale(arch)!}
              stroke="#e5e5e5"
              strokeDasharray="2 4"
            />
            <text
              x={MARGIN.left - 10}
              y={yScale(arch)!}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-neutral-600"
              fontSize={11}
              fontWeight={500}
            >
              {arch}
            </text>
          </g>
        ))}

        {ageTicks.map((age) => (
          <g key={age}>
            <line
              x1={xScale(age)}
              x2={xScale(age)}
              y1={MARGIN.top}
              y2={PANEL_HEIGHT - MARGIN.bottom}
              stroke="#f5f5f5"
            />
            <text
              x={xScale(age)}
              y={PANEL_HEIGHT - MARGIN.bottom + 14}
              textAnchor="middle"
              className="fill-neutral-500"
              fontSize={10}
            >
              {age}
            </text>
          </g>
        ))}
        <text
          x={(WIDTH - MARGIN.right + MARGIN.left) / 2}
          y={PANEL_HEIGHT - 8}
          textAnchor="middle"
          className="fill-neutral-600"
          fontSize={11}
        >
          age
        </text>

        <line
          x1={xScale(YOU_AGE)}
          x2={xScale(YOU_AGE)}
          y1={MARGIN.top - 6}
          y2={PANEL_HEIGHT - MARGIN.bottom}
          stroke="#16a34a"
          strokeWidth={1.25}
          strokeDasharray="4 4"
        />
        <text
          x={xScale(YOU_AGE)}
          y={MARGIN.top - 10}
          textAnchor="middle"
          className="fill-green-700"
          fontSize={10}
          fontWeight={600}
        >
          you · {YOU_AGE}
        </text>

        {/* Per-person parallel thin lines */}
        {tracks.map(({ person, segs, color, offset }) => {
          if (segs.length === 0) return null;
          const isHovered = hoverId === person.id;
          const isSelected = selectedId === person.id;
          const isAnyHovered = hoverId !== null;
          const isFaded = isAnyHovered && !isHovered && !isSelected;
          const dash: string | undefined = undefined;

          const yFor = (a: Archetype) => yScale(a)! + offset;
          const path = stairPath(segs, (n) => xScale(n), yFor);

          return (
            <g
              key={person.id}
              onMouseEnter={() => setHoverId(person.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => onSelect(person.id)}
              className="cursor-pointer"
            >
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={isHovered || isSelected ? 2.5 : 1.25}
                strokeDasharray={dash}
                opacity={isFaded ? 0.1 : isHovered || isSelected ? 1 : 0.85}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Endpoint marker at current age */}
              {segs.length > 0 && (
                <circle
                  cx={xScale(segs[segs.length - 1].endAge)}
                  cy={yFor(segs[segs.length - 1].archetype)}
                  r={isHovered || isSelected ? 3.5 : 2}
                  fill={color}
                  opacity={isFaded ? 0.1 : 1}
                />
              )}
            </g>
          );
        })}

        {/* Hover overlay: highlight a single person's name above their endpoint */}
        {hoverId &&
          (() => {
            const t = tracks.find((x) => x.person.id === hoverId);
            if (!t || t.segs.length === 0) return null;
            const last = t.segs[t.segs.length - 1];
            const x = xScale(last.endAge);
            const y = yScale(last.archetype)! + t.offset;
            const label = `${t.person.name} · ${
              t.birth !== null ? CURRENT_YEAR - t.birth : "?"
            }`;
            const w = label.length * 6.2 + 14;
            return (
              <g pointerEvents="none">
                <rect
                  x={x - w / 2}
                  y={y - 24}
                  width={w}
                  height={18}
                  rx={4}
                  fill="#0f172a"
                  opacity={0.92}
                />
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="#fff"
                >
                  {label}
                </text>
              </g>
            );
          })()}
      </svg>

      {/* Per-panel legend: colored swatch + name, clickable, hover-highlight */}
      <div className="px-4 py-3 border-t border-neutral-200 flex flex-wrap gap-x-4 gap-y-1.5">
        {tracks.map(({ person, color, birth }) => {
          const age = birth !== null ? CURRENT_YEAR - birth : null;
          const isHovered = hoverId === person.id;
          const isSelected = selectedId === person.id;
          const dash: string | undefined = undefined;
          return (
            <button
              key={person.id}
              onMouseEnter={() => setHoverId(person.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => onSelect(person.id)}
              className={
                "flex items-center gap-2 text-xs " +
                (isHovered || isSelected
                  ? "text-neutral-900 font-medium"
                  : "text-neutral-700 hover:text-neutral-900")
              }
            >
              {person.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.imageUrl}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover border border-neutral-200"
                />
              ) : (
                <span
                  className="w-6 h-6 rounded-full border border-neutral-200 bg-neutral-100 flex items-center justify-center text-[10px] text-neutral-500"
                  aria-hidden
                >
                  {person.name.charAt(0)}
                </span>
              )}
              <svg width="22" height="6" aria-hidden>
                <line
                  x1="0"
                  x2="22"
                  y1="3"
                  y2="3"
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray={dash}
                />
              </svg>
              <span>{person.name}</span>
              {age !== null && (
                <span className="text-neutral-400">· {age}</span>
              )}
            </button>
          );
        })}
      </div>

      <CohortSummary people={ordered} onSelect={onSelect} />
    </div>
  );
}

function normaliseSchool(raw: string): string {
  const s = raw.trim();
  // Group common university spellings to a single label.
  const patterns: { match: RegExp; label: string }[] = [
    { match: /\bcambridge\b/i, label: "University of Cambridge" },
    { match: /\boxford\b/i, label: "University of Oxford" },
    { match: /\bstanford\b/i, label: "Stanford University" },
    { match: /\bharvard\b/i, label: "Harvard University" },
    { match: /\bmit\b/i, label: "MIT" },
    { match: /\bimperial college\b|\bimperial\b/i, label: "Imperial College London" },
    { match: /\b(ucl|university college london)\b/i, label: "UCL" },
    { match: /\blse\b|\blondon school of economics\b/i, label: "LSE" },
    { match: /\bucla\b/i, label: "UCLA" },
    { match: /\b(uc berkeley|berkeley)\b/i, label: "UC Berkeley" },
    { match: /\beth\b/i, label: "ETH Zurich" },
    { match: /\bulster\b/i, label: "Ulster University" },
    { match: /\btrinity college dublin\b|\btcd\b/i, label: "Trinity College Dublin" },
    { match: /\bqueen's university belfast\b|\bqub\b/i, label: "Queen's University Belfast" },
  ];
  for (const { match, label } of patterns) {
    if (match.test(s)) return label;
  }
  return s;
}

type Filter =
  | { kind: "country"; value: string }
  | { kind: "school"; value: string };

function CohortSummary({
  people,
  onSelect,
}: {
  people: Person[];
  onSelect: (id: string) => void;
}) {
  const [filter, setFilter] = useState<Filter | null>(null);

  if (people.length === 0) return null;

  const countryBuckets = new Map<string, Person[]>();
  for (const p of people) {
    const c = p.countryOfOrigin?.trim();
    if (!c) continue;
    if (!countryBuckets.has(c)) countryBuckets.set(c, []);
    countryBuckets.get(c)!.push(p);
  }

  const schoolBuckets = new Map<string, Person[]>();
  for (const p of people) {
    const seen = new Set<string>();
    for (const ed of p.education) {
      const label = normaliseSchool(ed.school);
      if (!label || seen.has(label)) continue;
      seen.add(label);
      if (!schoolBuckets.has(label)) schoolBuckets.set(label, []);
      schoolBuckets.get(label)!.push(p);
    }
  }

  const sortBuckets = (m: Map<string, Person[]>) =>
    Array.from(m.entries()).sort(
      (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
    );

  const countries = sortBuckets(countryBuckets);
  const schools = sortBuckets(schoolBuckets);

  const toggle = (next: Filter) => {
    setFilter((prev) =>
      prev && prev.kind === next.kind && prev.value === next.value
        ? null
        : next
    );
  };

  const matches: Person[] = filter
    ? filter.kind === "country"
      ? countryBuckets.get(filter.value) ?? []
      : schoolBuckets.get(filter.value) ?? []
    : [];

  return (
    <div className="border-t border-neutral-200 bg-neutral-50/50">
      <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-6">
        <SummaryBlock
          title={`Nationalities · ${countries.length}`}
          entries={countries}
          total={people.length}
          kind="country"
          activeFilter={filter}
          onToggle={toggle}
        />
        <SummaryBlock
          title={`Universities · ${schools.length}`}
          entries={schools}
          total={people.length}
          kind="school"
          activeFilter={filter}
          onToggle={toggle}
        />
      </div>

      {filter && (
        <div className="px-4 pb-4 border-t border-neutral-200 pt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-2">
            <span>
              {matches.length} {matches.length === 1 ? "person" : "people"} ·{" "}
              {filter.kind === "country" ? "from" : "at"}{" "}
              <span className="text-neutral-900">{filter.value}</span>
            </span>
            <button
              onClick={() => setFilter(null)}
              className="text-neutral-500 hover:text-neutral-900 normal-case tracking-normal"
            >
              clear
            </button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {matches.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => onSelect(p.id)}
                  className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-white border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-100"
                  title="Open to view or edit"
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover border border-neutral-200"
                    />
                  ) : (
                    <span
                      className="w-5 h-5 rounded-full border border-neutral-200 bg-neutral-100 flex items-center justify-center text-[9px] text-neutral-500"
                      aria-hidden
                    >
                      {p.name.charAt(0)}
                    </span>
                  )}
                  <span className="text-neutral-800">{p.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SummaryBlock({
  title,
  entries,
  total,
  kind,
  activeFilter,
  onToggle,
}: {
  title: string;
  entries: [string, Person[]][];
  total: number;
  kind: Filter["kind"];
  activeFilter: Filter | null;
  onToggle: (f: Filter) => void;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
        {title}
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-neutral-500 italic">none recorded</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {entries.map(([label, ps]) => {
            const isActive =
              activeFilter?.kind === kind && activeFilter.value === label;
            return (
              <li key={label}>
                <button
                  onClick={() => onToggle({ kind, value: label })}
                  title={`${ps.length} of ${total} — click to list`}
                  className={
                    "inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition " +
                    (isActive
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-100")
                  }
                >
                  <span>{label}</span>
                  <span
                    className={
                      "tabular-nums " +
                      (isActive ? "text-neutral-300" : "text-neutral-500")
                    }
                  >
                    {ps.length}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
