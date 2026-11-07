import type { EloRating, EloState, Item, Matchup } from '../types';

const K_FACTOR = 32;
const INITIAL_RATING = 1500;

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Generate balanced matchups so every item appears roughly equally often.
function generateMatchups(items: Item[], count: number): Matchup[] {
  const matchups: Matchup[] = [];
  const appearances = new Map<string, number>();
  items.forEach((it) => appearances.set(it.id, 0));

  for (let i = 0; i < count; i++) {
    const sorted = [...items].sort(
      (a, b) => (appearances.get(a.id) || 0) - (appearances.get(b.id) || 0)
    );
    const a = sorted[0];
    const pool = sorted.slice(0, Math.max(2, Math.ceil(items.length / 2))).filter((c) => c.id !== a.id);
    const b = pool[Math.floor(Math.random() * pool.length)];
    matchups.push({ a, b });
    appearances.set(a.id, (appearances.get(a.id) || 0) + 1);
    appearances.set(b.id, (appearances.get(b.id) || 0) + 1);
  }
  return shuffle(matchups);
}

function initRatings(items: Item[]): Map<string, EloRating> {
  const ratings = new Map<string, EloRating>();
  items.forEach((item) => ratings.set(item.id, { item, rating: INITIAL_RATING, wins: 0, losses: 0, seen: 0 }));
  return ratings;
}

export function createEloState(items: Item[]): EloState {
  const matchups = generateMatchups(items, items.length * 2);
  return { ratings: initRatings(items), matchups, currentIndex: 0, total: matchups.length, completed: false };
}

function expectedScore(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

// Apply a single pairwise result, mutating the given ratings map in place. Shared
// by both the 1-v-1 and grid modes (a grid pick is just several pairwise results).
function applyPairwise(ratings: Map<string, EloRating>, winnerId: string, loserId: string): void {
  const w = ratings.get(winnerId)!;
  const l = ratings.get(loserId)!;
  const ew = expectedScore(w.rating, l.rating);
  const el = expectedScore(l.rating, w.rating);
  ratings.set(winnerId, {
    ...w,
    rating: Math.round(w.rating + K_FACTOR * (1 - ew)),
    wins: w.wins + 1,
    seen: w.seen + 1,
  });
  ratings.set(loserId, {
    ...l,
    rating: Math.round(l.rating + K_FACTOR * (0 - el)),
    losses: l.losses + 1,
    seen: l.seen + 1,
  });
}

export function getCurrentEloMatchup(state: EloState): Matchup | null {
  if (state.completed || !state.matchups) return null;
  return state.matchups[state.currentIndex];
}

export function selectEloWinner(state: EloState, winner: Item): EloState {
  const matchup = state.matchups![state.currentIndex];
  const loser = matchup.a.id === winner.id ? matchup.b : matchup.a;
  const ratings = new Map(state.ratings);
  applyPairwise(ratings, winner.id, loser.id);
  const currentIndex = state.currentIndex + 1;
  return { ...state, ratings, currentIndex, completed: currentIndex >= state.total };
}

// --- Grid modes -----------------------------------------------------------------

// Build panels of `panelSize` items where every item appears roughly equally,
// enough times for its rating to settle (targetAppearances per item).
function generatePanels(items: Item[], panelSize: number, targetAppearances = 3): Item[][] {
  const size = Math.min(panelSize, items.length);
  const panelCount = Math.max(1, Math.ceil((items.length * targetAppearances) / size));
  const seen = new Map<string, number>();
  items.forEach((it) => seen.set(it.id, 0));

  const panels: Item[][] = [];
  for (let p = 0; p < panelCount; p++) {
    // Shuffle first so ties in appearance count are broken randomly.
    const pool = shuffle(items).sort((a, b) => (seen.get(a.id) || 0) - (seen.get(b.id) || 0));
    const panel = pool.slice(0, size);
    panel.forEach((it) => seen.set(it.id, (seen.get(it.id) || 0) + 1));
    panels.push(shuffle(panel));
  }
  return panels;
}

export function createGridState(items: Item[], panelSize = 6): EloState {
  const panels = generatePanels(items, panelSize);
  return { ratings: initRatings(items), panels, panelSize, currentIndex: 0, total: panels.length, completed: false };
}

export function getCurrentPanel(state: EloState): Item[] | null {
  if (state.completed || !state.panels) return null;
  return state.panels[state.currentIndex];
}

// Resolve a panel: the chosen focus beats every other item on screen.
export function resolveGridPanel(state: EloState, focusId: string): EloState {
  const panel = state.panels![state.currentIndex];
  const ratings = new Map(state.ratings);
  for (const other of panel) {
    if (other.id === focusId) continue;
    applyPairwise(ratings, focusId, other.id);
  }
  const currentIndex = state.currentIndex + 1;
  return { ...state, ratings, currentIndex, completed: currentIndex >= state.total };
}

export function getEloRankings(state: EloState): EloRating[] {
  return Array.from(state.ratings.values()).sort((a, b) => b.rating - a.rating);
}
