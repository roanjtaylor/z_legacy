import type { Item } from './item';

// What the session produces.
export type CompareMode = 'elo' | 'tournament';
// How many items are shown at once. Independent of mode.
export type CompareView = 'pair' | 'quad';

export const groupSizeForView = (view: CompareView): number => (view === 'quad' ? 4 : 2);

export interface Matchup {
  a: Item;
  b: Item;
}

export interface EloRating {
  item: Item;
  rating: number;
  wins: number;
  losses: number;
  seen: number;
}

export interface EloState {
  ratings: Map<string, EloRating>;
  // The 'pair' view walks matchups; the 'quad' view walks panels. Exactly one is set.
  matchups?: Matchup[];
  panels?: Item[][];
  panelSize?: number;
  currentIndex: number;
  total: number;
  completed: boolean;
}

// Single-elimination by heats: each heat is a group of `groupSize` items (2 = 1-v-1,
// 4 = quad) whose winner advances. One engine covers both views.
export interface Heat {
  id: string;
  round: number; // 1-based
  entrants: Item[];
  winner: Item | null;
}

export interface HeatsBracket {
  groupSize: number;
  rounds: Heat[][];
  currentRound: number; // 1-based
  currentHeat: number; // 0-based within the round
  winner: Item | null;
  estTotalHeats: number; // for the progress bar (heats grow as rounds are built)
}

export interface FacetAffinity {
  value: string;
  affinity: number; // -1..+1, centred on 0 (0 = average preference)
  count: number;
}

export interface TasteProfile {
  ranked: Item[];
  topPicks: Item[];
  // affinities per filter-facet key, strongest first
  facetAffinities: Record<string, { label: string; values: FacetAffinity[] }>;
  signature: { facetLabel: string; value: string; affinity: number }[];
}

// Reason a choice was made, picked from a branch's critiqueDimensions.
export interface CritiqueMeta {
  dims?: string[]; // critique-dimension keys, about the focus item
  note?: string;
}

// A single recorded decision, persisted to data/judgments/<branch>.jsonl so the
// curation pipeline can later learn what the eye seeks. Every pick — 1-v-1 or
// 4-up, ranking or bracket — reduces to "focus beat the others".
export interface Judgment extends CritiqueMeta {
  ts: string;
  branch: string;
  mode: CompareMode;
  view: CompareView;
  focus: string; // the chosen item the reason is about
  winners: string[]; // ids that won (just the focus)
  losers: string[]; // the other contestants on screen
}
