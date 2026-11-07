import type { Verdict } from "../lib/schema.ts";

const LABEL: Record<Verdict, string> = {
  go: "GO",
  explore: "EXPLORE",
  reconsider: "RECONSIDER",
};

export function VerdictBanner({
  verdict,
  conviction,
  headline,
}: {
  verdict: Verdict;
  conviction: number;
  headline: string;
}) {
  return (
    <div className={`verdict verdict-${verdict}`}>
      <div className="verdict-row">
        <span className="verdict-label">{LABEL[verdict]}</span>
        <div className="conviction">
          <div className="conviction-bar">
            <div className="conviction-fill" style={{ width: `${conviction}%` }} />
          </div>
          <span className="conviction-num">{conviction}<small>/100 conviction</small></span>
        </div>
      </div>
      <p className="verdict-headline">{headline}</p>
    </div>
  );
}
