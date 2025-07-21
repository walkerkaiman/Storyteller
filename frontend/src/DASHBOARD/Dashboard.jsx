import React, { useEffect, useState } from 'react';
import MonitorTab from './MonitorTab';
import ConfigTab from './ConfigTab';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('monitor');
  const [config, setConfig] = useState({ chapters: [], connections: [], settings: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const configData = await res.json();
      setConfig(configData);
      setLoading(false);
    } catch (e) {
      console.error('Error fetching config:', e);
      setLoading(false);
    }
  };

  const handleConfigUpdate = () => {
    fetchConfig(); // Refresh config after changes
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 1400, margin: '2rem auto', fontFamily: 'sans-serif', padding: '0 1rem' }}>
      <h1>Storyteller System Dashboard</h1>
      
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '2px solid #ddd', 
        marginBottom: '2rem' 
      }}>
        <button
          onClick={() => setActiveTab('monitor')}
          style={{
            padding: '1rem 2rem',
            border: 'none',
            background: activeTab === 'monitor' ? '#1976d2' : '#f5f5f5',
            color: activeTab === 'monitor' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Monitor
        </button>
        <button
          onClick={() => setActiveTab('config')}
          style={{
            padding: '1rem 2rem',
            border: 'none',
            background: activeTab === 'config' ? '#1976d2' : '#f5f5f5',
            color: activeTab === 'config' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Configure
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'monitor' && (
        <MonitorTab config={config} isActive={activeTab === 'monitor'} />
      )}
      
      {activeTab === 'config' && (
        <ConfigTab config={config} onConfigUpdate={handleConfigUpdate} isActive={activeTab === 'config'} />
      )}
    </div>
  );
}

export default Dashboard; 