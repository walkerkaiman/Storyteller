import React from 'react';
import { useRegistrationStatus } from './socketRegistration';

const RegistrationStatusBar = ({ chapterId }) => {
  const status = useRegistrationStatus(chapterId);

  if (!status) return <div>Loading registration status...</div>;

  const { count, min_participants, max_participants, timer } = status;

  return (
    <div style={{
      background: '#f0f0f0',
      padding: '1rem',
      borderRadius: '8px',
      textAlign: 'center',
      margin: '1rem auto',
      maxWidth: 400
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
        {count} of {max_participants} registered
      </div>
      <div style={{ color: '#666', marginTop: 4 }}>
        Minimum to start: {min_participants}
      </div>
      <div style={{ marginTop: 8, fontSize: '1.1rem' }}>
        Time left: <span style={{ fontWeight: 'bold' }}>{timer}s</span>
      </div>
    </div>
  );
};

export default RegistrationStatusBar; 