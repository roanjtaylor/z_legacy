import { useCallback, useMemo } from 'react';
import { Facility, FacilityFormData, FilterState } from '../types/facility';
import { useLocalStorage } from './useLocalStorage';
import { useGeocoding } from './useGeocoding';
import { generateId } from '../utils/idGenerator';
import { exportFacilitiesToJSON, importFacilitiesFromJSON } from '../utils/storage';

interface UseFacilitiesReturn {
  facilities: Facility[];
  filteredFacilities: Facility[];
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  toggleFilter: (key: keyof FilterState) => void;
  addFacility: (data: FacilityFormData) => Promise<Facility>;
  updateFacility: (id: string, data: Partial<FacilityFormData>) => Promise<void>;
  deleteFacility: (id: string) => void;
  exportData: () => void;
  importData: (file: File) => Promise<void>;
  isGeocoding: boolean;
  geocodingError: string | null;
}

const initialFilters: FilterState = {
  council_run: false,
  pilot_progress: false,
  customer_secured: false
};

export function useFacilities(): UseFacilitiesReturn {
  const [facilities, setFacilities] = useLocalStorage<Facility[]>('squadova-facilities', []);
  const [filters, setFilters] = useLocalStorage<FilterState>('squadova-filters', initialFilters);
  const { geocodeAddress, isLoading: isGeocoding, error: geocodingError } = useGeocoding();

  const filteredFacilities = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(([, value]) => value);

    if (activeFilters.length === 0) {
      return facilities;
    }

    return facilities.filter(facility => {
      return activeFilters.every(([key]) => {
        return facility[key as keyof FilterState] === true;
      });
    });
  }, [facilities, filters]);

  const toggleFilter = useCallback((key: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, [setFilters]);

  const addFacility = useCallback(async (data: FacilityFormData): Promise<Facility> => {
    // Use provided coordinates, or fall back to geocoding
    let lat = data.lat;
    let lng = data.lng;

    if (lat === null || lng === null) {
      const coords = await geocodeAddress(data.googleMapsAddress);
      lat = coords?.lat ?? null;
      lng = coords?.lng ?? null;
    }

    const now = new Date().toISOString();
    const newFacility: Facility = {
      id: generateId(),
      // Facility details
      name: data.name,
      googleMapsAddress: data.googleMapsAddress,
      imageUrl1: data.imageUrl1,
      imageUrl2: data.imageUrl2,
      imageUrl3: data.imageUrl3,
      contactDetails: data.contactDetails,
      lat,
      lng,
      // Sales details
      recentInteractionDate: data.recentInteractionDate,
      presentState: data.presentState,
      nextInteractionDate: data.nextInteractionDate,
      todoNotes: data.todoNotes,
      // Filters
      council_run: data.council_run,
      pilot_progress: data.pilot_progress,
      customer_secured: data.customer_secured,
      // Metadata
      createdAt: now,
      updatedAt: now
    };

    setFacilities(prev => [...prev, newFacility]);
    return newFacility;
  }, [setFacilities, geocodeAddress]);

  const updateFacility = useCallback(async (id: string, data: Partial<FacilityFormData>) => {
    // Use provided coordinates, or fall back to geocoding if address changed
    let lat = data.lat;
    let lng = data.lng;

    if ((lat === null || lng === null) && data.googleMapsAddress) {
      const coords = await geocodeAddress(data.googleMapsAddress);
      lat = coords?.lat ?? null;
      lng = coords?.lng ?? null;
    }

    setFacilities(prev => prev.map(facility => {
      if (facility.id !== id) return facility;

      const { lat: _lat, lng: _lng, ...restData } = data;

      return {
        ...facility,
        ...restData,
        ...(lat !== undefined ? { lat } : {}),
        ...(lng !== undefined ? { lng } : {}),
        updatedAt: new Date().toISOString()
      };
    }));
  }, [setFacilities, geocodeAddress]);

  const deleteFacility = useCallback((id: string) => {
    setFacilities(prev => prev.filter(f => f.id !== id));
  }, [setFacilities]);

  const exportData = useCallback(() => {
    exportFacilitiesToJSON(facilities);
  }, [facilities]);

  const importData = useCallback(async (file: File) => {
    const imported = await importFacilitiesFromJSON(file);
    setFacilities(imported);
  }, [setFacilities]);

  return {
    facilities,
    filteredFacilities,
    filters,
    setFilters,
    toggleFilter,
    addFacility,
    updateFacility,
    deleteFacility,
    exportData,
    importData,
    isGeocoding,
    geocodingError
  };
}
