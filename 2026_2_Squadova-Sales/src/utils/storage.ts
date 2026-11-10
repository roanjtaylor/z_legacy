import { Facility } from '../types/facility';

const STORAGE_KEY = 'squadova-facilities';

export function loadFacilities(): Facility[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load facilities from localStorage:', error);
  }
  return [];
}

export function saveFacilities(facilities: Facility[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(facilities));
  } catch (error) {
    console.error('Failed to save facilities to localStorage:', error);
  }
}

export function exportFacilitiesToJSON(facilities: Facility[]): void {
  const data = {
    facilities,
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'facilities.json';
  a.click();

  URL.revokeObjectURL(url);
}

export async function importFacilitiesFromJSON(file: File): Promise<Facility[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data.facilities || []);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
