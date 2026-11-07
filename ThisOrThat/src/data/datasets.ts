// Client for the dev-only Dataset API (see datasetApiPlugin in vite.config.ts).
// These calls only work under `npm run dev`; the console is dev-only.

export interface DatasetStatus {
  briefCount: number;
  pending: number;
  done: number;
  flagged: number;
}

export interface DatasetSummary {
  id: string;
  label: string;
  tagline?: string;
  status: DatasetStatus;
}

export interface BriefItem {
  id: string;
  name: string;
  maker?: string;
  year?: number;
  facts?: Record<string, string | number | boolean>;
  tags?: string[];
  searchHints?: string[];
}

export interface CurationBrief {
  branch: string;
  rubric?: { requiredView?: string; minLongEdgePx?: number; reject?: string[]; prefer?: string[] };
  searchTemplates?: string[];
  items: BriefItem[];
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `${res.status}`);
  return body as T;
}

export const listDatasets = () => api<DatasetSummary[]>('/__dataset/list');

export const getBrief = (branch: string) =>
  api<{ brief: CurationBrief; status: DatasetStatus }>(`/__dataset/brief/${branch}`);

export const addBriefItems = (branch: string, items: BriefItem[]) =>
  api<{ ok: true; briefCount: number; status: DatasetStatus }>(`/__dataset/brief/${branch}/add`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items }),
  });

export const removeBriefItem = (branch: string, id: string) =>
  api<{ ok: true; briefCount: number; status: DatasetStatus }>(`/__dataset/brief/${branch}/remove`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id }),
  });

export const createBranch = (branch: unknown, brief: unknown) =>
  api<{ ok: true; status: DatasetStatus }>('/__dataset/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ branch, brief }),
  });
