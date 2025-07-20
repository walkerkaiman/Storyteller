import React, { useEffect, useState } from 'react';

function timeAgo(ts) {
  if (!ts) return 'Never';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 2) return 'just now';
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
  return new Date(ts).toLocaleString();
}

export default function Dashboard() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const res = await fetch('/api/monitor/chapters');
        const data = await res.json();
        if (mounted) {
          setChapters(data.chapters || []);
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>CHAPTERS Monitor</h1>
      {loading ? <div>Loading...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th>ID</th>
              <th>Status</th>
              <th>Participants</th>
              <th>Timer</th>
              <th>Session</th>
              <th>Last Heartbeat</th>
            </tr>
          </thead>
          <tbody>
            {chapters.map(ch => (
              <tr key={ch.chapterId} style={{ background: ch.status === 'offline' ? '#ffeaea' : 'white' }}>
                <td>{ch.chapterId}</td>
                <td style={{ color: ch.status === 'online' ? 'green' : 'red', fontWeight: 'bold' }}>{ch.status}</td>
                <td>{ch.participants.length}</td>
                <td>{ch.timer}s</td>
                <td>{ch.sessionActive ? (ch.sessionFinished ? 'Finished' : 'Active') : 'Idle'}</td>
                <td>{timeAgo(ch.lastHeartbeat)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 