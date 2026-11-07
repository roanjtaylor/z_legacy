"use client";

import { useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import type { Era, Person, PreFounderRoleType } from "@/lib/types";
import { ERAS } from "@/lib/types";

const X_MIN = 1980;
const X_MAX = 2028;
const WIDTH = 1200;
const ROW_HEIGHT = 38;
const MARGIN = { top: 70, right: 60, bottom: 30, left: 230 };
const CURRENT_YEAR = 2026;

const ERA_TINT: Record<Era, string> = {
  "pre-pc": "#f5f5f4",
  pc: "#fef3c7",
  web: "#dbeafe",
  "mobile-cloud": "#dcfce7",
  "ai-revolution": "#fae8ff",
};

const ROLE_COLOR: Record<PreFounderRoleType, string> = {
  Study: "#64748b",
  VC: "#a855f7",
  Tech: "#0d9488",
  Consulting: "#f97316",
  "Sales-BD": "#ec4899",
  "Side-business": "#d97706",
  Operator: "#2563eb",
  Other: "#737373",
};

const ROLE_LABELS = Object.entries(ROLE_COLOR) as [PreFounderRoleType, string][];

export function CareerTimeline({
  people,
  selectedId,
  onSelect,
}: {
  people: Person[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [europeOnly, setEuropeOnly] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!europeOnly) return people;
    return people.filter((p) => isEuropean(p.countryOfOrigin));
  }, [people, europeOnly]);

  // Sort by firstCompany.year ascending; nulls (no founding year) go last.
  const rows = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ay = a.firstCompany?.year ?? Infinity;
      const by = b.firstCompany?.year ?? Infinity;
      if (ay !== by) return ay - by;
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  const height = MARGIN.top + rows.length * ROW_HEIGHT + MARGIN.bottom;

  const xScale = scaleLinear()
    .domain([X_MIN, X_MAX])
    .range([MARGIN.left, WIDTH - MARGIN.right]);

  const yearTicks: number[] = [];
  for (let y = 1980; y <= X_MAX; y += 5) yearTicks.push(y);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-200 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
            Founders by year of first company
          </h3>
          <p className="text-xs text-neutral-600 mt-0.5">
            Pre-founder dots show their path to the leap. Solid line ends at first founded company; era bands shade the background.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={europeOnly}
              onChange={(e) => setEuropeOnly(e.target.checked)}
            />
            <span>Europe only</span>
          </label>
          <span className="text-neutral-500">{rows.length} founders</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${height}`}
          className="block min-w-[900px] w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Era bands */}
          {ERAS.map((era) => {
            const x1 = xScale(Math.max(era.startYear, X_MIN));
            const x2 = xScale(Math.min(era.endYear ?? X_MAX, X_MAX));
            return (
              <g key={era.id}>
                <rect
                  x={x1}
                  y={MARGIN.top - 30}
                  width={x2 - x1}
                  height={height - MARGIN.top + 30 - MARGIN.bottom}
                  fill={ERA_TINT[era.id]}
                  opacity={0.5}
                />
                <text
                  x={(x1 + x2) / 2}
                  y={MARGIN.top - 36}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  className="fill-neutral-600 uppercase tracking-wider"
                >
                  {era.label}
                </text>
              </g>
            );
          })}

          {/* Year ticks */}
          {yearTicks.map((y) => (
            <g key={y}>
              <line
                x1={xScale(y)}
                x2={xScale(y)}
                y1={MARGIN.top - 6}
                y2={height - MARGIN.bottom}
                stroke="#fff"
                strokeWidth={1}
                opacity={0.6}
              />
              <text
                x={xScale(y)}
                y={MARGIN.top - 10}
                textAnchor="middle"
                fontSize={9}
                className="fill-neutral-500"
              >
                {y}
              </text>
            </g>
          ))}

          {/* "You" marker — Roan, age 21 in 2026 */}
          <line
            x1={xScale(CURRENT_YEAR)}
            x2={xScale(CURRENT_YEAR)}
            y1={MARGIN.top - 4}
            y2={height - MARGIN.bottom}
            stroke="#16a34a"
            strokeWidth={1.25}
            strokeDasharray="4 4"
          />
          <text
            x={xScale(CURRENT_YEAR)}
            y={MARGIN.top - 18}
            textAnchor="middle"
            fontSize={9}
            fontWeight={600}
            className="fill-green-700"
          >
            you · 21
          </text>

          {/* Rows */}
          {rows.map((p, i) => {
            const y = MARGIN.top + i * ROW_HEIGHT + ROW_HEIGHT / 2;
            const isSelected = selectedId === p.id;
            const isHovered = hoverId === p.id;
            const isAnyHovered = hoverId !== null;
            const faded = isAnyHovered && !isHovered && !isSelected;

            const fc = p.firstCompany ?? null;
            const fcX = fc ? xScale(fc.year) : null;

            // Collect pre-founder role dots that have a startYear we can plot.
            const dots = (fc?.preFounderRoles ?? [])
              .filter((r) => r.startYear !== null && r.startYear >= X_MIN)
              .map((r) => ({
                year: r.startYear as number,
                color: ROLE_COLOR[r.type],
                type: r.type,
                label: `${r.role} @ ${r.org}`,
              }));

            const lineStart = dots.length > 0
              ? Math.min(...dots.map((d) => d.year))
              : p.studentEndYear ?? fc?.year ?? null;

            return (
              <g
                key={p.id}
                onMouseEnter={() => setHoverId(p.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => onSelect(p.id)}
                className="cursor-pointer"
                opacity={faded ? 0.35 : 1}
              >
                {/* Row hover background */}
                <rect
                  x={0}
                  y={y - ROW_HEIGHT / 2}
                  width={WIDTH}
                  height={ROW_HEIGHT}
                  fill={isSelected || isHovered ? "#0f172a" : "transparent"}
                  opacity={isSelected || isHovered ? 0.04 : 0}
                />

                {/* Left label: avatar + name + meta */}
                <foreignObject
                  x={4}
                  y={y - ROW_HEIGHT / 2 + 4}
                  width={MARGIN.left - 12}
                  height={ROW_HEIGHT - 8}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      height: "100%",
                      fontFamily: "inherit",
                    }}
                  >
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt=""
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1px solid #e5e5e5",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "#f5f5f5",
                          border: "1px solid #e5e5e5",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          color: "#737373",
                        }}
                      >
                        {p.name.charAt(0)}
                      </span>
                    )}
                    <div style={{ minWidth: 0, lineHeight: 1.15 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 500,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#737373",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {p.countryOfOrigin}
                      </div>
                    </div>
                  </div>
                </foreignObject>

                {/* Connector line from earliest pre-founder dot to first company */}
                {lineStart !== null && fc && (
                  <line
                    x1={xScale(Math.max(lineStart, X_MIN))}
                    x2={fcX ?? 0}
                    y1={y}
                    y2={y}
                    stroke="#cbd5e1"
                    strokeWidth={1.5}
                  />
                )}

                {/* Pre-founder dots */}
                {dots.map((d, di) => (
                  <circle
                    key={di}
                    cx={xScale(d.year)}
                    cy={y}
                    r={3}
                    fill={d.color}
                    stroke="#fff"
                    strokeWidth={1}
                  >
                    <title>
                      {d.year} · {d.type} · {d.label}
                    </title>
                  </circle>
                ))}

                {/* First-company marker */}
                {fc && fcX !== null && (
                  <g>
                    <circle
                      cx={fcX}
                      cy={y}
                      r={isHovered || isSelected ? 8 : 6}
                      fill="#0f172a"
                      stroke={ERA_TINT[fc.era]}
                      strokeWidth={3}
                    />
                    <text
                      x={fcX + 12}
                      y={y + 4}
                      fontSize={11}
                      fontWeight={600}
                      className="fill-neutral-900"
                    >
                      {fc.name} · {fc.year}
                      {fc.ageAtFounding !== null && (
                        <tspan className="fill-neutral-500" fontWeight={400}>
                          {" "}
                          (age {fc.ageAtFounding})
                        </tspan>
                      )}
                    </text>
                  </g>
                )}

                {/* No-data row */}
                {!fc && (
                  <text
                    x={MARGIN.left + 6}
                    y={y + 4}
                    fontSize={11}
                    className="fill-neutral-400 italic"
                  >
                    no firm founding date — see profile
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-neutral-200 bg-neutral-50/40 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-700">
        <span className="font-semibold text-neutral-600 uppercase tracking-wider text-[10px]">
          Pre-founder role:
        </span>
        {ROLE_LABELS.map(([type, color]) => (
          <span key={type} className="inline-flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: color }}
            />
            {type}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 ml-2">
          <span className="inline-block w-3 h-3 rounded-full bg-neutral-900 border-2 border-fuchsia-200" />
          First company (ring = era)
        </span>
      </div>

      <CohortSummary people={filtered} onSelect={onSelect} />
    </div>
  );
}

function isEuropean(country: string): boolean {
  const c = country.toLowerCase();
  const exclude = ["usa", "united states", "canada", "australia"];
  if (exclude.some((x) => c.includes(x))) return false;
  // Anything with England/UK/NI/Ireland/Sweden/Estonia/Germany/Netherlands/France/Spain/Italy etc.
  return true; // dataset is europe + USA; this covers everyone except USA
}

function normaliseSchool(raw: string): string {
  const s = raw.trim();
  const patterns: { match: RegExp; label: string }[] = [
    { match: /\bcambridge\b/i, label: "University of Cambridge" },
    { match: /\boxford\b/i, label: "University of Oxford" },
    { match: /\bstanford\b/i, label: "Stanford University" },
    { match: /\bharvard\b/i, label: "Harvard University" },
    { match: /\bmit\b/i, label: "MIT" },
    { match: /\bimperial\b/i, label: "Imperial College London" },
    { match: /\b(ucl|university college london)\b/i, label: "UCL" },
    { match: /\bking'?s college london\b/i, label: "King's College London" },
    { match: /\blse\b|\blondon school of economics\b/i, label: "LSE" },
    { match: /\b(uc berkeley|berkeley)\b/i, label: "UC Berkeley" },
    { match: /\beth\b/i, label: "ETH Zurich" },
    { match: /\bulster\b/i, label: "Ulster University" },
    { match: /\btrinity college dublin\b|\btcd\b/i, label: "Trinity College Dublin" },
    { match: /\bqueen's university belfast\b|\bqub\b/i, label: "Queen's University Belfast" },
    { match: /\buniversity college dublin\b|\bucd\b/i, label: "University College Dublin" },
    { match: /\bbristol\b/i, label: "University of Bristol" },
    { match: /\bkth\b/i, label: "KTH Stockholm" },
    { match: /\bstockholm school of economics\b|\bsse\b/i, label: "SSE Stockholm" },
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
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover border border-neutral-200"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-neutral-200 bg-neutral-100 flex items-center justify-center text-[9px] text-neutral-500">
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
