import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import './GameView.css';
import characterSprite from './assets/character.png';
import treeSprite from './assets/tree.png';
import cleanupSprite from './assets/cleanup.png';
import ActionForm from './ActionForm';

const API_BASE = '/api';

const GameView = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [itemMarkersLayer, setItemMarkersLayer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState('');

  // Fetch user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('ecoquest-user');
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  // Wrap fetchMarkers in useCallback so it has a stable identity
  const fetchMarkers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/markers`);
      const data = await response.json();
      setMarkers(data);
    } catch (error) {
      console.error('Failed to fetch markers:', error);
    }
  }, []);

  // Initial fetch of markers
  useEffect(() => {
    fetchMarkers();
  }, [fetchMarkers]);

  const handleCaptureClick = () => {
    if (!currentUser) {
      alert("Please set your name in the main map view first!");
      return;
    }
    setShowForm(true);
  };

  const handleFormSubmit = async (markerData) => {
    try {
      const response = await fetch(`${API_BASE}/markers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(markerData)
      });
      if (response.ok) {
        alert('Action submitted successfully!');
        setShowForm(false);
        fetchMarkers();
      } else {
        alert('Failed to submit action. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add marker:', error);
      alert('Failed to add marker. Please try again.');
    }
  };

  // Wrap handleCleanup in useCallback to prevent it from being stale
  const handleCleanup = useCallback(async (markerId) => {
    if (!map) return;
    try {
      const response = await fetch(`${API_BASE}/markers/${markerId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('Cleanup completed and removed!');
        map.closePopup();
        fetchMarkers();
      } else {
         const errorData = await response.json();
        console.error('Cleanup failed:', errorData);
        alert('Failed to complete cleanup. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete marker:', error);
      alert('Failed to delete marker. Please try again.');
    }
  }, [map, fetchMarkers]);

  // Initialize the map (runs only once)
  useEffect(() => {
    if (!mapRef.current || map) return;
    const leafletMap = L.map(mapRef.current, {
      center: [22.5726, 88.3639],
      zoom: 18,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);
    
    setMap(leafletMap);
    setItemMarkersLayer(L.layerGroup().addTo(leafletMap));
    return () => leafletMap.remove();
  }, []);

  // This effect now correctly handles attaching event listeners inside popups
  useEffect(() => {
    if (!map) return;
    const onPopupOpen = (e) => {
        const container = e.popup.getElement();
        const cleanupButton = container.querySelector('.cleanup-button');
        if (cleanupButton) {
            const markerId = cleanupButton.dataset.id;
            // Use L.DomEvent to safely attach a listener
            L.DomEvent.on(cleanupButton, 'click', () => {
                handleCleanup(markerId);
            });
        }
    };
    map.on('popupopen', onPopupOpen);
    return () => {
      map.off('popupopen', onPopupOpen);
    };
  }, [map, handleCleanup]);

  // Handle keyboard movement by panning the map
  useEffect(() => {
    if (!map) return;
    const handleKeyDown = (e) => {
      const step = 20;
      switch (e.key) {
        case 'ArrowUp': map.panBy([0, -step], { animate: false }); break;
        case 'ArrowDown': map.panBy([0, step], { animate: false }); break;
        case 'ArrowLeft': map.panBy([-step, 0], { animate: false }); break;
        case 'ArrowRight': map.panBy([step, 0], { animate: false }); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [map]);

  // Update item markers on the map
  useEffect(() => {
    if (!map || !itemMarkersLayer) return;
    itemMarkersLayer.clearLayers();

    const treeIcon = L.icon({
        iconUrl: treeSprite, iconSize: [48, 48], iconAnchor: [24, 48],
    });
    const cleanupIcon = L.icon({
        iconUrl: cleanupSprite, iconSize: [40, 40], iconAnchor: [20, 20],
    });

    markers.forEach(marker => {
      let icon;
      let popupContent;

      if (marker.type === 'tree') {
        icon = treeIcon;
        popupContent = `<div><b>Tree planted by:</b><br>${marker.user}<br><small>${marker.description}</small></div>`;
      } else if (marker.type === 'cleanup') {
        icon = cleanupIcon;
        popupContent = `
          <div>
            <b>Cleanup reported by:</b><br>${marker.user}<br><small>${marker.description}</small>
            <button class="popup-button cleanup-button" data-id="${marker.id}">Cleaned Up!</button>
          </div>`;
      }

      if (icon) {
        L.marker([marker.lat, marker.lng], { icon })
          .addTo(itemMarkersLayer)
          .bindPopup(popupContent);
      }
    });
  }, [markers, map, itemMarkersLayer]);

  return (
    <div className="game-container">
      <div ref={mapRef} className="game-map"></div>
      <div className="character">
        <img src={characterSprite} alt="character" />
      </div>
      <button className="capture-button" onClick={handleCaptureClick}>
        📸
      </button>

      <ActionForm
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
        lat={map ? map.getCenter().lat : 0}
        lng={map ? map.getCenter().lng : 0}
        currentUser={currentUser}
      />
    </div>
  );
};

export default GameView;