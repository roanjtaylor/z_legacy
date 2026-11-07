import { useEffect, useRef, useState } from 'react';
import type { Branch, CritiqueMeta } from '../../types';

interface Props {
  branch: Branch;
  /** Short prompt, e.g. "Why this one?" or "Why drop it?" */
  prompt: string;
  onSubmit: (meta: CritiqueMeta) => void;
}

// A slim, skippable bottom bar to capture WHY a choice was made: tappable critique
// dimensions plus an optional note. Enter (or "Skip") advances with no reason, so
// the fast flow stays fast; tapping chips enriches the taste log.
export function CritiqueBar({ branch, prompt, onSubmit }: Props) {
  const dims = branch.critiqueDimensions ?? [];
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const noteRef = useRef<HTMLInputElement>(null);

  // Reset on each new prompt instance is handled by remounting via React key.
  function toggle(key: string) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function commit() {
    onSubmit({
      dims: selected.length ? selected : undefined,
      note: note.trim() || undefined,
    });
  }

  // Enter anywhere advances; Escape clears the note focus.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && document.activeElement !== noteRef.current) commit();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, note]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-300">{prompt}</span>
          <span className="text-xs text-neutral-500">optional · press Enter to skip</span>
        </div>

        {dims.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {dims.map((d) => {
              const on = selected.includes(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggle(d.key)}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    on
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={noteRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
            }}
            placeholder="Add a note (optional)…"
            className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => onSubmit({})}
            className="rounded-lg px-3 py-2 text-sm text-neutral-400 hover:text-neutral-200"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={commit}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-emerald-400"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
