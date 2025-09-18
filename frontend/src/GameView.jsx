import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import './GameView.css';
import characterSprite from './assets/character.png';
import treeSprite from './assets/tree.png';
import cleanupSprite from './assets/cleanup.png';
import ActionForm from './ActionForm';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.PROD ? import.meta.env.VITE_API_BASE_URL : '/api';

const GameView = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [itemMarkersLayer, setItemMarkersLayer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 22.5726, lng: 88.3639 });

  const auth = getAuth();
  const navigate = useNavigate();

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
    let watchId;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.error('Geolocation error:', err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const fetchMarkers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/markers`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setMarkers(data);
    } catch (error) {
      console.error('Failed to fetch markers:', error);
    }
  }, []);

  useEffect(() => {
    fetchMarkers();
  }, [fetchMarkers]);

  const handleCaptureClick = () => {
    if (!user) {
      alert("Please log in first!");
      navigate('/login');
      return;
    }
    setShowForm(true);
  };

  const handleFormSubmit = async (markerData) => {
    const finalMarkerData = { ...markerData, user: user.displayName || user.email };
    try {
      const response = await fetch(`${API_BASE}/markers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalMarkerData)
      });
      if (response.ok) {
        setShowForm(false);
        fetchMarkers();
      } else {
        alert('Failed to submit action.');
      }
    } catch (error) {
      console.error('Failed to add marker:', error);
    }
  };

  const handleCleanup = useCallback(async (markerId) => {
    try {
      const response = await fetch(`${API_BASE}/markers/${markerId}`, { method: 'DELETE' });
      if (response.ok) {
        if (map) map.closePopup();
        fetchMarkers();
      } else {
        alert('Failed to complete cleanup.');
      }
    } catch (error) {
      console.error('Failed to delete marker:', error);
    }
  }, [map, fetchMarkers]);

  useEffect(() => {
    if (!mapRef.current || map) return;
    const leafletMap = L.map(mapRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 18,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap);
    setMap(leafletMap);
    setItemMarkersLayer(L.layerGroup().addTo(leafletMap));
    return () => leafletMap.remove();
  }, []);

  useEffect(() => {
    if (map && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], map.getZoom(), { animate: true });
    }
  }, [map, userLocation]);

  useEffect(() => {
    if (!map) return;
    const onPopupOpen = (e) => {
      const cleanupButton = e.popup.getElement().querySelector('.cleanup-button');
      if (cleanupButton) {
        L.DomEvent.on(cleanupButton, 'click', () => handleCleanup(cleanupButton.dataset.id));
      }
    };
    map.on('popupopen', onPopupOpen);
    return () => map.off('popupopen', onPopupOpen);
  }, [map, handleCleanup]);

  useEffect(() => {
    if (!itemMarkersLayer) return;
    itemMarkersLayer.clearLayers();
    const treeIcon = L.icon({ iconUrl: treeSprite, iconSize: [48, 48], iconAnchor: [24, 48] });
    const cleanupIcon = L.icon({ iconUrl: cleanupSprite, iconSize: [40, 40], iconAnchor: [20, 20] });

    markers.forEach(marker => {
      let icon = marker.type === 'tree' ? treeIcon : cleanupIcon;
      let popupContent = `
        <div>
          <b>${marker.type === 'tree' ? 'Tree planted by' : 'Cleanup by'}:</b><br>${marker.user}<br><small>${marker.description}</small>
        </div>`;
      if (marker.type === 'cleanup') {
        popupContent += `<button class="popup-button cleanup-button" data-id="${marker.id}">Cleaned Up!</button>`;
      }
      L.marker([marker.lat, marker.lng], { icon }).addTo(itemMarkersLayer).bindPopup(popupContent);
    });
  }, [markers, itemMarkersLayer]);

  return (
    <div className="game-container">
      <div ref={mapRef} className="game-map"></div>
      
      {/* This new container will hold all UI elements and sit on top of the map */}
      <div className="game-ui-container">
        <Link to="/dashboard" className="dashboard-button-game">
          📊 Dashboard
        </Link>
        <div className="character">
          <img src={characterSprite} alt="character" />
        </div>
        <button className="capture-button" onClick={handleCaptureClick}>
          📸
        </button>
      </div>

      <ActionForm
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
        lat={userLocation.lat}
        lng={userLocation.lng}
        currentUser={user ? user.displayName || user.email : ''}
      />
    </div>
  );
};

export default GameView;