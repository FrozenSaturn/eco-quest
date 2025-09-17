// backend/server.js

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

// --- CORS Configuration ---
// This is the crucial change. It tells your backend to allow
// requests from your deployed frontend.
const corsOptions = {
  origin: 'https://releaf-sooty.vercel.app',
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Data storage file
const DATA_FILE = path.join(__dirname, 'markers.json');

// Initialize data file if it doesn't exist
const initDataFile = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ markers: [] }, null, 2));
    console.log('Initialized empty markers.json');
  }
};

// Helper functions to read/write data
const readData = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return { markers: [] };
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
};


// --- Routes ---

// Get all markers
app.get('/markers', (req, res) => {
  const data = readData();
  res.json(data.markers || []);
});

// Create a new marker
app.post('/markers', (req, res) => {
  const { type, description, lat, lng, user, photoUrl } = req.body;
  
  const newMarker = {
    id: uuidv4(),
    type,
    description,
    lat,
    lng,
    user,
    photoUrl: photoUrl || null,
    timestamp: new Date().toISOString()
  };
  
  const data = readData();
  data.markers.push(newMarker);
  
  if (!writeData(data)) {
    return res.status(500).json({ error: 'Failed to save marker' });
  }
  
  res.status(201).json(newMarker);
});

// Delete a marker
app.delete('/markers/:id', (req, res) => {
    const markerId = req.params.id;
    const data = readData();
    const initialLength = data.markers.length;
    
    data.markers = data.markers.filter(m => m.id !== markerId);
    
    if (data.markers.length === initialLength) {
      return res.status(404).json({ error: 'Marker not found' });
    }
    
    if (!writeData(data)) {
      return res.status(500).json({ error: 'Failed to delete marker' });
    }
    
    res.json({ success: true, message: 'Marker deleted successfully' });
});


// Initialize and start server
const startServer = () => {
  initDataFile();
  app.listen(PORT, () => {
    console.log(`🌱 EcoQuest API Server running on http://localhost:${PORT}`);
  });
};

startServer();

module.exports = app;