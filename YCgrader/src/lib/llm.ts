import { query } from "@anthropic-ai/claude-agent-sdk";

export const MODEL = process.env.GRADER_MODEL ?? "claude-opus-4-8";

/**
 * Hard guarantee that we spend the Claude Code SUBSCRIPTION, not the paid API.
 *
 * A stray ANTHROPIC_API_KEY in the environment silently overrides the
 * subscription login and bills the Messages API. Call this at server startup
 * (and before any LLM call) so the tool refuses to run rather than spend money
 * the user didn't intend.
 */
export function assertNoApiKey(): void {
  if (process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is set. This tool runs on your Claude Code subscription " +
        "via the Agent SDK and must NOT use a paid API key. Unset ANTHROPIC_API_KEY " +
        "and ensure you are logged in (`claude` → /login) before starting the server.",
    );
  }
}

/**
 * Single-shot completion using the local Claude Code subscription.
 * No tools, no file access, no agentic loop — just system + prompt -> text.
 */
export async function complete(opts: { system: string; prompt: string }): Promise<string> {
  assertNoApiKey();

  let out = "";
  for await (const message of query({
    prompt: opts.prompt,
    options: {
      model: MODEL,
      systemPrompt: opts.system,
      maxTurns: 1, // one shot, no back-and-forth
      allowedTools: [], // pure text generation; the model has no tools
      permissionMode: "bypassPermissions", // non-interactive; we grant nothing anyway
      settingSources: [], // do NOT inherit the user's project CLAUDE.md / settings
    },
  })) {
    if (message.type === "assistant") {
      for (const block of message.message.content) {
        if (block.type === "text") out += block.text;
      }
    }
  }
  return out.trim();
}
