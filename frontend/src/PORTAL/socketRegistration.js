import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// You may want to set this to your backend's actual WebSocket URL
const SOCKET_URL = process.env.VITE_BACKEND_WS_URL || 'http://localhost:5000';

let socketInstance = null;

export function useRegistrationStatus(chapterId) {
  const [status, setStatus] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!chapterId) return;
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      query: { chapterId },
    });
    socketRef.current = socket;
    socketInstance = socket;

    socket.on('connect', () => {
      // Optionally emit a join event for the chapter
      socket.emit('join_chapter', { chapterId });
    });

    socket.on('registration_status', (data) => {
      setStatus(data);
    });

    socket.on('session_started', (data) => {
      setStatus((prev) => ({ ...prev, user_state: 'session_started' }));
    });

    socket.on('session_finished', (data) => {
      setStatus((prev) => ({ ...prev, user_state: 'session_finished' }));
    });

    return () => {
      socket.disconnect();
      socketInstance = null;
    };
  }, [chapterId]);

  return status;
}

export function deregisterParticipant(participantId, chapterId) {
  if (socketInstance && socketInstance.connected) {
    socketInstance.emit('participant:deregister', { participantId, chapterId });
  }
} 