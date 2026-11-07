import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { CompareMode, CompareView } from '../types';
import { useBranchData } from '../hooks/useBranchData';
import { applyFacets, type FacetState } from '../lib/facets';
import { useSession } from '../context/SessionContext';
import { PageContainer } from '../components/layout/PageContainer';
import { FacetFilters } from '../components/filters/FacetFilters';
import { Button } from '../components/common/Button';

export function SetupPage() {
  const { branch: branchId } = useParams();
  const { data, loading, error } = useBranchData(branchId);
  const { start } = useSession();
  const navigate = useNavigate();

  const [facetState, setFacetState] = useState<FacetState>({});
  const [mode, setMode] = useState<CompareMode>('elo');
  const [view, setView] = useState<CompareView>('pair');

  const filtered = useMemo(() => {
    if (!data) return [];
    return applyFacets(data.items, data.branch.filterFacets, facetState);
  }, [data, facetState]);

  if (loading) return <PageContainer><p className="text-neutral-500">Loading…</p></PageContainer>;
  if (error || !data)
    return (
      <PageContainer>
        <p className="text-red-400">{error ?? 'Branch not found.'}</p>
        <button onClick={() => navigate('/')} className="mt-4 underline">← Back</button>
      </PageContainer>
    );

  const { branch } = data;

  function startGame() {
    if (filtered.length < 2) return;
    start(branch, mode, view, filtered);
    navigate(`/${branch.id}/play`);
  }

  return (
    <PageContainer>
      <button onClick={() => navigate('/')} className="text-sm text-neutral-400 hover:text-neutral-200">
        ← All branches
      </button>

      <header className="mt-4 mb-8">
        <h1 className="text-3xl font-black">{branch.label}</h1>
        <p className="text-neutral-400">{branch.tagline}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">Filter the pool</h2>
          <FacetFilters items={data.items} facets={branch.filterFacets} state={facetState} onChange={setFacetState} />
        </section>

        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">Mode</div>
            <div className="grid grid-cols-2 gap-2">
              <ModeButton active={mode === 'elo'} onClick={() => setMode('elo')} title="Ranking" subtitle="Rate them all (ELO)" />
              <ModeButton active={mode === 'tournament'} onClick={() => setMode('tournament')} title="Bracket" subtitle="One winner" />
            </div>

            <div className="mt-5 mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">View</div>
            <div className="grid grid-cols-2 gap-2">
              <ModeButton active={view === 'pair'} onClick={() => setView('pair')} title="1 v 1" subtitle="Two at a time" />
              <ModeButton active={view === 'quad'} onClick={() => setView('quad')} title="4 up" subtitle="Tap the best of 4" />
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-center">
            <div className="text-4xl font-black text-emerald-400">{filtered.length}</div>
            <div className="text-sm text-neutral-400">{branch.itemNoun.plural} match your filters</div>
            <Button onClick={startGame} disabled={filtered.length < 2} className="mt-4 w-full">
              Start
            </Button>
            {filtered.length < 2 && (
              <p className="mt-2 text-xs text-neutral-500">Need at least 2 to play.</p>
            )}
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}

function ModeButton({ active, onClick, title, subtitle }: { active: boolean; onClick: () => void; title: string; subtitle: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-colors ${
        active ? 'border-emerald-500 bg-emerald-500/10' : 'border-neutral-800 bg-neutral-800/40 hover:bg-neutral-800'
      }`}
    >
      <div className="font-bold">{title}</div>
      <div className="text-xs text-neutral-400">{subtitle}</div>
    </button>
  );
}
