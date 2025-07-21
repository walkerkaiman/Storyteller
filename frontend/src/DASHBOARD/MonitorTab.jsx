import React, { useEffect, useState } from 'react';

function timeAgo(ts) {
  if (!ts) return 'Never';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 2) return 'just now';
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
  return new Date(ts).toLocaleString();
}

function formatDuration(seconds) {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export default function MonitorTab({ config }) {
  const [data, setData] = useState({ agents: [], summary: {} });
  const [discoveryStatus, setDiscoveryStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [monitorRes, discoveryRes] = await Promise.all([
          fetch('/api/monitor/chapters'),
          fetch('/api/discovery/status')
        ]);
        
        const monitorData = await monitorRes.json();
        const discoveryData = await discoveryRes.json();
        
        if (mounted) {
          setData(monitorData);
          setDiscoveryStatus(discoveryData);
          setLoading(false);
        }
      } catch (e) {
        console.error('Error fetching data:', e);
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const { agents, summary } = data;

  return (
    <div>
      {/* Summary Cards */}
      {!loading && summary && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div style={{ background: '#e3f2fd', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>{summary.total}</div>
            <div>Total Agents</div>
          </div>
          <div style={{ background: '#e8f5e8', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2e7d32' }}>{summary.online}</div>
            <div>Online</div>
          </div>
          <div style={{ background: '#fff3e0', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>{summary.activeSessions}</div>
            <div>Active Sessions</div>
          </div>
          <div style={{ background: '#f3e5f5', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7b1fa2' }}>{summary.totalParticipants}</div>
            <div>Total Participants</div>
          </div>
          <div style={{ background: '#e0f2f1', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00695c' }}>{summary.chapters}</div>
            <div>Chapters</div>
          </div>
          <div style={{ background: '#fce4ec', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#c2185b' }}>{summary.connections}</div>
            <div>Connections</div>
          </div>
          <div style={{ background: '#fafafa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#666' }}>
              {discoveryStatus.active ? '🟢' : '🔴'}
            </div>
            <div>Auto-Discovery</div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              {discoveryStatus.discoveredCount || 0} found
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Agents...</div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Agent</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Location</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Participants</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Timer</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Session</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Last Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    No agents found. Configure Chapters and Connections in the Configure tab.
                  </td>
                </tr>
              ) : (
                agents.map(agent => (
                  <tr key={agent.id} style={{ 
                    borderBottom: '1px solid #eee',
                    background: agent.isOnline ? 'white' : '#fff5f5'
                  }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {agent.configUrl ? (
                          <a 
                            href={agent.configUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              color: '#1976d2', 
                              textDecoration: 'none',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                          >
                            {agent.name} 🔗
                          </a>
                        ) : (
                          agent.name
                        )}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>ID: {agent.id}</div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        background: agent.type === 'chapter' ? '#e3f2fd' : '#fce4ec',
                        color: agent.type === 'chapter' ? '#1976d2' : '#c2185b'
                      }}>
                        {agent.type.toUpperCase()}
                      </span>
                      {agent.type === 'connection' && agent.deviceType && (
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                          {agent.deviceType}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        background: agent.isOnline ? '#e8f5e8' : '#ffeaea',
                        color: agent.isOnline ? '#2e7d32' : '#d32f2f'
                      }}>
                        {agent.isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {agent.location}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {agent.participantCount}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        {agent.min}-{agent.max}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ 
                        fontWeight: 'bold',
                        color: agent.timer > 10 ? '#2e7d32' : agent.timer > 5 ? '#f57c00' : '#d32f2f'
                      }}>
                        {formatDuration(agent.timer)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {agent.sessionActive ? (
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.9rem',
                          background: agent.sessionFinished ? '#e3f2fd' : '#e8f5e8',
                          color: agent.sessionFinished ? '#1976d2' : '#2e7d32'
                        }}>
                          {agent.sessionFinished ? 'FINISHED' : 'ACTIVE'}
                        </span>
                      ) : (
                        <span style={{ color: '#666' }}>Idle</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.9rem' }}>
                        {timeAgo(agent.last_heartbeat)}
                      </div>
                      {agent.timeSinceHeartbeat > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          {formatDuration(agent.timeSinceHeartbeat)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Auto-Discovery Info */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginTop: '2rem',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        <h4>Auto-Discovery Status</h4>
        <p style={{ margin: '0.5rem 0' }}>
          The system automatically discovers and registers agents on the network. 
          Agents can be added manually in the Configure tab or discovered automatically.
        </p>
      </div>
    </div>
  );
} 