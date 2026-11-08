import type { AnalyzeResponse, SectionKey } from "../lib/schema.ts";
import { SourceCard } from "./SourceCard.tsx";
import { VerdictBanner } from "./VerdictBanner.tsx";

const SECTION_TITLE: Record<SectionKey, string> = {
  problem: "Problem",
  solution: "Solution",
  progress: "Progress",
  doubts: "Doubts",
};

export function Report({ data }: { data: AnalyzeResponse }) {
  const { output, meta } = data;
  return (
    <div className="report">
      <VerdictBanner
        verdict={output.verdict}
        conviction={output.conviction}
        headline={output.headline}
      />

      <section className="block">
        <h2>Analysis</h2>
        {output.sections.map((s) => (
          <div className={`section section-${s.grade}`} key={s.key}>
            <div className="section-head">
              <h3>{SECTION_TITLE[s.key]}</h3>
              <span className={`grade grade-${s.grade}`}>{s.grade}</span>
            </div>
            <p className="section-analysis">{s.analysis}</p>
            {s.sources.map((src, i) => (
              <SourceCard source={src} key={i} />
            ))}
          </div>
        ))}
      </section>

      {output.comparables.length > 0 && (
        <section className="block">
          <h2>Comparable YC companies</h2>
          {output.comparables.map((c, i) => (
            <div className="comparable" key={i}>
              <a href={c.url} target="_blank" rel="noreferrer" className="comparable-name">
                {c.name}
              </a>
              <span className={`outcome outcome-${c.outcome}`}>{c.outcome}</span>
              <p className="comparable-lesson">{c.lesson}</p>
            </div>
          ))}
        </section>
      )}

      <section className="block">
        <h2>Next experiments</h2>
        {output.next_steps.map((n, i) => (
          <div className="next-step" key={i}>
            <p className="next-text">{n.text}</p>
            <p className="next-why">{n.why}</p>
          </div>
        ))}
      </section>

      <details className="meta">
        <summary>Diagnosis & sources</summary>
        <p><strong>Shape:</strong> {meta.diagnosis.shape}</p>
        <p><strong>Load-bearing risk:</strong> {meta.diagnosis.load_bearing_risk}</p>
        <p><strong>Stage:</strong> {meta.diagnosis.inferred_stage}</p>
        <p><strong>Sources used:</strong> {meta.sources_used.join(", ") || "—"}</p>
      </details>
    </div>
  );
}
