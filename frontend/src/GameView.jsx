import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import './GameView.css';
import characterSprite from './assets/character.png';

const GameView = () => {
  const mapRef = useRef(null);
  const characterRef = useRef(null);
  const [map, setMap] = useState(null);

  // Initialize the map
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

    return () => {
      leafletMap.remove();
    };
  }, []);

  // Handle keyboard movement
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!characterRef.current) return;
      const step = 10; // pixels to move
      const currentPos = {
        x: parseInt(characterRef.current.style.left || '0', 10),
        y: parseInt(characterRef.current.style.top || '0', 10),
      };

      switch (e.key) {
        case 'ArrowUp':
          characterRef.current.style.top = `${currentPos.y - step}px`;
          break;
        case 'ArrowDown':
          characterRef.current.style.top = `${currentPos.y + step}px`;
          break;
        case 'ArrowLeft':
          characterRef.current.style.left = `${currentPos.x - step}px`;
          break;
        case 'ArrowRight':
          characterRef.current.style.left = `${currentPos.x + step}px`;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  return (
    <div className="game-container">
      <div ref={mapRef} className="game-map"></div>
      <div
        ref={characterRef}
        className="character"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <img src={characterSprite} alt="character" />
      </div>
    </div>
  );
};

export default GameView;