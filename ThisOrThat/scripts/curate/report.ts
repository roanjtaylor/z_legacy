// report.ts <branch> [--json] [--only <id,id,...>]
//
// The single source of truth for "what still needs curating". Cross-references the
// brief against items.json and the images on disk. An item is DONE iff a non-flagged
// Item exists for it AND its image file is present on disk. This makes the pipeline
// resumable/idempotent: re-running curation simply skips done items.

import fs from 'node:fs';
import path from 'node:path';
import { loadBrief, loadItems } from './lib/io.ts';
import { imagesDir } from './lib/paths.ts';
import type { Item } from './lib/types.ts';

interface Status {
  pending: string[];
  done: string[];
  flagged: string[];
}

function computeStatus(branch: string, onlyIds?: Set<string>): Status {
  const brief = loadBrief(branch);
  const items = loadItems(branch);
  const byId = new Map<string, Item>(items.map((i) => [i.id, i]));

  const status: Status = { pending: [], done: [], flagged: [] };
  for (const bi of brief.items) {
    if (onlyIds && !onlyIds.has(bi.id)) continue;
    const item = byId.get(bi.id);
    const imgPresent = fs.existsSync(path.join(imagesDir(branch), `${bi.id}.jpg`));
    if (item && item.curation.flagged) {
      status.flagged.push(bi.id);
    } else if (item && !item.curation.flagged && imgPresent) {
      status.done.push(bi.id);
    } else {
      status.pending.push(bi.id);
    }
  }
  return status;
}

function main() {
  const args = process.argv.slice(2);
  const branch = args[0];
  if (!branch) {
    console.error('Usage: report.ts <branch> [--json] [--only <id,id>]');
    process.exit(2);
  }
  const asJson = args.includes('--json');
  const onlyArg = args[args.indexOf('--only') + 1];
  const onlyIds = args.includes('--only') && onlyArg ? new Set(onlyArg.split(',')) : undefined;

  const status = computeStatus(branch, onlyIds);

  if (asJson) {
    console.log(JSON.stringify(status));
    return;
  }

  const total = status.pending.length + status.done.length + status.flagged.length;
  console.log(`Branch "${branch}" — ${total} items in brief`);
  console.log(`  done:    ${status.done.length}`);
  console.log(`  flagged: ${status.flagged.length}${status.flagged.length ? '  → ' + status.flagged.join(', ') : ''}`);
  console.log(`  pending: ${status.pending.length}${status.pending.length ? '  → ' + status.pending.join(', ') : ''}`);
}

main();
