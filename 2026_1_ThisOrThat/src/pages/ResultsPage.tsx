import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { useGame } from '../context/GameContext';
import { getEloRankings } from '../utils/elo';
import type { Car, TournamentBracket, TournamentMatch } from '../types';

export function ResultsPage() {
  const navigate = useNavigate();
  const { state, resetGame } = useGame();

  // Check if results are actually ready
  const hasResults =
    (state.mode === 'tournament' && state.tournament?.winner) ||
    (state.mode === 'elo' && state.elo?.completed);

  // Redirect to home if no game is complete and no results
  useEffect(() => {
    if (!state.isGameComplete && !hasResults) {
      navigate('/');
    }
  }, [state.isGameComplete, hasResults, navigate]);

  const handleGoHome = () => {
    resetGame();
    navigate('/');
  };

  // Show loading state while waiting for results to be ready
  if (!hasResults) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <PageContainer className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-600 text-xl">Loading results...</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (state.mode === 'tournament' && state.tournament?.winner) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <PageContainer>
          <div className="max-w-7xl mx-auto">
            {/* Champion Header */}
            <div className="text-center mb-8">
              <span className="text-6xl block mb-4">🏆</span>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Champion!
              </h1>
              <p className="text-gray-600 mb-6">
                {state.tournament.winner.year} {state.tournament.winner.brand} {state.tournament.winner.name}
              </p>

              {/* Large Winner Image */}
              <div className="max-w-2xl mx-auto">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-4 ring-yellow-400">
                  <img
                    src={state.tournament.winner.imageUrl}
                    alt={`${state.tournament.winner.year} ${state.tournament.winner.brand} ${state.tournament.winner.name}`}
                    className="w-full h-auto object-cover"
                  />
                  {/* Gradient overlay at bottom with car details */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <div className="text-white">
                      <div className="text-2xl font-bold">
                        {state.tournament.winner.brand} {state.tournament.winner.name}
                      </div>
                      <div className="text-yellow-300 text-lg">
                        {state.tournament.winner.year}
                      </div>
                      {state.tournament.winner.stats && (
                        <div className="flex gap-4 mt-2 text-sm text-gray-200">
                          <span>{state.tournament.winner.stats.horsepower} hp</span>
                          <span>{state.tournament.winner.stats.topSpeedMph} mph</span>
                          {state.tournament.winner.stats.zeroToSixty && (
                            <span>0-60 in {state.tournament.winner.stats.zeroToSixty}s</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Bracket */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 overflow-x-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Tournament Bracket
              </h2>
              <VisualBracket bracket={state.tournament} />
            </div>

            {/* Home Button */}
            <div className="text-center">
              <Button size="lg" onClick={handleGoHome}>
                Home
              </Button>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (state.mode === 'elo' && state.elo?.completed) {
    const rankings = getEloRankings(state.elo);
    const champion = rankings[0]?.car;

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <PageContainer>
          <div className="max-w-4xl mx-auto">
            {/* Champion Header - same style as tournament */}
            {champion && (
              <div className="text-center mb-8">
                <span className="text-6xl block mb-4">🏆</span>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Champion!
                </h1>
                <p className="text-gray-600 mb-6">
                  {champion.year} {champion.brand} {champion.name}
                </p>

                {/* Large Winner Image */}
                <div className="max-w-2xl mx-auto mb-8">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-4 ring-yellow-400">
                    <img
                      src={champion.imageUrl}
                      alt={`${champion.year} ${champion.brand} ${champion.name}`}
                      className="w-full h-auto object-cover"
                    />
                    {/* Gradient overlay at bottom with car details */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                      <div className="text-white">
                        <div className="text-2xl font-bold">
                          {champion.brand} {champion.name}
                        </div>
                        <div className="text-yellow-300 text-lg">
                          {champion.year}
                        </div>
                        {champion.stats && (
                          <div className="flex gap-4 mt-2 text-sm text-gray-200">
                            <span>{champion.stats.horsepower} hp</span>
                            <span>{champion.stats.topSpeedMph} mph</span>
                            {champion.stats.zeroToSixty && (
                              <span>0-60 in {champion.stats.zeroToSixty}s</span>
                            )}
                          </div>
                        )}
                        {rankings[0] && (
                          <div className="flex gap-4 mt-2 text-sm text-yellow-300">
                            <span>ELO: {rankings[0].rating}</span>
                            <span>{rankings[0].wins}W - {rankings[0].losses}L</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rankings Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Full Rankings
              </h2>
              <p className="text-gray-600 text-sm">
                Based on your {state.elo.totalMatchups} comparisons
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              {rankings.map((rating, index) => (
                <div
                  key={rating.car.id}
                  className={`flex items-center gap-4 p-4 ${
                    index !== rankings.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : index === 1
                        ? 'bg-gray-200 text-gray-700'
                        : index === 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-shrink-0 w-16 h-12 overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={rating.car.imageUrl}
                      alt={rating.car.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold text-gray-900">
                      {rating.car.year} {rating.car.brand} {rating.car.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {rating.wins}W - {rating.losses}L
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">
                      {rating.rating}
                    </span>
                    <p className="text-xs text-gray-500">ELO</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button size="lg" onClick={handleGoHome}>
                Home
              </Button>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  return null;
}

// Car thumbnail component with hover tooltip
function CarThumbnail({
  car,
  isWinner,
  isChampion,
}: {
  car: Car | null;
  isWinner: boolean;
  isChampion?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!car) {
    return (
      <div className="w-12 h-9 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
        BYE
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`w-12 h-9 rounded overflow-hidden transition-all ${
          isChampion
            ? 'ring-2 ring-yellow-500 shadow-lg shadow-yellow-500/30'
            : isWinner
            ? 'ring-2 ring-green-500 shadow-md shadow-green-500/20'
            : 'opacity-50'
        }`}
      >
        <img
          src={car.imageUrl}
          alt={car.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '';
            (e.target as HTMLImageElement).style.background = 'linear-gradient(135deg, #e5e7eb, #d1d5db)';
          }}
        />
      </div>

      {/* Hover Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xl min-w-[200px]">
            <div className="w-full h-24 rounded overflow-hidden mb-2 bg-gray-100">
              <img
                src={car.imageUrl}
                alt={car.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-gray-900 font-semibold text-sm">
              {car.year} {car.brand}
            </div>
            <div className="text-gray-600 text-sm">{car.name}</div>
            {car.stats && (
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                <div className="text-gray-500">
                  <span className="text-gray-700">{car.stats.horsepower}</span> hp
                </div>
                <div className="text-gray-500">
                  <span className="text-gray-700">{car.stats.topSpeedMph}</span> mph
                </div>
              </div>
            )}
            {isChampion && (
              <div className="mt-2 text-yellow-600 text-xs font-semibold flex items-center gap-1">
                🏆 Champion
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45" />
        </div>
      )}
    </div>
  );
}

// Single match component
function MatchCard({
  match,
  isLastRound,
  championId,
}: {
  match: TournamentMatch;
  isLastRound: boolean;
  championId?: string;
}) {
  const car1Won = match.winner?.id === match.car1?.id;
  const car2Won = match.winner?.id === match.car2?.id;

  // Skip rendering if both cars are null (empty bye slot)
  if (!match.car1 && !match.car2) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
      <div className="flex flex-col gap-1">
        {/* Car 1 */}
        <div className={`flex items-center gap-2 p-1 rounded ${car1Won ? 'bg-green-50' : ''}`}>
          <CarThumbnail
            car={match.car1}
            isWinner={car1Won}
            isChampion={isLastRound && match.car1?.id === championId}
          />
          {match.car1 && (
            <span className={`text-xs truncate max-w-[80px] ${car1Won ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
              {match.car1.brand}
            </span>
          )}
        </div>

        {/* VS Divider */}
        <div className="text-gray-400 text-[10px] text-center">vs</div>

        {/* Car 2 */}
        <div className={`flex items-center gap-2 p-1 rounded ${car2Won ? 'bg-green-50' : ''}`}>
          <CarThumbnail
            car={match.car2}
            isWinner={car2Won}
            isChampion={isLastRound && match.car2?.id === championId}
          />
          {match.car2 && (
            <span className={`text-xs truncate max-w-[80px] ${car2Won ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
              {match.car2.brand}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Get round name based on position from final
function getRoundName(roundIndex: number, totalRounds: number): string {
  const roundsFromFinal = totalRounds - roundIndex - 1;
  if (roundsFromFinal === 0) return 'Final';
  if (roundsFromFinal === 1) return 'Semifinals';
  if (roundsFromFinal === 2) return 'Quarterfinals';
  return `Round ${roundIndex + 1}`;
}

// Visual bracket component
function VisualBracket({ bracket }: { bracket: TournamentBracket }) {
  const championId = bracket.winner?.id;

  // Filter out rounds that have no real matches (all empty)
  const nonEmptyRounds = bracket.rounds.filter(round =>
    round.some(match => match.car1 || match.car2)
  );

  return (
    <div className="flex gap-4 min-w-max justify-center items-start">
      {nonEmptyRounds.map((round, roundIndex) => {
        // Filter matches that have at least one car
        const validMatches = round.filter(match => match.car1 || match.car2);
        const isLastRound = roundIndex === nonEmptyRounds.length - 1;

        // Split matches into top half (left bracket) and bottom half (right bracket)
        const midpoint = Math.ceil(validMatches.length / 2);
        const topHalf = validMatches.slice(0, midpoint);
        const bottomHalf = validMatches.slice(midpoint);

        return (
          <div key={roundIndex} className="flex flex-col">
            {/* Round Header */}
            <div className="text-center mb-4">
              <div className="text-gray-500 text-xs uppercase tracking-wider font-medium">
                {getRoundName(roundIndex, nonEmptyRounds.length)}
              </div>
            </div>

            {/* Matches - compact layout with bracket halves separated */}
            <div className="flex flex-col">
              {/* Top bracket half */}
              <div className="flex flex-col gap-2">
                {topHalf.map((match) => (
                  <div key={match.id} className="relative">
                    <MatchCard
                      match={match}
                      isLastRound={isLastRound}
                      championId={championId}
                    />
                    {roundIndex < nonEmptyRounds.length - 1 && match.winner && (
                      <div className="absolute top-1/2 -right-4 w-4 h-px bg-gray-300" />
                    )}
                  </div>
                ))}
              </div>

              {/* Bracket divider - only show when there are two halves */}
              {bottomHalf.length > 0 && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-gray-300" />
                  <span className="text-gray-400 text-[10px] uppercase tracking-wider">bracket</span>
                  <div className="flex-1 h-px bg-gray-300" />
                </div>
              )}

              {/* Bottom bracket half */}
              <div className="flex flex-col gap-2">
                {bottomHalf.map((match) => (
                  <div key={match.id} className="relative">
                    <MatchCard
                      match={match}
                      isLastRound={isLastRound}
                      championId={championId}
                    />
                    {roundIndex < nonEmptyRounds.length - 1 && match.winner && (
                      <div className="absolute top-1/2 -right-4 w-4 h-px bg-gray-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Champion Display */}
      {bracket.winner && (
        <div className="flex flex-col ml-4">
          <div className="text-center mb-4">
            <div className="text-yellow-600 text-xs uppercase tracking-wider font-semibold">
              Champion
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-300 shadow-lg">
            <div className="text-center mb-2">
              <span className="text-3xl">🏆</span>
            </div>
            <div className="w-24 h-18 rounded-lg overflow-hidden mb-2 ring-2 ring-yellow-400">
              <img
                src={bracket.winner.imageUrl}
                alt={bracket.winner.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <div className="text-yellow-800 font-bold text-sm">
                {bracket.winner.brand}
              </div>
              <div className="text-yellow-700 text-xs">
                {bracket.winner.name}
              </div>
              <div className="text-yellow-600 text-xs mt-1">
                {bracket.winner.year}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
