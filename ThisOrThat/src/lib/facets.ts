import type { CardFact, FacetConfig, Facts, Item } from '../types';

export type FacetState = Record<string, string[]>; // facet key -> selected values (empty = no filter)

// Resolve a raw value for an item by key: facts first, then a few top-level fields.
function rawValue(item: Item, key: string): Facts[string] | undefined {
  if (key in item.facts) return item.facts[key];
  if (key === 'year') return item.year;
  if (key === 'maker') return item.maker;
  if (key === 'name') return item.name;
  return undefined;
}

function bucketLabel(value: number, size: number, suffix = ''): string {
  return `${Math.floor(value / size) * size}${suffix}`;
}

// The display value(s) an item contributes to a facet (tags yield several).
export function itemFacetValues(item: Item, facet: FacetConfig): string[] {
  if (facet.source === 'tag') return item.tags;
  const v = rawValue(item, facet.key);
  if (v === undefined || v === null) return [];
  if (facet.type === 'range' && facet.bucket && typeof v === 'number') {
    return [bucketLabel(v, facet.bucket.size, facet.bucket.suffix)];
  }
  return [String(v)];
}

export interface FacetOption {
  value: string;
  count: number;
}

// Distinct selectable options for a facet, ordered (explicit order, then by config).
export function facetOptions(items: Item[], facet: FacetConfig): FacetOption[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const v of itemFacetValues(item, facet)) {
      counts.set(v, (counts.get(v) || 0) + 1);
    }
  }
  let values = [...counts.keys()];
  if (facet.order) {
    values.sort((a, b) => {
      const ia = facet.order!.indexOf(a);
      const ib = facet.order!.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  } else if (facet.type === 'range') {
    values.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  } else {
    values.sort((a, b) => a.localeCompare(b));
  }
  return values.map((value) => ({ value, count: counts.get(value)! }));
}

// AND across facets, OR within a facet's selected values.
export function applyFacets(items: Item[], facets: FacetConfig[], state: FacetState): Item[] {
  return items.filter((item) =>
    facets.every((facet) => {
      const selected = state[facet.key];
      if (!selected || selected.length === 0) return true;
      const values = itemFacetValues(item, facet);
      return values.some((v) => selected.includes(v));
    })
  );
}

// Fill a title template like "${year} ${maker} ${name}" from an item.
export function fillTitle(item: Item, template?: string): string {
  const t = template ?? '${year} ${maker} ${name}';
  return t.replace(/\$\{(\w+)\}/g, (_, key: string) => {
    const v = rawValue(item, key);
    return v === undefined ? '' : String(v);
  }).trim();
}

// Format a card fact's value for display.
export function formatFact(item: Item, fact: CardFact): string | null {
  const v = rawValue(item, fact.key);
  if (v === undefined || v === null || v === '') return null;
  return `${v}${fact.suffix ?? ''}`;
}
