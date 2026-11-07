import type { Branch, Item } from '../../types';
import { fillTitle, formatFact } from '../../lib/facets';
import { FitImage } from '../common/FitImage';

export type CardState = 'idle' | 'winner' | 'loser';

interface Props {
  item: Item;
  branch: Branch;
  state?: CardState;
  onSelect?: (item: Item) => void;
  onInfo?: (item: Item) => void;
}

export function ItemCard({ item, branch, state = 'idle', onSelect, onInfo }: Props) {
  const title = fillTitle(item, branch.titleTemplate);
  const facts = branch.cardFacts
    .map((f) => ({ label: f.label, value: formatFact(item, f) }))
    .filter((f) => f.value !== null);

  const ring =
    state === 'winner'
      ? 'ring-4 ring-emerald-400 scale-[1.02]'
      : state === 'loser'
        ? 'opacity-40 grayscale'
        : 'ring-1 ring-neutral-800 hover:ring-emerald-500/60 hover:scale-[1.01]';

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      disabled={!onSelect}
      className={`group relative block w-full overflow-hidden rounded-2xl bg-neutral-900 text-left transition-all duration-200 ${ring} ${onSelect ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <FitImage
        src={item.imageUrl}
        alt={title}
        className="aspect-[16/10] w-full"
        imgClassName="transition-transform duration-300 group-hover:scale-[1.03]"
      />

      <div className="p-4">
        <h3 className="text-lg font-bold leading-tight">{title}</h3>
        {facts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {facts.map((f) => (
              <span
                key={f.label}
                className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-neutral-300"
              >
                <span className="text-neutral-500">{f.label}</span> {f.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {onInfo && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onInfo(item);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation();
              onInfo(item);
            }
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-sm text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/70 group-hover:opacity-100"
          aria-label="Details"
        >
          i
        </span>
      )}
    </button>
  );
}
