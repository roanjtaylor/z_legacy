import { useState, useCallback } from 'react';

export interface GoogleImage {
  url: string;
  thumbnailUrl: string;
  title: string;
  width: number;
  height: number;
}

interface GoogleSearchResult {
  items?: Array<{
    link: string;
    title: string;
    image: {
      thumbnailLink: string;
      width: number;
      height: number;
    };
  }>;
  error?: {
    code: number;
    message: string;
  };
}

interface UseGoogleImageSearchResult {
  images: GoogleImage[];
  isLoading: boolean;
  error: string | null;
  quotaExceeded: boolean;
  searchImages: (query: string) => Promise<void>;
  clearImages: () => void;
}

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const SEARCH_ENGINE_ID = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID || '';

// Track quota across the session
let quotaExceededGlobal = false;

export function useGoogleImageSearch(): UseGoogleImageSearchResult {
  const [images, setImages] = useState<GoogleImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(quotaExceededGlobal);

  const searchImages = useCallback(async (query: string) => {
    // Check if API is configured
    if (!API_KEY || !SEARCH_ENGINE_ID) {
      setError('Google API not configured. Please add VITE_GOOGLE_API_KEY and VITE_GOOGLE_SEARCH_ENGINE_ID to .env');
      return;
    }

    // Check if quota already exceeded
    if (quotaExceededGlobal) {
      setQuotaExceeded(true);
      setError('API quota exceeded. Please use manual mode.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setImages([]);

    try {
      // Enhance query to exclude toy/model cars and get real car photos
      const enhancedQuery = `${query} -toy -diecast -"model kit" -miniature -"scale model" -"hot wheels" -matchbox -replica`;

      // Google Custom Search API - request 10 images
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.set('key', API_KEY);
      url.searchParams.set('cx', SEARCH_ENGINE_ID);
      url.searchParams.set('q', enhancedQuery);
      url.searchParams.set('searchType', 'image');
      url.searchParams.set('num', '10');
      url.searchParams.set('imgSize', 'xlarge'); // Request extra large/HD images
      url.searchParams.set('imgType', 'photo'); // Only real photos, not illustrations
      url.searchParams.set('safe', 'active');

      const response = await fetch(url.toString());
      const data: GoogleSearchResult = await response.json();

      if (data.error) {
        // Check for quota exceeded (429 or specific error codes)
        if (data.error.code === 429 || data.error.message.includes('quota')) {
          quotaExceededGlobal = true;
          setQuotaExceeded(true);
          setError('API quota exceeded. Switching to manual mode.');
        } else {
          setError(data.error.message);
        }
        return;
      }

      if (!data.items || data.items.length === 0) {
        setError('No images found for this search.');
        return;
      }

      // Map to our image format - use the full-size link (HD), not thumbnail
      const mappedImages: GoogleImage[] = data.items.map((item) => ({
        url: item.link, // This is the full HD image URL
        thumbnailUrl: item.image.thumbnailLink,
        title: item.title,
        width: item.image.width,
        height: item.image.height,
      }));

      setImages(mappedImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
    setError(null);
  }, []);

  return {
    images,
    isLoading,
    error,
    quotaExceeded,
    searchImages,
    clearImages,
  };
}

// Helper to check if API is configured
export function isGoogleApiConfigured(): boolean {
  return Boolean(API_KEY && SEARCH_ENGINE_ID);
}

// Reset quota flag (useful for testing or new day)
export function resetQuotaFlag(): void {
  quotaExceededGlobal = false;
}
