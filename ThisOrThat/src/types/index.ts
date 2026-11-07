// Core car data types
export interface CarStats {
  horsepower: number;
  topSpeedMph: number;
  zeroToSixty: number;
  engineDisplacementL: number;
  weightLbs: number;
}

export interface ExtendedStats {
  torqueLbFt: number;
  fuelEconomyMpg?: number;
  transmission: string;
  drivetrain: string;
}

export interface CollectorStats {
  productionCount?: number;
  rarityTier?: 'common' | 'uncommon' | 'rare' | 'legendary';
  originalMsrp?: number;
  estimatedCurrentValue?: number;
}

export interface Car {
  id: string;
  name: string;
  brand: string;
  year: number;
  country: string;
  decade: string;
  imageUrl: string;
  imageAttribution: string;
  stats?: CarStats;
  extendedStats?: ExtendedStats;
  collectorStats?: CollectorStats;
}

// Game mode types
export type GameMode = 'tournament' | 'elo';

// Filter types
export interface FilterState {
  decades: string[];
  countries: string[];
  brands: string[];
  drivetrains: string[];
  rarityTiers: string[];
}

// Tournament types
export interface TournamentMatch {
  id: string;
  round: number;
  matchIndex: number;
  car1: Car | null;
  car2: Car | null;
  winner: Car | null;
}

export interface TournamentBracket {
  rounds: TournamentMatch[][];
  currentRound: number;
  currentMatch: number;
  totalRounds: number;
  winner: Car | null;
}

// ELO types
export interface EloRating {
  car: Car;
  rating: number;
  wins: number;
  losses: number;
}

export interface EloMatchup {
  car1: Car;
  car2: Car;
}

export interface EloState {
  ratings: Map<string, EloRating>;
  matchups: EloMatchup[];
  currentMatchIndex: number;
  totalMatchups: number;
  completed: boolean;
}

// Game context state
export interface GameState {
  mode: GameMode;
  filteredCars: Car[];
  tournament: TournamentBracket | null;
  elo: EloState | null;
  isGameActive: boolean;
  isGameComplete: boolean;
}

export type GameAction =
  | { type: 'SET_MODE'; payload: GameMode }
  | { type: 'SET_FILTERED_CARS'; payload: Car[] }
  | { type: 'START_TOURNAMENT'; payload: Car[] }
  | { type: 'TOURNAMENT_SELECT_WINNER'; payload: Car }
  | { type: 'START_ELO'; payload: Car[] }
  | { type: 'ELO_SELECT_WINNER'; payload: Car }
  | { type: 'RESET_GAME' };

// Curation types
export interface ModelData {
  id: string;
  name: string;
  yearStart: number;
  yearEnd?: number;
}

export interface BrandData {
  id: string;
  name: string;
  country: string;
  models: ModelData[];
}

export interface CurationState {
  step: 'brands' | 'models' | 'images' | 'complete';
  selectedBrands: string[];
  selectedModels: Record<string, string[]>;
  currentBrandIndex: number;
  currentModelIndex: number;
  imageSelections: Record<string, string>;
}

export interface CuratedCar {
  id: string;
  name: string;
  brand: string;
  year: number;
  country: string;
  decade: string;
  imageUrl: string;
  imageAttribution: string;
}
