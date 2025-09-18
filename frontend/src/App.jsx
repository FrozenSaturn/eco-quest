import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import './App.css'; // This component uses the simplified App.css
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ActionForm from './ActionForm';

const API_BASE = import.meta.env.PROD ? import.meta.env.VITE_API_BASE_URL : '/api';

function App() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newMarker, setNewMarker] = useState({
    type: 'tree',
    description: '',
    lat: 0,
    lng: 0,
    photo: null
  });
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  // Effect to manage user authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  // Effect to initialize the Leaflet map once
  useEffect(() => {
    if (!mapRef.current || map) return;

    const leafletMap = L.map(mapRef.current, {
      center: [22.5726, 88.3639], // Kolkata coordinates
      zoom: 13,
      zoomControl: true // Re-enable zoom controls for the main map
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);

    // Event listener for adding new markers
    const onMapClick = (e) => {
      if (auth.currentUser) {
        setNewMarker(prev => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }));
        setShowForm(true);
      }
    };
    leafletMap.on('click', onMapClick);
    
    setMap(leafletMap);
    
    return () => {
        leafletMap.off('click', onMapClick);
        leafletMap.remove();
    };
  }, []); // Empty dependency array ensures this runs only once

  // Function to fetch markers from the backend
  const fetchMarkers = async () => {
    try {
      const response = await fetch(`${API_BASE}/markers`);
      const data = await response.json();
      setMarkers(data);
    } catch (err) {
      console.error("Failed to fetch markers:", err);
    }
  };

  // Fetch markers on component mount
  useEffect(() => {
    fetchMarkers();
  }, []);

  // Effect to update markers on the map when the markers state changes
  useEffect(() => {
    if (!map) return;
    
    // Clear existing markers to prevent duplication
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
    
    // Add new markers
    markers.forEach(marker => {
      const icon = L.divIcon({ 
          className: 'custom-marker', 
          html: `<div class="marker-pin ${marker.type}"></div>` 
      });
      L.marker([marker.lat, marker.lng], { icon }).addTo(map)
        .bindPopup(`<b>${marker.type} by ${marker.user}</b><br>${marker.description}`);
    });
  }, [markers, map]);

  // Handler for submitting the new action form
  const handleSubmit = async (markerData) => {
    try {
      const response = await fetch(`${API_BASE}/markers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(markerData)
      });
      if (response.ok) {
        setShowForm(false);
        fetchMarkers(); // Refresh markers after submission
      } else {
          console.error("Failed to submit marker");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    // This container is styled to be full-screen
    <div className="map-view-container">
      <div ref={mapRef} className="map"></div>
      
      {/* Floating button to navigate back to the dashboard */}
      <Link to="/dashboard" className="dashboard-button">
        📊 Dashboard
      </Link>

      {/* The form for adding a new action, appears as a modal */}
      <ActionForm
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        lat={newMarker.lat}
        lng={newMarker.lng}
        currentUser={user ? user.displayName || user.email : ''}
      />
    </div>
  );
}

export default App;