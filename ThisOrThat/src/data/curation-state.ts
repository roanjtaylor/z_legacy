import type { CurationState, CuratedCar, BrandData, ModelData } from '../types';
import { BRANDS } from './brands';

const STORAGE_KEY = 'thisorthat-curation-state';

const defaultState: CurationState = {
  step: 'brands',
  selectedBrands: [],
  selectedModels: {},
  currentBrandIndex: 0,
  currentModelIndex: 0,
  imageSelections: {},
};

// Load existing curated cars from public/curated-cars.json
let existingCuratedCars: CuratedCar[] = [];

export async function loadExistingCuratedCars(): Promise<CuratedCar[]> {
  try {
    const response = await fetch('/curated-cars.json');
    if (response.ok) {
      existingCuratedCars = await response.json();
      return existingCuratedCars;
    }
  } catch (e) {
    console.error('Failed to load existing curated cars:', e);
  }
  return [];
}

// Reconstruct curation state from existing curated cars
export function reconstructStateFromCuratedCars(cars: CuratedCar[]): CurationState {
  const state: CurationState = {
    step: 'brands',
    selectedBrands: [],
    selectedModels: {},
    currentBrandIndex: 0,
    currentModelIndex: 0,
    imageSelections: {},
  };

  for (const car of cars) {
    // Find the brand
    const brand = BRANDS.find((b: BrandData) => b.name === car.brand);
    if (!brand) continue;

    // Add brand to selection if not already
    if (!state.selectedBrands.includes(brand.id)) {
      state.selectedBrands.push(brand.id);
    }

    // Find the model by matching the car.id pattern (brand.id-model.id)
    const modelIdFromCar = car.id.replace(`${brand.id}-`, '');
    const model = brand.models.find((m: ModelData) => m.id === modelIdFromCar);

    if (model) {
      // Add model to selection
      if (!state.selectedModels[brand.id]) {
        state.selectedModels[brand.id] = [];
      }
      if (!state.selectedModels[brand.id].includes(model.id)) {
        state.selectedModels[brand.id].push(model.id);
      }

      // Add image selection
      const modelKey = `${brand.id}-${model.id}`;
      state.imageSelections[modelKey] = car.imageUrl;
    }
  }

  return state;
}

export function loadCurationState(): CurationState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load curation state:', e);
  }
  return { ...defaultState };
}

export function saveCurationState(state: CurationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save curation state:', e);
  }
}

export function resetCurationState(): CurationState {
  localStorage.removeItem(STORAGE_KEY);
  return { ...defaultState };
}

export function getDecade(year: number): string {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

export function generateCuratedCars(
  brands: BrandData[],
  state: CurationState
): CuratedCar[] {
  const cars: CuratedCar[] = [];

  for (const brand of brands) {
    if (!state.selectedBrands.includes(brand.id)) continue;

    const selectedModelIds = state.selectedModels[brand.id] || [];
    for (const model of brand.models) {
      if (!selectedModelIds.includes(model.id)) continue;

      const imageUrl = state.imageSelections[`${brand.id}-${model.id}`];
      if (!imageUrl) continue;

      cars.push({
        id: `${brand.id}-${model.id}`,
        name: model.name,
        brand: brand.name,
        year: model.yearStart,
        country: brand.country,
        decade: getDecade(model.yearStart),
        imageUrl,
        imageAttribution: 'Source: Google Images',
      });
    }
  }

  return cars;
}

// Export with deduplication (existing cars + new cars)
export function exportCarsJson(newCars: CuratedCar[]): void {
  // Merge: new cars override existing ones with same id
  const carMap = new Map<string, CuratedCar>();

  // Add existing cars first
  for (const car of existingCuratedCars) {
    carMap.set(car.id, car);
  }

  // Add/override with new cars
  for (const car of newCars) {
    carMap.set(car.id, car);
  }

  const mergedCars = Array.from(carMap.values());

  // Sort by brand then by year
  mergedCars.sort((a, b) => {
    if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
    return a.year - b.year;
  });

  const json = JSON.stringify(mergedCars, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'curated-cars.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function getExistingCuratedCars(): CuratedCar[] {
  return existingCuratedCars;
}
