import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addBriefItems,
  getBrief,
  removeBriefItem,
  type BriefItem,
  type CurationBrief,
  type DatasetStatus,
} from '../data/datasets';
import { PageContainer } from '../components/layout/PageContainer';
import { StatusPills } from './DatasetsPage';

export function DatasetBranchPage() {
  const { branch: branchId } = useParams();
  const navigate = useNavigate();
  const [brief, setBrief] = useState<CurationBrief | null>(null);
  const [status, setStatus] = useState<DatasetStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!branchId) return;
    getBrief(branchId)
      .then((r) => {
        setBrief(r.brief);
        setStatus(r.status);
      })
      .catch((e) => setError(String(e)));
  }, [branchId]);
  useEffect(() => load(), [load]);

  if (error) return <PageContainer><p className="text-red-400">{error}</p></PageContainer>;
  if (!brief || !status || !branchId) return <PageContainer><p className="text-neutral-500">Loading…</p></PageContainer>;

  async function remove(id: string) {
    if (!branchId) return;
    const r = await removeBriefItem(branchId, id);
    setStatus(r.status);
    setBrief((b) => (b ? { ...b, items: b.items.filter((i) => i.id !== id) } : b));
  }

  const curateCmd = `/curate-branch ${branchId}`;

  return (
    <PageContainer>
      <button onClick={() => navigate('/datasets')} className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Datasets
      </button>

      <header className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{branchId}</h1>
          <p className="text-neutral-500">{brief.items.length} items in brief</p>
        </div>
        <StatusPills s={status} />
      </header>

      {/* Run-curation hint */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <span className="text-sm text-neutral-400">
          {status.pending > 0
            ? `${status.pending} item${status.pending === 1 ? '' : 's'} need images. Run in Claude Code:`
            : 'All items curated. To re-pick or add more, run:'}
        </span>
        <CopyCode text={curateCmd} />
        {status.flagged > 0 && (
          <button onClick={() => navigate(`/review/${branchId}`)} className="text-sm font-semibold text-amber-300 underline">
            Review {status.flagged} flagged →
          </button>
        )}
      </div>

      <AddItems branch={branchId} onAdded={(b) => { setStatus(b.status); load(); }} />

      {/* Rubric */}
      {brief.rubric?.requiredView && (
        <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">Rubric · required view</h2>
          <p className="text-sm text-neutral-300">{brief.rubric.requiredView}</p>
        </section>
      )}

      {/* Items table */}
      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">Brief items</h2>
      <div className="overflow-hidden rounded-2xl border border-neutral-800">
        {brief.items.map((it, i) => (
          <div
            key={it.id}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm ${i % 2 ? 'bg-neutral-900' : 'bg-neutral-900/40'}`}
          >
            <span className="w-8 text-right text-neutral-600">{i + 1}</span>
            <span className="flex-1 font-medium text-neutral-200">
              {[it.year, it.maker, it.name].filter(Boolean).join(' ')}
            </span>
            <span className="hidden text-xs text-neutral-600 sm:block">{it.id}</span>
            <div className="hidden flex-wrap gap-1 sm:flex">
              {(it.tags ?? []).map((t) => (
                <span key={t} className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">{t}</span>
              ))}
            </div>
            <button onClick={() => remove(it.id)} className="text-neutral-600 hover:text-red-400" aria-label="Remove">✕</button>
          </div>
        ))}
        {brief.items.length === 0 && <div className="px-4 py-6 text-center text-neutral-500">No items yet — add some below.</div>}
      </div>
    </PageContainer>
  );
}

function AddItems({ branch, onAdded }: { branch: string; onAdded: (r: { status: DatasetStatus }) => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);
    let items: BriefItem[];
    try {
      const parsed = JSON.parse(text);
      items = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return setMsg('Not valid JSON. Paste an array of brief items.');
    }
    setBusy(true);
    try {
      const r = await addBriefItems(branch, items);
      onAdded(r);
      setText('');
      setMsg(`Added. Brief now has ${r.briefCount} items.`);
    } catch (e) {
      setMsg(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">Add items</h2>
      <p className="mb-3 text-xs text-neutral-500">
        Paste a JSON array of brief items (id, name, maker, year, facts, tags). Tip: ask Claude to generate them —{' '}
        <code className="text-neutral-400">“give me 12 more {branch} as brief JSON”</code> — then paste here.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={'[\n  { "id": "example-1", "name": "…", "maker": "…", "year": 1970, "facts": { "country": "…" }, "tags": ["…"] }\n]'}
        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 font-mono text-xs text-neutral-200 placeholder:text-neutral-700 focus:border-sky-500 focus:outline-none"
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={submit} disabled={busy || !text.trim()} className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-neutral-950 hover:bg-sky-400 disabled:opacity-50">
          {busy ? 'Adding…' : 'Add to brief'}
        </button>
        {msg && <span className="text-sm text-neutral-400">{msg}</span>}
      </div>
    </section>
  );
}

function CopyCode({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 font-mono text-sm text-emerald-300 hover:border-emerald-500/60"
      title="Copy"
    >
      {copied ? 'copied ✓' : text}
    </button>
  );
}
