import { useRef } from 'react';
import { useFacilityContext } from '../../context/FacilityContext';
import { FilterState } from '../../types/facility';
import { Button } from '../UI';
import './FilterToolbox.css';

interface FilterOption {
  key: keyof FilterState;
  label: string;
  color: string;
}

const filterOptions: FilterOption[] = [
  { key: 'council_run', label: 'Council Run', color: '#F97316' },
  { key: 'pilot_progress', label: 'Pilot Progress', color: '#3B82F6' },
  { key: 'customer_secured', label: 'Secured Paying Customer', color: '#22C55E' }
];

export function FilterToolbox() {
  const {
    filters,
    toggleFilter,
    filteredFacilities,
    facilities,
    exportData,
    importData
  } = useFacilityContext();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCount = Object.values(filters).filter(Boolean).length;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await importData(file);
        alert('Data imported successfully!');
      } catch (error) {
        alert('Failed to import data. Please check the file format.');
      }
      e.target.value = '';
    }
  };

  return (
    <div className="filter-toolbox">
      <div className="filter-header">
        <h3 className="filter-title">Filters</h3>
        <span className="filter-count">
          {filteredFacilities.length} of {facilities.length}
        </span>
      </div>

      <div className="filter-options">
        {filterOptions.map(option => (
          <button
            key={option.key}
            className={`filter-btn ${filters[option.key] ? 'active' : ''}`}
            onClick={() => toggleFilter(option.key)}
            style={{
              '--filter-color': option.color
            } as React.CSSProperties}
          >
            <span
              className="filter-dot"
              style={{ backgroundColor: option.color }}
            />
            {option.label}
          </button>
        ))}
      </div>

      {activeCount > 0 && (
        <p className="filter-logic-hint">
          Showing facilities matching ALL selected filters
        </p>
      )}

      <div className="filter-divider" />

      <div className="data-actions">
        <Button variant="ghost" size="sm" onClick={exportData}>
          Export JSON
        </Button>
        <Button variant="ghost" size="sm" onClick={handleImportClick}>
          Import JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}
