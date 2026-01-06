import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useFacilityContext } from '../../context/FacilityContext';
import { FacilityFormData } from '../../types/facility';
import { Modal, Button, Input, Textarea, Checkbox, AddressAutocomplete } from '../UI';
import './Facility.css';

const initialFormData: FacilityFormData = {
  name: '',
  googleMapsAddress: '',
  imageUrl: '',
  needs_public_contract: false,
  pilot_in_progress: false,
  squadova_customer: false,
  contactDetails: '',
  lat: null,
  lng: null
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
          imageUrl: editingFacility.imageUrl,
          needs_public_contract: editingFacility.needs_public_contract,
          pilot_in_progress: editingFacility.pilot_in_progress,
          squadova_customer: editingFacility.squadova_customer,
          contactDetails: editingFacility.contactDetails,
          lat: editingFacility.lat,
          lng: editingFacility.lng
        });
      } else {
        setFormData(initialFormData);
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
      size="md"
    >
      <form onSubmit={handleSubmit} className="facility-form">
        <Input
          label="Facility Name *"
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

        <Input
          label="Image URL"
          value={formData.imageUrl}
          onChange={e => updateField('imageUrl', e.target.value)}
          placeholder="https://..."
          type="url"
        />

        <Textarea
          label="Contact Details"
          value={formData.contactDetails}
          onChange={e => updateField('contactDetails', e.target.value)}
          placeholder="Manager's name, email, phone number, and any notes..."
          rows={4}
        />

        <div className="form-checkboxes">
          <Checkbox
            label="Council Run (needs public contract)"
            checked={formData.needs_public_contract}
            onChange={e => updateField('needs_public_contract', e.target.checked)}
          />
          <Checkbox
            label="Pilot in Progress"
            checked={formData.pilot_in_progress}
            onChange={e => updateField('pilot_in_progress', e.target.checked)}
          />
          <Checkbox
            label="Squadova Customer"
            checked={formData.squadova_customer}
            onChange={e => updateField('squadova_customer', e.target.checked)}
          />
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
