# YC Idea Grader

A private, local-only tool that grades a startup idea the way Y Combinator would.
You enter four plain inputs — **Problem, Solution, Progress, Doubts** — and it
returns a sourced analysis and a decisive verdict (`go` / `explore` / `reconsider`),
grounded in a legible local "brain" of Paul Graham essays, YC Startup School
lectures, and real YC company histories (wins *and* failures).

It runs **only on your machine** and uses your **Claude Code subscription** via the
Claude Agent SDK — **no API key, nothing published.**

## How it works

```
4-field form ──> POST /api/analyze (local Node server :8787)
                   1. DIAGNOSE   cheap Claude call → shape, load-bearing risk, keywords
                   2. RETRIEVE   local BM25 over content/index.json + always-on principles
                   3. GRADE      Claude call → strict JSON → Zod + verbatim-quote check → repair retry
```

- **The brain** lives under `content/` as readable markdown you can edit:
  - `content/principles/*.md` — the always-on doctrine (PG demand, Thiel market
    structure, base rates, the verdict rules). **This is the main lever for tuning
    the grader.**
  - `content/pg-essays/*.md` — all ~230 Paul Graham essays (scraped).
  - `content/startup-school/*.md` — the full "How to Start a Startup" (CS183B) lectures.
  - `content/yc-companies/companies.json` — ~20 curated YC companies, successes and failures.
- **Retrieval is local BM25** (pure TypeScript). No embeddings, no external service.
- **Every quote is checked** against the retrieved sources; fabricated quotes are
  rejected and the model is asked to repair.

## Prerequisites

1. **Claude Code installed and logged in on your subscription** (`claude`, then
   `/login` → choose your subscription account).
2. **`ANTHROPIC_API_KEY` must be UNSET.** A stray key would silently bill the paid
   API instead of your subscription — so the server refuses to start if one is set.

## Setup

```bash
npm install

# Build the brain (one-time; commit the outputs):
npm run scrape:pg        # ~230 PG essays  -> content/pg-essays/
npm run scrape:ss        # CS183B lectures -> content/startup-school/
npm run build:index      # chunk everything -> content/index.json

# Sanity checks (no LLM):
npm run test:retrieval
npx tsx scripts/test-verbatim.ts

# Full pipeline check (calls Claude twice):
npm run test:analyze
```

## Run

```bash
npm run dev      # Vite UI on :5173  +  grader server on :8787
```

Open http://localhost:5173, fill in the four fields, and grade your idea. Runs are
saved to `localStorage`; use Export / Import to back them up.

## Config

- `GRADER_MODEL` — override the model (default `claude-opus-4-8`; try
  `claude-sonnet-4-6` for speed). See `.env.example`.
- `PORT` — server port (default `8787`).

## Tuning the grader

Edit `content/principles/*.md` — these files are injected verbatim into every grade
and define how the tool thinks. To grow the corpus, drop more markdown into
`content/pg-essays` or `content/startup-school`, add records to
`companies.json`, and re-run `npm run build:index`.
