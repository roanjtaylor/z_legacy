import type { FacetConfig, Item } from '../../types';
import { facetOptions, type FacetState } from '../../lib/facets';

interface Props {
  items: Item[]; // full item set (for deriving options)
  facets: FacetConfig[];
  state: FacetState;
  onChange: (state: FacetState) => void;
}

export function FacetFilters({ items, facets, state, onChange }: Props) {
  function toggle(facetKey: string, value: string) {
    const current = state[facetKey] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...state, [facetKey]: next });
  }

  const anyActive = Object.values(state).some((vs) => vs && vs.length > 0);

  return (
    <div className="space-y-5">
      {facets.map((facet) => {
        const options = facetOptions(items, facet);
        if (options.length === 0) return null;
        const selected = state[facet.key] ?? [];
        return (
          <div key={facet.key}>
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
              {facet.label}
            </div>
            <div className="flex flex-wrap gap-2">
              {options.map((opt) => {
                const on = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggle(facet.key, opt.value)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      on
                        ? 'bg-emerald-500 text-white'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {opt.value}
                    <span className={`ml-1.5 text-xs ${on ? 'text-emerald-100' : 'text-neutral-500'}`}>
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {anyActive && (
        <button onClick={() => onChange({})} className="text-sm text-neutral-400 underline hover:text-neutral-200">
          Clear all filters
        </button>
      )}
    </div>
  );
}
