import type { Car, TournamentBracket, TournamentMatch } from '../types';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function nextPowerOf2(n: number): number {
  let power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}

export function createTournamentBracket(cars: Car[]): TournamentBracket {
  const shuffledCars = shuffleArray(cars);
  const bracketSize = nextPowerOf2(shuffledCars.length);
  const totalRounds = Math.log2(bracketSize);

  // Pad with null for byes
  const paddedCars: (Car | null)[] = [...shuffledCars];
  while (paddedCars.length < bracketSize) {
    paddedCars.push(null);
  }

  // Create first round matches
  const firstRound: TournamentMatch[] = [];
  for (let i = 0; i < paddedCars.length; i += 2) {
    const car1 = paddedCars[i];
    const car2 = paddedCars[i + 1];

    // Handle byes - if one car is null, the other automatically advances
    const isBye = car1 === null || car2 === null;
    const winner = isBye ? (car1 || car2) : null;

    firstRound.push({
      id: `r1-m${i / 2}`,
      round: 1,
      matchIndex: i / 2,
      car1,
      car2,
      winner,
    });
  }

  // Create empty rounds for the rest of the tournament
  const rounds: TournamentMatch[][] = [firstRound];
  let matchesInRound = firstRound.length / 2;
  for (let round = 2; round <= totalRounds; round++) {
    const roundMatches: TournamentMatch[] = [];
    for (let i = 0; i < matchesInRound; i++) {
      roundMatches.push({
        id: `r${round}-m${i}`,
        round,
        matchIndex: i,
        car1: null,
        car2: null,
        winner: null,
      });
    }
    rounds.push(roundMatches);
    matchesInRound /= 2;
  }

  // Recursively process byes through ALL rounds until no new byes are created
  // This handles cases where multiple rounds of byes exist
  let madeProgress = true;
  while (madeProgress) {
    madeProgress = false;
    for (let r = 0; r < rounds.length; r++) {
      for (let m = 0; m < rounds[r].length; m++) {
        const match = rounds[r][m];
        const car1 = match.car1;
        const car2 = match.car2;

        // Skip if match already has a winner
        if (match.winner) continue;

        // Check if this is a bye (exactly one car present)
        const isBye = (car1 && !car2) || (!car1 && car2);

        if (isBye) {
          const byeWinner = car1 || car2;
          match.winner = byeWinner;

          // Advance to next round if not the final
          if (r < rounds.length - 1) {
            const nextMatchIndex = Math.floor(m / 2);
            const isFirstSlot = m % 2 === 0;
            if (isFirstSlot) {
              rounds[r + 1][nextMatchIndex].car1 = byeWinner;
            } else {
              rounds[r + 1][nextMatchIndex].car2 = byeWinner;
            }
          }
          madeProgress = true;
        }
      }
    }
  }

  // Find first playable match (both cars present, no winner)
  let currentRound = 1;
  let currentMatch = 0;
  let foundMatch = false;

  for (let r = 0; r < rounds.length && !foundMatch; r++) {
    for (let m = 0; m < rounds[r].length && !foundMatch; m++) {
      const match = rounds[r][m];
      if (match.car1 && match.car2 && !match.winner) {
        currentRound = r + 1;
        currentMatch = m;
        foundMatch = true;
      }
    }
  }

  // Check if tournament is already complete (single car or all byes led to a winner)
  const finalMatch = rounds[rounds.length - 1][0];
  const winner = finalMatch.winner;

  return {
    rounds,
    currentRound,
    currentMatch,
    totalRounds,
    winner,
  };
}

