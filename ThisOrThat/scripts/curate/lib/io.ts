import fs from 'node:fs';
import path from 'node:path';
import { briefPath, itemsPath, logPath } from './paths.ts';
import type { CurationBrief, CurationLogEntry, Item } from './types.ts';

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readJson<T>(file: string): T | null {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

// Atomic write: write to a temp file in the same dir, then rename.
export function writeJsonAtomic(file: string, data: unknown) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

export function loadBrief(branch: string): CurationBrief {
  const brief = readJson<CurationBrief>(briefPath(branch));
  if (!brief) {
    throw new Error(
      `No brief found at ${briefPath(branch)} — run /new-branch ${branch} first.`
    );
  }
  return brief;
}

export function loadItems(branch: string): Item[] {
  return readJson<Item[]>(itemsPath(branch)) ?? [];
}

// Upsert an item by id, keeping the file sorted by maker then year for stable diffs.
export function upsertItem(branch: string, item: Item) {
  const items = loadItems(branch);
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.push(item);
  items.sort(
    (a, b) => a.maker.localeCompare(b.maker) || a.year - b.year || a.name.localeCompare(b.name)
  );
  writeJsonAtomic(itemsPath(branch), items);
}

export function appendLog(branch: string, entry: CurationLogEntry) {
  ensureDir(path.dirname(logPath(branch)));
  fs.appendFileSync(logPath(branch), JSON.stringify(entry) + '\n');
}
