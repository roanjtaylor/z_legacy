import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

// Local BM25 retrieval over content/index.json. Zero network, zero API keys.
// The always-on principles are loaded separately and injected in full.

export interface Chunk {
  id: string;
  source: string;
  url: string;
  type: string;
  text: string;
}

const STOPWORDS = new Set(
  ("a an and are as at be but by for from has have he her his i if in into is it its of on or " +
    "our she that the their them then there these they this to too was we were what when where " +
    "which who will with would you your about can could do does did had not no so up out who's " +
    "im its were they're you're we're it's").split(" "),
);

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && t.length < 30 && !STOPWORDS.has(t));
}

// ---------------------------------------------------------------------------
// BM25 index (built once, cached).
// ---------------------------------------------------------------------------

interface Bm25Index {
  chunks: Chunk[];
  docTokens: string[][];
  docLen: number[];
  avgdl: number;
  df: Map<string, number>;
  n: number;
}

let cached: Bm25Index | null = null;
let cachedPrinciples: string | null = null;

const K1 = 1.5;
const B = 0.75;

export async function loadIndex(): Promise<Bm25Index> {
  if (cached) return cached;
  const path = join(process.cwd(), "content", "index.json");
  const chunks = JSON.parse(await readFile(path, "utf8")) as Chunk[];
  const docTokens = chunks.map((c) => tokenize(c.text));
  const docLen = docTokens.map((t) => t.length);
  const avgdl = docLen.reduce((a, b) => a + b, 0) / Math.max(docLen.length, 1);
  const df = new Map<string, number>();
  for (const tokens of docTokens) {
    for (const term of new Set(tokens)) df.set(term, (df.get(term) ?? 0) + 1);
  }
  cached = { chunks, docTokens, docLen, avgdl, df, n: chunks.length };
  return cached;
}

function score(queryTerms: string[], idx: Bm25Index, doc: number): number {
  const tokens = idx.docTokens[doc];
  if (tokens.length === 0) return 0;
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const len = idx.docLen[doc];
  let s = 0;
  for (const term of queryTerms) {
    const f = tf.get(term);
    if (!f) continue;
    const n = idx.df.get(term) ?? 0;
    const idf = Math.log(1 + (idx.n - n + 0.5) / (n + 0.5));
    s += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + B * (len / idx.avgdl))));
  }
  return s;
}

interface RankOpts {
  k: number;
  types?: string[]; // restrict to these chunk types
}

async function rank(query: string, { k, types }: RankOpts): Promise<Chunk[]> {
  const idx = await loadIndex();
  const queryTerms = Array.from(new Set(tokenize(query)));
  const scored: { doc: number; s: number }[] = [];
  for (let d = 0; d < idx.n; d++) {
    if (types && !types.includes(idx.chunks[d].type)) continue;
    const s = score(queryTerms, idx, d);
    if (s > 0) scored.push({ doc: d, s });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, k).map((x) => idx.chunks[x.doc]);
}

/** Top-k essay + lecture chunks for the founder's idea. */
export function retrieveChunks(query: string, k = 10): Promise<Chunk[]> {
  return rank(query, { k, types: ["pg-essay", "startup-school"] });
}

/** Top-k curated YC company records (successes and failures). */
export function retrieveCompanies(query: string, k = 6): Promise<Chunk[]> {
  return rank(query, { k, types: ["company"] });
}

/** The always-on doctrine — every principles/*.md, concatenated. */
export async function loadPrinciples(): Promise<string> {
  if (cachedPrinciples !== null) return cachedPrinciples;
  const dir = join(process.cwd(), "content", "principles");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
  const parts: string[] = [];
  for (const f of files) {
    const raw = await readFile(join(dir, f), "utf8");
    // Strip YAML frontmatter; keep the doctrine prose.
    parts.push(raw.replace(/^---\n[\s\S]*?\n---\n/, "").trim());
  }
  cachedPrinciples = parts.join("\n\n---\n\n");
  return cachedPrinciples;
}
