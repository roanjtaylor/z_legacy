import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";

// Scrape ALL Paul Graham essays from paulgraham.com/articles.html into
// content/pg-essays/<slug>.md with YAML frontmatter. Pure HTML scrape, no API.

const BASE = "https://paulgraham.com/";
const LIST_URL = `${BASE}articles.html`;
const OUT_DIR = join(process.cwd(), "content", "pg-essays");

const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

// Pages on articles.html that are not essays.
const SKIP = new Set([
  "index.html",
  "articles.html",
  "rss.html",
  "books.html",
  "faq.html",
  "bel.html",
  "raq.html",
  "raq2.html",
  "rss2.html",
  "talks.html",
  "founders.html",
  "kedrosky.html",
]);

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (yc-grader scraper)" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// PG essays put the body text in the table cell with the most text.
function extractEssay(html: string): { title: string; body: string } | null {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  let title =
    doc.querySelector("title")?.textContent?.trim() ||
    doc.querySelector("img[alt]")?.getAttribute("alt")?.trim() ||
    "";
  title = title.replace(/\s+/g, " ").trim();

  // Find the densest text container (PG nests the essay in a <font> in a <td>).
  const candidates = Array.from(doc.querySelectorAll("td, font, body"));
  let best: Element | null = null;
  let bestLen = 0;
  for (const el of candidates) {
    const len = (el.textContent ?? "").trim().length;
    if (len > bestLen) {
      bestLen = len;
      best = el;
    }
  }
  if (!best || bestLen < 400) return null;

  const md = cleanBody(turndown.turndown(best.innerHTML));
  return { title, body: md };
}

// Strip the image/nav/boilerplate cruft PG pages carry so the corpus is clean
// prose (better verbatim quotes, better BM25 signal).
function cleanBody(md: string): string {
  return md
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (/^!\[.*\]\(.*\)\s*$/.test(t)) return false; // bare image
      if (/^\[!\[.*\]\(.*\)\]\(.*\)\s*$/.test(t)) return false; // linked image
      if (/want to start a startup\?/i.test(t)) return false; // YC boilerplate
      if (/get funded by/i.test(t)) return false;
      return true;
    })
    .join("\n")
    // Drop inline images left mid-line.
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function frontmatter(title: string, url: string): string {
  const safe = title.replace(/"/g, "'");
  return `---\nsource: "${safe}"\nauthor: "Paul Graham"\nurl: "${url}"\ntype: "pg-essay"\ntopics: []\n---\n\n`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const listHtml = await fetchText(LIST_URL);
  const dom = new JSDOM(listHtml);
  const links = Array.from(dom.window.document.querySelectorAll("a[href]"))
    .map((a) => a.getAttribute("href")!.trim())
    .filter((h) => /^[a-z0-9_]+\.html$/i.test(h) && !SKIP.has(h.toLowerCase()));

  const unique = Array.from(new Set(links));
  console.log(`Found ${unique.length} candidate essay links.`);

  let ok = 0;
  let skip = 0;
  for (const href of unique) {
    const url = BASE + href;
    try {
      const html = await fetchText(url);
      const essay = extractEssay(html);
      if (!essay || essay.body.length < 600) {
        skip++;
        continue;
      }
      const slug = slugify(essay.title) || href.replace(/\.html$/i, "");
      const file = join(OUT_DIR, `${slug}.md`);
      await writeFile(file, frontmatter(essay.title, url) + essay.body + "\n", "utf8");
      ok++;
      if (ok % 20 === 0) console.log(`  …${ok} essays written`);
    } catch (err) {
      skip++;
      console.warn(`  skip ${href}: ${err instanceof Error ? err.message : err}`);
    }
    await new Promise((r) => setTimeout(r, 250)); // be polite
  }
  console.log(`✓ Wrote ${ok} essays to content/pg-essays (skipped ${skip}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
