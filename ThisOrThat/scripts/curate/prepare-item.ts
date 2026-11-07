// prepare-item.ts <branch> <itemId>
//
// Reads data/.tmp/<branch>/<itemId>/urls.json (a CandidateInput[]), downloads each
// candidate, validates it is a decodable image meeting the brief's min resolution,
// dedupes by content hash, and writes manifest.json. Pure plumbing — no judgment.
//
// The orchestrating Claude session then READs the candidate files listed in the
// manifest and decides which (if any) to keep.

import fs from 'node:fs';
import path from 'node:path';
import { loadBrief, readJson, writeJsonAtomic, appendLog, ensureDir } from './lib/io.ts';
import { curlDownload } from './lib/download.ts';
import { probeImage } from './lib/image.ts';
import { manifestPath, tmpItemDir, urlsPath } from './lib/paths.ts';
import type { Candidate, CandidateInput, CandidateManifest } from './lib/types.ts';

function extFor(format: string): string {
  if (format === 'jpeg') return 'jpg';
  return format;
}

async function main() {
  const [branch, itemId] = process.argv.slice(2);
  if (!branch || !itemId) {
    console.error('Usage: prepare-item.ts <branch> <itemId>');
    process.exit(2);
  }

  const brief = loadBrief(branch);
  const minLongEdge = brief.rubric.minLongEdgePx ?? 1000;

  const inputs = readJson<CandidateInput[]>(urlsPath(branch, itemId));
  if (!inputs || inputs.length === 0) {
    console.error(`No urls.json found at ${urlsPath(branch, itemId)} (write candidate URLs there first).`);
    process.exit(2);
  }

  const dir = tmpItemDir(branch, itemId);
  ensureDir(dir);

  const candidates: Candidate[] = [];
  const seenHashes = new Set<string>();
  const rejected: string[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const rawPath = path.join(dir, `raw-${i}`);

    if (i > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 400); // be polite between hosts' requests

    if (!curlDownload(input.imageUrl, rawPath)) {
      rejected.push(`#${i} download failed: ${input.imageUrl}`);
      continue;
    }

    const meta = await probeImage(rawPath);
    if (!meta) {
      rejected.push(`#${i} not a decodable image: ${input.imageUrl}`);
      fs.rmSync(rawPath, { force: true });
      continue;
    }

    const longEdge = Math.max(meta.width, meta.height);
    if (longEdge < minLongEdge) {
      rejected.push(`#${i} too small (${meta.width}x${meta.height}, need long edge >= ${minLongEdge})`);
      fs.rmSync(rawPath, { force: true });
      continue;
    }

    if (seenHashes.has(meta.sha256)) {
      rejected.push(`#${i} duplicate of an earlier candidate`);
      fs.rmSync(rawPath, { force: true });
      continue;
    }
    seenHashes.add(meta.sha256);

    const index = candidates.length;
    const candPath = path.join(dir, `cand-${index}.${extFor(meta.format)}`);
    fs.renameSync(rawPath, candPath);
    candidates.push({
      index,
      tempPath: candPath,
      sourceUrl: input.sourceUrl,
      imageUrl: input.imageUrl,
      width: meta.width,
      height: meta.height,
      bytes: meta.bytes,
      sha256: meta.sha256,
      license: input.license,
    });
  }

  const manifest: CandidateManifest = { itemId, candidates };
  writeJsonAtomic(manifestPath(branch, itemId), manifest);
  appendLog(branch, {
    itemId,
    ts: new Date().toISOString(),
    action: 'prepared',
    detail: `${candidates.length} valid candidate(s), ${rejected.length} rejected`,
  });

  // Human/agent-readable summary.
  console.log(`Prepared ${candidates.length} candidate(s) for "${itemId}":`);
  for (const c of candidates) {
    console.log(`  [${c.index}] ${c.width}x${c.height}  ${c.tempPath}`);
    console.log(`       source: ${c.sourceUrl}`);
  }
  if (rejected.length) {
    console.log(`Rejected ${rejected.length}:`);
    for (const r of rejected) console.log(`  - ${r}`);
  }
  if (candidates.length === 0) {
    console.log('NO VALID CANDIDATES — search again with different queries, or flag the item.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
