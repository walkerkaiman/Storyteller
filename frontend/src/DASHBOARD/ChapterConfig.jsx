import React, { useState } from 'react';

export default function ChapterConfig({ chapters, onConfigUpdate }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    ip: '',
    description: '',
    minParticipants: 2,
    maxParticipants: 6,
    countdownSeconds: 60
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingChapter 
        ? `/api/config/chapters/${editingChapter.id}`
        : '/api/config/chapters';
      
      const method = editingChapter ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowAddForm(false);
        setEditingChapter(null);
        setFormData({
          name: '',
          location: '',
          ip: '',
          description: '',
          minParticipants: 2,
          maxParticipants: 6,
          countdownSeconds: 60
        });
        onConfigUpdate();
      }
    } catch (e) {
      console.error('Error saving chapter:', e);
    }
  };

  const handleEdit = (chapter) => {
    setEditingChapter(chapter);
    setFormData({
      name: chapter.name,
      location: chapter.location,
      ip: chapter.ip || '',
      description: chapter.description || '',
      minParticipants: chapter.minParticipants || 2,
      maxParticipants: chapter.maxParticipants || 6,
      countdownSeconds: chapter.countdownSeconds || 60
    });
    setShowAddForm(true);
  };

  const handleDelete = async (chapterId) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    
    try {
      const res = await fetch(`/api/config/chapters/${chapterId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        onConfigUpdate();
      }
    } catch (e) {
      console.error('Error deleting chapter:', e);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingChapter(null);
    setFormData({
      name: '',
      location: '',
      ip: '',
      description: '',
      minParticipants: 2,
      maxParticipants: 6,
      countdownSeconds: 60
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>CHAPTER Configuration</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '0.5rem 1rem',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add CHAPTER
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div style={{ 
          background: '#f5f5f5', 
          padding: '2rem', 
          borderRadius: '8px', 
          marginBottom: '2rem' 
        }}>
          <h3>{editingChapter ? 'Edit CHAPTER' : 'Add New CHAPTER'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Name *:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Interactive Mirror"
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Location *:</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g., Main Hall"
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>IP Address:</label>
              <input
                type="text"
                value={formData.ip}
                onChange={(e) => setFormData({...formData, ip: e.target.value})}
                placeholder="e.g., 192.168.1.100"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Description:</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Min Participants:</label>
              <input
                type="number"
                value={formData.minParticipants}
                onChange={(e) => setFormData({...formData, minParticipants: parseInt(e.target.value)})}
                min="1"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Max Participants:</label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value)})}
                min="1"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Countdown (seconds):</label>
              <input
                type="number"
                value={formData.countdownSeconds}
                onChange={(e) => setFormData({...formData, countdownSeconds: parseInt(e.target.value)})}
                min="10"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
              <button 
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  background: '#2e7d32',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingChapter ? 'Update' : 'Create'}
              </button>
              <button 
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chapters List */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>CHAPTER</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Location</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>IP Address</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Participants</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Countdown</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {chapters.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                  No CHAPTERS configured. Add your first CHAPTER to get started.
                </td>
              </tr>
            ) : (
              chapters.map(chapter => (
                <tr key={chapter.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>{chapter.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>ID: {chapter.id}</div>
                    {chapter.description && (
                      <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>
                        {chapter.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {chapter.location}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {chapter.ip || '-'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {chapter.minParticipants}-{chapter.maxParticipants}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {chapter.countdownSeconds}s
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEdit(chapter)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(chapter.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#d32f2f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 