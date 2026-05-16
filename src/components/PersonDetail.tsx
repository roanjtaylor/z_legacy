"use client";

import { useEffect, useState } from "react";
import type {
  Archetype,
  CareerStep,
  Confidence,
  Education,
  Person,
} from "@/lib/types";

const ARCHETYPES: Archetype[] = [
  "Student",
  "Builder",
  "Hustler",
  "Founder",
  "Investor",
  "Operator",
  "Other",
];

const CONFIDENCES: Confidence[] = ["high", "medium", "low"];

export function PersonDetail({
  person,
  onSaved,
  onClose,
}: {
  person: Person;
  onSaved: (updated: Person) => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <aside className="p-5 border border-neutral-200 rounded-xl bg-white space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          {person.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.imageUrl}
              alt={person.name}
              className="w-20 h-20 rounded-full object-cover border border-neutral-200 shrink-0"
            />
          )}
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold truncate">{person.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {person.confidence !== "high" && (
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                  data: {person.confidence}
                </span>
              )}
              <span className="text-xs text-neutral-500">
                {person.birthYear ?? "?"} · {person.countryOfOrigin}
                {person.currentCountry &&
                  person.currentCountry !== person.countryOfOrigin && (
                    <> · now in {person.currentCountry}</>
                  )}
              </span>
            </div>
            <p className="text-xs text-neutral-600 italic mt-1">
              arc: {person.archetypeArc.join(" → ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setEditing((e) => !e)}
            className="px-3 py-1.5 text-xs font-medium border border-neutral-300 rounded-lg hover:bg-neutral-50"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 text-2xl leading-none px-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </header>

      {editing ? (
        <EditForm
          person={person}
          onCancel={() => setEditing(false)}
          onSaved={(p) => {
            onSaved(p);
            setEditing(false);
          }}
        />
      ) : (
        <ViewBody person={person} />
      )}
    </aside>
  );
}

