import React, { useState } from 'react';
import './ActionForm.css';

const ActionForm = ({ show, onClose, onSubmit, lat, lng, currentUser }) => {
  const [newMarker, setNewMarker] = useState({
    type: 'tree',
    description: '',
    photo: null
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setNewMarker(prev => ({
      ...prev,
      photo: file
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMarker.description.trim()) {
      alert('Please add a description');
      return;
    }
    const markerData = {
      ...newMarker,
      lat,
      lng,
      user: currentUser,
      photoUrl: newMarker.photo ? URL.createObjectURL(newMarker.photo) : null
    };
    onSubmit(markerData);
    // Reset form for next use
    setNewMarker({ type: 'tree', description: '', photo: null });
  };

  if (!show) {
    return null;
  }

  return (
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
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Add Marker</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActionForm;