# YC Idea Grader v2 — Build Plan

> **Seed document.** This file is the single source of truth for rebuilding the tool from scratch in a new, empty project. A fresh Claude session should be able to read this top-to-bottom and produce the working tool. If a decision contradicts this file, update this file in the same change.

---

## 0. What this is (one breath)

A **private, local-only YC-style startup-idea grader**. The founder enters their idea in the four simplest possible inputs — **Problem, Solution, Progress, Doubts** — and the tool grades it the way Y Combinator would: grounded in a clearly-organised local "brain" of Paul Graham's essays, YC Startup School content, and the history of real YC companies (successes *and* failures). It returns a **customised, sourced analysis** and an **actionable yes/no verdict with concrete next steps**, phrased as investor advice — on the premise that every early-stage startup is just an experiment, so if there's enough conviction the answer is "go run the experiment and see what happens."

It runs **only on the user's machine via the local dev server**, and it uses the user's **Claude subscription** (Claude Code login) — **not** a paid API key. It will not be published.

### How v2 differs from v1 (the old "Belfast Founders" build)

| Area | v1 (old) | v2 (this plan) |
|---|---|---|
| **Auth / LLM** | `@anthropic-ai/sdk` with `ANTHROPIC_API_KEY` (paid API) | **Claude Agent SDK** on the local Claude Code **subscription** — no API key |
| **Embeddings/RAG** | Voyage `voyage-3` API + opaque `embeddings.json` blob | **No API key.** Brain is readable markdown; **local BM25** selection |
| **Brain clarity** | Vectors only; hard to inspect or improve | Human-readable, clearly-organised corpus you can read and edit |
| **Inputs** | 6 office-hours questions + name + one-liner + stage | **4 plain inputs**: Problem, Solution, Progress, Doubts |
| **Output** | Per-question traffic lights + hackathon score | **Per-section analysis + sources + a single yes/no verdict + next steps** |
| **Deployment** | Vercel serverless, meant to ship | **Local-only internal tool**, never published |

The good ideas from v1 that we **keep**: the "no source = no answer" discipline (every claim grounded in a real quote), the three analytical lenses (PG product/demand, Thiel market structure, Cosgrave base-rates), the verbatim-quote check, and the strict-schema + retry loop.

---

## 1. Locked decisions (don't re-open mid-build)

