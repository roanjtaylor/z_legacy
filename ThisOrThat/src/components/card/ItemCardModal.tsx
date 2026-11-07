import type { Branch, Item } from '../../types';
import { fillTitle, formatFact } from '../../lib/facets';
import { FitImage } from '../common/FitImage';

interface Props {
  item: Item | null;
  branch: Branch;
  onClose: () => void;
}

export function ItemCardModal({ item, branch, onClose }: Props) {
  if (!item) return null;
  const title = fillTitle(item, branch.titleTemplate);
  const facts = branch.cardFacts
    .map((f) => ({ label: f.label, value: formatFact(item, f) }))
    .filter((f) => f.value !== null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-neutral-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <FitImage src={item.imageUrl} alt={title} className="aspect-[16/10] w-full" />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold">{title}</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-white" aria-label="Close">
              ✕
            </button>
          </div>

          {facts.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className="rounded-lg bg-neutral-800 p-3">
                  <div className="text-xs uppercase tracking-wide text-neutral-500">{f.label}</div>
                  <div className="font-semibold">{f.value}</div>
                </div>
              ))}
            </div>
          )}

          {item.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <span key={t} className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-400">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 border-t border-neutral-800 pt-4 text-xs text-neutral-500">
            Image:{' '}
            <a href={item.license.sourceUrl} target="_blank" rel="noreferrer" className="underline hover:text-neutral-300">
              {item.license.attribution || 'source'}
            </a>
            {item.license.licenseUrl && (
              <>
                {' · '}
                <a href={item.license.licenseUrl} target="_blank" rel="noreferrer" className="underline hover:text-neutral-300">
                  {item.license.license}
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
