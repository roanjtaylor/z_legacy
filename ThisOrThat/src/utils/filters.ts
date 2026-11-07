import type { Car, FilterState } from '../types';

export const DECADES = [
  '1950s',
  '1960s',
  '1970s',
  '1980s',
  '1990s',
  '2000s',
  '2010s',
  '2020s',
];

export const DRIVETRAINS = ['RWD', 'FWD', 'AWD'];

export const RARITY_TIERS = ['common', 'uncommon', 'rare', 'legendary'];

export function getUniqueCountries(cars: Car[]): string[] {
  const countries = new Set(cars.map((car) => car.country));
  return Array.from(countries).sort();
}

export function getUniqueBrands(cars: Car[]): string[] {
  const brands = new Set(cars.map((car) => car.brand));
  return Array.from(brands).sort();
}

export function getAvailableDecades(cars: Car[]): string[] {
  const decades = new Set(cars.map((car) => car.decade));
  return DECADES.filter((d) => decades.has(d));
}

export function getAvailableDrivetrains(cars: Car[]): string[] {
  const drivetrains = new Set(
    cars
      .filter((car) => car.extendedStats?.drivetrain)
      .map((car) => car.extendedStats!.drivetrain)
  );
  return DRIVETRAINS.filter((d) => drivetrains.has(d));
}

export function getAvailableRarityTiers(cars: Car[]): string[] {
  const tiers = new Set<string>(
    cars
      .filter((car) => car.collectorStats?.rarityTier)
      .map((car) => car.collectorStats!.rarityTier!)
  );
  return RARITY_TIERS.filter((t) => tiers.has(t));
}

export function filterCars(cars: Car[], filters: FilterState): Car[] {
  return cars.filter((car) => {
    const matchesDecade =
      filters.decades.length === 0 || filters.decades.includes(car.decade);
    const matchesCountry =
      filters.countries.length === 0 || filters.countries.includes(car.country);
    const matchesBrand =
      filters.brands.length === 0 || filters.brands.includes(car.brand);
    const matchesDrivetrain =
      filters.drivetrains.length === 0 ||
      (car.extendedStats?.drivetrain &&
        filters.drivetrains.includes(car.extendedStats.drivetrain));
    const matchesRarity =
      filters.rarityTiers.length === 0 ||
      (car.collectorStats?.rarityTier &&
        filters.rarityTiers.includes(car.collectorStats.rarityTier));

    return (
      matchesDecade &&
      matchesCountry &&
      matchesBrand &&
      matchesDrivetrain &&
      matchesRarity
    );
  });
}

export function getCarCounts(
  cars: Car[],
  filters: FilterState
): { decade: Record<string, number>; country: Record<string, number> } {
  const filtered = filterCars(cars, filters);

  const decadeCounts: Record<string, number> = {};
  const countryCounts: Record<string, number> = {};

  for (const car of filtered) {
    decadeCounts[car.decade] = (decadeCounts[car.decade] || 0) + 1;
    countryCounts[car.country] = (countryCounts[car.country] || 0) + 1;
  }

  return { decade: decadeCounts, country: countryCounts };
}

export const emptyFilters: FilterState = {
  decades: [],
  countries: [],
  brands: [],
  drivetrains: [],
  rarityTiers: [],
};