export function selectTournamentWinner(
  bracket: TournamentBracket,
  winner: Car
): TournamentBracket {
  const newBracket = JSON.parse(JSON.stringify(bracket)) as TournamentBracket;
  const currentRoundArr = newBracket.rounds[newBracket.currentRound - 1];
  const currentMatch = currentRoundArr[newBracket.currentMatch];

  // Set the winner
  currentMatch.winner = winner;

  // Advance winner to next round
  if (newBracket.currentRound < newBracket.totalRounds) {
    const nextRound = newBracket.rounds[newBracket.currentRound];
    const nextMatchIndex = Math.floor(newBracket.currentMatch / 2);
    const isFirstSlot = newBracket.currentMatch % 2 === 0;

    if (isFirstSlot) {
      nextRound[nextMatchIndex].car1 = winner;
    } else {
      nextRound[nextMatchIndex].car2 = winner;
    }
  }

  // Process any new byes that might have been created by this advancement
  // This handles cases where the other slot will never get a car
  let madeProgress = true;
  while (madeProgress) {
    madeProgress = false;
    for (let r = 0; r < newBracket.rounds.length; r++) {
      for (let m = 0; m < newBracket.rounds[r].length; m++) {
        const match = newBracket.rounds[r][m];

        // Skip if match already has a winner
        if (match.winner) continue;

        const car1 = match.car1;
        const car2 = match.car2;

        // Check if this is a bye situation (exactly one car present)
        // and the other slot will never get a car (check source matches)
        if ((car1 && !car2) || (!car1 && car2)) {
          // Check if the missing car's source match is complete or empty
          if (r > 0) {
            // Calculate which source match would provide the missing car
            const sourceMatchIndex = m * 2 + (car1 ? 1 : 0);

            // If source match exists and has no cars and no winner, this slot will never fill
            // Or if source match has a winner, the slot should already be filled
            if (sourceMatchIndex < newBracket.rounds[r - 1].length) {
              const srcMatch = newBracket.rounds[r - 1][sourceMatchIndex];
              // If source is complete (has winner) but this slot is empty,
              // or source can never produce a winner (both null)
              if (srcMatch.winner || (!srcMatch.car1 && !srcMatch.car2)) {
                const byeWinner = car1 || car2;
                match.winner = byeWinner;

                // Advance to next round
                if (r < newBracket.rounds.length - 1) {
                  const nextMatchIndex = Math.floor(m / 2);
                  const isFirstSlot = m % 2 === 0;
                  if (isFirstSlot) {
                    newBracket.rounds[r + 1][nextMatchIndex].car1 = byeWinner;
                  } else {
                    newBracket.rounds[r + 1][nextMatchIndex].car2 = byeWinner;
                  }
                }
                madeProgress = true;
              }
            }
          }
        }
      }
    }
  }

  // Find next playable match
  let nextMatchFound = false;
  let round = 1;
  let match = 0;

  for (let r = 0; r < newBracket.rounds.length && !nextMatchFound; r++) {
    for (let m = 0; m < newBracket.rounds[r].length && !nextMatchFound; m++) {
      const matchObj = newBracket.rounds[r][m];
      if (matchObj.car1 && matchObj.car2 && !matchObj.winner) {
        round = r + 1;
        match = m;
        nextMatchFound = true;
      }
    }
  }

  if (nextMatchFound) {
    newBracket.currentRound = round;
    newBracket.currentMatch = match;
  } else {
    // Tournament complete - find the final winner
    const finalRound = newBracket.rounds[newBracket.totalRounds - 1];
    newBracket.winner = finalRound[0].winner;
  }

  return newBracket;
}

export function getCurrentTournamentMatchup(
  bracket: TournamentBracket
): { car1: Car; car2: Car } | null {
  if (bracket.winner) return null;

  const currentRound = bracket.rounds[bracket.currentRound - 1];
  const currentMatch = currentRound[bracket.currentMatch];

  if (currentMatch.car1 && currentMatch.car2 && !currentMatch.winner) {
    return {
      car1: currentMatch.car1,
      car2: currentMatch.car2,
    };
  }

  return null;
}

export function getTournamentProgress(bracket: TournamentBracket): {
  completedMatches: number;
  totalMatches: number;
} {
  let completed = 0;
  let total = 0;

  for (const round of bracket.rounds) {
    for (const match of round) {
      // Only count real matches (where both cars exist or it's not a bye)
      if (match.car1 || match.car2) {
        total++;
        if (match.winner) {
          completed++;
        }
      }
    }
  }

  return { completedMatches: completed, totalMatches: total };
}
