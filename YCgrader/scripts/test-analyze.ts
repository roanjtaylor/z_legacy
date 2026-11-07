import { analyze } from "../server/analyze.ts";

// Full pipeline on a real idea. Because analyze() enforces the verbatim-quote
// check internally (failing quotes trigger a repair retry, and a second failure
// throws), simply reaching a result proves every quote is verbatim.
const form = {
  idea: "Rover for dog-walking in mid-size UK cities",
  problem:
    "Busy professionals with dogs can't walk them midday. Existing options are " +
    "unreliable neighbours or expensive bespoke walkers found via word of mouth.",
  solution:
    "A two-sided marketplace matching vetted local dog walkers with owners, with " +
    "in-app booking, GPS-tracked walks, and payments.",
  progress:
    "Landing page with 40 email signups. No walkers onboarded yet. Built a Figma " +
    "prototype. Haven't taken any payments.",
  doubts:
    "I'm worried I can't get enough walkers in a city to make matching reliable, and " +
    "that people will just arrange directly and cut us out after the first match.",
};

console.log("Running full analyze pipeline (this calls Claude twice)…\n");
const t0 = Date.now();
const res = await analyze(form);
console.log(`✓ Completed in ${((Date.now() - t0) / 1000).toFixed(1)}s on attempt ${res.meta.attempt}\n`);

const o = res.output;
console.log(`VERDICT: ${o.verdict.toUpperCase()}  (conviction ${o.conviction})`);
console.log(`HEADLINE: ${o.headline}\n`);
for (const s of o.sections) {
  console.log(`[${s.key}] ${s.grade.toUpperCase()} — ${s.analysis.slice(0, 130)}…`);
  for (const src of s.sources) console.log(`    └ "${src.quote.slice(0, 70)}…" — ${src.source}`);
}
console.log(`\nCOMPARABLES: ${o.comparables.map((c) => `${c.name} (${c.outcome})`).join(", ")}`);
console.log(`NEXT STEPS:`);
for (const n of o.next_steps) console.log(`  • ${n.text}  (${n.why})`);

const errors: string[] = [];
if (o.sections.length !== 4) errors.push("expected 4 sections");
if (o.next_steps.length < 1) errors.push("expected >=1 next step");
if (o.comparables.length < 1) errors.push("expected >=1 comparable");
const keys = new Set(o.sections.map((s) => s.key));
for (const k of ["problem", "solution", "progress", "doubts"]) {
  if (!keys.has(k as never)) errors.push(`missing section: ${k}`);
}

if (errors.length) {
  console.error("\n✗ FAILED:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("\n✓ All assertions passed.");
