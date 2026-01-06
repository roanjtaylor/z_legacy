import { Facility, FacilityStatus } from '../types/facility';

export const PIN_COLORS = {
  customer: {
    background: '#22C55E',
    borderColor: '#166534',
    glyphColor: '#FFFFFF'
  },
  pilot: {
    background: '#3B82F6',
    borderColor: '#1D4ED8',
    glyphColor: '#FFFFFF'
  },
  council: {
    background: '#F97316',
    borderColor: '#C2410C',
    glyphColor: '#FFFFFF'
  },
  default: {
    background: '#6B7280',
    borderColor: '#374151',
    glyphColor: '#FFFFFF'
  }
} as const;

export function getFacilityStatus(facility: Facility): FacilityStatus {
  if (facility.squadova_customer) return 'customer';
  if (facility.pilot_in_progress) return 'pilot';
  if (facility.needs_public_contract) return 'council';
  return 'default';
}

export function getPinColors(facility: Facility) {
  const status = getFacilityStatus(facility);
  return PIN_COLORS[status];
}

export function getStatusLabel(status: FacilityStatus): string {
  switch (status) {
    case 'customer': return 'Squadova Customer';
    case 'pilot': return 'Pilot in Progress';
    case 'council': return 'Council Run';
    default: return 'Prospect';
  }
}
