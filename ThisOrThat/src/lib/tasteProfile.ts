import type { Branch, FacetAffinity, Item, TasteProfile } from '../types';
import { itemFacetValues } from './facets';

// Build a taste profile from a final ranking (works for both ELO and tournament,
// since it only needs the ordered list). Each item gets a rank-based score in [0,1]
// (1 = most preferred). A facet value's "affinity" is how far the mean score of items
// carrying that value sits above or below the overall average — positive means the
// user's eye leans toward it.
export function computeTasteProfile(ranked: Item[], branch: Branch, topN = 3): TasteProfile {
  const n = ranked.length;
  const score = new Map<string, number>();
  ranked.forEach((item, i) => score.set(item.id, n > 1 ? (n - 1 - i) / (n - 1) : 1));

  const baseline = n > 1 ? 0.5 : 1; // mean of rank scores

  const facetAffinities: TasteProfile['facetAffinities'] = {};
  for (const facet of branch.filterFacets) {
    const byValue = new Map<string, number[]>();
    for (const item of ranked) {
      for (const v of itemFacetValues(item, facet)) {
        if (!byValue.has(v)) byValue.set(v, []);
        byValue.get(v)!.push(score.get(item.id)!);
      }
    }
    const values: FacetAffinity[] = [];
    for (const [value, scores] of byValue) {
      if (scores.length < 2) continue; // need support to be meaningful
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      values.push({ value, affinity: +(2 * (mean - baseline)).toFixed(3), count: scores.length });
    }
    values.sort((a, b) => b.affinity - a.affinity);
    if (values.length > 0) facetAffinities[facet.key] = { label: facet.label, values };
  }

  // Signature: the strongest positive affinity from each facet, then the best overall.
  const candidates = Object.values(facetAffinities)
    .flatMap((f) => f.values.map((v) => ({ facetLabel: f.label, value: v.value, affinity: v.affinity })))
    .filter((c) => c.affinity > 0)
    .sort((a, b) => b.affinity - a.affinity);

  const signature: TasteProfile['signature'] = [];
  const usedFacets = new Set<string>();
  for (const c of candidates) {
    if (usedFacets.has(c.facetLabel)) continue; // one per facet for variety
    signature.push(c);
    usedFacets.add(c.facetLabel);
    if (signature.length >= topN) break;
  }

  return { ranked, topPicks: ranked.slice(0, topN), facetAffinities, signature };
}
