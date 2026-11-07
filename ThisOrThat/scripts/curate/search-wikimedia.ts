// search-wikimedia.ts <branch> <itemId> "<query>" [limit]
//
// Queries the Wikimedia Commons API for file-namespace images matching the query and
// writes a CandidateInput[] to data/.tmp/<branch>/<itemId>/urls.json (merging with any
// existing entries). Commons is the preferred source: high-res, hotlinkable, and every
// file carries explicit license metadata which we capture up front.
//
// This is the skill's primary candidate source. For items Commons lacks, the orchestrator
// can hand-write additional entries into urls.json from WebSearch results.

import https from 'node:https';
import { readJson, writeJsonAtomic } from './lib/io.ts';
import { urlsPath } from './lib/paths.ts';
import type { CandidateInput, ImageLicense } from './lib/types.ts';

const UA = 'taste-trainer-curator/1.0 (https://github.com/; curation bot)';

function getJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': UA } }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Wikimedia API HTTP ${res.statusCode} (likely rate-limited) — retry shortly.`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error(`Non-JSON response from Wikimedia (likely rate-limited): ${body.slice(0, 80)}…`));
          }
        });
      })
      .on('error', reject);
  });
}

function stripHtml(s?: string): string {
  return (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function toLicense(extmeta: any, pageUrl: string): Partial<ImageLicense> {
  const license = stripHtml(extmeta?.LicenseShortName?.value) || 'unknown';
  const author = stripHtml(extmeta?.Artist?.value) || undefined;
  const licenseUrl = stripHtml(extmeta?.LicenseUrl?.value) || undefined;
  const attribution = author
    ? `${author} / Wikimedia Commons${license !== 'unknown' ? ` (${license})` : ''}`
    : `Wikimedia Commons${license !== 'unknown' ? ` (${license})` : ''}`;
  return {
    license: license.replace(/\s+/g, '-').toUpperCase().replace('CC-BY', 'CC-BY'),
    attribution,
    sourceUrl: pageUrl,
    author,
    licenseUrl,
  };
}

async function main() {
  const [branch, itemId, query, limitArg] = process.argv.slice(2);
  if (!branch || !itemId || !query) {
    console.error('Usage: search-wikimedia.ts <branch> <itemId> "<query>" [limit]');
    process.exit(2);
  }
  const limit = Number(limitArg) || 10;

  const api =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    '&generator=search&gsrnamespace=6&gsrlimit=' + limit +
    '&gsrsearch=' + encodeURIComponent(query) +
    '&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=2400';

  // Retry with backoff to ride out Commons API rate-limiting (HTTP 429).
  let data: any = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      data = await getJson(api);
      break;
    } catch (e) {
      if (attempt === 4) throw e;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  const pages = data?.query?.pages ? Object.values<any>(data.query.pages) : [];

  const found: (CandidateInput & { _w: number; _h: number; _title: string })[] = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii?.url) continue;
    const title: string = p.title || '';
    // Skip obvious non-photos by extension.
    if (/\.(svg|pdf|gif|tif|tiff)$/i.test(ii.url)) continue;
    const pageUrl = 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(title.replace(/ /g, '_'));
    found.push({
      imageUrl: ii.url,
      sourceUrl: pageUrl,
      license: toLicense(ii.extmetadata, pageUrl),
      _w: ii.width || 0,
      _h: ii.height || 0,
      _title: title,
    });
  }

  // Merge with any existing urls.json, de-duping by imageUrl.
  const existing = readJson<CandidateInput[]>(urlsPath(branch, itemId)) ?? [];
  const seen = new Set(existing.map((e) => e.imageUrl));
  const merged: CandidateInput[] = [...existing];
  for (const f of found) {
    if (seen.has(f.imageUrl)) continue;
    seen.add(f.imageUrl);
    merged.push({ imageUrl: f.imageUrl, sourceUrl: f.sourceUrl, license: f.license });
  }
  writeJsonAtomic(urlsPath(branch, itemId), merged);

  console.log(`Wikimedia "${query}" → ${found.length} results (urls.json now ${merged.length} candidate(s)):`);
  for (const f of found) {
    console.log(`  ${f._w}x${f._h}  ${f._title}  [${f.license?.license}]`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
