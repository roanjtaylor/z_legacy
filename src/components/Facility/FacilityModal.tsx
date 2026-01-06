import { useFacilityContext } from '../../context/FacilityContext';
import { Modal, Button } from '../UI';
import { getFacilityStatus, getStatusLabel, PIN_COLORS } from '../../utils/markerColors';
import './Facility.css';

export function FacilityModal() {
  const {
    selectedFacility,
    setSelectedFacility,
    openForm,
    deleteFacility
  } = useFacilityContext();

  if (!selectedFacility) return null;

  const status = getFacilityStatus(selectedFacility);
  const statusColor = PIN_COLORS[status].background;

  const handleEdit = () => {
    setSelectedFacility(null);
    openForm(selectedFacility);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${selectedFacility.name}"?`)) {
      deleteFacility(selectedFacility.id);
      setSelectedFacility(null);
    }
  };

  return (
    <Modal
      isOpen={!!selectedFacility}
      onClose={() => setSelectedFacility(null)}
      title={selectedFacility.name}
      size="md"
    >
      <div className="facility-details">
        {selectedFacility.imageUrl && (
          <div className="facility-image-container">
            <img
              src={selectedFacility.imageUrl}
              alt={selectedFacility.name}
              className="facility-image"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="facility-status-badge" style={{ backgroundColor: statusColor }}>
          {getStatusLabel(status)}
        </div>

        <div className="facility-info">
          <div className="facility-info-row">
            <span className="facility-label">Address</span>
            <span className="facility-value">{selectedFacility.googleMapsAddress}</span>
          </div>

          {selectedFacility.contactDetails && (
            <div className="facility-info-row">
              <span className="facility-label">Contact Details</span>
              <span className="facility-value facility-contact">
                {selectedFacility.contactDetails}
              </span>
            </div>
          )}

          <div className="facility-flags">
            {selectedFacility.needs_public_contract && (
              <span className="facility-flag flag-council">Council Run</span>
            )}
            {selectedFacility.pilot_in_progress && (
              <span className="facility-flag flag-pilot">Pilot in Progress</span>
            )}
            {selectedFacility.squadova_customer && (
              <span className="facility-flag flag-customer">Squadova Customer</span>
            )}
          </div>

          {selectedFacility.lat && selectedFacility.lng && (
            <div className="facility-info-row">
              <span className="facility-label">Coordinates</span>
              <span className="facility-value">
                {selectedFacility.lat.toFixed(6)}, {selectedFacility.lng.toFixed(6)}
              </span>
            </div>
          )}
        </div>

        <div className="facility-actions">
          <Button variant="secondary" onClick={handleEdit}>
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
