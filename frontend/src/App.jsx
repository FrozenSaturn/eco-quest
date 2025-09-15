import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import './App.css';

// Mock user data for leaderboard
const mockUsers = [
  { name: 'EcoWarrior123', trees: 15, cleanups: 8, schools: 2, total: 25 },
  { name: 'GreenThumb', trees: 12, cleanups: 10, schools: 1, total: 23 },
  { name: 'NatureLover', trees: 20, cleanups: 2, schools: 0, total: 22 },
  { name: 'CleanupCrew', trees: 5, cleanups: 15, schools: 1, total: 21 }
];

const API_BASE = '/api';

function App() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [stats, setStats] = useState({ trees: 0, cleanups: 0, schools: 0 });
  const [showForm, setShowForm] = useState(false);
  const [newMarker, setNewMarker] = useState({
    type: 'tree',
    description: '',
    lat: 0,
    lng: 0,
    photo: null
  });
  const [currentUser, setCurrentUser] = useState('');
  const [showUserInput, setShowUserInput] = useState(false);

  // Initialize user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('ecoquest-user');
    if (savedUser) {
      setCurrentUser(savedUser);
    } else {
      setShowUserInput(true);
    }
  }, []);

  // Initialize Leaflet map instance (runs only once)
  useEffect(() => {
    if (!mapRef.current || map) return;

    const leafletMap = L.map(mapRef.current, {
      center: [22.5726, 88.3639], // Kolkata coordinates
      zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);

    setMap(leafletMap);

    return () => {
      leafletMap.remove();
      setMap(null);
    };
  }, []); // Empty dependency array ensures this runs only once

  // Effect to handle map clicks (re-runs when currentUser changes)
  useEffect(() => {
    if (!map) return;

    const onMapClick = (e) => {
      if (currentUser) {
        setNewMarker(prev => ({
          ...prev,
          lat: e.latlng.lat,
          lng: e.latlng.lng
        }));
        setShowForm(true);
      } else {
        alert('Please enter your name first!');
        setShowUserInput(true);
      }
    };

    map.on('click', onMapClick);

    // Cleanup function to remove the listener before adding a new one
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, currentUser]); // Dependency array includes map and currentUser

  // Load markers from backend
  useEffect(() => {
    fetchMarkers();
  }, []);

  // Add/update markers on the map
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add new markers
    markers.forEach(marker => {
      const icon = getMarkerIcon(marker.type);
      const leafletMarker = L.marker([marker.lat, marker.lng], { icon })
        .addTo(map);

      leafletMarker.bindPopup(`
        <div>
          <h4>${getActionTitle(marker.type)}</h4>
          <p>${marker.description}</p>
          <small>by ${marker.user}</small>
          ${marker.photoUrl ? `<br><img src="${marker.photoUrl}" style="max-width: 200px; max-height: 150px; margin-top: 5px;">` : ''}
        </div>
      `);
    });

    // Update stats
    const newStats = markers.reduce((acc, marker) => {
      if (marker.type === 'tree') acc.trees++;
      else if (marker.type === 'cleanup') acc.cleanups++;
      else if (marker.type === 'school') acc.schools++;
      return acc;
    }, { trees: 0, cleanups: 0, schools: 0 });
    setStats(newStats);
  }, [markers, map]);

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
    
    if (!newMarker.description.trim()) {
      alert('Please add a description');
      return;
    }

    const markerData = {
      type: newMarker.type,
      description: newMarker.description,
      lat: newMarker.lat,
      lng: newMarker.lng,
      user: currentUser,
      photoUrl: newMarker.photo ? URL.createObjectURL(newMarker.photo) : null
    };

    try {
      const response = await fetch(`${API_BASE}/markers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(markerData)
      });

      if (response.ok) {
        await fetchMarkers();
        setShowForm(false);
        setNewMarker({
          type: 'tree',
          description: '',
          lat: 0,
          lng: 0,
          photo: null
        });
      }
    } catch (error) {
      console.error('Failed to add marker:', error);
      alert('Failed to add marker. Please try again.');
    }
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (currentUser.trim()) {
      localStorage.setItem('ecoquest-user', currentUser);
      setShowUserInput(false);
    }
  };

  const getMarkerIcon = (type) => {
    const colors = {
      tree: 'green',
      cleanup: 'orange',
      school: 'blue'
    };
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${colors[type]}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  const getActionTitle = (type) => {
    const titles = {
      tree: 'Tree Planted 🌳',
      cleanup: 'Cleanup Done 🗑️',
      school: 'School Added 🏫'
    };
    return titles[type] || 'Action';
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setNewMarker(prev => ({
      ...prev,
      photo: file
    }));
  };

  return (
    <div className="app">
      {/* User Input Modal */}
      {showUserInput && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Welcome to EcoQuest!</h3>
            <form onSubmit={handleUserSubmit}>
              <input
                type="text"
                placeholder="Enter your name"
                value={currentUser}
                onChange={(e) => setCurrentUser(e.target.value)}
                required
              />
              <button type="submit">Start Playing</button>
            </form>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Environmental Action</h3>
            <form onSubmit={handleSubmit}>
              <select
                value={newMarker.type}
                onChange={(e) => setNewMarker(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="tree">Tree Planted</option>
                <option value="cleanup">Cleanup</option>
                <option value="school">School</option>
              </select>
              
              <textarea
                placeholder="Description of your action..."
                value={newMarker.description}
                onChange={(e) => setNewMarker(prev => ({ ...prev, description: e.target.value }))}
                required
              />
              
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              
              {newMarker.photo && (
                <div className="photo-preview">
                  <img
                    src={URL.createObjectURL(newMarker.photo)}
                    alt="Preview"
                  />
                </div>
              )}
              
              <div className="form-buttons">
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit">Add Marker</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="main-content">
        {/* Map */}
        <div className="map-container">
          <div ref={mapRef} className="map"></div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="user-info">
            <h3>Welcome, {currentUser}!</h3>
            <button onClick={() => setShowUserInput(true)} className="change-user">
              Change User
            </button>
          </div>

          <div className="stats">
            <h3>Global Impact</h3>
            <div className="stat-item">
              <span className="stat-icon">🌳</span>
              <span>Trees Planted: {stats.trees}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🗑️</span>
              <span>Cleanups: {stats.cleanups}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🏫</span>
              <span>Schools: {stats.schools}</span>
            </div>
          </div>

          <div className="leaderboard">
            <h3>Leaderboard</h3>
            {mockUsers.map((user, index) => (
              <div key={index} className="leader-item">
                <span className="rank">#{index + 1}</span>
                <span className="name">{user.name}</span>
                <span className="score">{user.total}</span>
              </div>
            ))}
          </div>

          <div className="instructions">
            <h4>How to play:</h4>
            <p>Click anywhere on the map to add an environmental action!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;