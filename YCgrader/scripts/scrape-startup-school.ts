import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { YoutubeTranscript } from "youtube-transcript";

// Scrape the canonical YC "How to Start a Startup" (CS183B) lecture series as
// cleaned transcripts. We read the playlist page to get VERIFIED {videoId,
// title} pairs straight from YouTube — never guessing IDs — so every source's
// title/url attribution matches the real video. Transcript-disabled or
// non-English videos are skipped.

const PLAYLIST_ID = "PL11qn6zM2Y3bMZdChxEqHKaCaKUjwItGL"; // How to Start a Startup 2014
const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;
const OUT_DIR = join(process.cwd(), "content", "startup-school");

interface Video {
  id: string;
  title: string;
}

// Lecture 1 renders in a featured slot YouTube markup omits from the lockup
// list, so seed it explicitly (verified id).
const SEED: Video[] = [
  { id: "CBYhVcO4WgI", title: "Lecture 1 - How to Start a Startup (Sam Altman, Dustin Moskovitz)" },
];

async function fetchPlaylistVideos(): Promise<Video[]> {
  const res = await fetch(PLAYLIST_URL, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9" },
  });
  const html = await res.text();

  // YouTube renders playlist items as lockupViewModel entries: each carries a
  // contentId (the videoId) and a lockupMetadataViewModel.title.content.
  const videos: Video[] = [];
  const seen = new Set<string>();
  const re =
    /"contentId":"([\w-]{11})","contentType":"LOCKUP_CONTENT_TYPE_VIDEO".*?"lockupMetadataViewModel":\{"title":\{"content":"((?:[^"\\]|\\.)*)"/gs;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const title = JSON.parse(`"${m[2]}"`); // unescape JSON string
    videos.push({ id, title });
  }
  // Merge the seed (Lecture 1) ahead of the parsed list, de-duped.
  const merged = [...SEED, ...videos];
  const out: Video[] = [];
  const dedupe = new Set<string>();
  for (const v of merged) {
    if (dedupe.has(v.id)) continue;
    dedupe.add(v.id);
    out.push(v);
  }
  return out;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Reject transcripts that aren't predominantly Latin script (wrong/auto-
// translated caption track).
function isEnglish(s: string): boolean {
  const letters = s.replace(/[^a-zA-ZÀ-ɏ]/g, "").length;
  const latin = s.replace(/[^a-zA-Z]/g, "").length;
  return letters > 0 && latin / Math.max(letters, 1) > 0.85;
}

function cleanTranscript(parts: { text: string }[]): string {
  const raw = parts
    .map((p) => p.text)
    .join(" ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/&amp;#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\b(uh+|um+|er+|hmm+)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = raw.split(" ");
  const paras: string[] = [];
  for (let i = 0; i < words.length; i += 70) paras.push(words.slice(i, i + 70).join(" "));
  return paras.join("\n\n");
}

function frontmatter(v: Video): string {
  const safe = v.title.replace(/"/g, "'");
  return (
    `---\n` +
    `source: "${safe}"\n` +
    `author: "Y Combinator — How to Start a Startup (CS183B)"\n` +
    `url: "https://www.youtube.com/watch?v=${v.id}"\n` +
    `type: "startup-school"\n` +
    `topics: []\n` +
    `---\n\n`
  );
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const videos = await fetchPlaylistVideos();
  console.log(`Found ${videos.length} videos in the playlist.`);
  if (videos.length === 0) throw new Error("Could not parse playlist — YouTube markup may have changed.");

  let ok = 0;
  let skip = 0;
  for (const v of videos) {
    try {
      const parts = await YoutubeTranscript.fetchTranscript(v.id, { lang: "en" });
      const body = cleanTranscript(parts as { text: string }[]);
      if (body.length < 800 || !isEnglish(body)) {
        console.warn(`  skip "${v.title}": short or non-English transcript`);
        skip++;
        continue;
      }
      const file = join(OUT_DIR, `${slugify(v.title)}.md`);
      await writeFile(file, frontmatter(v) + `# ${v.title}\n\n` + body + "\n", "utf8");
      ok++;
      console.log(`  ✓ ${v.title}`);
    } catch (err) {
      skip++;
      console.warn(`  skip "${v.title}": ${err instanceof Error ? err.message : err}`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log(`✓ Wrote ${ok} lectures to content/startup-school (skipped ${skip}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
