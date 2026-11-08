import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Car, GameAction, GameMode, GameState } from '../types';
import {
  createTournamentBracket,
  selectTournamentWinner,
} from '../utils/tournament';
import { createEloState, selectEloWinner } from '../utils/elo';

const initialState: GameState = {
  mode: 'tournament',
  filteredCars: [],
  tournament: null,
  elo: null,
  isGameActive: false,
  isGameComplete: false,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };

    case 'SET_FILTERED_CARS':
      return { ...state, filteredCars: action.payload };

    case 'START_TOURNAMENT': {
      const bracket = createTournamentBracket(action.payload);
      return {
        ...state,
        mode: 'tournament',
        filteredCars: action.payload,
        tournament: bracket,
        elo: null,
        isGameActive: true,
        isGameComplete: false,
      };
    }

    case 'TOURNAMENT_SELECT_WINNER': {
      if (!state.tournament) return state;
      const newBracket = selectTournamentWinner(state.tournament, action.payload);
      return {
        ...state,
        tournament: newBracket,
        isGameComplete: newBracket.winner !== null,
      };
    }

    case 'START_ELO': {
      const eloState = createEloState(action.payload);
      return {
        ...state,
        mode: 'elo',
        filteredCars: action.payload,
        tournament: null,
        elo: eloState,
        isGameActive: true,
        isGameComplete: false,
      };
    }

    case 'ELO_SELECT_WINNER': {
      if (!state.elo) return state;
      const newElo = selectEloWinner(state.elo, action.payload);
      return {
        ...state,
        elo: newElo,
        isGameComplete: newElo.completed,
      };
    }

    case 'RESET_GAME':
      return {
        ...initialState,
        mode: state.mode,
      };

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  setMode: (mode: GameMode) => void;
  startGame: (cars: Car[]) => void;
  selectWinner: (car: Car) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setMode = (mode: GameMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  };

  const startGame = (cars: Car[]) => {
    if (state.mode === 'tournament') {
      dispatch({ type: 'START_TOURNAMENT', payload: cars });
    } else {
      dispatch({ type: 'START_ELO', payload: cars });
    }
  };

  const selectWinner = (car: Car) => {
    if (state.mode === 'tournament') {
      dispatch({ type: 'TOURNAMENT_SELECT_WINNER', payload: car });
    } else {
      dispatch({ type: 'ELO_SELECT_WINNER', payload: car });
    }
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        setMode,
        startGame,
        selectWinner,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
