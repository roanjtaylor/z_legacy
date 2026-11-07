"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MyProfile, Person } from "@/lib/types";
import { CareerTimeline } from "./CareerTimeline";
import { PersonDetail } from "./PersonDetail";

export function Main({
  people: initialPeople,
  profile,
}: {
  people: Person[];
  profile: MyProfile;
}) {
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const selected = selectedId
    ? people.find((p) => p.id === selectedId) ?? null
    : null;

  useEffect(() => {
    if (selected && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedId, selected]);

  const handleSave = (updated: Person) => {
    setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

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
          <div className="text-xs text-neutral-500">
            <strong className="text-neutral-900">{people.length}</strong> people
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

      {selected && (
        <div ref={detailRef}>
          <PersonDetail
            person={selected}
            onSaved={handleSave}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}

      <section>
        <CareerTimeline
          people={people}
          selectedId={selectedId ?? undefined}
          onSelect={(id) =>
            setSelectedId((prev) => (prev === id ? null : id))
          }
        />
      </section>
    </div>
  );
}
