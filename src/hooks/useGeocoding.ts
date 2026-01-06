import { useState, useCallback } from 'react';

interface GeocodingResult {
  lat: number;
  lng: number;
}

interface UseGeocodingReturn {
  geocodeAddress: (address: string) => Promise<GeocodingResult | null>;
  isLoading: boolean;
  error: string | null;
}

export function useGeocoding(): UseGeocodingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocodeAddress = useCallback(async (address: string): Promise<GeocodingResult | null> => {
    if (!address.trim()) {
      return null;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key not configured');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      } else if (data.status === 'ZERO_RESULTS') {
        setError('Address not found');
        return null;
      } else {
        setError(`Geocoding error: ${data.status}`);
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to geocode address';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { geocodeAddress, isLoading, error };
}
