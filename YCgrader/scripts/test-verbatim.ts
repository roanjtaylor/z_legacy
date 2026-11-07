import { normalizeForQuoteCheck } from "../src/lib/prompts.ts";

// Regression: the verbatim check must accept exact (and lightly-formatted)
// quotes and reject fabricated ones. Mirrors the substring logic in
// server/analyze.ts findVerbatimViolations().
const sourceText =
  "The way to get startup ideas is not to try to think of startup ideas. " +
  "It's to look for problems, preferably problems you have yourself.";

function isVerbatim(quote: string): boolean {
  const hay = normalizeForQuoteCheck(sourceText);
  const needle = normalizeForQuoteCheck(quote);
  return needle.length > 0 && hay.includes(needle);
}

const cases: [string, boolean][] = [
  ["look for problems, preferably problems you have yourself", true], // exact
  ["It's to *look for problems*, preferably problems you have yourself.", true], // markdown/punct
  ["the way to get startup ideas is not to try to think of startup ideas", true], // case
  ["talk to ten users every single week without fail", false], // fabricated
  ["the best startups are always founded by two technical cofounders", false], // fabricated
];

let pass = 0;
for (const [quote, expected] of cases) {
  const got = isVerbatim(quote);
  const ok = got === expected;
  console.log(`${ok ? "✓" : "✗"} expect ${expected} got ${got}: "${quote.slice(0, 50)}…"`);
  if (ok) pass++;
}

if (pass !== cases.length) {
  console.error(`\n✗ verbatim guard: ${pass}/${cases.length} passed`);
  process.exit(1);
}
console.log(`\n✓ verbatim guard: all ${cases.length} cases passed.`);