| Area | Choice |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | A **local Node server** (Express or the built-in `node:http`) exposing `POST /api/analyze`. **Not** Vercel serverless — this is local-only. |
| LLM auth | **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) running on the local Claude Code subscription login. No `ANTHROPIC_API_KEY`. |
| Model | `claude-opus-4-8` (most capable; 1M context lets us stuff a large brain). Allow override to `claude-sonnet-4-6` for speed via an env var. |
| Brain storage | Readable markdown under `content/`, organised by source type. Committed to the repo. |
| Retrieval | **Local BM25** (pure TypeScript, no external service). Core `principles/` are *always* included; essays/lectures/companies are selected per-query. |
| Structured output | Instructed-JSON in the prompt + **Zod** validation + a 2-attempt repair loop. (The Agent SDK doesn't expose `tool_choice` forcing the way the raw Messages API does, so we validate the returned JSON ourselves.) |
| Inputs | 4 free-text fields: `problem`, `solution`, `progress`, `doubts`. Plus an optional one-line `idea` summary. No "stage" field (infer stage from `progress`). |
| Output | One verdict (`go` / `reconsider`) + headline + per-section grounded analysis + cited sources + 1–3 concrete next experiments. |
| Persistence | `localStorage` (export/import JSON button). No database. |
| Privacy | Everything stays on disk + the user's Claude subscription. Nothing is published or sent to a third-party API. |

---

## 2. Architecture

```
React (Vite) frontend  ── http://localhost:5173
   │   4-field form: Problem / Solution / Progress / Doubts
   │
   └─ POST /api/analyze ── local Node server on http://localhost:8787
            │
            ├─ 1. DIAGNOSE (Claude via Agent SDK)
            │      cheap call: classify the idea, name the load-bearing
            │      risk, emit retrieval keywords/tags
            │
            ├─ 2. RETRIEVE (local, no network)
            │      always: content/principles/*  (the core doctrine)
            │      + BM25 top-k over pg-essays / startup-school / yc-companies
            │      keyed on the founder's text + diagnosis keywords
            │
            └─ 3. GRADE + VERDICT (Claude via Agent SDK)
                   stuff sources into context; produce strict JSON:
                   { verdict, headline, sections[], sources[], next_steps[] }
                   → Zod validate → verbatim-quote check → repair retry
```

**Why a local Node server and not Vercel:** the Claude Agent SDK spawns the local `claude` binary and uses the machine's Claude Code login. That only works on the user's machine, which is exactly the intended constraint ("only works when running my local npm server"). A serverless deployment has no logged-in subscription to borrow.

---

## 3. Authentication — the crux (Claude subscription, no API key)

The tool authenticates by piggy-backing on the **local Claude Code subscription login** via the **Claude Agent SDK**. There is no `ANTHROPIC_API_KEY` anywhere in this project.

### 3.1 Prerequisites (one-time, on the user's machine)

1. Claude Code is installed and the user is logged in with their subscription (`claude` in a terminal, then `/login` → choose the subscription account). This is the credential the tool will use.
2. **Ensure no `ANTHROPIC_API_KEY` is set in the environment**, and the project's `.env*` files must not define one. A stray API key silently overrides the subscription login and would bill the API instead. The server should **assert at startup** that `process.env.ANTHROPIC_API_KEY` is unset and refuse to run (with a clear message) if it is — this is the guardrail that guarantees we're spending subscription credits, not API credits.

### 3.2 The LLM wrapper (`src/lib/llm.ts`)

Use `@anthropic-ai/claude-agent-sdk`. The implementing session must **verify exact binding names against the current Agent SDK docs/repo before writing this file** (do not guess SDK signatures — use the `claude-api` skill or WebFetch `https://github.com/anthropics/claude-agent-sdk-typescript`). The intended shape:

```ts
// src/lib/llm.ts  — verify exact API against the Agent SDK docs before finalising
import { query } from "@anthropic-ai/claude-agent-sdk";

const MODEL = process.env.GRADER_MODEL ?? "claude-opus-4-8";

/**
 * Single-shot completion using the local Claude Code subscription.
 * No tools, no file access, no agentic loop — just system + prompt → text.
 */
export async function complete(opts: {
  system: string;
  prompt: string;
}): Promise<string> {
  let out = "";
  for await (const message of query({
    prompt: opts.prompt,
    options: {
      model: MODEL,
      systemPrompt: opts.system,
      maxTurns: 1,            // one shot, no back-and-forth
      allowedTools: [],       // pure text generation; the model has no tools
      permissionMode: "bypassPermissions", // non-interactive; we grant nothing anyway
      // settingSources: []   // do NOT inherit the user's project CLAUDE.md etc.
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
```

Notes for the implementer:
- The Agent SDK streams typed messages; collect the `assistant` text blocks. Confirm the exact message/result shape in the SDK docs — the names above are the intended structure, not verbatim guarantees.
- Because we can't force a tool call (as v1 did with `tool_choice`), **structured output is achieved by instructing the model to emit only a JSON object** and validating with Zod (see §7). The prompt must say "output the JSON object only, no prose, no markdown fences." Strip accidental ```json fences defensively before parsing (carry over v1's `extractJsonText` helper).
- Keep `allowedTools: []` and don't pass `settingSources` that pull in the user's other Claude config — we want a clean, deterministic prompt, not an agent that wanders the filesystem.

### 3.3 Fallback auth (only if the Agent SDK path is blocked)

If, and only if, the Agent SDK can't run in this context, the documented fallback is the OAuth-token path: `ant auth login` to create a profile, then the raw `@anthropic-ai/sdk` with `new Anthropic({ authToken })` **plus** the header `anthropic-beta: oauth-2025-04-20`, where the token comes from `ant auth print-credentials --access-token`. The token is short-lived (~1h) and not auto-refreshed, so the wrapper would need to re-fetch it. This is strictly a fallback — prefer the Agent SDK.

---

## 4. Repo layout

