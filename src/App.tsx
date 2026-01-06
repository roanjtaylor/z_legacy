import { useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { FacilityProvider } from './context/FacilityContext';
import { MapContainer } from './components/Map';
import { SidePanel } from './components/SidePanel';
import { FacilityModal, FacilityForm } from './components/Facility';
import { Facility } from './types/facility';
import './App.css';

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [focusedFacility, setFocusedFacility] = useState<Facility | null>(null);

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return (
      <div className="app-error">
        <h2>Google Maps API Key Required</h2>
        <p>Please add your API key to the .env file:</p>
        <code>VITE_GOOGLE_MAPS_API_KEY=your_key_here</code>
      </div>
    );
  }

  const handleFacilityClick = (facility: Facility) => {
    setFocusedFacility(facility);
    // Reset after a short delay so clicking the same facility again works
    setTimeout(() => setFocusedFacility(null), 100);
  };

  return (
    <APIProvider apiKey={apiKey}>
      <FacilityProvider>
        <div className={`app ${sidePanelOpen ? 'side-panel-open' : ''}`}>
          <SidePanel
            isOpen={sidePanelOpen}
            onToggle={() => setSidePanelOpen(!sidePanelOpen)}
            onFacilityClick={handleFacilityClick}
          />
          <MapContainer focusedFacility={focusedFacility} />
          <FacilityModal />
          <FacilityForm />
        </div>
      </FacilityProvider>
    </APIProvider>
  );
}

export default App;
