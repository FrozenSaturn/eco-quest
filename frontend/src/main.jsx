// frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import GameView from './GameView.jsx';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx'; // Import the new Dashboard
import './firebase';
import './index.css';
import 'leaflet/dist/leaflet.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<App />} />
        <Route path="/game" element={<GameView />} />
        <Route path="/dashboard" element={<Dashboard />} /> {/* Add the new route */}
      </Routes>
    </Router>
  </React.StrictMode>,
);