```
/content                         ← the YC "brain" (readable markdown, committed)
  /principles
    pg-product-demand.md         ← PG axis doctrine (make something people want, do
                                    things that don't scale, talk to users, narrow wedge…)
    thiel-market-structure.md    ← monopoly vs competition, value capture, last mover,
                                    four moats, AI-cloneability test
    cosgrave-base-rates.md       ← power-law outcomes, default-failure prior, survivorship
    verdict-doctrine.md          ← how to turn analysis into go/reconsider (see §8)
  /pg-essays/*.md                ← scraped PG essays w/ frontmatter
  /startup-school/*.md           ← cleaned Startup School transcripts w/ frontmatter
  /yc-companies
    companies.json               ← structured records: name, batch, outcome, one-liner,
                                    tags, what-they-did, lesson (successes AND failures)
/scripts
  scrape-pg.ts                   ← paulgraham.com → markdown + frontmatter
  scrape-startup-school.ts       ← Startup School transcripts → markdown + frontmatter
  scrape-yc-companies.ts         ← YC directory → companies.json
  build-index.ts                 ← chunk the corpus → content/index.json (BM25 corpus)
  test-analyze.ts                ← run the analyzer on a sample idea end-to-end
/server
  index.ts                       ← local Node server, POST /api/analyze
/src
  /lib
    llm.ts                       ← Agent SDK wrapper (§3.2)
    retrieval.ts                 ← BM25 over content/index.json (§6)
    prompts.ts                   ← diagnose + grader prompts (§8)
    schema.ts                    ← Zod schemas for input + output (§7)
    storage.ts                   ← localStorage adapter (export/import)
  /components
    Form.tsx                     ← the 4-field form
    Report.tsx                   ← verdict + analysis + sources + next steps
    VerdictBanner.tsx
    SourceCard.tsx               ← quote + source link
  App.tsx  main.tsx  styles.css
plan.md                          ← this file
.env.example                     ← documents GRADER_MODEL only; NO api key
README.md
```

---

## 5. The brain (content) — clear, inspectable, improvable

The whole point of v2's brain is that it's **legible**: anyone can open `content/` and see exactly what fuels the grader. Three source types, plus the always-on principles.

### 5.1 `content/principles/` — the core doctrine (always included in context)

Hand-written markdown distilling the three lenses. This is the permanent "mind" of the grader and the main lever for improving it over time. Port the doctrine already written in v1's `WORLDVIEW_PROMPT` (it's good) but split into readable files:
- **`pg-product-demand.md`** — startup = growth; make something people want; default alive/dead; do things that don't scale; talk to users; narrow wedge beats platform; real demand vs polite "yes"; free-incumbent switching cost.
- **`thiel-market-structure.md`** — competition is for losers; create value AND capture it; start with a small dominable market; last mover; four moats (proprietary tech, network effects, economies of scale, brand); the AI-cloneability test ("if a competitor rebuilds this in a weekend with Claude, what survives?"); intersection-lie / union-lie.
- **`cosgrave-base-rates.md`** — most startups fail or stagnate; heavy-tailed outcomes; VC money extends runway, not fate; survivorship bias; the honest prior is failure unless evidence beats the base rate.
- **`verdict-doctrine.md`** — see §8.3.

### 5.2 `content/pg-essays/` and `content/startup-school/`

Scraped to markdown, each file with YAML frontmatter:

```yaml
---
source: "How to Get Startup Ideas"
author: "Paul Graham"
url: "https://paulgraham.com/startupideas.html"
type: "pg-essay"          # or "startup-school"
topics: ["idea-validation", "demand", "wedge"]
---
```

Scrapers (`scrape-pg.ts`, `scrape-startup-school.ts`): fetch HTML / transcripts, convert to clean markdown (use `turndown` + `jsdom` for PG; `youtube-transcript` for lectures, as v1 did). Start with the canonical ~30 PG essays and ~10–15 core Startup School lectures; the corpus can grow later because retrieval is generic over whatever's in `content/`.

### 5.3 `content/yc-companies/companies.json`

Structured records of **real YC companies, including failures**, so the grader can cite outcomes and base rates and name comparable peers. Each record:

```json
{
  "name": "Airbnb",
  "batch": "W09",
  "outcome": "public",          // active | acquired | public | dead
  "top_company": true,
  "one_liner": "Marketplace for short-term lodging.",
  "tags": ["marketplace", "two-sided", "consumer", "do-things-that-dont-scale"],
  "what_they_did": "Went door-to-door in NYC to recruit and photograph hosts.",
  "lesson": "Marketplaces require heroic unscalable supply-side work at the start.",
  "url": "https://www.ycombinator.com/companies/airbnb"
}
```

`scrape-yc-companies.ts` pulls the YC directory for the raw set; hand-curate a smaller high-signal subset with `what_they_did`/`lesson` for the comparables the grader is allowed to quote. Keep a healthy mix of deaths and exits so the grader can show real base rates, not a survivorship reel.

---

## 6. Retrieval — local BM25, zero API keys (`src/lib/retrieval.ts`)

No embeddings, no network. `build-index.ts` chunks every markdown file in `content/pg-essays` and `content/startup-school` (chunk by heading / ~200–400 word windows), plus one chunk per `companies.json` record, and writes `content/index.json` with `{ id, source, url, type, text }` per chunk. Commit `index.json`.

