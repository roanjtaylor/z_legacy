import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandSelector } from '../components/curation/BrandSelector';
import { ModelSelector } from '../components/curation/ModelSelector';
import { ImageSelector } from '../components/curation/ImageSelector';
import { BRANDS } from '../data/brands';
import {
  saveCurationState,
  resetCurationState,
  generateCuratedCars,
  exportCarsJson,
  loadExistingCuratedCars,
  reconstructStateFromCuratedCars,
} from '../data/curation-state';
import type { CurationState, BrandData, ModelData } from '../types';

const defaultState: CurationState = {
  step: 'brands',
  selectedBrands: [],
  selectedModels: {},
  currentBrandIndex: 0,
  currentModelIndex: 0,
  imageSelections: {},
};

const CURATE_PASSWORD = import.meta.env.VITE_CURATE_PASSWORD || '';

export function CurationPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [state, setState] = useState<CurationState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [existingCount, setExistingCount] = useState(0);

  // Load from curated-cars.json on mount
  useEffect(() => {
    async function initializeFromJson() {
      setIsLoading(true);
      try {
        const existingCars = await loadExistingCuratedCars();
        setExistingCount(existingCars.length);
        if (existingCars.length > 0) {
          const reconstructedState = reconstructStateFromCuratedCars(existingCars);
          setState(reconstructedState);
        }
      } catch (e) {
        console.error('Failed to load existing cars:', e);
      }
      setIsLoading(false);
    }
    initializeFromJson();
  }, []);

  // Save state on changes (after initial load)
  useEffect(() => {
    if (!isLoading) {
      saveCurationState(state);
    }
  }, [state, isLoading]);

  const handleToggleBrand = useCallback((brandId: string) => {
    setState((prev) => {
      const isSelected = prev.selectedBrands.includes(brandId);
      return {
        ...prev,
        selectedBrands: isSelected
          ? prev.selectedBrands.filter((id) => id !== brandId)
          : [...prev.selectedBrands, brandId],
      };
    });
  }, []);

  const handleContinueToModels = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 'models',
      currentBrandIndex: 0,
    }));
  }, []);

  const handleToggleModel = useCallback((brandId: string, modelId: string) => {
    setState((prev) => {
      const brandModels = prev.selectedModels[brandId] || [];
      const isSelected = brandModels.includes(modelId);
      return {
        ...prev,
        selectedModels: {
          ...prev.selectedModels,
          [brandId]: isSelected
            ? brandModels.filter((id) => id !== modelId)
            : [...brandModels, modelId],
        },
      };
    });
  }, []);

  const handleSelectAllModels = useCallback((brandId: string) => {
    const brand = BRANDS.find((b: BrandData) => b.id === brandId);
    if (!brand) return;

    setState((prev) => ({
      ...prev,
      selectedModels: {
        ...prev.selectedModels,
        [brandId]: brand.models.map((m: ModelData) => m.id),
      },
    }));
  }, []);

  const handleDeselectAllModels = useCallback((brandId: string) => {
    setState((prev) => ({
      ...prev,
      selectedModels: {
        ...prev.selectedModels,
        [brandId]: [],
      },
    }));
  }, []);

  const handleSetBrandIndex = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      currentBrandIndex: index,
    }));
  }, []);

  const handleFinishModels = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 'images',
      currentModelIndex: 0,
    }));
  }, []);

  const handleSaveImage = useCallback((modelKey: string, imageUrl: string) => {
    setState((prev) => ({
      ...prev,
      imageSelections: {
        ...prev.imageSelections,
        [modelKey]: imageUrl,
      },
    }));
  }, []);

  const handleSkipModel = useCallback((modelKey: string) => {
    // Optionally track skipped models
    setState((prev) => {
      const { [modelKey]: _, ...rest } = prev.imageSelections;
      return {
        ...prev,
        imageSelections: rest,
      };
    });
  }, []);

  const handleBackToModels = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 'models',
    }));
  }, []);

  const handleExport = useCallback(() => {
    const cars = generateCuratedCars(BRANDS, state);
    exportCarsJson(cars);
    setState((prev) => ({
      ...prev,
      step: 'complete',
    }));
  }, [state]);

  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to reset all progress?')) {
      setState(resetCurationState());
    }
  }, []);

  const handleBackToBrands = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 'brands',
    }));
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === CURATE_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Access denied.');
      setPasswordInput('');
    }
  };

  // Show password gate if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-white mb-2">Curation Access</h1>
            <p className="text-gray-400">
              Enter the password to access the curation tool
            </p>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none mb-4"
              autoFocus
            />
            {passwordError && (
              <p className="text-red-400 text-sm mb-4">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Access Curation Tool
            </button>
          </form>
          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 px-4 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Back Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">Loading...</div>
          <p className="text-gray-400">Loading existing curated cars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top bar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">Car Dataset Curation</h1>
              {existingCount > 0 && (
                <p className="text-xs text-green-400">
                  Loaded {existingCount} existing cars from curated-cars.json
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <span
                className={`px-2 py-1 rounded text-sm ${
                  state.step === 'brands' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
              >
                1. Brands
              </span>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  state.step === 'models' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
              >
                2. Models
              </span>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  state.step === 'images' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
              >
                3. Images
              </span>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  state.step === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
              >
                4. Done
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              Back Home
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reset Progress
            </button>
          </div>
        </div>
      </div>

      {/* Content based on step */}
      {state.step === 'brands' && (
        <BrandSelector
          selectedBrands={state.selectedBrands}
          onToggleBrand={handleToggleBrand}
          onContinue={handleContinueToModels}
        />
      )}

      {state.step === 'models' && (
        <>
          <div className="max-w-4xl mx-auto pt-4 px-6">
            <button
              onClick={handleBackToBrands}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              ← Back to Brand Selection
            </button>
          </div>
          <ModelSelector
            selectedBrands={state.selectedBrands}
            selectedModels={state.selectedModels}
            currentBrandIndex={state.currentBrandIndex}
            onToggleModel={handleToggleModel}
            onSelectAll={handleSelectAllModels}
            onDeselectAll={handleDeselectAllModels}
            onFinish={handleFinishModels}
            onSetBrandIndex={handleSetBrandIndex}
          />
        </>
      )}

      {state.step === 'images' && (
        <ImageSelector
          selectedBrands={state.selectedBrands}
          selectedModels={state.selectedModels}
          imageSelections={state.imageSelections}
          onSaveImage={handleSaveImage}
          onSkipModel={handleSkipModel}
          onFinish={handleExport}
          onBack={handleBackToModels}
        />
      )}

      {state.step === 'complete' && (
        <div className="max-w-2xl mx-auto p-6 text-center">
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">Export Complete!</h2>
            <p className="text-gray-400 mb-6">
              Your curated car dataset has been downloaded as JSON.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  const cars = generateCuratedCars(BRANDS, state);
                  exportCarsJson(cars);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Download Again
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
              >
                Start Over
              </button>
            </div>
            <div className="mt-6 text-gray-500 text-sm">
              {Object.keys(state.imageSelections).length} cars in current session
              {existingCount > 0 && ` (merged with ${existingCount} existing)`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
