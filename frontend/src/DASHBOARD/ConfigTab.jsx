import React, { useState } from 'react';
import ChapterConfig from './ChapterConfig';
import ConnectionConfig from './ConnectionConfig';

export default function ConfigTab({ config, onConfigUpdate }) {
  const [activeSection, setActiveSection] = useState('chapters');

  return (
    <div>
      {/* Section Navigation */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #ddd', 
        marginBottom: '2rem' 
      }}>
        <button
          onClick={() => setActiveSection('chapters')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: activeSection === 'chapters' ? '#1976d2' : '#f5f5f5',
            color: activeSection === 'chapters' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          CHAPTERS ({config.chapters.length})
        </button>
        <button
          onClick={() => setActiveSection('connections')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: activeSection === 'connections' ? '#1976d2' : '#f5f5f5',
            color: activeSection === 'connections' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          CONNECTIONS ({config.connections.length})
        </button>
      </div>

      {/* Section Content */}
      {activeSection === 'chapters' && (
        <ChapterConfig chapters={config.chapters} onConfigUpdate={onConfigUpdate} />
      )}
      
      {activeSection === 'connections' && (
        <ConnectionConfig connections={config.connections} onConfigUpdate={onConfigUpdate} />
      )}
    </div>
  );
} 