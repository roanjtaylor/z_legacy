---
name: curate-item
description: Curate the best licensed image for ONE item in a branch — search, download candidates, visually judge them, and commit the pick into the repo. Used per-item by /curate-branch.
---

# curate-item

Curate one item end-to-end. You (Claude) are the visual judge — the scripts only do
plumbing. Everything runs on the Claude Code subscription; no paid image API is used.

Inputs you need: `<branch>`, `<itemId>`, and the item's brief entry (id, name, maker,
year, searchHints) plus the branch `rubric` from `data/branches/<branch>/brief.json`.

## Steps

1. **Gather candidates (Wikimedia first).** Run the Commons search helper with 1–3
   queries built from the item (and `brief.searchTemplates`):
   ```
   npm run curate:search --silent <branch> <itemId> "<maker> <name>" 10
   ```
   It writes/merges `data/.tmp/<branch>/<itemId>/urls.json` with image URLs AND captures
   each file's license up front. If Commons is thin, add a different query, or hand-append
   `{imageUrl, sourceUrl, license}` entries to `urls.json` from `WebSearch`/`WebFetch`
   results (manufacturer press galleries, Unsplash). Run searches SERIALLY (Wikimedia
   rate-limits concurrent requests).

2. **Download + validate.**
   ```
   npm run curate:prepare --silent <branch> <itemId>
   ```
   Downloads each URL, drops non-images / too-small / duplicates, and prints a numbered
   list of valid candidates with their temp paths. If it prints NO VALID CANDIDATES, go
   back to step 1 with new queries; after two empty rounds, flag the item (step 4, null).

3. **Judge (look at them).** `Read` each candidate file listed in the manifest. Score
   against the branch `rubric`:
   - Correct **make / model / generation / year**? Reject look-alikes (e.g. a 991 when you
     need a 964). This is the most common mistake — verify generation cues.
   - Matches `rubric.requiredView` (e.g. clean side or 3/4 showing the whole object)?
   - Sharp, high-res, real photograph — not a render/CGI/toy/diecast/illustration?
   - No heavy watermark/dealer text/logo overlay; background not dominated by people or
     other items; the item is the clear subject?
   Pick the single best candidate index, or `null` if none qualify.

4. **Decide.** Use the helper, which pulls the chosen candidate's resolved license from
   the manifest automatically — call it via `npx tsx` (NOT `npm run`, which swallows
   `--`-prefixed flags like `--flag`):
   ```
   npx tsx scripts/curate/decide.ts <branch> <itemId> <chosenIndex|null> <confidence> <score> [--flag "reason"]
   ```
   - `confidence: high` → auto-accept (no `--flag`). Pass `--flag "reason"` (and usually
     `medium`/`low`) when the best option only just passes, the generation is uncertain,
     the background is busy, or the license came back `unknown`. Aim for ~10% flagged
     overall — flag when genuinely unsure, don't rubber-stamp.
   - `chosenIndex: null` → always flagged (no acceptable image; Review UI surfaces it).
   - If a flagged pick later needs different candidates, re-run from step 1 — note the
     temp dir (and its manifest) is deleted after a NON-flagged commit, so you cannot
     re-decide a cleaned item without re-preparing.
   - Prefer a targeted re-search over flagging when the brief's intent is recoverable
     (e.g. searching "split window coupe" specifically) — flag only when no good image exists.

5. **Commit.**
   ```
   npm run curate:commit --silent <branch> <itemId>
   ```
   Re-encodes the image into `public/branches/<branch>/images/<id>.jpg`, makes a WebP
   thumb, upserts the record into `items.json`, appends the audit log, and (for non-flagged
   picks) cleans the temp dir. Idempotent — safe to re-run.

## Notes
- Prefer Wikimedia Commons: high-res, hotlinkable, explicit licenses captured automatically.
- Never invent image URLs — only use ones returned by search/fetch that actually download.
- Keep the item the clear subject; a slightly less "perfect" angle with a clean background
  usually beats a hero angle in a cluttered show hall.
