import { loadPrinciples, retrieveChunks, retrieveCompanies } from "../src/lib/retrieval.ts";

// Sanity-check retrieval returns relevant chunks without any LLM call.
const query =
  "two-sided marketplace connecting local dog walkers with busy owners, " +
  "cold start, hard to get supply, no revenue yet, worried about demand";

const chunks = await retrieveChunks(query, 8);
const companies = await retrieveCompanies(query, 4);
const principles = await loadPrinciples();

console.log(`principles chars: ${principles.length}`);
console.log(`\nTop ${chunks.length} essay/lecture chunks:`);
for (const c of chunks) console.log(`  [${c.type}] ${c.source} — ${c.text.slice(0, 70)}…`);

console.log(`\nTop ${companies.length} companies:`);
for (const c of companies) console.log(`  ${c.source}`);

if (chunks.length === 0 || companies.length === 0 || principles.length < 1000) {
  console.error("\n✗ Retrieval looks broken.");
  process.exit(1);
}
console.log("\n✓ Retrieval works.");
