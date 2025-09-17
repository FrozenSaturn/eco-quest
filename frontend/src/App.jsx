// frontend/src/App.jsx

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import './App.css'; // We will update this file
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

// This logic makes your API calls deployment-ready.
const API_BASE = import.meta.env.PROD ? import.meta.env.VITE_API_BASE_URL : '/api';


function App() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [stats, setStats] = useState({ trees: 0, cleanups: 0, schools: 0, total: 0 });
  const [showForm, setShowForm] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [newMarker, setNewMarker] = useState({
    type: 'tree',
    description: '',
    lat: 0,
    lng: 0,
    photo: null
  });

  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState(null);

  // --- Hooks ---
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

  useEffect(() => {
    if (!mapRef.current || map) return;
    const leafletMap = L.map(mapRef.current, { center: [22.5726, 88.3639], zoom: 13 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);
    setMap(leafletMap);
    return () => { if (leafletMap) leafletMap.remove(); setMap(null); };
  }, []);

  useEffect(() => {
    if (!map) return;
    const onMapClick = (e) => {
      if (user) {
        setNewMarker(prev => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }));
        setShowForm(true);
      }
    };
    map.on('click', onMapClick);
    return () => map.off('click', onMapClick);
  }, [map, user]);

  useEffect(() => {
    fetchMarkers();
  }, []);

  useEffect(() => {
    if (!map) return;
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });
    markers.forEach(marker => {
      const icon = getMarkerIcon(marker.type);
      const leafletMarker = L.marker([marker.lat, marker.lng], { icon }).addTo(map);
      leafletMarker.bindPopup(`
        <div>
          <h4>${getActionTitle(marker.type)}</h4>
          <p>${marker.description}</p>
          <small>by ${marker.user}</small>
          ${marker.photoUrl ? `<br><img src="${marker.photoUrl}" style="max-width: 200px; max-height: 150px; margin-top: 5px;">` : ''}
        </div>
      `);
    });
    const newStats = markers.reduce((acc, m) => ({ ...acc, [m.type + 's']: (acc[m.type + 's'] || 0) + 1 }), { trees: 0, cleanups: 0, schools: 0 });
    setStats(newStats);
  }, [markers, map]);

  // --- Functions ---
  const fetchMarkers = async () => {
    try {
      const response = await fetch(`${API_BASE}/markers`);
      const data = await response.json();
      setMarkers(data);
    } catch (error) {
      console.error('Failed to fetch markers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMarker.description.trim()) return alert('Please add a description');
    if (!user) return alert('You must be logged in.');

    const markerData = {
      type: newMarker.type,
      description: newMarker.description,
      lat: newMarker.lat,
      lng: newMarker.lng,
      user: user.displayName || user.email,
      photoUrl: newMarker.photo ? URL.createObjectURL(newMarker.photo) : null
    };
    try {
      const response = await fetch(`${API_BASE}/markers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(markerData)
      });
      if (response.ok) {
        await fetchMarkers();
        setShowForm(false);
        setNewMarker({ type: 'tree', description: '', lat: 0, lng: 0, photo: null });
      }
    } catch (error) {
      console.error('Failed to add marker:', error);
    }
  };

  const handleLogout = () => signOut(auth);
  const getMarkerIcon = (type) => L.divIcon({ className: 'custom-marker', html: `<div class="marker-pin ${type}"></div>`, iconSize: [30, 42], iconAnchor: [15, 42] });
  const getActionTitle = (type) => ({ tree: 'Tree Planted 🌳', cleanup: 'Cleanup Done 🗑️', school: 'School Added 🏫' }[type] || 'Action');
  const handlePhotoChange = (e) => setNewMarker(prev => ({ ...prev, photo: e.target.files[0] }));

  // --- Render ---
  const SidebarContent = () => (
    <>
      <div className="user-info">
        <h3>Welcome, {user ? user.displayName || user.email : 'Guest'}!</h3>
        <button onClick={handleLogout} className="change-user">Logout</button>
      </div>
      <div className="stats">
        <h3>Global Impact</h3>
        <div className="stat-item">🌳<span>Trees Planted: {stats.trees}</span></div>
        <div className="stat-item">🗑️<span>Cleanups: {stats.cleanups}</span></div>
        <div className="stat-item">🏫<span>Schools: {stats.schools}</span></div>
      </div>
      <div className="instructions">
        <h4>How to play:</h4>
        <p>Click anywhere on the map to add an environmental action!</p>
      </div>
    </>
  );

  return (
    <div className="app">
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Environmental Action</h3>
            <form onSubmit={handleSubmit}>
              <select value={newMarker.type} onChange={(e) => setNewMarker(prev => ({ ...prev, type: e.target.value }))}>
                <option value="tree">Tree Planted</option>
                <option value="cleanup">Cleanup</option>
                <option value="school">School</option>
              </select>
              <textarea placeholder="Description of your action..." value={newMarker.description} onChange={(e) => setNewMarker(prev => ({ ...prev, description: e.target.value }))} required />
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
              {newMarker.photo && <div className="photo-preview"><img src={URL.createObjectURL(newMarker.photo)} alt="Preview" /></div>}
              <div className="form-buttons">
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit">Add Marker</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStatsModal && (
        <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
            <div className="modal stats-modal" onClick={e => e.stopPropagation()}>
                <SidebarContent />
            </div>
        </div>
      )}
      
      <div className="main-content">
        <div className="map-container">
          <div ref={mapRef} className="map"></div>
        </div>
        <div className="sidebar">
          <SidebarContent />
        </div>
      </div>

      <nav className="bottom-nav">
        <button onClick={() => setShowStatsModal(true)} className="nav-button">📊 Stats</button>
        <Link to="/game" className="nav-button game-button">🎮 Game View</Link>
      </nav>
    </div>
  );
}

export default App;