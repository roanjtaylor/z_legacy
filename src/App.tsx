import { APIProvider } from '@vis.gl/react-google-maps';
import { FacilityProvider } from './context/FacilityContext';
import { MapContainer } from './components/Map';
import { FilterToolbox } from './components/Filter';
import { FacilityModal, FacilityForm } from './components/Facility';
import './App.css';

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return (
      <div className="app-error">
        <h2>Google Maps API Key Required</h2>
        <p>Please add your API key to the .env file:</p>
        <code>VITE_GOOGLE_MAPS_API_KEY=your_key_here</code>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <FacilityProvider>
        <div className="app">
          <MapContainer />
          <FilterToolbox />
          <FacilityModal />
          <FacilityForm />
        </div>
      </FacilityProvider>
    </APIProvider>
  );
}

export default App;
