import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import { Company } from "../src/lib/schema.ts";

// Chunk the corpus (pg-essays + startup-school + companies) into
// content/index.json — the flat array BM25 retrieves over. Principles are NOT
// indexed; they are always injected in full at query time.

const ROOT = join(process.cwd(), "content");
const OUT = join(ROOT, "index.json");

const TEXT_DIRS = [
  { dir: "pg-essays", type: "pg-essay" },
  { dir: "startup-school", type: "startup-school" },
];

export interface Chunk {
  id: string;
  source: string;
  url: string;
  type: string;
  text: string;
}

// Split markdown body into ~280-word chunks on paragraph boundaries so a chunk
// is a coherent passage (good for verbatim quoting and BM25 signal).
function chunkBody(body: string, targetWords = 280): string[] {
  const paras = body
    .replace(/^#.*$/gm, "") // drop heading lines
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let buf: string[] = [];
  let count = 0;
  for (const p of paras) {
    const w = p.split(" ").length;
    if (count + w > targetWords && buf.length > 0) {
      chunks.push(buf.join("\n\n"));
      buf = [];
      count = 0;
    }
    buf.push(p);
    count += w;
  }
  if (buf.length > 0) chunks.push(buf.join("\n\n"));
  return chunks.filter((c) => c.length > 120);
}

async function main() {
  const out: Chunk[] = [];

  for (const { dir, type } of TEXT_DIRS) {
    const path = join(ROOT, dir);
    let files: string[] = [];
    try {
      files = (await readdir(path)).filter((f) => f.endsWith(".md"));
    } catch {
      console.warn(`  (no ${dir} dir — skipping)`);
      continue;
    }
    for (const file of files) {
      const raw = await readFile(join(path, file), "utf8");
      const { data, content } = matter(raw);
      const source = String(data.source ?? file.replace(/\.md$/, ""));
      const url = String(data.url ?? "");
      const slug = file.replace(/\.md$/, "");
      const chunks = chunkBody(content);
      chunks.forEach((text, i) => {
        out.push({ id: `${type}:${slug}#${i}`, source, url, type, text });
      });
    }
  }

  // One chunk per curated company record.
  const companiesRaw = await readFile(join(ROOT, "yc-companies", "companies.json"), "utf8");
  const companies = Company.array().parse(JSON.parse(companiesRaw));
  for (const c of companies) {
    out.push({
      id: `company:${c.name.toLowerCase().replace(/\s+/g, "-")}`,
      source: `${c.name} (${c.batch}, ${c.outcome})`,
      url: c.url,
      type: "company",
      text: `${c.name} — ${c.one_liner} Tags: ${c.tags.join(", ")}. What they did: ${c.what_they_did} Lesson: ${c.lesson}`,
    });
  }

  await writeFile(OUT, JSON.stringify(out, null, 0), "utf8");
  const byType = out.reduce<Record<string, number>>((a, c) => ((a[c.type] = (a[c.type] ?? 0) + 1), a), {});
  console.log(`✓ Wrote ${out.length} chunks to content/index.json`);
  console.log(`  by type:`, byType);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
