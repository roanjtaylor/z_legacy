import { complete, MODEL } from "../src/lib/llm.ts";

// Minimal end-to-end check that the Agent SDK reaches the Claude Code
// subscription and returns text. Run: npm exec tsx scripts/smoke-llm.ts
const out = await complete({
  system: "You are a terse assistant. Reply with exactly one short sentence.",
  prompt: "Say hello and name the company that makes you.",
});

console.log(`model: ${MODEL}`);
console.log(`reply: ${out}`);
if (!out) {
  console.error("✗ Empty reply — auth or SDK wiring is wrong.");
  process.exit(1);
}
console.log("✓ LLM wrapper works on the subscription.");
