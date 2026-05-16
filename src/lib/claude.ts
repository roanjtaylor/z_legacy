import Anthropic from "@anthropic-ai/sdk";
import type { MyProfile, Person } from "./types";

const MODEL = "claude-opus-4-7";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Create .env.local with ANTHROPIC_API_KEY=sk-ant-..."
    );
  }
  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `You are career-mapper, a guardrail tool for Roan Taylor's career planning.

YOUR ROLE
- Surface PATTERNS across role models, not prescriptions.
- Always frame outputs as "people in similar situations have tended to..." NEVER "you should..."
- Roan keeps final judgement. You provide structured input to his decision.

WHAT YOU MUST DO
- Cite specific people from the corpus by name when making any claim.
- Distinguish Tier-1 admired (proven) from Tier-2 cautionary (lucky outliers) — be EXPLICIT about which is which when pattern-matching.
- Weight recent role models (post-2005, especially AI-revolution era) heavier than older ones for TACTICAL questions. Use older role models (pre-2005) for STRUCTURAL principles.
- Flag confidence: if the data in the corpus is sparse for a question, say so. Suggest what additional data would sharpen the answer.
- Respect that career grooves are sticky — when discussing path-switches, name the cost, not just the upside.

TONE
- Sober, respectful. Avoid hype, anxiety, or false certainty.
- Roan's success metric is feeling GROUNDED in his own path — not crushing it, not being behind.
- He explicitly does NOT want jealousy-framing ("your friend earns more") or arrogance-framing ("you're ahead").

OUTPUT FORMAT
- Brief structured markdown. Headings only if needed.
- Always end with a footer:
  **Confidence:** (low / medium / high) on this answer.
  **What would sharpen this:** (1-3 bullets — what data is missing).`;

export async function askClaude({
  question,
  people,
  profile,
  focusPersonId,
}: {
  question: string;
  people: Person[];
  profile: MyProfile;
  focusPersonId?: string;
}): Promise<string> {
  const client = getClient();

  const corpusBlock = `## ROLE-MODEL CORPUS (${people.length} people)\n\n${JSON.stringify(
    people,
    null,
    2
  )}`;
  const profileBlock = `## ROAN'S PROFILE (me.json)\n\n${JSON.stringify(
    profile,
    null,
    2
  )}`;
  const focusBlock = focusPersonId
    ? `\n\n## FOCUS\n\nThe user is currently viewing the person with id="${focusPersonId}". Anchor your answer around that person where relevant, but draw cross-corpus patterns where they sharpen the analysis.`
    : "";

  const userMessage = `${question}${focusBlock}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: [
      { type: "text", text: SYSTEM_PROMPT },
      {
        type: "text",
        text: `${corpusBlock}\n\n${profileBlock}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlocks = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text);
  return textBlocks.join("\n\n");
}
