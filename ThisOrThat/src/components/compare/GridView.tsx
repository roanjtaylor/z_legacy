import type { Branch, Item } from '../../types';
import { ItemCard, type CardState } from '../card/ItemCard';

interface Props {
  items: Item[];
  branch: Branch;
  /** Selected item id, highlighted while the critique bar is open. */
  selectedId: string | null;
  onSelect: (item: Item) => void;
  onInfo?: (item: Item) => void;
}

// A panel of up to 4 items; tap the best. The parent decides when to advance.
export function GridView({ items, branch, selectedId, onSelect, onInfo }: Props) {
  const stateFor = (item: Item): CardState =>
    !selectedId ? 'idle' : selectedId === item.id ? 'winner' : 'loser';

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          branch={branch}
          state={stateFor(item)}
          onSelect={selectedId ? undefined : onSelect}
          onInfo={onInfo}
        />
      ))}
    </div>
  );
}
