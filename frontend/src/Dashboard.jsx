// frontend/src/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import './Dashboard.css'; // We will create this CSS file next

const API_BASE = import.meta.env.PROD ? import.meta.env.VITE_API_BASE_URL : '/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ trees: 0, cleanups: 0, schools: 0 });
  const [user, setUser] = useState(null);
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
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        setStats(data.globalStats);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => signOut(auth);

  if (!user) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <div className="user-info-dash">
            Welcome, <strong>{user.displayName || user.email}</strong>!
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🌳</div>
          <div className="stat-value">{stats.trees}</div>
          <div className="stat-label">Trees Planted</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🗑️</div>
          <div className="stat-value">{stats.cleanups}</div>
          <div className="stat-label">Cleanups</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div className="stat-value">{stats.schools}</div>
          <div className="stat-label">Schools</div>
        </div>
      </div>

      <div className="nav-links">
        <Link to="/" className="nav-link map-link">
          🗺️ Go to Map View
        </Link>
        <Link to="/game" className="nav-link game-link">
          🎮 Go to Game View
        </Link>
      </div>

      <div className="instructions">
        <h4>How to play:</h4>
        <p>Go to the map view and tap anywhere to log an environmental action!</p>
      </div>

      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
};

export default Dashboard;