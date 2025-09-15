const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Data storage file
const DATA_FILE = path.join(__dirname, 'markers.json');

// Initialize data file if it doesn't exist
const initDataFile = () => {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      markers: [
        {
          id: '1',
          type: 'tree',
          description: 'Planted a mango tree in Eco Park',
          lat: 22.5568,
          lng: 88.4107,
          user: 'EcoWarrior123',
          photoUrl: null,
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          type: 'cleanup',
          description: 'Cleaned up plastic waste near Hooghly River',
          lat: 22.5675,
          lng: 88.3708,
          user: 'GreenThumb',
          photoUrl: null,
          timestamp: new Date().toISOString()
        },
        {
          id: '3',
          type: 'school',
          description: 'Environmental awareness program at local school',
          lat: 22.5812,
          lng: 88.4042,
          user: 'NatureLover',
          photoUrl: null,
          timestamp: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    console.log('Initialized markers.json with sample data');
  }
};

// Helper functions
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

// Validation functions
const validateMarker = (marker) => {
  const { type, description, lat, lng, user } = marker;
  
  const errors = [];
  
  if (!type || !['tree', 'cleanup', 'school'].includes(type)) {
    errors.push('Invalid or missing type. Must be: tree, cleanup, or school');
  }
  
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and must be a non-empty string');
  }
  
  if (typeof lat !== 'number' || lat < -90 || lat > 90) {
    errors.push('Latitude must be a number between -90 and 90');
  }
  
  if (typeof lng !== 'number' || lng < -180 || lng > 180) {
    errors.push('Longitude must be a number between -180 and 180');
  }
  
  if (!user || typeof user !== 'string' || user.trim().length === 0) {
    errors.push('User is required and must be a non-empty string');
  }
  
  return errors;
};

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get all markers
app.get('/markers', (req, res) => {
  try {
    const data = readData();
    
    // Optional query parameters for filtering
    const { type, user, limit } = req.query;
    let markers = data.markers || [];
    
    if (type && ['tree', 'cleanup', 'school'].includes(type)) {
      markers = markers.filter(marker => marker.type === type);
    }
    
    if (user) {
      markers = markers.filter(marker => 
        marker.user.toLowerCase().includes(user.toLowerCase())
      );
    }
    
    if (limit && !isNaN(parseInt(limit))) {
      markers = markers.slice(0, parseInt(limit));
    }
    
    // Sort by timestamp (newest first)
    markers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    console.log(`Retrieved ${markers.length} markers`);
    res.json(markers);
  } catch (error) {
    console.error('Error fetching markers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch markers',
      message: error.message 
    });
  }
});

// Get marker by ID
app.get('/markers/:id', (req, res) => {
  try {
    const data = readData();
    const marker = data.markers.find(m => m.id === req.params.id);
    
    if (!marker) {
      return res.status(404).json({ error: 'Marker not found' });
    }
    
    res.json(marker);
  } catch (error) {
    console.error('Error fetching marker:', error);
    res.status(500).json({ 
      error: 'Failed to fetch marker',
      message: error.message 
    });
  }
});

// Create a new marker
app.post('/markers', (req, res) => {
  try {
    const { type, description, lat, lng, user, photoUrl } = req.body;
    
    // Validate input
    const validationErrors = validateMarker({ type, description, lat, lng, user });
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors 
      });
    }
    
    // Create new marker
    const newMarker = {
      id: uuidv4(),
      type: type.toLowerCase(),
      description: description.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      user: user.trim(),
      photoUrl: photoUrl || null,
      timestamp: new Date().toISOString()
    };
    
    // Read current data
    const data = readData();
    
    // Add new marker
    data.markers.push(newMarker);
    
    // Write back to file
    if (!writeData(data)) {
      return res.status(500).json({ error: 'Failed to save marker' });
    }
    
    console.log(`Created new marker: ${newMarker.type} by ${newMarker.user}`);
    res.status(201).json({
      success: true,
      marker: newMarker,
      message: 'Marker created successfully'
    });
    
  } catch (error) {
    console.error('Error creating marker:', error);
    res.status(500).json({ 
      error: 'Failed to create marker',
      message: error.message 
    });
  }
});

// Update a marker (optional - for future enhancements)
app.put('/markers/:id', (req, res) => {
  try {
    const markerId = req.params.id;
    const updates = req.body;
    
    const data = readData();
    const markerIndex = data.markers.findIndex(m => m.id === markerId);
    
    if (markerIndex === -1) {
      return res.status(404).json({ error: 'Marker not found' });
    }
    
    // Validate updates
    const validationErrors = validateMarker({ 
      ...data.markers[markerIndex], 
      ...updates 
    });
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors 
      });
    }
    
    // Update marker
    data.markers[markerIndex] = {
      ...data.markers[markerIndex],
      ...updates,
      id: markerId, // Ensure ID doesn't change
      timestamp: data.markers[markerIndex].timestamp, // Keep original timestamp
      updatedAt: new Date().toISOString()
    };
    
    if (!writeData(data)) {
      return res.status(500).json({ error: 'Failed to update marker' });
    }
    
    console.log(`Updated marker: ${markerId}`);
    res.json({
      success: true,
      marker: data.markers[markerIndex],
      message: 'Marker updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating marker:', error);
    res.status(500).json({ 
      error: 'Failed to update marker',
      message: error.message 
    });
  }
});

// Delete a marker (optional - for future enhancements)
app.delete('/markers/:id', (req, res) => {
  try {
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
    
    console.log(`Deleted marker: ${markerId}`);
    res.json({
      success: true,
      message: 'Marker deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting marker:', error);
    res.status(500).json({ 
      error: 'Failed to delete marker',
      message: error.message 
    });
  }
});

// Get statistics
app.get('/stats', (req, res) => {
  try {
    const data = readData();
    const markers = data.markers || [];
    
    const stats = markers.reduce((acc, marker) => {
      acc[marker.type] = (acc[marker.type] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {});
    
    const userStats = {};
    markers.forEach(marker => {
      if (!userStats[marker.user]) {
        userStats[marker.user] = { trees: 0, cleanups: 0, schools: 0, total: 0 };
      }
      userStats[marker.user][marker.type]++;
      userStats[marker.user].total++;
    });
    
    res.json({
      globalStats: {
        trees: stats.tree || 0,
        cleanups: stats.cleanup || 0,
        schools: stats.school || 0,
        total: stats.total || 0
      },
      userStats,
      totalUsers: Object.keys(userStats).length,
      totalMarkers: markers.length
    });
    
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ 
      error: 'Failed to get statistics',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    availableRoutes: [
      'GET /health',
      'GET /markers',
      'GET /markers/:id',
      'POST /markers',
      'PUT /markers/:id',
      'DELETE /markers/:id',
      'GET /stats'
    ]
  });
});

// Initialize and start server
const startServer = () => {
  initDataFile();
  
  app.listen(PORT, () => {
    console.log(`🌱 EcoQuest API Server running on http://localhost:${PORT}`);
    console.log(`📊 Stats available at: http://localhost:${PORT}/stats`);
    console.log(`📍 Markers endpoint: http://localhost:${PORT}/markers`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  });
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down EcoQuest API server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down EcoQuest API server...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;