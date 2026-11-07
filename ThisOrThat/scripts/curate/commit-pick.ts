// commit-pick.ts <branch> <itemId>
//
// Reads data/.tmp/<branch>/<itemId>/decision.json (a PickDecision) plus the manifest,
// then materialises the result: re-encodes the chosen image into the repo, generates a
// thumbnail, and upserts the Item record into public/branches/<branch>/items.json.
//
// Idempotent: re-running overwrites the same files deterministically.

import fs from 'node:fs';
import {
  appendLog,
  loadBrief,
  readJson,
  upsertItem,
} from './lib/io.ts';
import { writeFullImage, writeThumb } from './lib/image.ts';
import {
  decisionPath,
  imageWebPath,
  imagesDir,
  manifestPath,
  thumbWebPath,
  thumbsDir,
  tmpItemDir,
} from './lib/paths.ts';
import path from 'node:path';
import type { CandidateManifest, Curation, Item, PickDecision } from './lib/types.ts';

const MODEL = process.env.CURATION_MODEL || 'claude-opus-4-8';

async function main() {
  const [branch, itemId] = process.argv.slice(2);
  if (!branch || !itemId) {
    console.error('Usage: commit-pick.ts <branch> <itemId>');
    process.exit(2);
  }

  const decision = readJson<PickDecision>(decisionPath(branch, itemId));
  if (!decision) {
    console.error(`No decision.json found at ${decisionPath(branch, itemId)}`);
    process.exit(2);
  }

  const brief = loadBrief(branch);
  const briefItem = brief.items.find((i) => i.id === itemId);
  if (!briefItem) {
    console.error(`Item "${itemId}" is not in the brief for branch "${branch}".`);
    process.exit(2);
  }

  const manifest = readJson<CandidateManifest>(manifestPath(branch, itemId));
  const ts = new Date().toISOString();

  const curation: Curation = {
    confidence: decision.confidence,
    flagged: decision.flagged,
    flagReason: decision.flagReason,
    model: MODEL,
    judgedAt: ts,
    candidatesConsidered: manifest?.candidates.length ?? 0,
    score: decision.score,
  };

  // No acceptable candidate: record the item as flagged with no image so the
  // Review UI surfaces it. Do not write image files.
  if (decision.chosenIndex === null) {
    upsertItem(branch, {
      id: briefItem.id,
      branch,
      name: briefItem.name,
      maker: briefItem.maker,
      year: briefItem.year,
      imageUrl: '',
      thumbUrl: '',
      license: decision.license,
      tags: briefItem.tags,
      facts: briefItem.facts,
      curation: { ...curation, flagged: true, flagReason: curation.flagReason || 'no acceptable image found' },
    });
    appendLog(branch, { itemId, ts, action: 'skipped', detail: 'no acceptable candidate', decision });
    console.log(`Skipped "${itemId}" — flagged, no image saved.`);
    return;
  }

  const chosen = manifest?.candidates.find((c) => c.index === decision.chosenIndex);
  if (!chosen) {
    console.error(`chosenIndex ${decision.chosenIndex} not found in manifest for "${itemId}".`);
    process.exit(2);
  }

  const imgFile = path.join(imagesDir(branch), `${itemId}.jpg`);
  const thumbFile = path.join(thumbsDir(branch), `${itemId}.webp`);
  await writeFullImage(chosen.tempPath, imgFile);
  await writeThumb(chosen.tempPath, thumbFile);

  const item: Item = {
    id: briefItem.id,
    branch,
    name: briefItem.name,
    maker: briefItem.maker,
    year: briefItem.year,
    imageUrl: imageWebPath(branch, itemId),
    thumbUrl: thumbWebPath(branch, itemId),
    license: decision.license,
    tags: briefItem.tags,
    facts: briefItem.facts,
    curation,
  };
  upsertItem(branch, item);
  appendLog(branch, { itemId, ts, action: 'committed', detail: `chose candidate #${decision.chosenIndex}`, decision });

  // Clean temp working dir on a clean (non-flagged) accept; keep it for flagged
  // items so the Review UI could offer the other candidates later.
  if (!decision.flagged) {
    fs.rmSync(tmpItemDir(branch, itemId), { recursive: true, force: true });
  }

  console.log(
    `Committed "${itemId}" → ${imageWebPath(branch, itemId)} ` +
      `(confidence: ${decision.confidence}${decision.flagged ? ', FLAGGED' : ''})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
