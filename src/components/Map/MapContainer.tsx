import { useState, useRef, useEffect } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import { useFacilityContext } from '../../context/FacilityContext';
import { FacilityMarker } from './FacilityMarker';
import { Facility, FilterState } from '../../types/facility';
import { Button } from '../UI';
import './MapContainer.css';

const NORTHERN_IRELAND_CENTER = { lat: 54.6, lng: -6.9 };
const DEFAULT_ZOOM = 9;
const FOCUSED_ZOOM = 14;

// Two Map IDs: normal view and clean view (no labels)
const MAP_ID_NORMAL = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
const MAP_ID_CLEAN = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID_CLEAN;

// Filter options with their colors
const filterOptions: { key: keyof FilterState; label: string; color: string }[] = [
  { key: 'council_run', label: 'Council Run', color: '#F97316' },
  { key: 'pilot_progress', label: 'Pilot Progress', color: '#3B82F6' },
  { key: 'customer_secured', label: 'Secured Customer', color: '#22C55E' }
];

// Component to handle map centering
function MapCenterHandler({ focusedFacility }: { focusedFacility: Facility | null }) {
  const map = useMap();

  useEffect(() => {
    if (map && focusedFacility && focusedFacility.lat && focusedFacility.lng) {
      map.panTo({ lat: focusedFacility.lat, lng: focusedFacility.lng });
      map.setZoom(FOCUSED_ZOOM);
    }
  }, [map, focusedFacility]);

  return null;
}

interface MapContainerProps {
  focusedFacility?: Facility | null;
}

export function MapContainer({ focusedFacility = null }: MapContainerProps) {
  const { filteredFacilities, facilities, setSelectedFacility, openForm, filters, toggleFilter, exportData, importData } = useFacilityContext();
  const [showLabels, setShowLabels] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMapId = showLabels ? MAP_ID_NORMAL : MAP_ID_CLEAN;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

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
    <div className="map-wrapper">
      <Map
        key={currentMapId}
        defaultCenter={NORTHERN_IRELAND_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        mapId={currentMapId}
        style={{ width: '100%', height: '100%' }}
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        <MapCenterHandler focusedFacility={focusedFacility} />
        {filteredFacilities.map(facility => (
          <FacilityMarker
            key={facility.id}
            facility={facility}
            onClick={setSelectedFacility}
          />
        ))}
      </Map>

      <div className="map-controls">
        <div className="control-panel">
          <button
            className="control-panel-toggle"
            onClick={() => setPanelExpanded(!panelExpanded)}
          >
            <span className="control-panel-toggle-text">
              Controls
              {activeFilterCount > 0 && (
                <span className="active-filter-badge">{activeFilterCount}</span>
              )}
            </span>
            <span className="control-panel-count">{filteredFacilities.length}/{facilities.length}</span>
            <span className={`control-panel-arrow ${panelExpanded ? 'expanded' : ''}`}>&#9650;</span>
          </button>

          <div className={`control-panel-content ${panelExpanded ? 'expanded' : ''}`}>
            <div className="control-panel-header">Filters</div>

            {filterOptions.map(option => (
              <label key={option.key} className="toggle-switch">
                <input
                  type="checkbox"
                  checked={filters[option.key]}
                  onChange={() => toggleFilter(option.key)}
                />
                <span
                  className="toggle-slider"
                  style={{ '--toggle-color': option.color } as React.CSSProperties}
                ></span>
                <span className="toggle-label">{option.label}</span>
              </label>
            ))}

            <div className="control-panel-divider"></div>
            <div className="control-panel-header">Display</div>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Show Labels</span>
            </label>

            <div className="control-panel-divider"></div>

            <div className="control-panel-actions">
              <button className="control-panel-btn" onClick={exportData}>
                Export JSON
              </button>
              <button className="control-panel-btn" onClick={handleImportClick}>
                Import JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>

        <Button
          className="add-facility-btn"
          size="lg"
          onClick={() => openForm()}
        >
          + Add Facility
        </Button>
      </div>
    </div>
  );
}
