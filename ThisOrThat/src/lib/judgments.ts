import type { Judgment } from '../types';

// Persist one decision to data/judgments/<branch>.jsonl via the dev-only endpoint
// (see judgmentApiPlugin in vite.config.ts). Best-effort and fire-and-forget: it
// never blocks or breaks the UI, and is a no-op in a production build where the
// endpoint doesn't exist.
export function recordJudgment(judgment: Judgment): void {
  if (!import.meta.env.DEV) return;
  void fetch(`/__judgment/${judgment.branch}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(judgment),
    keepalive: true,
  }).catch(() => {
    /* logging taste is best-effort; swallow network/dev-server errors */
  });
}