At query time:
- **Always include** the full `content/principles/*` text (small, and it's the doctrine).
- Build a BM25 query from the founder's four fields + the diagnosis keywords (§8.1).
- Return top-k (≈8–12) essay/lecture chunks + top-k (≈6) company records.
- Implement BM25 in plain TypeScript (tokenise → lowercase → stopword-strip → term-frequency / inverse-document-frequency scoring). ~80 lines, no dependency. Carry over v1's stopword list and `normalize()` helper.

This keeps the brain fully local and legible while still surfacing the most relevant passages per idea.

---

## 7. Schemas (`src/lib/schema.ts`, Zod)

### Input

```ts
export const FormInput = z.object({
  idea: z.string().min(1).max(280).optional(),   // optional one-line summary
  problem:  z.string().min(1).max(3000),         // What problem? Who has it?
  solution: z.string().min(1).max(3000),         // What are you building?
  progress: z.string().min(1).max(3000),         // What have you done / learned / built so far?
  doubts:   z.string().min(1).max(3000),         // What are your biggest risks / fears?
});
```

### Output (what the analyzer must return)

```ts
export const Verdict = z.enum(["go", "reconsider"]);

export const Source = z.object({
  quote: z.string().min(1),        // VERBATIM from a retrieved source
  source: z.string().min(1),       // title, e.g. "How to Get Startup Ideas"
  url: z.string().min(1),
});

export const Section = z.object({
  key: z.enum(["problem", "solution", "progress", "doubts"]),
  grade: z.enum(["green", "yellow", "red"]),
  analysis: z.string().min(1),     // direct, PG-voice, no hedging
  sources: z.array(Source).min(0).max(2),
});

export const NextStep = z.object({
  text: z.string().min(1),         // concrete experiment, e.g. "Talk to 10 X by Friday"
  why:  z.string().min(1),         // what it tests / de-risks
});

export const AnalyzerOutput = z.object({
  verdict: Verdict,
  conviction: z.number().int().min(0).max(100),  // strength of the case to proceed
  headline: z.string().min(1).max(280),          // one PG-style sentence — the call
  sections: z.array(Section).length(4),
  comparables: z.array(z.object({                 // real YC peers (from companies.json)
    name: z.string(), outcome: z.string(), lesson: z.string(), url: z.string(),
  })).max(3),
  next_steps: z.array(NextStep).min(1).max(3),
});
```

---

## 8. The analyzer pipeline (`server/index.ts` + `src/lib/prompts.ts`)

Three steps, mirroring v1's proven two-phase + retrieval design but simplified.

### 8.1 Step 1 — Diagnose (cheap Claude call)

System prompt = the three-lens doctrine (concise version of `content/principles/*`). User prompt = the four fields. Ask for a small JSON object:

```json
{
  "shape": "one-line structural description of the company",
  "load_bearing_risk": "the single biggest risk in one phrase",
  "inferred_stage": "idea | building | launched",
  "keywords": ["6-10 kebab-case retrieval keywords"]
}
```

Use `keywords` + the raw fields to drive BM25 (§6).

### 8.2 Step 2 — Retrieve (local, §6)

Assemble a **SOURCES block** (principles always first, then top essay/lecture chunks) and a **COMPANIES block** (top company records). Each entry labelled with its title + url so the model can cite exactly.

### 8.3 Step 3 — Grade + verdict (main Claude call)

System prompt rules (port from v1's grader, adapted):
1. **Use ONLY the SOURCES and COMPANIES blocks.** No outside knowledge, no generic advice.
2. **Every `quote` must appear VERBATIM in a SOURCE.** If no verbatim sentence supports a point, return that section with `sources: []` and say so — better no quote than a fabricated one.
3. **Apply all three lenses** (PG demand, Thiel structure, Cosgrave base-rates). Most ideas fail at least one — name which.
4. **Voice:** direct, concrete, no hedging. No "consider", "you might want to", "it's worth noting."
5. **Grade each of the 4 sections** green/yellow/red against the doctrine.
6. **Verdict doctrine** (`verdict-doctrine.md`): frame every early-stage startup as an *experiment*. The bar for `go` is **not** "this will succeed" — it's "there's a cheap, fast experiment that would meaningfully reduce the load-bearing risk, and enough signal/conviction to justify running it." Return `go` with the experiment as `next_steps`. Return `reconsider` only when the core premise is structurally broken (no real demand, no possible moat, a fatal base-rate problem) **and** name *why*, concretely. Always end with what to do next — even a `reconsider` says what would change the answer.
7. `next_steps` must be concrete and time-boxed ("Talk to 10 [specific people] this week and ask [specific question]"), never vague ("validate the market").
8. `comparables` come only from the COMPANIES block; prefer including at least one relevant **failure**.
9. Output the JSON object only — no prose, no markdown fences.

Then in code: parse (strip fences defensively) → `AnalyzerOutput.safeParse` → run the **verbatim-quote check** (normalise both sides, substring match against the SOURCES haystack; carry over v1's `normalizeForQuoteCheck`) → if validation or the quote check fails, retry once with the failure appended to the system prompt ("PREVIOUS ATTEMPT FAILED: … Fix it."). Max 2 attempts, then surface a clear error.

---

## 9. Frontend (`src/`)

- **Form.tsx** — four labelled textareas (Problem, Solution, Progress, Doubts) + optional one-line idea. Friendly placeholder prompts under each (e.g. Problem: "What's the problem, and who has it badly enough to pay to fix it?"). Submit → `POST /api/analyze` → store result in `localStorage`.
- **Report.tsx** — render in this order:
  1. **VerdictBanner** — big `GO` / `RECONSIDER` with the `headline` and a conviction meter.
  2. **Per-section analysis** — four cards (green/yellow/red), each with the analysis text and its **SourceCard** quotes (quote + clickable source link).
  3. **Comparables** — real YC peers with outcome + lesson.
  4. **Next steps** — the 1–3 concrete experiments, each with its `why`.
- **storage.ts** — save/load runs to `localStorage`; an Export/Import JSON button so nothing is lost.
- Keep styling minimal and readable; this is a personal tool.

---

## 10. Build order (suggested)

1. **Skeleton** — Vite + React + TS app; local Node server with a stub `POST /api/analyze` returning canned JSON; wire the form to it end-to-end.
2. **Auth wrapper (`llm.ts`)** — get a real single-shot Claude completion through the **Agent SDK** on the subscription. Verify with a trivial "say hello" call. Add the startup assertion that `ANTHROPIC_API_KEY` is unset. **This is the riskiest piece — do it early.**
3. **Principles** — write `content/principles/*` (port v1's doctrine). These alone make the grader useful before any scraping.
4. **Scrapers + index** — `scrape-pg.ts`, `scrape-startup-school.ts`, `scrape-yc-companies.ts`, then `build-index.ts` → `content/index.json`.
5. **Retrieval (`retrieval.ts`)** — BM25; unit-test that a sample query returns sane chunks.
6. **Prompts + schema + pipeline** — implement diagnose → retrieve → grade with Zod + verbatim check + repair retry. Test with `scripts/test-analyze.ts` on a real idea.
7. **Report UI** — verdict banner, section cards, source cards, comparables, next steps.
8. **Polish** — localStorage export/import, error states, README with run instructions.

---

## 11. Acceptance criteria (definition of done)

- [ ] `npm run dev` starts the Vite app **and** the local server; submitting the 4-field form returns a real graded report.
- [ ] **No `ANTHROPIC_API_KEY` is used anywhere**; the server refuses to start if one is set. All LLM calls go through the Claude Code subscription via the Agent SDK.
- [ ] No external API keys of any kind (no Voyage, no API key). Retrieval is fully local.
- [ ] The brain under `content/` is human-readable and the `principles/` files are the editable core.
- [ ] Every `quote` in the output passes the verbatim check against the retrieved sources; fabricated quotes are rejected and repaired.
- [ ] Output always includes a single `go`/`reconsider` verdict, a headline, four graded sections with sources, real YC comparables (incl. at least one failure where relevant), and 1–3 concrete next experiments.
- [ ] The tool runs only locally and persists runs to `localStorage` with export/import.

---

## 12. Guiding principles (when in doubt)

1. **Subscription, never API key.** If a change would require an API key, it's the wrong change.
2. **Legible brain.** If you can't open a file and see what fuels a judgement, simplify until you can.
3. **Ground every claim.** No source = no answer. Sycophancy is the enemy.
4. **Investor framing.** Startups are experiments. The job is to either green-light a cheap experiment with conviction, or explain concretely why the premise is broken — and always say what to do next.
5. **Simplest inputs, richest output.** Four fields in; a sourced, decisive, actionable report out.

---

## 13. Open questions (decide as they arise, don't block)

- Exact canonical list of PG essays + Startup School lectures (start from `paulgraham.com/articles.html` and the Startup School curriculum; ~30 + ~12).
- Whether to include the *full* `principles/` plus retrieved chunks every time, or cap total context — with `claude-opus-4-8`'s 1M window this likely isn't a constraint; measure with `count_tokens` if needed.
- Exact Claude Agent SDK message/option binding names — **verify against the SDK docs/repo at build time** (`@anthropic-ai/claude-agent-sdk`); do not guess.
- Whether `reconsider` should also suggest the *nearest adjacent idea* worth pursuing, or just explain the break. (Lean: explain the break + name what would change the answer.)
```
