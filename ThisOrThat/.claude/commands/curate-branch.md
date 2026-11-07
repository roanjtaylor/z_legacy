---
description: Curate (or resume curating) all pending items in a branch using Claude as the image judge. Usage: /curate-branch <branch> [--only id,id]
---

# /curate-branch <branch> [--only id,id]

Orchestrate curation of a whole branch. Resumable and idempotent: it only works on items
that aren't done yet, so re-running after an interruption picks up where it left off.

## Procedure

1. **Locate the brief.** Confirm `data/branches/<branch>/brief.json` exists. If not, tell
   the user to run `/new-branch <branch>` first and stop.

2. **Compute the work list.**
   ```
   npm run curate:report --silent <branch> --json
   ```
   This returns `{pending, done, flagged}`. Work the `pending` set (or the intersection
   with `--only` ids if given). `done` items are skipped automatically. Report how many
   are pending before starting.

3. **Curate each pending item** by following the `curate-item` skill (search → prepare →
   Read & judge → decision → commit). Work through items one at a time, or for large
   briefs dispatch parallel subagents — but cap concurrency at ~4 and keep each item's
   network calls serial, because Wikimedia rate-limits bursts. Each subagent handles one
   item end-to-end via the curate-item skill.

4. **Summarise.** Re-run `npm run curate:report --silent <branch>` and report:
   - how many are now done,
   - which items are flagged (and why) — tell the user to review them at `/review/<branch>`
     in the app (Phase 5) or to re-run `/curate-branch <branch> --only <ids>` after editing
     the brief.

## Tips
- Always run network steps serially per item; parallelism comes from running different
  items concurrently, not from bursting requests for one item.
- If many items in a branch come back with NO VALID CANDIDATES, the brief's
  `searchTemplates` or `rubric.minLongEdgePx` may be too strict — adjust the brief and rerun.
