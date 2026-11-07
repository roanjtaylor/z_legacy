import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBranch, listDatasets, type DatasetSummary } from '../data/datasets';
import { PageContainer } from '../components/layout/PageContainer';

// Curator-only console (dev builds only): the front door to dataset tooling.
export function DatasetsPage() {
  const [rows, setRows] = useState<DatasetSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(() => {
    listDatasets().then(setRows).catch((e) => setError(String(e)));
  }, []);
  useEffect(() => load(), [load]);

  return (
    <PageContainer>
      <button onClick={() => navigate('/')} className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Home
      </button>

      <header className="mt-4 mb-8">
        <p className="text-sm uppercase tracking-widest text-sky-400">Curator</p>
        <h1 className="text-3xl font-black">Datasets</h1>
        <p className="text-neutral-400">
          Author and manage the taste branches. Image curation runs through the{' '}
          <code className="text-neutral-300">/curate-branch</code> skill in Claude Code.
        </p>
      </header>

      {error && <p className="mb-4 text-red-400">{error}</p>}

      <div className="space-y-3">
        {rows.map((b) => (
          <button
            key={b.id}
            onClick={() => navigate(`/datasets/${b.id}`)}
            className="flex w-full items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-left transition-colors hover:border-sky-500/50 hover:bg-neutral-800/50"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{b.label}</h2>
                <span className="text-xs text-neutral-500">{b.id}</span>
              </div>
              {b.tagline && <p className="text-sm text-neutral-500">{b.tagline}</p>}
            </div>
            <StatusPills s={b.status} />
            <span className="text-neutral-600">→</span>
          </button>
        ))}
        {rows.length === 0 && !error && <p className="text-neutral-500">Loading…</p>}
      </div>

      <div className="mt-8">
        {creating ? (
          <CreateBranchForm
            onCancel={() => setCreating(false)}
            onCreated={(id) => {
              setCreating(false);
              navigate(`/datasets/${id}`);
            }}
          />
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-sky-400"
          >
            + New branch
          </button>
        )}
      </div>
    </PageContainer>
  );
}

export function StatusPills({ s }: { s: DatasetSummary['status'] }) {
  return (
    <div className="flex shrink-0 gap-1.5 text-xs font-semibold">
      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-300">{s.done} done</span>
      {s.flagged > 0 && <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-300">{s.flagged} flagged</span>}
      {s.pending > 0 && <span className="rounded-full bg-neutral-700/40 px-2.5 py-1 text-neutral-300">{s.pending} pending</span>}
    </div>
  );
}

// Scaffolds branch.json + a minimal brief.json. Items are added afterwards in the
// branch editor (or by asking Claude to populate the brief).
function CreateBranchForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (id: string) => void }) {
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [tagline, setTagline] = useState('');
  const [noun, setNoun] = useState('');
  const [requiredView, setRequiredView] = useState('A clean, well-lit photo showing the whole object in frame.');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const slug = id.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

  async function submit() {
    setErr(null);
    if (!slug || !label.trim()) return setErr('id and label are required');
    setBusy(true);
    const singular = noun.trim() || 'item';
    const branch = {
      id: slug,
      label: label.trim(),
      tagline: tagline.trim(),
      status: 'curating',
      itemNoun: { singular, plural: singular.endsWith('s') ? singular : singular + 's' },
      titleTemplate: '${maker} ${name}',
      cardFacts: [{ key: 'country', label: 'Origin', format: 'text' }],
      filterFacets: [
        { key: 'year', label: 'Decade', source: 'fact', type: 'range', bucket: { size: 10, suffix: 's' } },
        { key: 'country', label: 'Origin', source: 'fact', type: 'enum' },
        { key: 'tags', label: 'Style', source: 'tag', type: 'enum' },
      ],
      critiqueDimensions: [
        { key: 'proportion', label: 'Proportion' },
        { key: 'line', label: 'Line & form' },
        { key: 'detailing', label: 'Detailing' },
      ],
    };
    const brief = {
      branch: slug,
      rubric: {
        requiredView: requiredView.trim(),
        minLongEdgePx: 1200,
        reject: ['render/CGI/illustration (must be a real photograph)', 'heavy watermark or logo overlay'],
        prefer: ['neutral or plain background', 'sharp focus, the object as the clear subject'],
      },
      searchTemplates: ['{maker} {name} {year}', '{maker} {name} wikimedia commons'],
      items: [],
    };
    try {
      await createBranch(branch, brief);
      onCreated(slug);
    } catch (e) {
      setErr(String(e));
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-sky-500/30 bg-neutral-900 p-5">
      <h3 className="mb-4 text-lg font-bold">New branch</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Branch id (slug)" value={id} onChange={setId} placeholder="fighter-jets" hint={slug && `→ ${slug}`} />
        <Field label="Label" value={label} onChange={setLabel} placeholder="Fighter Jets" />
        <Field label="Tagline" value={tagline} onChange={setTagline} placeholder="Find the airframe your eye loves." />
        <Field label="Item noun (singular)" value={noun} onChange={setNoun} placeholder="jet" />
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Required view (rubric)</label>
        <textarea
          value={requiredView}
          onChange={(e) => setRequiredView(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:border-sky-500 focus:outline-none"
        />
      </div>
      {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
      <div className="mt-4 flex gap-2">
        <button onClick={submit} disabled={busy} className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-neutral-950 hover:bg-sky-400 disabled:opacity-50">
          {busy ? 'Creating…' : 'Create'}
        </button>
        <button onClick={onCancel} className="rounded-full px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200">
          Cancel
        </button>
      </div>
      <p className="mt-3 text-xs text-neutral-600">
        Creates the config + an empty brief. Then add items, or ask Claude:{' '}
        <code className="text-neutral-400">“populate the {slug || 'branch'} brief with N iconic examples”</code>.
      </p>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, hint,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-sky-500 focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-neutral-600">{hint}</p>}
    </div>
  );
}