function ViewBody({ person }: { person: Person }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-5">
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
                  {ed.degree ?? "—"} · {ed.startYear ?? "?"}–
                  {ed.endYear ?? "?"}
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
      </div>

      <div>
        <Section title="Career steps">
          <ol className="space-y-3 relative border-l border-neutral-200 pl-4">
            {person.careerSteps.map((step, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full bg-neutral-400" />
                <div className="text-sm font-medium">
                  {step.role}
                  <span className="font-normal text-neutral-600">
                    {" "}
                    · {step.company}
                  </span>
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
      </div>
    </div>
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

// ---------------------------------------------------------------------------
// Edit form
// ---------------------------------------------------------------------------

function EditForm({
  person,
  onCancel,
  onSaved,
}: {
  person: Person;
  onCancel: () => void;
  onSaved: (p: Person) => void;
}) {
  const [draft, setDraft] = useState<Person>(() => deepClone(person));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(deepClone(person));
  }, [person]);

  const update = <K extends keyof Person>(key: K, val: Person[K]) =>
    setDraft((d) => ({ ...d, [key]: val }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person: draft, overwrite: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error +
            (data.issues
              ? "\n" + JSON.stringify(data.issues, null, 2)
              : "")
        );
      }
      onSaved(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 border border-red-300 bg-red-50 rounded text-xs text-red-800 whitespace-pre-wrap font-mono">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Name">
          <input
            className={inputCls}
            value={draft.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field label="Image URL">
          <input
            className={inputCls}
            value={draft.imageUrl ?? ""}
            placeholder="https://…"
            onChange={(e) => update("imageUrl", e.target.value || null)}
          />
        </Field>
        <Field label="Birth year">
          <input
            type="number"
            className={inputCls}
            value={draft.birthYear ?? ""}
            onChange={(e) =>
              update(
                "birthYear",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          />
        </Field>
        <Field label="Country of origin">
          <input
            className={inputCls}
            value={draft.countryOfOrigin}
            onChange={(e) => update("countryOfOrigin", e.target.value)}
          />
        </Field>
        <Field label="Current country">
          <input
            className={inputCls}
            value={draft.currentCountry ?? ""}
            onChange={(e) =>
              update("currentCountry", e.target.value || null)
            }
          />
        </Field>
        <Field label="Confidence">
          <select
            className={inputCls}
            value={draft.confidence}
            onChange={(e) =>
              update("confidence", e.target.value as Confidence)
            }
          >
            {CONFIDENCES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Archetype arc (comma-separated)">
          <input
            className={inputCls}
            value={draft.archetypeArc.join(", ")}
            onChange={(e) =>
              update(
                "archetypeArc",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean) as Archetype[]
              )
            }
          />
        </Field>
      </div>

      <Field label="Current status">
        <textarea
          className={inputCls + " min-h-[60px]"}
          value={draft.outcomes.currentStatus}
          onChange={(e) =>
            update("outcomes", {
              ...draft.outcomes,
              currentStatus: e.target.value,
            })
          }
        />
      </Field>

      <Field label="Estimated net worth (USD number, string, or empty)">
        <input
          className={inputCls}
          value={
            draft.outcomes.estNetWorthUsd === null
              ? ""
              : String(draft.outcomes.estNetWorthUsd)
          }
          onChange={(e) => {
            const v = e.target.value;
            const parsed =
              v === ""
                ? null
                : /^-?\d+(\.\d+)?$/.test(v)
                ? Number(v)
                : v;
            update("outcomes", { ...draft.outcomes, estNetWorthUsd: parsed });
          }}
        />
      </Field>

      <Field label="Notes">
        <textarea
          className={inputCls + " min-h-[60px]"}
          value={draft.notes ?? ""}
          onChange={(e) => update("notes", e.target.value || null)}
        />
      </Field>

      <EducationEditor
        education={draft.education}
        onChange={(education) => update("education", education)}
      />

      <CareerStepsEditor
        steps={draft.careerSteps}
        onChange={(careerSteps) => update("careerSteps", careerSteps)}
      />

      <Field label="Lessons (JSON: [{lesson, source}])">
        <JsonEditor
          value={draft.lessons}
          onChange={(v) => update("lessons", v as Person["lessons"])}
        />
      </Field>

      <Field label="Sources (JSON: [{title, url, type}])">
        <JsonEditor
          value={draft.sources}
          onChange={(v) => update("sources", v as Person["sources"])}
        />
      </Field>

      <Field label="Exit events (JSON)">
        <JsonEditor
          value={draft.outcomes.exitEvents}
          onChange={(v) =>
            update("outcomes", {
              ...draft.outcomes,
              exitEvents: v as Person["outcomes"]["exitEvents"],
            })
          }
        />
      </Field>

      <div className="flex gap-2 sticky bottom-0 bg-white pt-3 border-t border-neutral-200">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full p-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function EducationEditor({
  education,
  onChange,
}: {
  education: Education[];
  onChange: (ed: Education[]) => void;
}) {
  const update = (i: number, patch: Partial<Education>) =>
    onChange(education.map((e, j) => (i === j ? { ...e, ...patch } : e)));
  const add = () =>
    onChange([
      ...education,
      {
        school: "",
        degree: null,
        startYear: null,
        endYear: null,
        notes: null,
      },
    ]);
  const remove = (i: number) =>
    onChange(education.filter((_, j) => j !== i));

  return (
    <Section title="Education">
      <div className="space-y-3">
        {education.map((ed, i) => (
          <div
            key={i}
            className="border border-neutral-200 rounded-lg p-3 space-y-2 bg-neutral-50"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className={inputCls}
                placeholder="School"
                value={ed.school}
                onChange={(e) => update(i, { school: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="Degree"
                value={ed.degree ?? ""}
                onChange={(e) =>
                  update(i, { degree: e.target.value || null })
                }
              />
              <input
                type="number"
                className={inputCls}
                placeholder="Start year"
                value={ed.startYear ?? ""}
                onChange={(e) =>
                  update(i, {
                    startYear:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <input
                type="number"
                className={inputCls}
                placeholder="End year"
                value={ed.endYear ?? ""}
                onChange={(e) =>
                  update(i, {
                    endYear:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </div>
            <textarea
              className={inputCls}
              placeholder="Notes"
              value={ed.notes ?? ""}
              onChange={(e) => update(i, { notes: e.target.value || null })}
            />
            <button
              onClick={() => remove(i)}
              className="text-xs text-red-700 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className="px-3 py-1.5 text-xs border border-dashed border-neutral-400 rounded hover:bg-neutral-50"
        >
          + Add education
        </button>
      </div>
    </Section>
  );
}

function CareerStepsEditor({
  steps,
  onChange,
}: {
  steps: CareerStep[];
  onChange: (s: CareerStep[]) => void;
}) {
  const update = (i: number, patch: Partial<CareerStep>) =>
    onChange(steps.map((s, j) => (i === j ? { ...s, ...patch } : s)));
  const add = () =>
    onChange([
      ...steps,
      {
        role: "",
        company: "",
        archetype: "Builder",
        startYear: null,
        endYear: null,
        estAgeStart: null,
        estAgeEnd: null,
        estCompUsd: null,
        estCompConfidence: "low",
        keyDecisions: [],
        lessons: [],
        notes: null,
      },
    ]);
  const remove = (i: number) => onChange(steps.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <Section title="Career steps">
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className="border border-neutral-200 rounded-lg p-3 space-y-2 bg-neutral-50"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className={inputCls}
                placeholder="Role"
                value={step.role}
                onChange={(e) => update(i, { role: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="Company"
                value={step.company}
                onChange={(e) => update(i, { company: e.target.value })}
              />
              <select
                className={inputCls}
                value={step.archetype}
                onChange={(e) =>
                  update(i, { archetype: e.target.value as Archetype })
                }
              >
                {ARCHETYPES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <select
                className={inputCls}
                value={step.estCompConfidence}
                onChange={(e) =>
                  update(i, {
                    estCompConfidence: e.target.value as Confidence,
                  })
                }
              >
                {CONFIDENCES.map((c) => (
                  <option key={c} value={c}>
                    comp conf: {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className={inputCls}
                placeholder="Start year"
                value={step.startYear ?? ""}
                onChange={(e) =>
                  update(i, {
                    startYear:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <input
                type="number"
                className={inputCls}
                placeholder="End year (blank = present)"
                value={step.endYear ?? ""}
                onChange={(e) =>
                  update(i, {
                    endYear:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <input
                type="number"
                className={inputCls}
                placeholder="Age start"
                value={step.estAgeStart ?? ""}
                onChange={(e) =>
                  update(i, {
                    estAgeStart:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <input
                type="number"
                className={inputCls}
                placeholder="Age end"
                value={step.estAgeEnd ?? ""}
                onChange={(e) =>
                  update(i, {
                    estAgeEnd:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </div>
            <textarea
              className={inputCls}
              placeholder="Lessons (one per line)"
              value={step.lessons.join("\n")}
              onChange={(e) =>
                update(i, {
                  lessons: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
            <textarea
              className={inputCls}
              placeholder="Key decisions (one per line)"
              value={step.keyDecisions.join("\n")}
              onChange={(e) =>
                update(i, {
                  keyDecisions: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
            <textarea
              className={inputCls}
              placeholder="Notes"
              value={step.notes ?? ""}
              onChange={(e) => update(i, { notes: e.target.value || null })}
            />
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => move(i, -1)}
                className="text-neutral-600 hover:text-neutral-900"
              >
                ↑ up
              </button>
              <button
                onClick={() => move(i, 1)}
                className="text-neutral-600 hover:text-neutral-900"
              >
                ↓ down
              </button>
              <button
                onClick={() => remove(i)}
                className="text-red-700 hover:underline ml-auto"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={add}
          className="px-3 py-1.5 text-xs border border-dashed border-neutral-400 rounded hover:bg-neutral-50"
        >
          + Add career step
        </button>
      </div>
    </Section>
  );
}

function JsonEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(value, null, 2));
  }, [value]);

  return (
    <div className="space-y-1">
      <textarea
        className={
          inputCls +
          " font-mono text-xs min-h-[120px] " +
          (err ? "border-red-400" : "")
        }
        value={text}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          try {
            const parsed = JSON.parse(v);
            setErr(null);
            onChange(parsed);
          } catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
          }
        }}
      />
      {err && <div className="text-xs text-red-700">{err}</div>}
    </div>
  );
}

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}
