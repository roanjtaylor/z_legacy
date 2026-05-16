"use client";

import { useState } from "react";
import { scaleLinear, scalePoint } from "d3-scale";
import type { Archetype, Person } from "@/lib/types";
import { ARCHETYPE_LANES, ageOfStep } from "@/lib/types";

const WIDTH = 1200;
const HEIGHT = 480;
const MARGIN = { top: 30, right: 220, bottom: 60, left: 110 };
const AGE_MIN = 15;
const AGE_MAX = 55;
const CURRENT_YEAR = 2026;

type TierStyle = {
  stroke: string;
  strokeWidth: number;
  opacity: number;
  strokeDasharray?: string;
};

const TIER_STYLES: Record<Person["tier"], TierStyle> = {
  "tier1-admired": {
    stroke: "#0ea5e9",
    strokeWidth: 3,
    opacity: 1,
  },
  "tier2-cautionary": {
    stroke: "#dc2626",
    strokeWidth: 2,
    opacity: 0.75,
    strokeDasharray: "6 4",
  },
  "adjacent-benchmark": {
    stroke: "#a855f7",
    strokeWidth: 2,
    opacity: 0.85,
    strokeDasharray: "2 3",
  },
};

export function CareerTimeline({
  people,
  selectedId,
  onSelect,
}: {
  people: Person[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const xScale = scaleLinear()
    .domain([AGE_MIN, AGE_MAX])
    .range([MARGIN.left, WIDTH - MARGIN.right]);

  const yScale = scalePoint<Archetype>()
    .domain(ARCHETYPE_LANES)
    .range([MARGIN.top, HEIGHT - MARGIN.bottom])
    .padding(0.5);

  // Compute each person's polyline
  const personLines = people.map((p) => {
    const points: { age: number; archetype: Archetype }[] = [];
    for (const step of p.careerSteps) {
      const { ageStart, ageEnd } = ageOfStep(step, p.birthYear);
      if (ageStart === null) continue;
      points.push({ age: ageStart, archetype: step.archetype });
      const effectiveEnd =
        ageEnd ??
        (p.birthYear !== null
          ? Math.min(CURRENT_YEAR - p.birthYear, AGE_MAX)
          : null);
      if (effectiveEnd !== null && effectiveEnd > ageStart) {
        points.push({ age: effectiveEnd, archetype: step.archetype });
      }
    }
    return { person: p, points };
  });

  const ageTicks: number[] = [];
  for (let a = AGE_MIN; a <= AGE_MAX; a += 5) ageTicks.push(a);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full bg-neutral-50 rounded-xl border border-neutral-200"
    >
      {/* Lane horizontal lines + labels */}
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
            x={MARGIN.left - 12}
            y={yScale(arch)!}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-neutral-700"
            fontSize={13}
            fontWeight={500}
          >
            {arch}
          </text>
        </g>
      ))}

      {/* Vertical age gridlines + tick labels */}
      {ageTicks.map((age) => (
        <g key={age}>
          <line
            x1={xScale(age)}
            x2={xScale(age)}
            y1={MARGIN.top}
            y2={HEIGHT - MARGIN.bottom}
            stroke="#f5f5f5"
          />
          <text
            x={xScale(age)}
            y={HEIGHT - MARGIN.bottom + 18}
            textAnchor="middle"
            className="fill-neutral-500"
            fontSize={11}
          >
            {age}
          </text>
        </g>
      ))}
      <text
        x={(WIDTH - MARGIN.right + MARGIN.left) / 2}
        y={HEIGHT - 14}
        textAnchor="middle"
        className="fill-neutral-700"
        fontSize={12}
        fontWeight={500}
      >
        age
      </text>

      {/* Roan's current-age marker */}
      <line
        x1={xScale(21)}
        x2={xScale(21)}
        y1={MARGIN.top - 8}
        y2={HEIGHT - MARGIN.bottom}
        stroke="#16a34a"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      <text
        x={xScale(21)}
        y={MARGIN.top - 12}
        textAnchor="middle"
        className="fill-green-700"
        fontSize={11}
        fontWeight={600}
      >
        you · 21
      </text>

      {/* Person polylines */}
      {personLines.map(({ person, points }) => {
        if (points.length < 2) return null;
        const isHovered = hoverId === person.id;
        const isSelected = selectedId === person.id;
        const isAnyHovered = hoverId !== null;
        const isFaded = isAnyHovered && !isHovered && !isSelected;
        const style = TIER_STYLES[person.tier];
        const path = points
          .map(
            (pt, i) =>
              `${i === 0 ? "M" : "L"} ${xScale(pt.age)} ${yScale(pt.archetype)}`
          )
          .join(" ");
        const lastPoint = points[points.length - 1];
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
              stroke={style.stroke}
              strokeWidth={
                isHovered || isSelected
                  ? style.strokeWidth + 2
                  : style.strokeWidth
              }
              strokeDasharray={style.strokeDasharray}
              opacity={isFaded ? 0.15 : style.opacity}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((pt, i) => (
              <circle
                key={i}
                cx={xScale(pt.age)}
                cy={yScale(pt.archetype)}
                r={isHovered || isSelected ? 5 : 3}
                fill={style.stroke}
                opacity={isFaded ? 0.15 : style.opacity}
              />
            ))}
            <text
              x={xScale(lastPoint.age) + 10}
              y={yScale(lastPoint.archetype)!}
              dominantBaseline="middle"
              className="fill-neutral-800"
              fontSize={12}
              fontWeight={isSelected || isHovered ? 600 : 400}
              opacity={isFaded ? 0.2 : 1}
            >
              {person.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
