import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useFacilityContext } from '../../context/FacilityContext';
import { FacilityFormData } from '../../types/facility';
import { Modal, Button, Input, Textarea, Checkbox, AddressAutocomplete } from '../UI';
import './Facility.css';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const initialFormData: FacilityFormData = {
  // Facility details
  name: '',
  googleMapsAddress: '',
  imageUrl1: '',
  imageUrl2: '',
  imageUrl3: '',
  contactDetails: '',
  lat: null,
  lng: null,
  // Sales details
  recentInteractionDate: getTodayDate(),
  presentState: '',
  nextInteractionDate: '',
  todoNotes: '',
  // Filters
  council_run: false,
  pilot_progress: false,
  customer_secured: false
};

export function FacilityForm() {
  const {
    isFormOpen,
    closeForm,
    editingFacility,
    addFacility,
    updateFacility,
    isGeocoding
  } = useFacilityContext();

  const [formData, setFormData] = useState<FacilityFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when editing facility changes or modal opens
  useEffect(() => {
    if (isFormOpen) {
      if (editingFacility) {
        setFormData({
          name: editingFacility.name,
          googleMapsAddress: editingFacility.googleMapsAddress,
          imageUrl1: editingFacility.imageUrl1,
          imageUrl2: editingFacility.imageUrl2,
          imageUrl3: editingFacility.imageUrl3,
          contactDetails: editingFacility.contactDetails,
          lat: editingFacility.lat,
          lng: editingFacility.lng,
          recentInteractionDate: editingFacility.recentInteractionDate,
          presentState: editingFacility.presentState,
          nextInteractionDate: editingFacility.nextInteractionDate || '',
          todoNotes: editingFacility.todoNotes,
          council_run: editingFacility.council_run,
          pilot_progress: editingFacility.pilot_progress,
          customer_secured: editingFacility.customer_secured
        });
      } else {
        setFormData({ ...initialFormData, recentInteractionDate: getTodayDate() });
      }
    }
  }, [isFormOpen, editingFacility]);

  const handleClose = () => {
    setFormData(initialFormData);
    closeForm();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.googleMapsAddress.trim()) {
      alert('Name and Address are required');
      return;
    }

    if (formData.lat === null || formData.lng === null) {
      alert('Please select an address from the dropdown to get accurate coordinates');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingFacility) {
        await updateFacility(editingFacility.id, formData);
      } else {
        await addFacility(formData);
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save facility:', error);
      alert('Failed to save facility. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof FacilityFormData>(
    field: K,
    value: FacilityFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = useCallback((address: string, lat: number | null, lng: number | null) => {
    setFormData(prev => ({
      ...prev,
      googleMapsAddress: address,
      lat,
      lng
    }));
  }, []);

  const hasValidCoordinates = formData.lat !== null && formData.lng !== null;

  return (
    <Modal
      isOpen={isFormOpen}
      onClose={handleClose}
      title={editingFacility ? 'Edit Facility' : 'Add New Facility'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="facility-form">
        {/* Facility Details Section */}
        <div className="form-section">
          <h3 className="form-section-title">Facility Details</h3>

          <Input
            label="Name *"
            value={formData.name}
            onChange={e => updateField('name', e.target.value)}
            placeholder="e.g., Belfast Leisure Centre"
            required
          />

          <AddressAutocomplete
            label="Address *"
            value={formData.googleMapsAddress}
            onChange={handleAddressChange}
            placeholder="Start typing to search for an address..."
            required
          />

          {hasValidCoordinates && (
            <p className="coordinates-status">
              Location captured: {formData.lat?.toFixed(4)}, {formData.lng?.toFixed(4)}
            </p>
          )}

          <div className="form-image-urls">
            <label className="form-label">Images (URLs)</label>
            <Input
              value={formData.imageUrl1}
              onChange={e => updateField('imageUrl1', e.target.value)}
              placeholder="Image 1 URL (https://...)"
              type="url"
            />
            <Input
              value={formData.imageUrl2}
              onChange={e => updateField('imageUrl2', e.target.value)}
              placeholder="Image 2 URL (https://...)"
              type="url"
            />
            <Input
              value={formData.imageUrl3}
              onChange={e => updateField('imageUrl3', e.target.value)}
              placeholder="Image 3 URL (https://...)"
              type="url"
            />
          </div>

          <Textarea
            label="Contact"
            value={formData.contactDetails}
            onChange={e => updateField('contactDetails', e.target.value)}
            placeholder="Manager's name, email, phone number, and any notes..."
            rows={3}
          />
        </div>

        {/* Sales Details Section */}
        <div className="form-section">
          <h3 className="form-section-title">Sales Details</h3>

          <Input
            label="Recent Interaction Date"
            type="date"
            value={formData.recentInteractionDate}
            onChange={e => updateField('recentInteractionDate', e.target.value)}
          />

          <Textarea
            label="Present State"
            value={formData.presentState}
            onChange={e => updateField('presentState', e.target.value)}
            placeholder="Current status of the sales relationship..."
            rows={2}
          />

          <Input
            label="Approx. Next Interaction"
            type="date"
            value={formData.nextInteractionDate}
            onChange={e => updateField('nextInteractionDate', e.target.value)}
          />

          <Textarea
            label="To-Do"
            value={formData.todoNotes}
            onChange={e => updateField('todoNotes', e.target.value)}
            placeholder="Next actions to take with this facility..."
            rows={2}
          />
        </div>

        {/* Filters Section */}
        <div className="form-section">
          <h3 className="form-section-title">Filters</h3>
          <div className="form-checkboxes">
            <Checkbox
              label="Council Run"
              checked={formData.council_run}
              onChange={e => updateField('council_run', e.target.checked)}
            />
            <Checkbox
              label="Pilot Progress"
              checked={formData.pilot_progress}
              onChange={e => updateField('pilot_progress', e.target.checked)}
            />
            <Checkbox
              label="Secured Paying Customer"
              checked={formData.customer_secured}
              onChange={e => updateField('customer_secured', e.target.checked)}
            />
          </div>
        </div>

        {isGeocoding && (
          <p className="geocoding-status">Geocoding address...</p>
        )}

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isGeocoding}>
            {isSubmitting ? 'Saving...' : editingFacility ? 'Update' : 'Add Facility'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
