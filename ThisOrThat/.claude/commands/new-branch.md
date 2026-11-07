---
description: Scaffold a new taste-trainer branch — its display config and a curation brief (item list + judging rubric). Usage: /new-branch <branch-id>
---

# /new-branch <branch-id>

Create a new branch (a category of visually-designed things: watches, jets, ships, guns,
clothes, …). This produces two curator-owned files; it does NOT curate images (run
`/curate-branch <branch-id>` after).

## Steps

1. **Clarify the concept** with the user if unclear: the item noun (e.g. "watch"), the
   scope (e.g. "iconic dive watches 1953–today"), and which facts matter for filtering and
   for showing on cards. Pick sensible defaults and proceed rather than over-asking.

2. **Write `public/branches/<branch-id>/branch.json`** (the app reads this to render cards
   and filters generically — there must be NO per-branch component code):
   ```json
   {
     "id": "<branch-id>",
     "label": "Dive Watches",
     "tagline": "Find the dial your eye keeps returning to.",
     "status": "curating",
     "itemNoun": { "singular": "watch", "plural": "watches" },
     "titleTemplate": "${maker} ${name}",
     "cardFacts": [
       { "key": "caseMm", "label": "Case", "suffix": "mm", "format": "number" },
       { "key": "movement", "label": "Movement", "format": "text" }
     ],
     "filterFacets": [
       { "key": "year", "label": "Decade", "source": "fact", "type": "range", "bucket": { "size": 10, "suffix": "s" } },
       { "key": "country", "label": "Origin", "source": "fact", "type": "enum" },
       { "key": "tags", "label": "Style", "source": "tag", "type": "enum" }
     ]
   }
   ```
   `cardFacts` keys must exist in each item's `facts`. `filterFacets` read from `facts`
   (`source: "fact"`) or from the `tags[]` array (`source: "tag"`). Use `type: "range"`
   with `bucket` to derive decades from `year`.

3. **Write `data/branches/<branch-id>/brief.json`** — enumerate the canonical, highly-
   designed examples for this branch using your own knowledge + `WebSearch` to verify
   names/makers/years. Each item gets `id` (slug), `name`, `maker`, `year`, `facts` (must
   include the keys referenced by `cardFacts`/`filterFacets`), and `tags`. Set a
   branch-appropriate `rubric` (e.g. watches want a straight-on dial macro, not a 3/4) and
   `searchTemplates`. See `data/branches/cars/brief.json` for the shape. Aim for breadth
   and variety so the user has a rich taste space to sort.

4. **Register the branch**: add an entry to `public/registry.json`
   (`{ "id", "label", "status": "curating", "itemCount": 0 }`); the app lists branches from
   here. `itemCount` is refreshed as curation completes.

5. Tell the user to review/edit the brief, then run `/curate-branch <branch-id>`.
