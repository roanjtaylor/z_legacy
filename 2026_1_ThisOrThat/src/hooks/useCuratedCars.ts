import { useState, useEffect } from 'react';
import type { Car } from '../types';
import { fetchCuratedCars } from '../utils/curatedCarsSource';

export function useCuratedCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCars() {
      try {
        setCars(await fetchCuratedCars<Car>());
      } catch (e) {
        console.error('Failed to load curated cars:', e);
        setError(e instanceof Error ? e.message : 'Unknown error');
        setCars([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadCars();
  }, []);

  return { cars, isLoading, error };
}
