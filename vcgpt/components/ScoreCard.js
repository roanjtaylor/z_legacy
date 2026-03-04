"use client";

import { useState, useMemo } from "react";
import AnalysisOutput from "./AnalysisOutput";

function parseAnalysis(markdown) {
  if (!markdown) return null;

  // Overall score
  const scoreMatch = markdown.match(/OVERALL SCORE:\s*(\d+)\/100/i);
  const overallScore = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

  // Verdict
  let verdict = null;
  if (markdown.includes("**PASS**")) verdict = "PASS";
  else if (markdown.includes("**CONDITIONAL**")) verdict = "CONDITIONAL";
  else if (markdown.includes("**INVEST**")) verdict = "INVEST";

  // Category scores from scorecard table
  const categories = [];
  const rowRegex = /\|\s*(.+?)\s*\|\s*(\d+)\s*\|\s*(.+?)\s*\|/g;
  let match;
  while ((match = rowRegex.exec(markdown)) !== null) {
    const name = match[1].trim();
    // Skip header rows
    if (name === "Category" || name.startsWith("---")) continue;
    categories.push({
      name,
      score: parseInt(match[2], 10),
      comment: match[3].trim(),
    });
  }

  // One-liner quote (the blockquote after OVERALL SCORE)
  const quoteMatch = markdown.match(/OVERALL SCORE:.*?\n\n>\s*"?([^"\n]+)"?/i);
  const oneLiner = quoteMatch ? quoteMatch[1].trim().replace(/^"|"$/g, "") : null;

  return { overallScore, verdict, categories, oneLiner };
}

function getVerdictColor(verdict) {
  switch (verdict) {
    case "PASS": return { bg: "bg-verdict-red/10", text: "text-verdict-red", border: "border-verdict-red", bar: "bg-verdict-red" };
    case "CONDITIONAL": return { bg: "bg-verdict-amber/10", text: "text-verdict-amber", border: "border-verdict-amber", bar: "bg-verdict-amber" };
    case "INVEST": return { bg: "bg-verdict-green/10", text: "text-verdict-green", border: "border-verdict-green", bar: "bg-verdict-green" };
    default: return { bg: "bg-muted/10", text: "text-muted", border: "border-muted", bar: "bg-muted" };
  }
}

function getScoreColor(score) {
  if (score >= 15) return "bg-verdict-green";
  if (score >= 10) return "bg-verdict-amber";
  return "bg-verdict-red";
}

function downloadMarkdown(content) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vcgpt-analysis.md";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ScoreCard({ content }) {
  const [showFull, setShowFull] = useState(false);
  const parsed = useMemo(() => parseAnalysis(content), [content]);

  if (!parsed || parsed.overallScore === null) return null;

  const { overallScore, verdict, categories, oneLiner } = parsed;
  const colors = getVerdictColor(verdict);

  return (
    <div className="space-y-6">
      {/* Main score card */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8 md:p-10">
        {/* Score + Verdict header */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
          {/* Big score circle */}
          <div className={`w-36 h-36 rounded-full border-4 ${colors.border} flex flex-col items-center justify-center shrink-0`}>
            <span className="text-5xl font-bold text-foreground">{overallScore}</span>
            <span className="text-sm text-muted">/100</span>
          </div>
          <div className="text-center sm:text-left">
            <span className={`inline-block px-5 py-2 rounded-full text-lg font-semibold ${colors.bg} ${colors.text} ${colors.border} border`}>
              {verdict}
            </span>
            {oneLiner && (
              <p className="mt-3 text-muted italic text-base">&ldquo;{oneLiner}&rdquo;</p>
            )}
          </div>
        </div>

        {/* Category progress bars */}
        {categories.length > 0 && (
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-base font-medium text-foreground">{cat.name}</span>
                  <span className="text-base font-semibold text-foreground">{cat.score}/20</span>
                </div>
                <div className="w-full bg-background rounded-full h-3.5">
                  <div
                    className={`h-3.5 rounded-full transition-all duration-500 ${getScoreColor(cat.score)}`}
                    style={{ width: `${(cat.score / 20) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-muted mt-1">{cat.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-border">
          <button
            onClick={() => downloadMarkdown(content)}
            className="px-6 py-3 bg-accent text-white rounded-lg text-base font-medium hover:bg-accent/90 transition-colors cursor-pointer"
          >
            Download .md
          </button>
          <button
            onClick={() => setShowFull(!showFull)}
            className="px-6 py-3 border border-border text-foreground rounded-lg text-base font-medium hover:bg-background transition-colors cursor-pointer"
          >
            {showFull ? "Hide Full Analysis" : "View Full Analysis"}
          </button>
        </div>
      </div>

      {/* Expandable full analysis */}
      {showFull && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8">
          <AnalysisOutput content={content} />
        </div>
      )}
    </div>
  );
}
