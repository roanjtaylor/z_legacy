import type { Branch, BranchRegistryEntry, Item } from '../types';

const BASE = import.meta.env.BASE_URL || '/';

export async function loadRegistry(): Promise<BranchRegistryEntry[]> {
  const res = await fetch(`${BASE}registry.json`);
  if (!res.ok) throw new Error(`Failed to load registry (${res.status})`);
  return res.json();
}

export interface BranchData {
  branch: Branch;
  items: Item[];
}

export async function loadBranch(id: string): Promise<BranchData> {
  const [branchRes, itemsRes] = await Promise.all([
    fetch(`${BASE}branches/${id}/branch.json`),
    fetch(`${BASE}branches/${id}/items.json`),
  ]);
  if (!branchRes.ok) throw new Error(`Failed to load branch "${id}" config (${branchRes.status})`);
  if (!itemsRes.ok) throw new Error(`Failed to load branch "${id}" items (${itemsRes.status})`);
  const branch: Branch = await branchRes.json();
  const items: Item[] = await itemsRes.json();
  // Only items with a real image are playable (flagged/no-image entries are hidden).
  return { branch, items: items.filter((it) => it.imageUrl) };
}
