import { useState } from "react";
import type { FormInput } from "../lib/schema.ts";

const FIELDS: { key: keyof Omit<FormInput, "idea">; label: string; placeholder: string }[] = [
  {
    key: "problem",
    label: "Problem",
    placeholder: "What's the problem, and who has it badly enough to pay to fix it?",
  },
  {
    key: "solution",
    label: "Solution",
    placeholder: "What are you building? Why is it the right shape for this problem?",
  },
  {
    key: "progress",
    label: "Progress",
    placeholder: "What have you built, shipped, or learned so far? Real numbers beat adjectives.",
  },
  {
    key: "doubts",
    label: "Doubts",
    placeholder: "What's the risk that keeps you up at night? What might kill this?",
  },
];

interface Props {
  onSubmit: (input: FormInput) => void;
  loading: boolean;
}

export function Form({ onSubmit, loading }: Props) {
  const [idea, setIdea] = useState("");
  const [values, setValues] = useState<Record<string, string>>({
    problem: "",
    solution: "",
    progress: "",
    doubts: "",
  });

  const ready = FIELDS.every((f) => values[f.key].trim().length > 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || loading) return;
    onSubmit({
      idea: idea.trim() || undefined,
      problem: values.problem.trim(),
      solution: values.solution.trim(),
      progress: values.progress.trim(),
      doubts: values.doubts.trim(),
    });
  }

  return (
    <form className="form" onSubmit={submit}>
      <label className="field">
        <span className="field-label">One-line idea <em>(optional)</em></span>
        <input
          className="field-input"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g. Stripe for X"
          maxLength={280}
        />
      </label>

      {FIELDS.map((f) => (
        <label className="field" key={f.key}>
          <span className="field-label">{f.label}</span>
          <textarea
            className="field-input field-textarea"
            value={values[f.key]}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            maxLength={3000}
            rows={4}
          />
        </label>
      ))}

      <button className="submit" type="submit" disabled={!ready || loading}>
        {loading ? "Grading…" : "Grade my idea"}
      </button>
    </form>
  );
}
