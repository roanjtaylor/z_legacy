export interface Facility {
  id: string;
  // Facility details
  name: string;
  googleMapsAddress: string;
  imageUrl1: string;
  imageUrl2: string;
  imageUrl3: string;
  contactDetails: string;
  lat: number | null;
  lng: number | null;
  // Sales details
  recentInteractionDate: string;
  presentState: string;
  nextInteractionDate: string;
  todoNotes: string;
  // Filters
  council_run: boolean;
  pilot_progress: boolean;
  customer_secured: boolean;
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface FacilityFormData {
  // Facility details
  name: string;
  googleMapsAddress: string;
  imageUrl1: string;
  imageUrl2: string;
  imageUrl3: string;
  contactDetails: string;
  lat: number | null;
  lng: number | null;
  // Sales details
  recentInteractionDate: string;
  presentState: string;
  nextInteractionDate: string;
  todoNotes: string;
  // Filters
  council_run: boolean;
  pilot_progress: boolean;
  customer_secured: boolean;
}

export type FacilityStatus = 'default' | 'council' | 'pilot' | 'customer';

export interface FilterState {
  council_run: boolean;
  pilot_progress: boolean;
  customer_secured: boolean;
}
