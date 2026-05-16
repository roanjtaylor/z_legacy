# `/data` — Schemas

This directory is the **hand-curated knowledge base** for `career-mapper`. Each file is git-versioned and citable. The Next.js app reads from here at build/runtime.

## Files
- `/data/people/<id>.json` — one role model or cautionary case per file
- `/data/companies/<id>.json` — (v0.2) one company / job archetype per file
- `/data/me.json` — Roan's profile, kept in sync with `plan.md` §1 and §6

## Archetype enum

Every `careerStep` carries one of:

| Archetype | Meaning |
|---|---|
| `Student` | Formal education — school, undergrad, master's, PhD |
| `Builder` | Engineer / IC role at a company, including consulting and freelance technical work |
| `Hustler` | VC, investing, deal-driven, BD, sales-led, accelerator-side |
| `Founder` | Building one's own company as CEO/co-founder |
| `Investor` | Full-time investor (VC partner, angel as primary income, fund manager) |
| `Operator` | Senior exec at a company they didn't found (CEO, COO, President) |
| `Other` | None of the above (writer, academic, gap, etc.) — use sparingly |

The **visualization lanes are exactly these archetypes** in this order (top → bottom: Investor, Operator, Founder, Hustler, Builder, Student).

## Tier enum

| Tier | Meaning | Visual treatment |
|---|---|---|
| `tier1-admired` | Proven paths Roan wants to decode and learn from | Solid line, prominent |
| `tier2-cautionary` | Lucky outliers — do NOT pattern-match | Dashed line, muted, with warning glyph |
| `adjacent-benchmark` | Different model (e.g. elite commodity trader friend) — useful as comparison | Dotted line, distinct color |

## Era enum (for the era ribbon)

| Era | Years | Defining shift |
|---|---|---|
| `pre-pc` | <1980 | Mainframe / industrial |
| `pc` | 1980–1994 | Personal computer + early software |
| `web` | 1995–2006 | The Web, dot-com boom, early SaaS |
| `mobile-cloud` | 2007–2018 | iPhone + AWS — mobile-first + cloud-native |
| `ai-revolution` | 2019–present | Transformers → GPT → frontier AI labs |

The visualization renders eras as a horizontal ribbon under the timeline so you can see *which era a career step happened in*. **NOW** is marked at 2026-05-16.

## Person schema (canonical)

```jsonc
{
  "id": "kebab-case-matching-filename",
  "name": "Display Name",
  "birthYear": 1964,              // number | null
  "countryOfOrigin": "England",
  "currentCountry": "England",    // optional
  "tier": "tier1-admired",        // tier1-admired | tier2-cautionary | adjacent-benchmark
  "archetypeArc": ["Student", "Founder", "Investor"],   // ordered phases
  "confidence": "high",           // high | medium | low — how trustworthy the structured data is

  "education": [
    {
      "school": "Cornell University",
      "degree": "BA Philosophy",
      "startYear": 1982,
      "endYear": 1986,
      "notes": null
    }
  ],

  "careerSteps": [
    // ORDERED CHRONOLOGICALLY. This is what the visualization plots.
    {
      "role": "Co-founder & CEO",
      "company": "Viaweb",
      "archetype": "Founder",
      "startYear": 1995,
      "endYear": 1998,            // null if open-ended
      "estAgeStart": 30,          // derived from startYear - birthYear, but stored for null-birth-year cases
      "estAgeEnd": 33,
      "estCompUsd": null,         // number | [low, high] | null
      "estCompConfidence": "low", // high | medium | low
      "keyDecisions": ["..."],
      "lessons": ["..."],
      "notes": "..."
    }
  ],

  "outcomes": {
    "estNetWorthUsd": "100M+",    // null | exact number | bucket "<1M" | "1-10M" | "10-100M" | "100M+" | "1B+"
    "exitEvents": [
      { "type": "acquisition", "year": 1998, "valueUsd": 49000000, "notes": "..." }
    ],
    "currentStatus": "..."
  },

  "lessons": [
    { "lesson": "...", "source": "..." }
  ],

  "sources": [
    { "title": "...", "url": "...", "type": "article" }   // type: article | book | interview | podcast | biography | other
  ],

  "notes": "Free-text caveats, weighting guidance, era context."
}
```

## How to use this corpus

- The Next.js app reads all `/data/people/*.json` at runtime (or build).
- Visualization: each person's `careerSteps[]` becomes a polyline through (age, archetype) space.
- Detail panel: shows `lessons`, `sources`, `outcomes`, `notes`.
- Claude RAG context: the full JSON for relevant people is embedded in prompts (the `confidence` and `notes` fields let Claude reason about uncertainty).

## Filling in gaps

- **PRIORITY for v0.2 on-demand researcher:** any person with `confidence: "low"` or `confidence: "medium"`. Use Claude with web search to enrich, then human-review before accepting into the corpus.
- Stubs are explicitly OK — better to have the structural slot with `null` fields than to omit the person entirely.
