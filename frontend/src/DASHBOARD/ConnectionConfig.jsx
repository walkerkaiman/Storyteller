import React, { useState } from 'react';

export default function ConnectionConfig({ connections, onConfigUpdate }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'performer',
    description: '',
    deviceType: 'esp32',
    serialPort: '',
    baudRate: 115200,
    ipAddress: '',
    macAddress: '',
    autoConnect: true,
    heartbeatInterval: 30,
    sensors: [],
    actuators: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingConnection 
        ? `/api/config/connections/${editingConnection.id}`
        : '/api/config/connections';
      
      const method = editingConnection ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowAddForm(false);
        setEditingConnection(null);
        setFormData({
          name: '',
          type: 'performer',
          description: '',
          deviceType: 'esp32',
          serialPort: '',
          baudRate: 115200,
          ipAddress: '',
          macAddress: '',
          autoConnect: true,
          heartbeatInterval: 30,
          sensors: [],
          actuators: []
        });
        onConfigUpdate();
      }
    } catch (e) {
      console.error('Error saving connection:', e);
    }
  };

  const handleEdit = (connection) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      type: connection.type || 'performer',
      description: connection.description || '',
      deviceType: connection.deviceType || 'esp32',
      serialPort: connection.serialPort || '',
      baudRate: connection.baudRate || 115200,
      ipAddress: connection.ipAddress || '',
      macAddress: connection.macAddress || '',
      autoConnect: connection.autoConnect !== false,
      heartbeatInterval: connection.heartbeatInterval || 30,
      sensors: connection.sensors || [],
      actuators: connection.actuators || []
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingConnection(null);
    setFormData({
      name: '',
      type: 'performer',
      description: '',
      deviceType: 'esp32',
      serialPort: '',
      baudRate: 115200,
      ipAddress: '',
      macAddress: '',
      autoConnect: true,
      heartbeatInterval: 30,
      sensors: [],
      actuators: []
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>CONNECTION Configuration</h2>
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
          Add CONNECTION
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
          <h3>{editingConnection ? 'Edit CONNECTION' : 'Add New CONNECTION'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Basic Information */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Name *:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Story Guide Device"
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Type:</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="performer">Performer</option>
                <option value="guide">Guide</option>
                <option value="facilitator">Facilitator</option>
                <option value="technician">Technician</option>
                <option value="sensor">Sensor Node</option>
                <option value="actuator">Actuator Node</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Description:</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of device and role"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            {/* Device Configuration */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Device Type:</label>
              <select
                value={formData.deviceType}
                onChange={(e) => setFormData({...formData, deviceType: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="esp32">ESP32</option>
                <option value="arduino">Arduino</option>
                <option value="raspberry-pi">Raspberry Pi</option>
                <option value="esp8266">ESP8266</option>
                <option value="stm32">STM32</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Serial Port:</label>
              <input
                type="text"
                value={formData.serialPort}
                onChange={(e) => setFormData({...formData, serialPort: e.target.value})}
                placeholder="e.g., COM3, /dev/ttyUSB0"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Baud Rate:</label>
              <select
                value={formData.baudRate}
                onChange={(e) => setFormData({...formData, baudRate: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value={9600}>9600</option>
                <option value={19200}>19200</option>
                <option value={38400}>38400</option>
                <option value={57600}>57600</option>
                <option value={115200}>115200</option>
                <option value={230400}>230400</option>
                <option value={460800}>460800</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>IP Address:</label>
              <input
                type="text"
                value={formData.ipAddress}
                onChange={(e) => setFormData({...formData, ipAddress: e.target.value})}
                placeholder="e.g., 192.168.1.100"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>MAC Address:</label>
              <input
                type="text"
                value={formData.macAddress}
                onChange={(e) => setFormData({...formData, macAddress: e.target.value})}
                placeholder="e.g., AA:BB:CC:DD:EE:FF"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            {/* Connection Behavior */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Auto Connect:</label>
              <select
                value={formData.autoConnect}
                onChange={(e) => setFormData({...formData, autoConnect: e.target.value === 'true'})}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value={true}>Yes</option>
                <option value={false}>No</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Heartbeat Interval (s):</label>
              <input
                type="number"
                value={formData.heartbeatInterval}
                onChange={(e) => setFormData({...formData, heartbeatInterval: parseInt(e.target.value)})}
                min="5"
                max="300"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', gridColumn: '1 / -1' }}>
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
                {editingConnection ? 'Update' : 'Create'}
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

      {/* Connections List */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>CONNECTION</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Type</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Device</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Connection</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {connections.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                  No CONNECTIONS configured. Add microcontroller devices to get started.
                </td>
              </tr>
            ) : (
              connections.map(connection => (
                <tr key={connection.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>{connection.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>ID: {connection.id}</div>
                    {connection.description && (
                      <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>
                        {connection.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.9rem',
                      background: '#e3f2fd',
                      color: '#1976d2'
                    }}>
                      {connection.type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold' }}>{connection.deviceType}</div>
                    {connection.ipAddress && (
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {connection.ipAddress}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {connection.serialPort ? (
                      <div>
                        <div style={{ fontSize: '0.9rem' }}>{connection.serialPort}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{connection.baudRate} baud</div>
                      </div>
                    ) : (
                      <span style={{ color: '#666' }}>WiFi</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.9rem',
                      background: connection.status === 'active' ? '#e8f5e8' : '#ffeaea',
                      color: connection.status === 'active' ? '#2e7d32' : '#d32f2f'
                    }}>
                      {connection.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEdit(connection)}
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