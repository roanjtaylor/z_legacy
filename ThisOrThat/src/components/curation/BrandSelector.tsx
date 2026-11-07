import { BRANDS, BRAND_CATEGORIES } from '../../data/brands';
import type { BrandData } from '../../types';

interface BrandSelectorProps {
  selectedBrands: string[];
  onToggleBrand: (brandId: string) => void;
  onContinue: () => void;
}

export function BrandSelector({
  selectedBrands,
  onToggleBrand,
  onContinue,
}: BrandSelectorProps) {
  const totalBrands = BRANDS.length;
  const selectedCount = selectedBrands.length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Select Car Brands</h1>
        <p className="text-gray-400">
          Choose the brands you want to include in your dataset.
          Selected: <span className="text-blue-400 font-semibold">{selectedCount}</span> / {totalBrands}
        </p>
      </div>

      {Object.entries(BRAND_CATEGORIES).map(([category, brands]) => {
        if (brands.length === 0) return null;
        return (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-300 mb-4 border-b border-gray-700 pb-2">
              {category} ({brands.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {brands.map((brand: BrandData) => {
                const isSelected = selectedBrands.includes(brand.id);
                return (
                  <button
                    key={brand.id}
                    onClick={() => onToggleBrand(brand.id)}
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-200
                      ${isSelected
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                      }
                    `}
                  >
                    <div className="font-semibold">{brand.name}</div>
                    <div className="text-sm text-gray-400">{brand.country}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {brand.models.length} models
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-gray-400">
            {selectedCount} brand{selectedCount !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={onContinue}
            disabled={selectedCount < 1}
            className={`
              px-6 py-3 rounded-lg font-semibold transition-all
              ${selectedCount >= 1
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Continue to Model Selection
          </button>
        </div>
      </div>

      {/* Spacer for fixed bottom bar */}
      <div className="h-24" />
    </div>
  );
}
