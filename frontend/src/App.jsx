// frontend/src/App.jsx

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import './App.css'; // We will replace this CSS next
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else navigate('/login');
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  useEffect(() => {
    if (!mapRef.current || map) return;
    const leafletMap = L.map(mapRef.current, { center: [22.5726, 88.3639], zoom: 13 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap);
    setMap(leafletMap);

    const onMapClick = (e) => {
      if (auth.currentUser) {
        setNewMarker(prev => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }));
        setShowForm(true);
      }
    };
    leafletMap.on('click', onMapClick);
    
    return () => leafletMap.remove();
  }, []);

  useEffect(() => {
    if (!map) return;
    map.eachLayer((layer) => { if (layer instanceof L.Marker) map.removeLayer(layer); });
    markers.forEach(marker => {
      const icon = L.divIcon({ className: 'custom-marker', html: `<div class="marker-pin ${marker.type}"></div>` });
      L.marker([marker.lat, marker.lng], { icon }).addTo(map)
        .bindPopup(`<b>${marker.type} by ${marker.user}</b><br>${marker.description}`);
    });
  }, [markers, map]);

  const fetchMarkers = async () => {
    try {
      const res = await fetch(`${API_BASE}/markers`);
      const data = await res.json();
      setMarkers(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchMarkers(); }, []);

  const handleSubmit = async (markerData) => {
    try {
      await fetch(`${API_BASE}/markers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(markerData)
      });
      setShowForm(false);
      fetchMarkers();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="map-view-container">
      <div ref={mapRef} className="map"></div>
      
      {/* This is now a simple floating button */}
      <Link to="/dashboard" className="dashboard-button">
        📊 Dashboard
      </Link>

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