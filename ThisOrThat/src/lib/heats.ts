import type { Heat, HeatsBracket, Item } from '../types';

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function partition<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Group survivors into heats. A lone trailing entrant auto-advances (winner preset),
// so it never becomes a "tap the winner of 1" non-decision.
function buildRound(items: Item[], groupSize: number, round: number): Heat[] {
  return partition(items, groupSize).map((entrants, i) => ({
    id: `r${round}-h${i}`,
    round,
    entrants,
    winner: entrants.length === 1 ? entrants[0] : null,
  }));
}

// Move currentHeat/currentRound to the next heat awaiting a decision, building the
// next round from this round's winners when the round is exhausted. Sets `winner`
// once a single survivor remains.
function advance(bracket: HeatsBracket): HeatsBracket {
  const rounds = bracket.rounds.map((r) => r.map((h) => ({ ...h })));
  let currentRound = bracket.currentRound;
  let currentHeat = bracket.currentHeat;
  let winner: Item | null = null;

  for (;;) {
    const round = rounds[currentRound - 1];
    while (currentHeat < round.length && round[currentHeat].winner) currentHeat++;
    if (currentHeat < round.length) break; // found a playable heat

    const advancing = round.map((h) => h.winner).filter((w): w is Item => !!w);
    if (advancing.length <= 1) {
      winner = advancing[0] ?? null;
      break;
    }
    rounds.push(buildRound(advancing, bracket.groupSize, currentRound + 1));
    currentRound += 1;
    currentHeat = 0;
  }

  return { ...bracket, rounds, currentRound, currentHeat, winner };
}

export function createHeatsBracket(items: Item[], groupSize: number): HeatsBracket {
  const round1 = buildRound(shuffle(items), groupSize, 1);
  const eliminations = Math.max(0, items.length - 1);
  const estTotalHeats = Math.max(1, Math.ceil(eliminations / Math.max(1, groupSize - 1)));
  return advance({ groupSize, rounds: [round1], currentRound: 1, currentHeat: 0, winner: null, estTotalHeats });
}

export function getCurrentHeat(bracket: HeatsBracket): Item[] | null {
  if (bracket.winner) return null;
  const heat = bracket.rounds[bracket.currentRound - 1]?.[bracket.currentHeat];
  return heat && !heat.winner ? heat.entrants : null;
}

export function selectHeatWinner(bracket: HeatsBracket, winner: Item): HeatsBracket {
  const rounds = bracket.rounds.map((r) => r.map((h) => ({ ...h })));
  rounds[bracket.currentRound - 1][bracket.currentHeat].winner = winner;
  return advance({ ...bracket, rounds });
}

// Only multi-entrant heats are real decisions (singleton auto-advances don't count).
export function getHeatsProgress(bracket: HeatsBracket): { completed: number; total: number } {
  let completed = 0;
  let known = 0;
  for (const round of bracket.rounds) {
    for (const heat of round) {
      if (heat.entrants.length <= 1) continue;
      known++;
      if (heat.winner) completed++;
    }
  }
  return { completed, total: Math.max(bracket.estTotalHeats, known) };
}

// Approximate ranking from how many heats each item won (further = higher).
export function getHeatsRanking(bracket: HeatsBracket, items: Item[]): Item[] {
  const wins = new Map<string, number>();
  items.forEach((it) => wins.set(it.id, 0));
  for (const round of bracket.rounds) {
    for (const heat of round) {
      if (heat.winner && heat.entrants.length > 1) wins.set(heat.winner.id, (wins.get(heat.winner.id) || 0) + 1);
    }
  }
  return [...items].sort((a, b) => (wins.get(b.id) || 0) - (wins.get(a.id) || 0));
}
