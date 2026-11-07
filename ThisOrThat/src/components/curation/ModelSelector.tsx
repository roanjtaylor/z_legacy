import { useState, useMemo } from 'react';
import { BRANDS } from '../../data/brands';
import type { BrandData, ModelData } from '../../types';

interface ModelSelectorProps {
  selectedBrands: string[];
  selectedModels: Record<string, string[]>;
  currentBrandIndex: number;
  onToggleModel: (brandId: string, modelId: string) => void;
  onSelectAll: (brandId: string) => void;
  onDeselectAll: (brandId: string) => void;
  onFinish: () => void;
  onSetBrandIndex: (index: number) => void;
}

type ViewMode = 'new' | 'selected';

export function ModelSelector({
  selectedBrands,
  selectedModels,
  currentBrandIndex,
  onToggleModel,
  onSelectAll,
  onDeselectAll,
  onFinish,
  onSetBrandIndex,
}: ModelSelectorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('new');

  // Categorize brands into new (no models selected) vs selected (has models)
  const { newBrands, selectedBrandsWithModels } = useMemo(() => {
    const newB: string[] = [];
    const selectedB: string[] = [];

    for (const brandId of selectedBrands) {
      const hasModels = (selectedModels[brandId]?.length || 0) > 0;
      if (hasModels) {
        selectedB.push(brandId);
      } else {
        newB.push(brandId);
      }
    }

    return { newBrands: newB, selectedBrandsWithModels: selectedB };
  }, [selectedBrands, selectedModels]);

  // Get the brands to display based on view mode
  const displayBrands = viewMode === 'new' ? newBrands : selectedBrandsWithModels;

  // Find current brand in the display list
  const currentBrandId = selectedBrands[currentBrandIndex];
  const displayIndex = displayBrands.indexOf(currentBrandId);

  // If current brand isn't in view, switch to first brand in current view
  const effectiveBrandId = displayIndex >= 0
    ? currentBrandId
    : displayBrands[0] || currentBrandId;

  const currentBrand = BRANDS.find((b: BrandData) => b.id === effectiveBrandId);

  // Calculate total selected models across all brands
  const totalSelectedModels = Object.values(selectedModels).reduce(
    (sum, models) => sum + models.length,
    0
  );

  // Handle navigation within current view
  const handlePrevInView = () => {
    const currentDisplayIdx = displayBrands.indexOf(effectiveBrandId);
    if (currentDisplayIdx > 0) {
      const prevBrandId = displayBrands[currentDisplayIdx - 1];
      const globalIdx = selectedBrands.indexOf(prevBrandId);
      onSetBrandIndex(globalIdx);
    }
  };

  const handleNextInView = () => {
    const currentDisplayIdx = displayBrands.indexOf(effectiveBrandId);
    if (currentDisplayIdx < displayBrands.length - 1) {
      const nextBrandId = displayBrands[currentDisplayIdx + 1];
      const globalIdx = selectedBrands.indexOf(nextBrandId);
      onSetBrandIndex(globalIdx);
    }
  };

  // Switch view mode and jump to first brand in that view
  const switchViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    const targetBrands = mode === 'new' ? newBrands : selectedBrandsWithModels;
    if (targetBrands.length > 0) {
      const globalIdx = selectedBrands.indexOf(targetBrands[0]);
      onSetBrandIndex(globalIdx);
    }
  };

  if (!currentBrand) {
    return <div className="text-white p-6">Brand not found</div>;
  }

  const brandModelSelections = selectedModels[effectiveBrandId] || [];
  const currentDisplayIdx = displayBrands.indexOf(effectiveBrandId);
  const isFirstInView = currentDisplayIdx <= 0;
  const isLastInView = currentDisplayIdx >= displayBrands.length - 1;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Select Models</h1>
          <div className="text-gray-400">
            {displayBrands.length > 0 ? (
              <>Brand {currentDisplayIdx + 1} of {displayBrands.length}</>
            ) : (
              <>No brands in this view</>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {displayBrands.length > 0 && (
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentDisplayIdx + 1) / displayBrands.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => switchViewMode('new')}
          className={`
            flex-1 py-2 px-4 rounded-lg font-medium transition-all
            ${viewMode === 'new'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
        >
          New Brands ({newBrands.length})
        </button>
        <button
          onClick={() => switchViewMode('selected')}
          className={`
            flex-1 py-2 px-4 rounded-lg font-medium transition-all
            ${viewMode === 'selected'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
        >
          View Selected ({selectedBrandsWithModels.length})
        </button>
      </div>

      {/* Empty state */}
      {displayBrands.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">
            {viewMode === 'new'
              ? 'All brands have models selected. Switch to "View Selected" to edit.'
              : 'No brands have models selected yet. Switch to "New Brands" to start.'}
          </p>
        </div>
      )}

      {/* Current brand header */}
      {displayBrands.length > 0 && (
        <>
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{currentBrand.name}</h2>
                <p className="text-gray-400">{currentBrand.country}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSelectAll(effectiveBrandId)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Select All
                </button>
                <button
                  onClick={() => onDeselectAll(effectiveBrandId)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Selected: {brandModelSelections.length} / {currentBrand.models.length} models
            </div>
          </div>

          {/* Model grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-24">
            {currentBrand.models.map((model: ModelData) => {
              const isSelected = brandModelSelections.includes(model.id);
              return (
                <button
                  key={model.id}
                  onClick={() => onToggleModel(effectiveBrandId, model.id)}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-left
                    ${isSelected
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                    }
                  `}
                >
                  <div className="font-medium">{model.name}</div>
                  <div className="text-sm text-gray-400">
                    {model.yearStart}{model.yearEnd ? ` - ${model.yearEnd}` : ' - present'}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={handlePrevInView}
            disabled={isFirstInView || displayBrands.length === 0}
            className={`
              px-4 py-2 rounded-lg font-semibold transition-all
              ${isFirstInView || displayBrands.length === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-500'
              }
            `}
          >
            Previous Brand
          </button>

          <div className="text-gray-400 text-center">
            <div>Total: {totalSelectedModels} models selected</div>
          </div>

          {isLastInView || displayBrands.length === 0 ? (
            <button
              onClick={onFinish}
              disabled={totalSelectedModels < 1}
              className={`
                px-6 py-2 rounded-lg font-semibold transition-all
                ${totalSelectedModels >= 1
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Continue to Images
            </button>
          ) : (
            <button
              onClick={handleNextInView}
              className="px-6 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              Next Brand
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
