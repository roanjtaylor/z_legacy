import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Item } from '../types';
import { useSession } from '../context/SessionContext';
import { getEloRankings } from '../lib/elo';
import { getHeatsRanking } from '../lib/heats';
import { fillTitle } from '../lib/facets';
import { computeTasteProfile } from '../lib/tasteProfile';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { ItemCardModal } from '../components/card/ItemCardModal';
import { FitImage } from '../components/common/FitImage';

export function ResultsPage() {
  const { branch: branchId } = useParams();
  const { session, reset } = useSession();
  const navigate = useNavigate();
  const [info, setInfo] = useState<Item | null>(null);

  useEffect(() => {
    if (!session) navigate(`/${branchId}`, { replace: true });
  }, [session, branchId, navigate]);

  const ranking = useMemo<Item[]>(() => {
    if (!session) return [];
    // Ranking mode (either view) accumulates into the same ELO ratings.
    if (session.elo) return getEloRankings(session.elo).map((r) => r.item);
    if (session.mode === 'tournament' && session.heats)
      return getHeatsRanking(session.heats, session.items);
    return [];
  }, [session]);

  const profile = useMemo(
    () => (session && ranking.length ? computeTasteProfile(ranking, session.branch) : null),
    [session, ranking]
  );

  if (!session || ranking.length === 0 || !profile) return null;
  const { branch } = session;
  const champion = ranking[0];

  function playAgain() {
    reset();
    navigate(`/${branch.id}`);
  }

  return (
    <PageContainer>
      <header className="mb-8 text-center">
        <p className="text-sm uppercase tracking-widest text-emerald-400">Your top pick</p>
        <h1 className="mt-1 text-3xl font-black">{fillTitle(champion, branch.titleTemplate)}</h1>
      </header>

      <button
        onClick={() => setInfo(champion)}
        className="mx-auto mb-10 block w-full max-w-2xl overflow-hidden rounded-3xl ring-4 ring-emerald-400/70"
      >
        <FitImage src={champion.imageUrl} alt="" className="aspect-[16/9] w-full" />
      </button>

      {/* Taste signature */}
      {profile.signature.length > 0 && (
        <section className="mx-auto mb-10 max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Your eye leans toward</h2>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {profile.signature.map((s) => (
              <span key={s.facetLabel + s.value} className="rounded-full bg-emerald-500/15 px-4 py-1.5 text-emerald-300">
                <span className="text-xs uppercase tracking-wide text-emerald-500/70">{s.facetLabel}</span>{' '}
                <span className="font-semibold">{s.value}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Affinity bars */}
      <section className="mx-auto mb-10 grid max-w-3xl gap-6 sm:grid-cols-2">
        {Object.entries(profile.facetAffinities).map(([key, facet]) => (
          <div key={key} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">{facet.label}</h3>
            <div className="space-y-2">
              {facet.values.map((v) => (
                <AffinityBar key={v.value} label={v.value} affinity={v.affinity} count={v.count} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Full ranking */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">Full ranking</h2>
      <ol className="space-y-2">
        {ranking.map((item, i) => (
          <li key={item.id}>
            <button
              onClick={() => setInfo(item)}
              className="flex w-full items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-left transition-colors hover:bg-neutral-800/60"
            >
              <span className={`w-8 text-center text-lg font-black ${i === 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                {i + 1}
              </span>
              <img src={item.thumbUrl || item.imageUrl} alt="" className="h-12 w-20 rounded-md object-cover" />
              <span className="font-semibold">{fillTitle(item, branch.titleTemplate)}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex justify-center">
        <Button onClick={playAgain}>Play again</Button>
      </div>

      <ItemCardModal item={info} branch={branch} onClose={() => setInfo(null)} />
    </PageContainer>
  );
}

// A diverging bar: positive affinity grows right (emerald), negative left (neutral).
function AffinityBar({ label, affinity, count }: { label: string; affinity: number; count: number }) {
  const pct = Math.min(Math.abs(affinity) * 100, 100);
  const positive = affinity >= 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 truncate text-neutral-300" title={`${label} (${count})`}>
        {label}
      </span>
      <div className="relative h-2 flex-1 rounded-full bg-neutral-800">
        <div className="absolute left-1/2 top-0 h-full w-px bg-neutral-600" />
        <div
          className={`absolute top-0 h-full rounded-full ${positive ? 'bg-emerald-500' : 'bg-neutral-500'}`}
          style={{ width: `${pct / 2}%`, left: positive ? '50%' : `${50 - pct / 2}%` }}
        />
      </div>
    </div>
  );
}
