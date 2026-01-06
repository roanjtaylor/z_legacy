import { useState } from 'react';
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

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!selectedFacility) return null;

  const status = getFacilityStatus(selectedFacility);
  const statusColor = PIN_COLORS[status].background;

  // Collect valid images
  const images = [
    selectedFacility.imageUrl1,
    selectedFacility.imageUrl2,
    selectedFacility.imageUrl3
  ].filter(url => url && url.trim() !== '');

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

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Modal
      isOpen={!!selectedFacility}
      onClose={() => setSelectedFacility(null)}
      title={selectedFacility.name}
      size="lg"
    >
      <div className="facility-details">
        {/* Image Carousel */}
        {images.length > 0 && (
          <div className="facility-carousel">
            <div className="carousel-image-container">
              <img
                src={images[currentImageIndex]}
                alt={`${selectedFacility.name} - Image ${currentImageIndex + 1}`}
                className="facility-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            {images.length > 1 && (
              <>
                <button className="carousel-btn carousel-prev" onClick={prevImage}>
                  &#8249;
                </button>
                <button className="carousel-btn carousel-next" onClick={nextImage}>
                  &#8250;
                </button>
                <div className="carousel-dots">
                  {images.map((_, index) => (
                    <span
                      key={index}
                      className={`carousel-dot ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="facility-status-badge" style={{ backgroundColor: statusColor }}>
          {getStatusLabel(status)}
        </div>

        {/* Facility Details Section */}
        <div className="facility-section">
          <h4 className="facility-section-title">Facility Details</h4>
          <div className="facility-info">
            <div className="facility-info-row">
              <span className="facility-label">Address</span>
              <span className="facility-value">{selectedFacility.googleMapsAddress}</span>
            </div>

            {selectedFacility.contactDetails && (
              <div className="facility-info-row">
                <span className="facility-label">Contact</span>
                <span className="facility-value facility-contact">
                  {selectedFacility.contactDetails}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sales Details Section */}
        <div className="facility-section">
          <h4 className="facility-section-title">Sales Details</h4>
          <div className="facility-info">
            <div className="facility-info-row">
              <span className="facility-label">Recent Interaction</span>
              <span className="facility-value">{formatDate(selectedFacility.recentInteractionDate)}</span>
            </div>

            {selectedFacility.presentState && (
              <div className="facility-info-row">
                <span className="facility-label">Present State</span>
                <span className="facility-value facility-contact">
                  {selectedFacility.presentState}
                </span>
              </div>
            )}

            {selectedFacility.todoNotes && (
              <div className="facility-info-row">
                <span className="facility-label">To-Do</span>
                <span className="facility-value facility-contact">
                  {selectedFacility.todoNotes}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Filters/Flags */}
        <div className="facility-flags">
          {selectedFacility.council_run && (
            <span className="facility-flag flag-council">Council Run</span>
          )}
          {selectedFacility.pilot_progress && (
            <span className="facility-flag flag-pilot">Pilot Progress</span>
          )}
          {selectedFacility.customer_secured && (
            <span className="facility-flag flag-customer">Secured Paying Customer</span>
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
