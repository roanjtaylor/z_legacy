import type { Branch, Item } from '../../types';
import { ItemCard, type CardState } from '../card/ItemCard';

interface Props {
  a: Item;
  b: Item;
  branch: Branch;
  /** Selected winner id, highlighted while the critique bar is open. */
  selectedId: string | null;
  onSelect: (winner: Item) => void;
  onInfo?: (item: Item) => void;
}

// Shows two items; tapping one selects it as the winner. The parent decides when
// to advance (after optional critique), keeping the loser dimmed meanwhile.
export function PairwiseView({ a, b, branch, selectedId, onSelect, onInfo }: Props) {
  const stateFor = (item: Item): CardState =>
    !selectedId ? 'idle' : selectedId === item.id ? 'winner' : 'loser';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
      <ItemCard item={a} branch={branch} state={stateFor(a)} onSelect={selectedId ? undefined : onSelect} onInfo={onInfo} />
      <ItemCard item={b} branch={branch} state={stateFor(b)} onSelect={selectedId ? undefined : onSelect} onInfo={onInfo} />
    </div>
  );
}
