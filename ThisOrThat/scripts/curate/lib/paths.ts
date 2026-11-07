import path from 'node:path';

// All paths resolve from the repo root (scripts are run via `npm run` / tsx from root).
export const repoRoot = process.cwd();

export const publicDir = path.join(repoRoot, 'public');
export const dataDir = path.join(repoRoot, 'data');

export function publicBranchDir(branch: string) {
  return path.join(publicDir, 'branches', branch);
}
export function imagesDir(branch: string) {
  return path.join(publicBranchDir(branch), 'images');
}
export function thumbsDir(branch: string) {
  return path.join(publicBranchDir(branch), 'thumbs');
}
export function itemsPath(branch: string) {
  return path.join(publicBranchDir(branch), 'items.json');
}
export function branchConfigPath(branch: string) {
  return path.join(publicBranchDir(branch), 'branch.json');
}
export function registryPath() {
  return path.join(publicDir, 'registry.json');
}

export function dataBranchDir(branch: string) {
  return path.join(dataDir, 'branches', branch);
}
export function briefPath(branch: string) {
  return path.join(dataBranchDir(branch), 'brief.json');
}
export function logPath(branch: string) {
  return path.join(dataBranchDir(branch), 'curation-log.jsonl');
}

export function tmpItemDir(branch: string, id: string) {
  return path.join(dataDir, '.tmp', branch, id);
}
export function urlsPath(branch: string, id: string) {
  return path.join(tmpItemDir(branch, id), 'urls.json');
}
export function manifestPath(branch: string, id: string) {
  return path.join(tmpItemDir(branch, id), 'manifest.json');
}
export function decisionPath(branch: string, id: string) {
  return path.join(tmpItemDir(branch, id), 'decision.json');
}

// Public web paths (what the app fetches), forward-slashed.
export function imageWebPath(branch: string, id: string) {
  return `/branches/${branch}/images/${id}.jpg`;
}
export function thumbWebPath(branch: string, id: string) {
  return `/branches/${branch}/thumbs/${id}.webp`;
}
