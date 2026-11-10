import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Toggle } from '../components/common/Toggle';
import { useGame } from '../context/GameContext';
import {
  filterCars,
  getAvailableDecades,
  getUniqueCountries,
  getUniqueBrands,
  getAvailableDrivetrains,
  getAvailableRarityTiers,
  emptyFilters,
} from '../utils/filters';
import { useCuratedCars } from '../hooks/useCuratedCars';
import type { FilterState } from '../types';
import landingBg from '../assets/Landing-Background.jpg';

// Rarity tier display config
const RARITY_STYLES: Record<string, { bg: string; text: string; activeBg: string }> = {
  common: { bg: 'bg-white/60', text: 'text-gray-700', activeBg: 'bg-gray-600' },
  uncommon: { bg: 'bg-blue-100/80', text: 'text-blue-700', activeBg: 'bg-blue-600' },
  rare: { bg: 'bg-purple-100/80', text: 'text-purple-700', activeBg: 'bg-purple-600' },
  legendary: { bg: 'bg-yellow-100/80', text: 'text-yellow-700', activeBg: 'bg-yellow-500' },
};

export function SetupPage() {
  const navigate = useNavigate();
  const { state, setMode, startGame } = useGame();
  const { cars, isLoading, error } = useCuratedCars();

  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  const availableDecades = useMemo(() => getAvailableDecades(cars), [cars]);
  const availableCountries = useMemo(() => getUniqueCountries(cars), [cars]);
  const availableBrands = useMemo(() => getUniqueBrands(cars), [cars]);
  const availableDrivetrains = useMemo(() => getAvailableDrivetrains(cars), [cars]);
  const availableRarityTiers = useMemo(() => getAvailableRarityTiers(cars), [cars]);

  const filteredCars = useMemo(() => filterCars(cars, filters), [cars, filters]);

  const hasActiveFilters =
    filters.decades.length > 0 ||
    filters.countries.length > 0 ||
    filters.brands.length > 0 ||
    filters.drivetrains.length > 0 ||
    filters.rarityTiers.length > 0;

  // Loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen w-full relative"
        style={{
          backgroundImage: `url(${landingBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <div className="text-4xl mb-4">Loading...</div>
            <p className="text-gray-600">Loading your curated cars...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error or no cars
  if (error || cars.length === 0) {
    return (
      <div
        className="min-h-screen w-full relative"
        style={{
          backgroundImage: `url(${landingBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-md bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <div className="text-6xl mb-4">🚗</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Cars Available</h2>
            <p className="text-gray-600 mb-6">
              {error || 'No curated cars found. Visit /curate to add cars to your dataset.'}
            </p>
            <Button onClick={() => navigate('/curate')}>Go to Curation Tool</Button>
          </div>
        </div>
      </div>
    );
  }

  const toggleFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
  };

  const handleStart = () => {
    if (filteredCars.length >= 2) {
      startGame(filteredCars);
      navigate('/game');
    }
  };

  const handleModeToggle = (value: 'left' | 'right') => {
    setMode(value === 'left' ? 'tournament' : 'elo');
  };

  const canStart = filteredCars.length >= 2;

  return (
    <div
      className="min-h-screen w-full relative"
      style={{
        backgroundImage: `url(${landingBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Home
            </button>
            <h1 className="text-xl font-bold text-gray-900">Game Setup</h1>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Mode Toggle Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Game Mode</h2>
                <p className="text-gray-600 text-sm">
                  {state.mode === 'tournament'
                    ? 'Single elimination bracket to find your #1 favorite'
                    : 'Rate all cars to create a complete ranking'}
                </p>
              </div>
              <Toggle
                leftLabel="Tournament"
                rightLabel="ELO"
                value={state.mode === 'tournament' ? 'left' : 'right'}
                onChange={handleModeToggle}
              />
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Filter Cars</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Decades */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Decade</h3>
              <div className="flex flex-wrap gap-2">
                {availableDecades.map((decade) => (
                  <button
                    key={decade}
                    onClick={() => toggleFilter('decades', decade)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filters.decades.includes(decade)
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white/60 text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    {decade}
                  </button>
                ))}
              </div>
            </div>

            {/* Countries */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Country</h3>
              <div className="flex flex-wrap gap-2">
                {availableCountries.map((country) => (
                  <button
                    key={country}
                    onClick={() => toggleFilter('countries', country)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filters.countries.includes(country)
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white/60 text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Brand</h3>
              <div className="flex flex-wrap gap-2">
                {availableBrands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => toggleFilter('brands', brand)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filters.brands.includes(brand)
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white/60 text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Drivetrain */}
            {availableDrivetrains.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Drivetrain</h3>
                <div className="flex flex-wrap gap-2">
                  {availableDrivetrains.map((drivetrain) => (
                    <button
                      key={drivetrain}
                      onClick={() => toggleFilter('drivetrains', drivetrain)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        filters.drivetrains.includes(drivetrain)
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-white/60 text-gray-700 hover:bg-white/80'
                      }`}
                    >
                      {drivetrain}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rarity Tier */}
            {availableRarityTiers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Rarity</h3>
                <div className="flex flex-wrap gap-2">
                  {availableRarityTiers.map((tier) => {
                    const style = RARITY_STYLES[tier] || RARITY_STYLES.common;
                    const isActive = filters.rarityTiers.includes(tier);
                    return (
                      <button
                        key={tier}
                        onClick={() => toggleFilter('rarityTiers', tier)}
                        className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                          isActive
                            ? `${style.activeBg} text-white shadow-lg`
                            : `${style.bg} ${style.text} hover:opacity-90`
                        }`}
                      >
                        {tier}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Car Count & Start */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 text-center">
            <div className="mb-4">
              <span className="text-4xl font-bold text-blue-600">{filteredCars.length}</span>
              <span className="text-lg text-gray-600 ml-2">
                {filteredCars.length === 1 ? 'car' : 'cars'} selected
              </span>
            </div>

            {!canStart && (
              <p className="text-red-500 mb-4 font-medium">
                Select at least 2 cars to start the game
              </p>
            )}

            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/')}>
                Back
              </Button>
              <Button size="lg" onClick={handleStart} disabled={!canStart}>
                Start {state.mode === 'tournament' ? 'Tournament' : 'ELO Rating'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
