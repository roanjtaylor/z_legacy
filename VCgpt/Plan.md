# VCGPT — The AI That Replaces Venture Capitalists

## Core Concept

VCGPT is a founder preparation tool disguised as a joke about replacing VCs with AI. It pressure-tests startup ideas the way a real investor would — asking the hard foundational questions that founders typically have weak answers to, then scoring their readiness and telling them exactly what to fix before approaching real investors.

The joke is the wrapper. The value is real: founders get a brutal, honest, commercially rigorous stress-test of their idea in minutes — complete with a readiness checklist, a score, and (if they're good enough) a mock term sheet.

**Audience:** Founders & VCs at a live startup event (Founders vs VCs build challenge).
**Timeline:** 2-hour sprint. Ship working reasoning first. Intelligence > polish.
**Punchline:** "We've replaced the first six months of fundraising with an AI that asks better questions than your investors do."

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js (App Router) | JavaScript (NOT TypeScript) |
| Styling | Tailwind CSS | Terminal/hacker aesthetic — dark bg, green/amber monospace text |
| AI | Claude API (Anthropic SDK) | `@anthropic-ai/sdk` — streaming responses |
| Deployment | Vercel | Connect repo, deploy |
| State | React useState only | No external state libraries |

### Prerequisites
- Anthropic API key (set in `.env.local` as `ANTHROPIC_API_KEY`)
- Node.js installed
- Vercel account for deployment

---

## Project Structure

```
/
├── app/
│   ├── layout.js          # Root layout — global styles, fonts
│   ├── page.js            # Single page: input form + streaming output
│   ├── globals.css         # Tailwind + terminal theme overrides
│   └── api/
│       └── analyse/
│           └── route.js    # Single API route — two Claude calls, streamed response
├── data/
│   └── portfolio.js        # Sure Valley portfolio memory (exported array)
├── components/
│   ├── PitchForm.js        # Input form with structured fields + example buttons
│   └── AnalysisOutput.js   # Streaming markdown renderer
├── .env.local              # ANTHROPIC_API_KEY=sk-ant-...
├── package.json
├── tailwind.config.js
└── next.config.js
```

---

## UI Design — Terminal/Hacker Aesthetic

### Visual Rules
- **Background:** Near-black (`#0a0a0a`)
- **Primary text:** Green monospace (`#00ff41`, font-family: 'JetBrains Mono' or 'Fira Code' via Google Fonts, fallback to monospace)
- **Secondary text:** Amber (`#ffb000`)
- **Accent/borders:** Dim green (`#003b00`)
- **Verdict colours:** PASS = red (`#ff0040`), CONDITIONAL = amber (`#ffb000`), INVEST = bright green (`#00ff41`)
- **No rounded corners** — sharp edges, 1px borders
- **Scanline effect** (optional CSS) for extra flavour
- **Header:** `> VCGPT v1.0 — SURE VALLEY VENTURES INVESTMENT ENGINE` in terminal style

### Layout (Single Page)
```
┌──────────────────────────────────────────────────┐
│ > VCGPT v1.0 — SURE VALLEY VENTURES              │
│   AI INVESTMENT ENGINE                            │
│   "Replacing VCs, one founder at a time."         │
├──────────────────────────────────────────────────┤
│                                                    │
│  [Demo: Squadova] [Example: Bad] [Example: Strong] │
│                                                    │
│  > STARTUP IDEA: ________________________________ │
│  > TARGET CUSTOMER: _____________________________ │
│  > REVENUE MODEL: _______________________________ │
│  > WHY NOW: _____________________________________ │
│                                                    │
│  [ >> SUBMIT FOR ANALYSIS ]                       │
│                                                    │
├──────────────────────────────────────────────────┤
│                                                    │
│  > ANALYSING PITCH... ██████████░░░░░░░           │
│                                                    │
│  (Streaming markdown output appears here)         │
│                                                    │
│  ## INVESTMENT MEMO                                │
│  ## PORTFOLIO PATTERN MATCH                        │
│  ## WHERE THIS BREAKS                              │
│  ## SCORECARD                                      │
│  ## THE HARD QUESTIONS                             │
│  ## BEFORE YOU TALK TO INVESTORS — FIX THESE       │
│  ## 30-DAY KILL TEST                               │
│  ## VERDICT                                        │
│  ## TERM SHEET (if earned)                         │
│                                                    │
└──────────────────────────────────────────────────┘
```

---

## Pre-loaded Example Pitches (3 buttons)

### Demo: Squadova (primary demo button — for live presentation)
```
Startup Idea: Squadova is an online platform to turn real life football into a videogame by connecting players together to form full teams. It provides a booking system for pitches and a social platform for players. It handles all the admin behind recreational football — for pitches (invoices, closures, bookings) and players (team organisation, payment handling, booking details).
Target Customer: Football pitches (as venue partners) and recreational football players who play 5-a-side and similar formats.
Revenue Model: 5% commission on bookings through the system (e.g. typical 5-a-side pitch charges £50, Squadova gets £2.50 per booking). Subscription tier for pitches once the player connection layer is proven.
Why Now: Booking systems for pitches are outdated and fragmented. Social leagues are overpriced and inflexible. An all-in-one solution that combines player availability to form full teams removes the admin from everyone's football experience.
```

### Example: Bad Idea — "AI for Dog Horoscopes"
```
Startup Idea: An AI that generates daily horoscopes for dogs based on their breed and birthday
Target Customer: Dog owners aged 25-40
Revenue Model: Premium subscription $4.99/month
Why Now: AI is trending and people love their dogs
```

### Example: Strong Idea — "AI Compliance Engine for Financial Services"
```
Startup Idea: An AI platform that continuously monitors regulatory changes across jurisdictions and auto-updates compliance documentation for financial institutions
Target Customer: Compliance teams at banks and fintech companies
Revenue Model: Enterprise SaaS — £50k-200k/year contracts
Why Now: Regulatory complexity is accelerating post-AI, compliance teams are understaffed, and manual monitoring is failing
```

---

## API Architecture — `/app/api/analyse/route.js`

Single POST endpoint. Two sequential Claude calls. Second call streams to client.

### Step 1 — Assumption Extraction (non-streaming)

**Claude call #1** — fast, structured extraction.

**System prompt:**
```
You are a startup analyst. Extract the core assumptions from this pitch.
Return ONLY valid JSON, no markdown, no explanation.
```

**User message:** The four form fields concatenated.

**Expected JSON response:**
```json
{
  "target_customer": "...",
  "core_problem": "...",
  "revenue_model": "...",
  "distribution_strategy": "...",
  "claimed_differentiation": "...",
  "key_assumptions": ["...", "...", "..."],
  "market_timing_claim": "..."
}
```

**Model:** `claude-sonnet-4-20250514` (fast, cheap — this is just extraction)

### Step 2 — Investment Decision + Founder Readiness (streaming)

**Claude call #2** — the main analysis. Stream this to the client.

**System prompt:** (see Full System Prompt section below)

**User message includes:**
- Original pitch (all 4 fields)
- Extracted assumptions JSON from Step 1
- Full portfolio memory JSON from `/data/portfolio.js`

**Model:** `claude-sonnet-4-20250514` (good balance of speed + quality for hackathon)

**Streaming:** Use the Anthropic SDK's streaming mode. Pipe `text` delta events to the client as a `ReadableStream` with `Content-Type: text/plain; charset=utf-8`.

### Client-side streaming
In `page.js`, use `fetch` with the response body as a `ReadableStream`. Read chunks with a `TextDecoder` and append to state. Render with a markdown renderer (e.g., `react-markdown`).

---

## Full System Prompt for Step 2

```
You are VCGPT — an AI that replaces venture capitalists. You exist to give founders the brutal, honest pressure-test that most investors are too polite (or too busy) to give.

You are modelled on the investment style of Sure Valley Ventures, an entrepreneur-led VC firm that has backed 27+ AI companies across the UK and Ireland since 2017. You have their portfolio memory and investment patterns.

YOUR PURPOSE:
You help founders face the hard foundational questions they typically have weak answers to:
- Why are you building this?
- What is actually defensible about it?
- How big can this really get?
- Who pays, and why would they switch from what they use today?
- What has to be true for this to work?

You are a founder preparation tool. Your job is to make founders READY for real investor conversations by exposing every weakness in their thinking before a real VC does. If they can survive your analysis, they can survive a real pitch.

THE JOKE: You are literally replacing VCs with AI. If the idea is good enough, you issue a mock term sheet. If it's not, you tell them exactly what to fix first. Either way, the founder walks away better prepared than after most real investor meetings.

YOUR INVESTMENT THESIS (Sure Valley Ventures style):
- Early-stage software companies (Seed to Series A), with a focus on AI but open to strong non-AI software plays
- You value: distribution advantage, urgency of problem, defensibility, vertical focus, clear monetisation, founder-market fit
- You dislike: "AI for X" with no moat, vague TAM claims, consumer plays without willingness to pay, feature companies pretending to be platforms, marketplaces with no path to liquidity, solutions looking for problems
- You are backed by British Business Bank, Enterprise Ireland, and Tech Nation

YOUR TONE:
- Sharp. Direct. Dry humour. Commercially rigorous
- Slightly sarcastic but ALWAYS fair
- Never childish. Never mean without justification
- You respect founders who have done the work
- You're harder on founders who haven't thought things through — because that's what helps them
- Occasional VC in-jokes are welcome ("your TAM slide is doing a lot of heavy lifting here")

You will be given:
1. A startup pitch (idea, target customer, revenue model, why now)
2. Extracted assumptions from that pitch
3. Portfolio memory (real Sure Valley Ventures investments)

You must produce a structured analysis in this EXACT markdown format:

---

## INVESTMENT MEMO

[2-3 paragraph analysis of the pitch. What's the actual thesis here? What would need to be true for this to work? What's the bull case and the bear case? Be specific to THIS idea — no generic startup advice.]

## PORTFOLIO PATTERN MATCH

[Compare this startup to 2-3 relevant companies from the portfolio memory provided. Highlight similarities AND dangerous differences. Be specific about which portfolio companies and why they're relevant comparisons. If the startup is outside SVV's typical thesis, say so explicitly.]

## WHERE THIS BREAKS

[3-5 bullet points identifying structural weaknesses, dangerous assumptions, or market risks. These should be the things that would keep an investor up at night. Be brutal but fair — each point should be specific and actionable, not generic.]

## SCORECARD

| Category | Score (/20) | Comment |
|----------|-------------|---------|
| Problem Urgency | X | [Is this a painkiller or a vitamin?] |
| Market Size & Timing | X | [How big can this actually get? Is the timing right?] |
| Defensibility & Moat | X | [What stops someone copying this tomorrow?] |
| Monetisation Clarity | X | [Is the business model proven? Unit economics?] |
| Founder-Market Fit & Execution | X | [Can this team actually pull this off?] |

**OVERALL SCORE: [sum]/100**

> "[One dramatic interpretation line — e.g. 'Compelling narrative. Commercial validation pending.' or 'This is a feature, not a company.' or 'Strong bones. Needs muscle.']"

## THE HARD QUESTIONS

[5 sharp, specific questions that a real investor would ask in a pitch meeting. These should be the questions founders typically fumble. Not generic — tailored to THIS specific pitch. These are the questions the founder needs to have bulletproof answers to before walking into a real investor meeting.]

## BEFORE YOU TALK TO INVESTORS — FIX THESE

[A concrete checklist of 3-5 things the founder MUST address before they are ready to raise money. Be specific:
- What evidence do they need to gather?
- What assumptions need to be validated?
- What part of their pitch needs to be reworked?
- What metrics do they need to hit first?
Each item should be actionable and measurable. This is the most valuable section — it's the founder's roadmap to investor-readiness.]

## 30-DAY KILL TEST

[5 concrete, actionable validation steps the founder should complete in 30 days to prove or kill this idea. Be specific — named tools, exact experiments, measurable outcomes. If they can't pass these tests, they should pivot.]

## VERDICT

[One of: **PASS**, **CONDITIONAL**, or **INVEST**]

Scoring thresholds:
- 0-59 → PASS (with a sharp one-liner explaining why, plus "Come back when you've [specific thing]")
- 60-74 → CONDITIONAL (with 2-3 specific conditions that would change the verdict to INVEST)
- 75+ → INVEST (with clear conviction statement about why this is worth backing)

[If INVEST, also include:]

## TERM SHEET

**Sure Valley Ventures — Indicative Term Sheet**
*Generated by VCGPT — The AI That Replaced Your Investors*

| Term | Detail |
|------|--------|
| Company | [name from pitch] |
| Round | Pre-Seed / Seed |
| Investment Amount | £[amount] |
| Pre-Money Valuation | £[amount] |
| Equity | [X]% |
| Instrument | [SAFE / Convertible / Priced Round] |
| Key Conditions | [2-3 conditions] |
| Partner Concerns | [1-2 honest concerns even with an INVEST verdict] |

*This is a non-binding indicative term sheet generated by VCGPT for demonstration purposes. But honestly, it's probably more transparent than most real term sheets.*

---

IMPORTANT RULES:
- Follow the format EXACTLY. Do not skip sections.
- Score honestly. Most ideas should score 40-65. Only truly exceptional ideas score 75+. Be realistic.
- The portfolio pattern match MUST reference specific companies from the portfolio memory provided.
- Be specific, not generic. Reference the actual pitch details throughout.
- The "BEFORE YOU TALK TO INVESTORS" section is the most important — this is where real value is delivered. Make it actionable.
- The term sheet should only appear if the verdict is INVEST.
- Remember: you're helping founders get ready. Be hard on them because it helps them, not to be cruel.
```

---

## Portfolio Memory — `/data/portfolio.js`

Export a JS array with real Sure Valley Ventures portfolio companies:

```js
export const portfolio = [
  {
    name: "Getvisibility",
    sector: "Data Security / AI",
    description: "AI-powered data classification and security platform. Acquired by Forcepoint in 2025.",
    strengths: ["Clear enterprise buyer", "Regulatory tailwind (GDPR/data compliance)", "Sticky product once deployed", "Successful exit"],
    weaknesses: ["Crowded data security market", "Long enterprise sales cycles"],
    outcome: "EXIT — Acquired by Forcepoint (2025)"
  },
  {
    name: "Capably",
    sector: "AI / Automation",
    description: "Intelligent Automation Platform that helps businesses adopt AI to delegate work smarter.",
    strengths: ["Clear ROI proposition", "B2B focus", "Workflow automation has proven demand"],
    weaknesses: ["Competing with UiPath, Automation Anywhere at scale", "Needs to prove AI differentiation beyond RPA"],
    outcome: "Active — Growing"
  },
  {
    name: "Jentic",
    sector: "AI / Infrastructure",
    description: "AI middleware platform that helps developers connect AI agents to APIs safely, securely, and at scale.",
    strengths: ["Infrastructure play — picks and shovels", "Developer-focused", "API connectivity is a real bottleneck"],
    weaknesses: ["Middleware is hard to monetise at early stage", "Needs ecosystem adoption"],
    outcome: "Active — Early stage"
  },
  {
    name: "Vizgard",
    sector: "Defence Tech / AI",
    description: "Vendor-agnostic visual autonomy platform for UK defence, security, and resilience.",
    strengths: ["Government contracts provide revenue stability", "Defence tech has strong tailwinds", "High barrier to entry"],
    weaknesses: ["Slow procurement cycles", "Geographically constrained initially"],
    outcome: "Active — Growing"
  },
  {
    name: "Literal Labs",
    sector: "AI / Edge Computing",
    description: "Logic-based AI platform helping companies build energy-efficient models optimised for edge deployment.",
    strengths: ["Differentiated tech (logic-based vs neural)", "Edge AI is a growing need", "Energy efficiency is a selling point"],
    weaknesses: ["Niche positioning may limit TAM", "Requires technical buyers to understand the value"],
    outcome: "Active — Early stage"
  },
  {
    name: "Momntum",
    sector: "AI / Customer Service",
    description: "AI customer platform that helps businesses drive loyalty through real-time engagement and intelligent customer service.",
    strengths: ["Large addressable market", "Customer retention is a universal problem", "Real-time engagement is defensible"],
    weaknesses: ["Crowded CX space", "Consumer AI retention tools have high churn risk"],
    outcome: "Active — Growing"
  },
  {
    name: "Elelem",
    sector: "AI / Search Analytics",
    description: "Generative Search Analytics platform for how brands navigate the shift from traditional search to AI discovery.",
    strengths: ["Timely — AI search is disrupting SEO", "Clear pain point for marketing teams", "Novel category"],
    weaknesses: ["Market is still forming", "Dependency on AI search platforms (OpenAI, Google)"],
    outcome: "Active — Early stage"
  },
  {
    name: "Astut",
    sector: "AI / Crisis Management",
    description: "Oxford University AI spinout addressing crisis management where traditional AI fails due to a lack of historical data.",
    strengths: ["Strong academic pedigree", "Unique positioning (low-data AI)", "Government and enterprise buyers"],
    weaknesses: ["Crisis management is a niche market", "Hard to demonstrate ROI before a crisis happens"],
    outcome: "Active — Early stage"
  }
];
```

---

## Streaming Implementation Details

### API Route (`/app/api/analyse/route.js`)

```
1. Parse request body (idea, customer, revenue, whyNow)
2. Claude Call #1 — assumption extraction (await full response, non-streaming)
   - model: claude-sonnet-4-20250514
   - max_tokens: 1000
   - Parse JSON from response
3. Claude Call #2 — investment analysis (streaming)
   - model: claude-sonnet-4-20250514
   - max_tokens: 4000
   - stream: true
   - System prompt = full persona prompt above
   - User message = pitch + assumptions + portfolio JSON
4. Return a ReadableStream that pipes text deltas to the client
```

### Client Streaming (`page.js`)

```
1. fetch('/api/analyse', { method: 'POST', body: JSON.stringify(formData) })
2. Get reader from response.body.getReader()
3. Read chunks in a loop, decode with TextDecoder
4. Append each chunk to a state variable
5. Render state with react-markdown (install: react-markdown + remark-gfm for tables)
```

---

## Dependencies

```json
{
  "@anthropic-ai/sdk": "latest",
  "react-markdown": "latest",
  "remark-gfm": "latest"
}
```

Everything else comes with `create-next-app`.

---

## Constraints

- No authentication
- No database
- No chat history or persistence
- No vector databases
- No external APIs beyond Claude
- No TypeScript
- No complex state management
- No additional infrastructure
- JavaScript only
- Ship working reasoning first, polish second

---

## 120-Minute Execution Plan

| Time | Task | Details |
|------|------|---------|
| 0–10 min | Project setup | `npx create-next-app`, install deps, set up `.env.local`, configure Tailwind terminal theme |
| 10–25 min | Build UI | Single page with form, example pitch buttons (Squadova as primary), output area. Terminal aesthetic. |
| 25–35 min | Portfolio data | Create `/data/portfolio.js` with the 8 real SVV companies above |
| 35–55 min | API Step 1 | Implement assumption extraction Claude call in `/app/api/analyse/route.js` |
| 55–80 min | API Step 2 | Implement investment analysis streaming Claude call with full system prompt |
| 80–95 min | Wire streaming | Connect API streaming to frontend, render with react-markdown |
| 95–110 min | Polish | Verdict colours, score formatting, term sheet styling, loading states |
| 110–120 min | Test & demo prep | Test all 3 example pitches (especially Squadova), fix any issues, prepare demo script |

---

## Demo Script

1. Open app — terminal aesthetic loads, "The AI That Replaced Your Investors"
2. **Click "Demo: Squadova"** → Submit → Watch the AI grill a real startup live → Show the hard questions, the fix list, the readiness assessment
3. Click "Bad Idea" (Dog Horoscopes) → Submit → Watch it get roasted → PASS with a sharp "come back when..."
4. Optionally: invite audience member to pitch their idea live
5. Close with: **"We've replaced the first six months of fundraising. The AI asks better questions than your investors do."**

---

## Definition of Done

MVP is complete when:
- [ ] Founder can enter a structured pitch (4 fields)
- [ ] 3 example pitches can be loaded with one click (Squadova as primary demo)
- [ ] VCGPT analyses the pitch with streaming output
- [ ] Portfolio comparisons reference real SVV companies
- [ ] Score out of 100 is generated with breakdown
- [ ] "Before You Talk to Investors — Fix These" checklist appears with actionable items
- [ ] Verdict (PASS / CONDITIONAL / INVEST) appears clearly with colour
- [ ] Term sheet appears if verdict is INVEST
- [ ] Terminal/hacker aesthetic looks polished on screen
- [ ] Output feels like a genuinely useful founder preparation tool, not just a gimmick
- [ ] Works on Vercel deployment
