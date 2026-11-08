import { useState, useEffect } from 'react';
import type { Car } from '../types';

export function useCuratedCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCars() {
      try {
        const response = await fetch('/curated-cars.json');
        if (!response.ok) {
          throw new Error(`Failed to load cars: ${response.status}`);
        }
        const data = await response.json();
        setCars(data as Car[]);
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
