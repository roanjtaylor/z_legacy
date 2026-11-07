---
name: taste-trainer-direction
description: What the CarPicker/taste-trainer app is for and where it's headed
metadata:
  type: project
---

This repo (package name `taste-trainer`) is an **internal, not-deployed** tool to develop the user's visual taste across many domains (cars, watches, → jets, art, websites, …), inspired by the Steve Jobs "expose yourself to the best, internalize why" philosophy (see `taste.md` / `taste-synthesis.md`). The point is to leverage AI to build datasets and taste-developing experiences quickly and excellently — fun to browse, useful for forming design opinions.

Architecture: AI **curation pipeline** (briefs + rubric + Claude-as-judge skills `/new-branch`, `/curate-branch`, `scripts/curate/*`) → `public/branches/<b>/{branch.json, items.json, images}`; a React **selection app** (ELO/heats → taste profile).

Established model (2026-06): selection has two **independent axes** — Mode {`elo` ranking, `tournament` one-winner} × View {`pair` 1v1, `quad` 4-up}. No "cull worst" mode, multi-card is fixed at 4. Bracket is a group-size **heats** engine (`src/lib/heats.ts`), not the old binary tournament.

Every pick is logged as a **Judgment** (focus beats others + optional critique-chip reasons) to `data/judgments/<b>.jsonl` via a dev-only Vite endpoint. This log is the substrate for planned next slices: a **dual taste profile** (what the eye seeks vs rejects) and a **curation loop** where curation reads accumulated taste to propose the next batch.

Dataset console (dev-only): Home → "Datasets" → `/datasets` (overview + new-branch) and `/datasets/:branch` (brief editor, status, add/remove items, surfaced `/curate-branch` command), backed by the `__dataset` dev API. Actual image fetching still runs through the Claude skill, not the browser.

**Why:** keeps cross-session context on intent and the agreed UX model. **How to apply:** build on the judgment log + heats/elo engines; don't reintroduce cull or per-screen size options without the user asking.
