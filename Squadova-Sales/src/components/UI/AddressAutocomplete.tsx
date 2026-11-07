import { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import './UI.css';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat: number | null, lng: number | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  label,
  placeholder = 'Start typing an address...',
  required
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const places = useMapsLibrary('places');
  const [inputValue, setInputValue] = useState(value);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!places || !inputRef.current) return;

    // Initialize autocomplete
    autocompleteRef.current = new places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'gb' }, // Restrict to UK
      fields: ['formatted_address', 'geometry', 'name'],
      types: ['establishment', 'geocode']
    });

    // Listen for place selection
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();

      if (place?.geometry?.location) {
        const address = place.formatted_address || place.name || '';
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setInputValue(address);
        onChange(address, lat, lng);
      }
    });

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [places, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // Only update parent with address, coords will come from place selection
    onChange(newValue, null, null);
  };

  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <input
        ref={inputRef}
        type="text"
        className="input"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
      />
      <span className="input-hint">Select an address from the dropdown for accurate location</span>
    </div>
  );
}
