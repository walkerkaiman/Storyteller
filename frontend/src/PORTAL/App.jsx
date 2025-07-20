import React from 'react';
import ParticipantQRCode from './ParticipantQRCode';
import RegistrationStatusBar from './RegistrationStatusBar';
import { useRegistrationStatus, deregisterParticipant } from './socketRegistration';

function App() {
  // Generate a persistent random userId for testing
  const [participantId] = React.useState(() => {
    return localStorage.getItem('participantId') || (() => {
      const id = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('participantId', id);
      return id;
    })();
  });
  const chapterId = 'CHAPTER_001'; // TODO: Dynamically select or fetch

  // Get registration status and user state
  const status = useRegistrationStatus(chapterId);
  const userState = status?.user_state || 'not_registered';

  // State-driven UI
  let content;
  switch (userState) {
    case 'not_registered':
      content = (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <h2>Check In</h2>
          <p>Scan your QR code at the installation to check in.</p>
          <ParticipantQRCode userId={participantId} />
        </div>
      );
      break;
    case 'pre_session':
      content = (
        <>
          <RegistrationStatusBar chapterId={chapterId} />
          <ParticipantQRCode userId={participantId} />
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button style={{ marginTop: 16 }} onClick={() => deregisterParticipant(participantId, chapterId)}>Deregister</button>
            <p style={{ marginTop: 8, color: '#666' }}>
              You are checked in! Waiting for the group to be ready.
            </p>
          </div>
        </>
      );
      break;
    case 'deregistered':
      content = (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <h2>You have been deregistered.</h2>
          <p>You may check in again by scanning your QR code.</p>
          <ParticipantQRCode userId={participantId} />
        </div>
      );
      break;
    case 'session_started':
      content = (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <h2>Session in Progress</h2>
          <p>Please follow the instructions at the installation.</p>
        </div>
      );
      break;
    case 'session_finished':
      content = (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <h2>Session Complete!</h2>
          <p>Thank you for participating.</p>
        </div>
      );
      break;
    default:
      content = <div>Loading...</div>;
  }

  return (
    <div className="App">
      {content}
    </div>
  );
}

export default App; 