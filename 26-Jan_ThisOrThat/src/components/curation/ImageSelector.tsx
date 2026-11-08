import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BRANDS } from '../../data/brands';
import { useGoogleImageSearch, isGoogleApiConfigured } from '../../hooks/useGoogleImageSearch';
import type { BrandData, ModelData } from '../../types';

// Threshold in pixels - if mouse moves more than this, it's a drag not a click
const DRAG_THRESHOLD = 5;

interface ImageSelectorProps {
  selectedBrands: string[];
  selectedModels: Record<string, string[]>;
  imageSelections: Record<string, string>;
  onSaveImage: (modelKey: string, imageUrl: string) => void;
  onSkipModel: (modelKey: string) => void;
  onFinish: () => void;
  onBack: () => void;
}

interface FlatModel {
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  yearStart: number;
  yearEnd?: number;
  country: string;
  key: string;
}

type ViewMode = 'pending' | 'completed';
type SelectionMode = 'auto' | 'manual';

export function ImageSelector({
  selectedBrands,
  selectedModels,
  imageSelections,
  onSaveImage,
  onSkipModel,
  onFinish,
  onBack,
}: ImageSelectorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('pending');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(() =>
    isGoogleApiConfigured() ? 'auto' : 'manual'
  );
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  // Track mouse position to distinguish clicks from drags
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const { images, isLoading, error: apiError, quotaExceeded, searchImages, clearImages } = useGoogleImageSearch();

  // Mouse handler for drag detection - records start position
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Build flat list of all selected models
  const allModels: FlatModel[] = useMemo(() => {
    const result: FlatModel[] = [];
    for (const brandId of selectedBrands) {
      const brand = BRANDS.find((b: BrandData) => b.id === brandId);
      if (!brand) continue;

      const modelIds = selectedModels[brandId] || [];
      for (const modelId of modelIds) {
        const model = brand.models.find((m: ModelData) => m.id === modelId);
        if (!model) continue;

        result.push({
          brandId: brand.id,
          brandName: brand.name,
          modelId: model.id,
          modelName: model.name,
          yearStart: model.yearStart,
          yearEnd: model.yearEnd,
          country: brand.country,
          key: `${brand.id}-${model.id}`,
        });
      }
    }
    return result;
  }, [selectedBrands, selectedModels]);

  // Split models into pending (no image) and completed (has image)
  const { pendingModels, completedModels } = useMemo(() => {
    const pending: FlatModel[] = [];
    const completed: FlatModel[] = [];

    for (const model of allModels) {
      if (imageSelections[model.key]) {
        completed.push(model);
      } else {
        pending.push(model);
      }
    }

    return { pendingModels: pending, completedModels: completed };
  }, [allModels, imageSelections]);

  // Get current display list based on view mode
  const displayModels = viewMode === 'pending' ? pendingModels : completedModels;
  const currentModel = displayModels[currentViewIndex];
  const totalModels = allModels.length;
  const completedCount = completedModels.length;

  // Generate search query for current model
  const getSearchQuery = (model: FlatModel) =>
    `${model.brandName} ${model.modelName} ${model.yearStart} car`;

  // Generate Google Images search URL (for manual mode)
  const getSearchUrl = (model: FlatModel) => {
    const query = encodeURIComponent(getSearchQuery(model));
    return `https://www.google.com/search?q=${query}&tbm=isch`;
  };

  // Auto-search when model changes in auto mode (only for pending models)
  useEffect(() => {
    if (selectionMode === 'auto' && currentModel && !quotaExceeded && viewMode === 'pending') {
      clearImages();
      setLoadedImages({});
      searchImages(getSearchQuery(currentModel));
    }
  }, [currentViewIndex, selectionMode, quotaExceeded, viewMode, currentModel?.key]);

  // Switch to manual mode if quota exceeded
  useEffect(() => {
    if (quotaExceeded && selectionMode === 'auto') {
      setSelectionMode('manual');
    }
  }, [quotaExceeded, selectionMode]);

  // Reset index when switching view modes
  const switchViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    setCurrentViewIndex(0);
    clearImages();
    setLoadedImages({});
    setImageUrl('');
    setImageError(false);
  };

  // Handle image selection in auto mode - immediately saves and advances
  const handleImageSelect = useCallback((url: string) => {
    if (!currentModel) return;
    onSaveImage(currentModel.key, url);
    clearImages();
    setLoadedImages({});
    // Stay on same index - model will move to completed, next pending model takes its place
    // If no more pending, index will be out of bounds and we show empty state
  }, [currentModel, onSaveImage, clearImages]);

  // Click handler that ignores drags
  const handleImageClick = useCallback((e: React.MouseEvent, url: string) => {
    // Check if this was a drag (mouse moved more than threshold)
    if (mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x);
      const dy = Math.abs(e.clientY - mouseDownPos.current.y);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        // This was a drag, not a click - ignore
        mouseDownPos.current = null;
        return;
      }
    }
    mouseDownPos.current = null;
    handleImageSelect(url);
  }, [handleImageSelect]);

  // Manual mode save
  const handleSave = () => {
    if (imageUrl.trim() && currentModel) {
      onSaveImage(currentModel.key, imageUrl.trim());
      setImageUrl('');
      setImageError(false);
      clearImages();
      setLoadedImages({});
    }
  };

  const handleSkip = () => {
    if (!currentModel) return;
    onSkipModel(currentModel.key);
    setImageUrl('');
    setImageError(false);
    clearImages();
    setLoadedImages({});
    if (currentViewIndex < displayModels.length - 1) {
      setCurrentViewIndex(currentViewIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentViewIndex > 0) {
      setCurrentViewIndex(currentViewIndex - 1);
      setImageUrl('');
      setImageError(false);
      clearImages();
      setLoadedImages({});
    }
  };

  const handleNext = () => {
    if (currentViewIndex < displayModels.length - 1) {
      setCurrentViewIndex(currentViewIndex + 1);
      setImageUrl('');
      setImageError(false);
      clearImages();
      setLoadedImages({});
    }
  };

  // Switch to manual mode for current model
  const switchToManualMode = () => {
    setSelectionMode('manual');
    clearImages();
    setLoadedImages({});
  };

  // Switch back to auto mode
  const switchToAutoMode = () => {
    if (!isGoogleApiConfigured() || quotaExceeded) return;
    setSelectionMode('auto');
    if (currentModel && viewMode === 'pending') {
      clearImages();
      setLoadedImages({});
      searchImages(getSearchQuery(currentModel));
    }
  };

  // Track when full-res images finish loading
  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => ({ ...prev, [index]: true }));
  };

  // Check if current model already has an image
  const existingImage = currentModel ? imageSelections[currentModel.key] : null;

  // Clamp index if it goes out of bounds
  useEffect(() => {
    if (displayModels.length > 0 && currentViewIndex >= displayModels.length) {
      setCurrentViewIndex(Math.max(0, displayModels.length - 1));
    }
  }, [displayModels.length, currentViewIndex]);

  const apiConfigured = isGoogleApiConfigured();

  // Empty state
  if (displayModels.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => switchViewMode('pending')}
            className={`
              flex-1 py-2 px-4 rounded-lg font-medium transition-all
              ${viewMode === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
          >
            Pending ({pendingModels.length})
          </button>
          <button
            onClick={() => switchViewMode('completed')}
            className={`
              flex-1 py-2 px-4 rounded-lg font-medium transition-all
              ${viewMode === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
          >
            Completed ({completedModels.length})
          </button>
        </div>

        <div className="text-center py-12">
          <div className="text-4xl mb-4">
            {viewMode === 'pending' ? '🎉' : '📭'}
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {viewMode === 'pending'
              ? 'All models have images!'
              : 'No completed models yet'}
          </h2>
          <p className="text-gray-400 mb-6">
            {viewMode === 'pending'
              ? 'Switch to "Completed" to review or edit selected images.'
              : 'Switch to "Pending" to start selecting images.'}
          </p>
          {viewMode === 'pending' && completedCount > 0 && (
            <button
              onClick={onFinish}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
            >
              Export {completedCount} Cars
            </button>
          )}
        </div>

        <button
          onClick={onBack}
          className="mt-6 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
        >
          Back to Models
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header with progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Select Images</h1>
          <div className="flex items-center gap-4">
            {/* Mode indicator */}
            {viewMode === 'pending' && apiConfigured && !quotaExceeded && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectionMode === 'auto' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}>
                {selectionMode === 'auto' ? 'Auto Mode' : 'Manual Mode'}
              </span>
            )}
            {quotaExceeded && (
              <span className="px-3 py-1 bg-yellow-600/50 text-yellow-300 rounded-full text-sm">
                API Quota Exceeded
              </span>
            )}
            <div className="text-gray-400">
              {currentViewIndex + 1} of {displayModels.length} | {completedCount}/{totalModels} total
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${(completedCount / totalModels) * 100}%` }}
          />
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => switchViewMode('pending')}
          className={`
            flex-1 py-2 px-4 rounded-lg font-medium transition-all
            ${viewMode === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
        >
          Pending ({pendingModels.length})
        </button>
        <button
          onClick={() => switchViewMode('completed')}
          className={`
            flex-1 py-2 px-4 rounded-lg font-medium transition-all
            ${viewMode === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
        >
          Completed ({completedModels.length})
        </button>
      </div>

      {/* Current model info */}
      {currentModel && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">
                {currentModel.brandName} {currentModel.modelName}
              </h2>
              <p className="text-gray-400">
                {currentModel.yearStart}{currentModel.yearEnd ? ` - ${currentModel.yearEnd}` : ' - present'}
                {' '}&middot;{' '}{currentModel.country}
              </p>
            </div>
            {existingImage && (
              <div className="flex items-center gap-2 text-green-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Image Selected
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto Mode: Image Grid (only for pending models) */}
      {selectionMode === 'auto' && viewMode === 'pending' && currentModel && (
        <div className="mb-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <span className="ml-4 text-gray-400">Loading images...</span>
            </div>
          )}

          {apiError && !quotaExceeded && (
            <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-400 mb-4">
              {apiError}
              <button
                onClick={switchToManualMode}
                className="ml-4 underline hover:no-underline"
              >
                Switch to Manual Mode
              </button>
            </div>
          )}

          {!isLoading && images.length > 0 && (
            <>
              <p className="text-gray-400 mb-4">
                Click an image to select it (full HD version will be saved):
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onMouseDown={handleMouseDown}
                    onClick={(e) => handleImageClick(e, image.url)}
                    className="group relative aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all focus:outline-none focus:border-blue-500 select-none"
                  >
                    {/* Show thumbnail first, then load full image */}
                    <img
                      src={image.thumbnailUrl}
                      alt={image.title}
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity pointer-events-none ${loadedImages[index] ? 'opacity-0' : 'opacity-100'}`}
                    />
                    <img
                      src={image.url}
                      alt={image.title}
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity pointer-events-none ${loadedImages[index] ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => handleImageLoad(index)}
                      onError={(e) => {
                        // Fallback to thumbnail if HD fails
                        (e.target as HTMLImageElement).src = image.thumbnailUrl;
                        handleImageLoad(index);
                      }}
                    />
                    {/* Loading indicator for each image */}
                    {!loadedImages[index] && (
                      <div className="absolute top-2 right-2 bg-black/50 rounded px-2 py-1 text-xs text-white">
                        Loading HD...
                      </div>
                    )}
                    {/* HD badge when loaded */}
                    {loadedImages[index] && (
                      <div className="absolute top-2 right-2 bg-green-600/80 rounded px-2 py-1 text-xs text-white">
                        HD
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/30 transition-all flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white font-semibold bg-blue-600 px-3 py-1 rounded transition-all">
                        Select
                      </span>
                    </div>
                    {/* Image number */}
                    <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-1 text-xs text-white">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {!isLoading && images.length === 0 && !apiError && (
            <div className="text-center py-12 text-gray-400">
              No images loaded yet.
            </div>
          )}
        </div>
      )}

      {/* Manual Mode: URL Input */}
      {(selectionMode === 'manual' || viewMode === 'completed') && currentModel && (
        <>
          {/* Google Images search button */}
          <div className="mb-6">
            <a
              href={getSearchUrl(currentModel)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.53 20.47l-3.66-3.66A8.95 8.95 0 0019 12a9 9 0 10-9 9 8.95 8.95 0 004.81-1.13l3.66 3.66a.75.75 0 001.06-1.06zM4 12a8 8 0 1116 0 8 8 0 01-16 0z" />
              </svg>
              Search Google Images
            </a>
          </div>

          {/* Image URL input */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Paste Image URL:</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImageError(false);
              }}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Image preview */}
          {(imageUrl || existingImage) && (
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Preview:</label>
              <div className="bg-gray-800 rounded-lg p-4">
                {imageError ? (
                  <div className="aspect-video flex items-center justify-center bg-gray-700 rounded text-gray-400">
                    Failed to load image. Check the URL.
                  </div>
                ) : (
                  <img
                    src={imageUrl || existingImage || ''}
                    alt={`${currentModel.brandName} ${currentModel.modelName}`}
                    className="w-full aspect-video object-cover rounded"
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Existing image indicator */}
          {existingImage && !imageUrl && (
            <div className="mb-6 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-400">
              This model already has an image selected. Enter a new URL to replace it.
            </div>
          )}

          {/* Manual mode save button */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleSave}
              disabled={!imageUrl.trim() || imageError}
              className={`
                flex-1 py-3 rounded-lg font-semibold transition-all
                ${imageUrl.trim() && !imageError
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {viewMode === 'completed' ? 'Update Image' : 'Save & Next'}
            </button>
          </div>
        </>
      )}

      {/* Action buttons */}
      {currentModel && (
        <div className="flex flex-col gap-3 mb-24">
          {viewMode === 'pending' && (
            <button
              onClick={handleSkip}
              className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
            >
              Skip This Model
            </button>
          )}

          {/* Manual Image Search button - only show in auto mode for pending */}
          {selectionMode === 'auto' && viewMode === 'pending' && (
            <button
              onClick={switchToManualMode}
              className="w-full py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 border border-gray-600"
            >
              Manual Image Search
            </button>
          )}

          {/* Back to Auto button - only show in manual mode when API is available */}
          {selectionMode === 'manual' && viewMode === 'pending' && apiConfigured && !quotaExceeded && (
            <button
              onClick={switchToAutoMode}
              className="w-full py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 border border-gray-600"
            >
              Back to Auto Mode
            </button>
          )}
        </div>
      )}

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Back to Models
            </button>
            <button
              onClick={handlePrev}
              disabled={currentViewIndex === 0}
              className={`
                px-4 py-2 rounded transition-all
                ${currentViewIndex === 0
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-500'
                }
              `}
            >
              Prev
            </button>
            <button
              onClick={handleNext}
              disabled={currentViewIndex >= displayModels.length - 1}
              className={`
                px-4 py-2 rounded transition-all
                ${currentViewIndex >= displayModels.length - 1
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-500'
                }
              `}
            >
              Next
            </button>
          </div>

          <button
            onClick={onFinish}
            disabled={completedCount < 1}
            className={`
              px-6 py-2 rounded-lg font-semibold transition-all
              ${completedCount >= 1
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Export {completedCount} Cars
          </button>
        </div>
      </div>
    </div>
  );
}
