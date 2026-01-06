import { Map } from '@vis.gl/react-google-maps';
import { useFacilityContext } from '../../context/FacilityContext';
import { FacilityMarker } from './FacilityMarker';
import { Button } from '../UI';
import './MapContainer.css';

const NORTHERN_IRELAND_CENTER = { lat: 54.6, lng: -6.9 };
const DEFAULT_ZOOM = 9;
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'squadova-sales-map';

export function MapContainer() {
  const { filteredFacilities, setSelectedFacility, openForm } = useFacilityContext();

  return (
    <div className="map-wrapper">
      <Map
        defaultCenter={NORTHERN_IRELAND_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        mapId={MAP_ID}
        style={{ width: '100%', height: '100%' }}
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        {filteredFacilities.map(facility => (
          <FacilityMarker
            key={facility.id}
            facility={facility}
            onClick={setSelectedFacility}
          />
        ))}
      </Map>

      <Button
        className="add-facility-btn"
        size="lg"
        onClick={() => openForm()}
      >
        + Add Facility
      </Button>
    </div>
  );
}
