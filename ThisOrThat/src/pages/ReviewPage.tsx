import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Branch, Item } from '../types';
import { fillTitle } from '../lib/facets';
import { PageContainer } from '../components/layout/PageContainer';
import { FitImage } from '../components/common/FitImage';

// Curator-only screen (mounted only in dev). Lists flagged picks and lets a human
// Accept them or send them back for re-curation, writing items.json via /__review.
export function ReviewPage() {
  const { branch: branchId } = useParams();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [flagged, setFlagged] = useState<Item[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [b, items] = await Promise.all([
      fetch(`/branches/${branchId}/branch.json`).then((r) => r.json()),
      fetch(`/branches/${branchId}/items.json?t=${Date.now()}`).then((r) => r.json()),
    ]);
    setBranch(b);
    setFlagged((items as Item[]).filter((i) => i.curation.flagged));
  }, [branchId]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: 'accept' | 'recurate') {
    setBusy(id);
    await fetch(`/__review/${branchId}/${id}/${action}`, { method: 'POST' });
    setFlagged((prev) => prev.filter((i) => i.id !== id));
    setBusy(null);
  }

  if (!branch) return <PageContainer><p className="text-neutral-500">Loading…</p></PageContainer>;

  return (
    <PageContainer>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-amber-400">Curator · flagged picks</p>
        <h1 className="text-3xl font-black">{branch.label}</h1>
        <p className="text-neutral-400">{flagged.length} item{flagged.length === 1 ? '' : 's'} need a human eye.</p>
      </header>

      {flagged.length === 0 && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-10 text-center text-neutral-400">
          ✓ Nothing flagged — every pick was high-confidence.
        </div>
      )}

      <div className="space-y-4">
        {flagged.map((item) => (
          <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-amber-500/30 bg-neutral-900 p-4 sm:flex-row">
            {item.imageUrl ? (
              <FitImage src={item.imageUrl} className="aspect-[16/10] w-full shrink-0 rounded-xl sm:w-64" />
            ) : (
              <div className="flex aspect-[16/10] w-full shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-sm text-neutral-500 sm:w-64">
                no image found
              </div>
            )}
            <div className="flex flex-1 flex-col">
              <h2 className="text-lg font-bold">{fillTitle(item, branch.titleTemplate)}</h2>
              <p className="mt-1 text-sm text-amber-300/90">
                <span className="uppercase tracking-wide text-amber-500/70">{item.curation.confidence}</span>
                {item.curation.flagReason ? ` · ${item.curation.flagReason}` : ''}
              </p>
              {item.license.sourceUrl && (
                <a href={item.license.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 text-xs text-neutral-500 underline">
                  {item.license.attribution || 'source'}
                </a>
              )}
              <div className="mt-auto flex gap-2 pt-4">
                <button
                  disabled={busy === item.id}
                  onClick={() => act(item.id, 'accept')}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  disabled={busy === item.id}
                  onClick={() => act(item.id, 'recurate')}
                  className="rounded-full bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-700 disabled:opacity-50"
                >
                  Send back for re-curation
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-neutral-600">
        “Send back” removes the image and record so <code>report.ts</code> marks it pending — then run{' '}
        <code>/curate-branch {branchId} --only {'<id>'}</code> to re-pick it.
      </p>
    </PageContainer>
  );
}
