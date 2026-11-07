import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { ProgressBar } from '../components/common/ProgressBar';
import { MatchupView } from '../components/game/MatchupView';
import { useGame } from '../context/GameContext';
import { getCurrentTournamentMatchup, getTournamentProgress } from '../utils/tournament';
import { getCurrentEloMatchup, getEloProgress } from '../utils/elo';
import type { Car } from '../types';

export function GamePage() {
  const navigate = useNavigate();
  const { state, selectWinner } = useGame();

  // Redirect to results if game is complete
  useEffect(() => {
    if (state.isGameComplete) {
      navigate('/results');
    }
  }, [state.isGameComplete, navigate]);

  // Redirect to home if no game is active
  useEffect(() => {
    if (!state.isGameActive && !state.isGameComplete) {
      navigate('/');
    }
  }, [state.isGameActive, state.isGameComplete, navigate]);

  const getCurrentMatchup = (): { car1: Car; car2: Car } | null => {
    if (state.mode === 'tournament' && state.tournament) {
      return getCurrentTournamentMatchup(state.tournament);
    } else if (state.mode === 'elo' && state.elo) {
      return getCurrentEloMatchup(state.elo);
    }
    return null;
  };

  const getProgress = (): { current: number; total: number } => {
    if (state.mode === 'tournament' && state.tournament) {
      const { completedMatches, totalMatches } = getTournamentProgress(state.tournament);
      return { current: completedMatches, total: totalMatches };
    } else if (state.mode === 'elo' && state.elo) {
      return getEloProgress(state.elo);
    }
    return { current: 0, total: 0 };
  };

  const matchup = getCurrentMatchup();
  const progress = getProgress();

  // If no matchup and game is complete, show completion message while redirecting
  if (!matchup) {
    // Check if the game should be complete
    const isTournamentComplete = state.mode === 'tournament' && state.tournament?.winner;
    const isEloComplete = state.mode === 'elo' && state.elo?.completed;

    if (isTournamentComplete || isEloComplete) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Header />
          <PageContainer className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="text-center">
              <div className="text-6xl mb-4">{state.mode === 'tournament' ? '🏆' : '📊'}</div>
              <p className="text-gray-600 text-xl">
                {state.mode === 'tournament' ? 'Tournament Complete!' : 'Ratings Complete!'}
              </p>
              <p className="text-gray-400 mt-2">Preparing results...</p>
            </div>
          </PageContainer>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <PageContainer className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <p className="text-gray-600">Loading...</p>
        </PageContainer>
      </div>
    );
  }

  const getRoundLabel = () => {
    if (state.mode === 'tournament' && state.tournament) {
      const { currentRound, totalRounds } = state.tournament;
      if (currentRound === totalRounds) return 'Final';
      if (currentRound === totalRounds - 1) return 'Semifinal';
      if (currentRound === totalRounds - 2) return 'Quarterfinal';
      return `Round ${currentRound}`;
    }
    return `Match ${progress.current + 1}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <PageContainer>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {getRoundLabel()}
              </h2>
              <span className="text-sm text-gray-500">
                {state.mode === 'tournament' ? 'Tournament' : 'ELO Rating'}
              </span>
            </div>
            <ProgressBar
              current={progress.current}
              total={progress.total}
              label="Progress"
            />
          </div>

          <div className="text-center mb-6">
            <p className="text-lg text-gray-600">
              Click on the car you prefer
            </p>
          </div>

          <MatchupView
            car1={matchup.car1}
            car2={matchup.car2}
            onSelectWinner={selectWinner}
          />
        </div>
      </PageContainer>
    </div>
  );
}
