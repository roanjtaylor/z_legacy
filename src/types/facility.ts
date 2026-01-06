export interface Facility {
  id: string;
  name: string;
  googleMapsAddress: string;
  imageUrl: string;
  needs_public_contract: boolean;
  pilot_in_progress: boolean;
  squadova_customer: boolean;
  contactDetails: string;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FacilityFormData {
  name: string;
  googleMapsAddress: string;
  imageUrl: string;
  needs_public_contract: boolean;
  pilot_in_progress: boolean;
  squadova_customer: boolean;
  contactDetails: string;
  lat: number | null;
  lng: number | null;
}

export type FacilityStatus = 'default' | 'council' | 'pilot' | 'customer';

export interface FilterState {
  needs_public_contract: boolean;
  pilot_in_progress: boolean;
  squadova_customer: boolean;
}
