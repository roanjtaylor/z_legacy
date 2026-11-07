import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BranchRegistryEntry } from '../types';
import { loadRegistry } from '../data/loadBranch';
import { PageContainer } from '../components/layout/PageContainer';

export function HomePage() {
  const [branches, setBranches] = useState<BranchRegistryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRegistry().then(setBranches).catch((e) => setError(String(e)));
  }, []);

  return (
    <PageContainer>
      {import.meta.env.DEV && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/datasets')}
            className="rounded-full border border-neutral-800 bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-sky-300 hover:border-sky-500/50"
          >
            Datasets
          </button>
        </div>
      )}

      <header className="mx-auto max-w-2xl py-12 text-center">
        <h1 className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">
          Train Your Eye
        </h1>
        <p className="mt-4 text-lg text-neutral-400">
          Develop your visual taste by comparing beautifully-designed things.
          Discover what your eye truly loves.
        </p>
      </header>

      {error && <p className="text-center text-red-400">{error}</p>}

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {branches.map((b) => (
          <button
            key={b.id}
            onClick={() => navigate(`/${b.id}`)}
            disabled={b.itemCount < 2}
            className="group rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-left transition-all hover:border-emerald-500/60 hover:bg-neutral-800/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{b.label}</h2>
              <span className="text-neutral-600 transition-transform group-hover:translate-x-1">→</span>
            </div>
            {b.tagline && <p className="mt-1 text-sm text-neutral-400">{b.tagline}</p>}
            <p className="mt-4 text-xs uppercase tracking-wide text-neutral-500">
              {b.itemCount} {b.itemCount === 1 ? 'item' : 'items'}
            </p>
          </button>
        ))}

        {branches.length === 0 && !error && (
          <p className="col-span-full text-center text-neutral-500">Loading branches…</p>
        )}
      </div>
    </PageContainer>
  );
}
