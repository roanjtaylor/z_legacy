import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { CritiqueMeta, Item } from '../types';
import { useSession } from '../context/SessionContext';
import { getHeatsProgress } from '../lib/heats';
import { PageContainer } from '../components/layout/PageContainer';
import { PairwiseView } from '../components/compare/PairwiseView';
import { GridView } from '../components/compare/GridView';
import { CritiqueBar } from '../components/compare/CritiqueBar';
import { ItemCardModal } from '../components/card/ItemCardModal';

export function ComparePage() {
  const { branch: branchId } = useParams();
  const { session, contestants, choose } = useSession();
  const navigate = useNavigate();
  const [info, setInfo] = useState<Item | null>(null);
  // The item the user tapped, awaiting optional critique before we advance.
  const [pending, setPending] = useState<Item | null>(null);

  const mode = session?.mode;
  const view = session?.view;
  const elo = session?.elo ?? null;
  const heats = session?.heats ?? null;
  const onScreen = session ? contestants() : [];

  const done = mode === 'elo' ? elo?.completed : !!heats?.winner;

  // No active session (e.g. refresh / deep link) → back to setup.
  useEffect(() => {
    if (!session) navigate(`/${branchId}`, { replace: true });
  }, [session, branchId, navigate]);

  useEffect(() => {
    if (session && done) navigate(`/${session.branch.id}/results`, { replace: true });
  }, [session, done, navigate]);

  if (!session) return null;
  const { branch } = session;
  if (onScreen.length === 0) return null;

  const progress =
    mode === 'elo' && elo
      ? { current: elo.currentIndex, total: elo.total }
      : heats
        ? getHeatsProgress(heats)
        : { current: 0, total: 0 };
  const current = 'current' in progress ? progress.current : progress.completed;
  const pct = progress.total ? Math.round((current / progress.total) * 100) : 0;

  const heading =
    mode === 'tournament'
      ? 'Tap the one that advances'
      : view === 'quad'
        ? 'Tap the best'
        : 'Which do you prefer?';

  function handleCritique(meta: CritiqueMeta) {
    if (!pending) return;
    choose(pending, meta);
    setPending(null);
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-neutral-400">
          <button onClick={() => navigate(`/${branch.id}`)} className="hover:text-neutral-200">← Exit</button>
          <span>
            {mode === 'tournament' && heats ? 'Round ' + heats.currentRound + ' · ' : ''}
            {current} / {progress.total}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-800">
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <h1 className="mb-6 text-center text-xl font-bold text-neutral-300">{heading}</h1>

      {view === 'pair' && onScreen.length >= 2 ? (
        <PairwiseView
          a={onScreen[0]}
          b={onScreen[1]}
          branch={branch}
          selectedId={pending?.id ?? null}
          onSelect={setPending}
          onInfo={setInfo}
        />
      ) : (
        <GridView
          items={onScreen}
          branch={branch}
          selectedId={pending?.id ?? null}
          onSelect={setPending}
          onInfo={setInfo}
        />
      )}

      {pending && (
        <>
          {/* Spacer so the fixed bar never covers the last row of cards. */}
          <div className="h-48" aria-hidden />
          <CritiqueBar
            key={pending.id + ':' + current}
            branch={branch}
            prompt="Why this one?"
            onSubmit={handleCritique}
          />
        </>
      )}

      <ItemCardModal item={info} branch={branch} onClose={() => setInfo(null)} />
    </PageContainer>
  );
}
