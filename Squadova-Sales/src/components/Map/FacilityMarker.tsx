import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Facility } from '../../types/facility';
import { getPinColors } from '../../utils/markerColors';

interface FacilityMarkerProps {
  facility: Facility;
  onClick: (facility: Facility) => void;
}

export function FacilityMarker({ facility, onClick }: FacilityMarkerProps) {
  if (facility.lat === null || facility.lng === null) {
    return null;
  }

  const colors = getPinColors(facility);

  return (
    <AdvancedMarker
      position={{ lat: facility.lat, lng: facility.lng }}
      onClick={() => onClick(facility)}
      title={facility.name}
    >
      <Pin
        background={colors.background}
        borderColor={colors.borderColor}
        glyphColor={colors.glyphColor}
      />
    </AdvancedMarker>
  );
}
