import type { Car, EloMatchup, EloRating, EloState } from '../types';

const K_FACTOR = 32;
const INITIAL_RATING = 1500;

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateMatchups(cars: Car[], matchupCount: number): EloMatchup[] {
  const matchups: EloMatchup[] = [];
  const carCount = cars.length;

  // Generate balanced matchups - each car should appear roughly equally
  const appearances = new Map<string, number>();
  cars.forEach((car) => appearances.set(car.id, 0));

  for (let i = 0; i < matchupCount; i++) {
    // Sort cars by appearances (ascending) to balance
    const sortedCars = [...cars].sort(
      (a, b) => (appearances.get(a.id) || 0) - (appearances.get(b.id) || 0)
    );

    // Pick two cars with lowest appearances
    const car1 = sortedCars[0];
    // Pick second car randomly from bottom half to add variety
    const bottomHalf = sortedCars.slice(0, Math.max(2, Math.ceil(carCount / 2)));
    const car2Candidates = bottomHalf.filter((c) => c.id !== car1.id);
    const car2 = car2Candidates[Math.floor(Math.random() * car2Candidates.length)];

    matchups.push({ car1, car2 });
    appearances.set(car1.id, (appearances.get(car1.id) || 0) + 1);
    appearances.set(car2.id, (appearances.get(car2.id) || 0) + 1);
  }

  // Shuffle the matchups so they're not in order
  return shuffleArray(matchups);
}

export function createEloState(cars: Car[]): EloState {
  const ratings = new Map<string, EloRating>();

  cars.forEach((car) => {
    ratings.set(car.id, {
      car,
      rating: INITIAL_RATING,
      wins: 0,
      losses: 0,
    });
  });

  // Generate 2x the number of cars as matchups
  const matchupCount = cars.length * 2;
  const matchups = generateMatchups(cars, matchupCount);

  return {
    ratings,
    matchups,
    currentMatchIndex: 0,
    totalMatchups: matchups.length,
    completed: false,
  };
}

function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function selectEloWinner(state: EloState, winner: Car): EloState {
  const currentMatchup = state.matchups[state.currentMatchIndex];
  const loser =
    currentMatchup.car1.id === winner.id
      ? currentMatchup.car2
      : currentMatchup.car1;

  const newRatings = new Map(state.ratings);

  const winnerRating = newRatings.get(winner.id)!;
  const loserRating = newRatings.get(loser.id)!;

  const expectedWinner = calculateExpectedScore(
    winnerRating.rating,
    loserRating.rating
  );
  const expectedLoser = calculateExpectedScore(
    loserRating.rating,
    winnerRating.rating
  );

  // Update ratings
  const newWinnerRating = winnerRating.rating + K_FACTOR * (1 - expectedWinner);
  const newLoserRating = loserRating.rating + K_FACTOR * (0 - expectedLoser);

  newRatings.set(winner.id, {
    ...winnerRating,
    rating: Math.round(newWinnerRating),
    wins: winnerRating.wins + 1,
  });

  newRatings.set(loser.id, {
    ...loserRating,
    rating: Math.round(newLoserRating),
    losses: loserRating.losses + 1,
  });

  const newMatchIndex = state.currentMatchIndex + 1;
  const isCompleted = newMatchIndex >= state.totalMatchups;

  return {
    ...state,
    ratings: newRatings,
    currentMatchIndex: newMatchIndex,
    completed: isCompleted,
  };
}

export function getCurrentEloMatchup(state: EloState): EloMatchup | null {
  if (state.completed) return null;
  return state.matchups[state.currentMatchIndex];
}

export function getEloRankings(state: EloState): EloRating[] {
  const ratings = Array.from(state.ratings.values());
  return ratings.sort((a, b) => b.rating - a.rating);
}

export function getEloProgress(state: EloState): {
  current: number;
  total: number;
} {
  return {
    current: state.currentMatchIndex,
    total: state.totalMatchups,
  };
}
