import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from './io.ts';

// Polite, contactful User-Agent. Wikimedia (and others) throttle/deny generic bot UAs;
// their policy asks for an identifying agent. See https://meta.wikimedia.org/wiki/User-Agent_policy
const USER_AGENT =
  'taste-trainer-curator/1.0 (https://github.com/; contact: roanjtaylor@gmail.com)';

function sleep(ms: number) {
  // Synchronous sleep so the sequential download loop stays simple.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// Download a URL to destFile using curl. Returns true on success.
// curl is available on Windows 10+, macOS, and Linux. We follow redirects, cap file
// size, and retry with backoff to ride out transient throttling (HTTP 429/5xx).
export function curlDownload(
  url: string,
  destFile: string,
  maxBytes = 15_000_000,
  attempts = 3
): boolean {
  ensureDir(path.dirname(destFile));
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      execFileSync(
        'curl',
        [
          '-L', // follow redirects
          '--fail', // non-zero exit on HTTP errors
          '--silent',
          '--show-error',
          '--max-time', '45',
          '--retry', '2', // curl's own retry for transient transport errors
          '--retry-delay', '2',
          '--max-filesize', String(maxBytes),
          '-A', USER_AGENT,
          '-o', destFile,
          url,
        ],
        { stdio: ['ignore', 'ignore', 'pipe'] }
      );
      if (fs.existsSync(destFile) && fs.statSync(destFile).size > 0) return true;
    } catch {
      if (fs.existsSync(destFile)) fs.rmSync(destFile, { force: true });
    }
    if (attempt < attempts) sleep(1500 * attempt); // linear backoff
  }
  return false;
}
