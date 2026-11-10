import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Facility, FacilityFormData, FilterState } from '../types/facility';
import { useFacilities } from '../hooks/useFacilities';

interface FacilityContextType {
  // Data
  facilities: Facility[];
  filteredFacilities: Facility[];

  // Filters
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  toggleFilter: (key: keyof FilterState) => void;

  // CRUD
  addFacility: (data: FacilityFormData) => Promise<Facility>;
  updateFacility: (id: string, data: Partial<FacilityFormData>) => Promise<void>;
  deleteFacility: (id: string) => void;

  // Data management
  exportData: () => void;
  importData: (file: File) => Promise<void>;

  // UI State
  selectedFacility: Facility | null;
  setSelectedFacility: (facility: Facility | null) => void;
  isFormOpen: boolean;
  openForm: (facility?: Facility) => void;
  closeForm: () => void;
  editingFacility: Facility | null;

  // Loading states
  isGeocoding: boolean;
  geocodingError: string | null;
}

const FacilityContext = createContext<FacilityContextType | null>(null);

interface FacilityProviderProps {
  children: ReactNode;
}

export function FacilityProvider({ children }: FacilityProviderProps) {
  const {
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
  } = useFacilities();

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  const openForm = useCallback((facility?: Facility) => {
    setEditingFacility(facility ?? null);
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingFacility(null);
  }, []);

  const value: FacilityContextType = {
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
    selectedFacility,
    setSelectedFacility,
    isFormOpen,
    openForm,
    closeForm,
    editingFacility,
    isGeocoding,
    geocodingError
  };

  return (
    <FacilityContext.Provider value={value}>
      {children}
    </FacilityContext.Provider>
  );
}

export function useFacilityContext() {
  const context = useContext(FacilityContext);
  if (!context) {
    throw new Error('useFacilityContext must be used within a FacilityProvider');
  }
  return context;
}
