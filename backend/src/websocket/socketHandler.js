const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');
const { logger } = require('../utils/logger');

// Store active connections
const activeConnections = new Map();
const activeChapters = new Map();
const activeConnections_agents = new Map();

// Registration state manager for each CHAPTER
const chapterRegistrationState = {};

function emitChapterRegistrationStatus(io, chapterId) {
  const state = chapterRegistrationState[chapterId];
  if (!state) return;
  // Emit to all participants in this chapter
  state.participants.forEach((participantId) => {
    const user_state = state.sessionActive
      ? (state.sessionFinished ? 'session_finished' : 'session_started')
      : (state.deregistered && state.deregistered.has(participantId) ? 'deregistered' : 'pre_session');
    io.to(`participant:${participantId}`).emit('registration_status', {
      count: state.participants.length,
      min_participants: state.min,
      max_participants: state.max,
      timer: state.timer,
      user_state,
    });
  });
}

function startOrResetChapterTimer(io, chapterId) {
  const state = chapterRegistrationState[chapterId];
  if (!state) return;
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
  }
  state.timer = state.countdownSeconds;
  state.sessionActive = false;
  state.sessionFinished = false;
  emitChapterRegistrationStatus(io, chapterId);
  state.timerInterval = setInterval(() => {
    if (state.timer > 0 && state.participants.length < state.max) {
      state.timer--;
      emitChapterRegistrationStatus(io, chapterId);
    } else {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
      // Registration closes, session starts
      state.sessionActive = true;
      state.timer = 0;
      emitChapterRegistrationStatus(io, chapterId);
      io.to(`chapter:${chapterId}`).emit('session_started', { participants: state.participants });
      // Simulate session finish after 30 seconds
      setTimeout(() => {
        state.sessionActive = false;
        state.sessionFinished = true;
        emitChapterRegistrationStatus(io, chapterId);
        io.to(`chapter:${chapterId}`).emit('session_finished', { participants: state.participants });
      }, 30000);
    }
  }, 1000);
}

function emitRegistrationStatus(io, chapterId, participantId, socket) {
  // Use actual chapter state data
  const state = chapterRegistrationState[chapterId];
  if (!state) {
    socket.emit('registration_status', {
      count: 0,
      min_participants: 2,
      max_participants: 6,
      timer: 0,
      user_state: 'not_registered',
    });
    return;
  }
  
  const status = {
    count: state.participants.length,
    min_participants: state.min,
    max_participants: state.max,
    timer: state.timer,
    user_state: socket.user_state || 'not_registered',
  };
  socket.emit('registration_status', status);
}

function setupWebSocket(io) {
  io.on('connection', (socket) => {
    logger.info(`New WebSocket connection: ${socket.id}`);
    
    // Handle participant connections
    socket.on('participant:join', async (data) => {
      try {
        const { participantId, chapterId, metadata = {} } = data;
        
        if (!participantId || !chapterId) {
          socket.emit('error', { message: 'Participant ID and Chapter ID are required' });
          return;
        }
        
        // Store connection info
        activeConnections.set(socket.id, {
          type: 'participant',
          participantId,
          metadata,
          connectedAt: new Date()
        });
        
        // Create or update participant in database
        const db = getDatabase();
        try {
          const stmt = db.prepare(`INSERT OR REPLACE INTO participants (id, last_seen, metadata) 
           VALUES (?, CURRENT_TIMESTAMP, ?)`);
          stmt.run(participantId, JSON.stringify(metadata));
        } catch (err) {
          logger.warn('Failed to create/update participant:', err);
        }
        
        // Initialize chapter state if needed
        if (!chapterRegistrationState[chapterId]) {
          chapterRegistrationState[chapterId] = {
            participants: [],
            min: 2, // TODO: fetch from config or DB
            max: 6, // TODO: fetch from config or DB
            countdownSeconds: 30, // TODO: fetch from config or DB
            timer: 0,
            timerInterval: null,
            sessionActive: false,
            sessionFinished: false,
            deregistered: new Set(),
            lastHeartbeat: Date.now(),
            status: 'online',
            heartbeatTimeout: null,
          };
        }
        const state = chapterRegistrationState[chapterId];
        // Add participant if not already present
        if (!state.participants.includes(participantId)) {
          state.participants.push(participantId);
        }
        state.deregistered.delete(participantId);
        // Join both chapter and participant rooms
        socket.join(`chapter:${chapterId}`);
        socket.join(`participant:${participantId}`);
        // Timer logic
        if (state.participants.length >= state.min && state.participants.length < state.max && !state.sessionActive) {
          startOrResetChapterTimer(io, chapterId);
        }
        if (state.participants.length === state.max && !state.sessionActive) {
          if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
          }
          state.timer = 0;
          state.sessionActive = true;
          emitChapterRegistrationStatus(io, chapterId);
          io.to(`chapter:${chapterId}`).emit('session_started', { participants: state.participants });
          // Simulate session finish after 30 seconds
          setTimeout(() => {
            state.sessionActive = false;
            state.sessionFinished = true;
            emitChapterRegistrationStatus(io, chapterId);
            io.to(`chapter:${chapterId}`).emit('session_finished', { participants: state.participants });
          }, 30000);
        }
        emitChapterRegistrationStatus(io, chapterId);
        socket.user_state = 'pre_session';
        emitRegistrationStatus(io, chapterId, participantId, socket);
        
      } catch (error) {
        logger.error('Error in participant join:', error);
        socket.emit('error', { message: 'Failed to join participant' });
      }
    });
    
    // Handle participant deregistration
    socket.on('participant:deregister', async (data) => {
      try {
        const { participantId, chapterId } = data;
        if (!participantId || !chapterId) {
          socket.emit('error', { message: 'Participant ID and Chapter ID are required for deregistration' });
          return;
        }
        const state = chapterRegistrationState[chapterId];
        if (state) {
          state.deregistered.add(participantId);
          state.participants = state.participants.filter(id => id !== participantId);
          emitChapterRegistrationStatus(io, chapterId);
        }
        socket.user_state = 'deregistered';
        emitRegistrationStatus(io, chapterId, participantId, socket);
        logger.info(`Participant deregistered: ${participantId}`);
      } catch (error) {
        logger.error('Error in participant deregistration:', error);
        socket.emit('error', { message: 'Failed to deregister participant' });
      }
    });
    
    // Handle chapter connections
    socket.on('chapter:register', async (data) => {
      try {
        const { chapterId, name, location, metadata = {} } = data;
        
        if (!chapterId || !name) {
          socket.emit('error', { message: 'Chapter ID and name are required' });
          return;
        }
        
        // Store chapter info
        activeChapters.set(socket.id, {
          type: 'chapter',
          chapterId,
          name,
          location,
          metadata,
          connectedAt: new Date()
        });
        
        // Update or create chapter in database
        const db = getDatabase();
        db.run(
          `INSERT OR REPLACE INTO chapters (id, name, location, status, last_heartbeat, metadata) 
           VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP, ?)`,
          [chapterId, name, location, JSON.stringify(metadata)],
          (err) => {
            if (err) {
              logger.warn('Failed to update chapter in database:', err);
            }
          }
        );
        
        // Initialize or update chapter state
        if (!chapterRegistrationState[chapterId]) {
          chapterRegistrationState[chapterId] = {
            participants: [],
            min: 2,
            max: 6,
            countdownSeconds: 30,
            timer: 0,
            timerInterval: null,
            sessionActive: false,
            sessionFinished: false,
            deregistered: new Set(),
            lastHeartbeat: Date.now(),
            status: 'online',
            heartbeatTimeout: null,
          };
        } else {
          chapterRegistrationState[chapterId].lastHeartbeat = Date.now();
          chapterRegistrationState[chapterId].status = 'online';
        }
        // Set up heartbeat timeout
        if (chapterRegistrationState[chapterId].heartbeatTimeout) {
          clearTimeout(chapterRegistrationState[chapterId].heartbeatTimeout);
        }
        chapterRegistrationState[chapterId].heartbeatTimeout = setTimeout(() => {
          chapterRegistrationState[chapterId].status = 'offline';
        }, 10000); // 10 seconds
        
        // Join chapter room
        socket.join(`chapter:${chapterId}`);
        
        // Broadcast chapter registration
        socket.broadcast.emit('chapter:registered', {
          chapterId,
          name,
          location,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
        
        logger.info(`Chapter registered: ${name} (${chapterId})`);
        socket.emit('chapter:registered', { chapterId, name, socketId: socket.id });
        
      } catch (error) {
        logger.error('Error in chapter registration:', error);
        socket.emit('error', { message: 'Failed to register chapter' });
      }
    });
    
    // Handle connection agent connections
    socket.on('connection:register', async (data) => {
      try {
        const { connectionId, name, type = 'performer', metadata = {} } = data;
        
        if (!connectionId || !name) {
          socket.emit('error', { message: 'Connection ID and name are required' });
          return;
        }
        
        // Store connection info
        activeConnections_agents.set(socket.id, {
          type: 'connection',
          connectionId,
          name,
          agentType: type,
          metadata,
          connectedAt: new Date()
        });
        
        // Update or create connection in database
        const db = getDatabase();
        db.run(
          `INSERT OR REPLACE INTO connections (id, name, type, status, last_heartbeat, metadata) 
           VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP, ?)`,
          [connectionId, name, type, JSON.stringify(metadata)],
          (err) => {
            if (err) {
              logger.warn('Failed to update connection in database:', err);
            }
          }
        );
        
        // Join connection room
        socket.join(`connection:${connectionId}`);
        
        // Broadcast connection registration
        socket.broadcast.emit('connection:registered', {
          connectionId,
          name,
          type,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
        
        logger.info(`Connection registered: ${name} (${connectionId})`);
        socket.emit('connection:registered', { connectionId, name, socketId: socket.id });
        
      } catch (error) {
        logger.error('Error in connection registration:', error);
        socket.emit('error', { message: 'Failed to register connection' });
      }
    });
    
    // Handle interaction logging
    socket.on('interaction:log', async (data) => {
      try {
        const { participantId, type, payload = {} } = data;
        
        if (!participantId || !type) {
          socket.emit('error', { message: 'Participant ID and interaction type are required' });
          return;
        }
        
        // Log interaction to database
        await logInteraction(participantId, type, payload);
        
        // Broadcast interaction to all connected clients
        socket.broadcast.emit('interaction:logged', {
          participantId,
          type,
          payload,
          timestamp: new Date().toISOString()
        });
        
        socket.emit('interaction:logged', {
          participantId,
          type,
          payload,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error('Error in interaction logging:', error);
        socket.emit('error', { message: 'Failed to log interaction' });
      }
    });
    
    // Handle chapter updates
    socket.on('chapter:update', async (data) => {
      try {
        const { chapterId, status, metadata = {} } = data;
        const connection = activeChapters.get(socket.id);
        
        if (!connection || connection.chapterId !== chapterId) {
          socket.emit('error', { message: 'Unauthorized chapter update' });
          return;
        }
        
        // Update chapter in database
        const db = getDatabase();
        db.run(
          'UPDATE chapters SET status = ?, last_heartbeat = CURRENT_TIMESTAMP, metadata = ? WHERE id = ?',
          [status, JSON.stringify(metadata), chapterId],
          (err) => {
            if (err) {
              logger.warn('Failed to update chapter in database:', err);
            }
          }
        );
        
        // Broadcast chapter update
        socket.broadcast.emit('chapter:updated', {
          chapterId,
          status,
          metadata,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error('Error in chapter update:', error);
        socket.emit('error', { message: 'Failed to update chapter' });
      }
    });
    
    // Handle connection agent updates
    socket.on('connection:update', async (data) => {
      try {
        const { connectionId, status, metadata = {} } = data;
        const connection = activeConnections_agents.get(socket.id);
        
        if (!connection || connection.connectionId !== connectionId) {
          socket.emit('error', { message: 'Unauthorized connection update' });
          return;
        }
        
        // Update connection in database
        const db = getDatabase();
        db.run(
          'UPDATE connections SET status = ?, last_heartbeat = CURRENT_TIMESTAMP, metadata = ? WHERE id = ?',
          [status, JSON.stringify(metadata), connectionId],
          (err) => {
            if (err) {
              logger.warn('Failed to update connection in database:', err);
            }
          }
        );
        
        // Broadcast connection update
        socket.broadcast.emit('connection:updated', {
          connectionId,
          status,
          metadata,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error('Error in connection update:', error);
        socket.emit('error', { message: 'Failed to update connection' });
      }
    });
    
    // Handle targeted messages
    socket.on('message:send', async (data) => {
      try {
        const { targetType, targetId, message, payload = {} } = data;
        
        if (!targetType || !targetId || !message) {
          socket.emit('error', { message: 'Target type, target ID, and message are required' });
          return;
        }
        
        // Send message to specific target
        io.to(`${targetType}:${targetId}`).emit('message:received', {
          from: socket.id,
          message,
          payload,
          timestamp: new Date().toISOString()
        });
        
        socket.emit('message:sent', {
          targetType,
          targetId,
          message,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error('Error in message sending:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle heartbeat
    socket.on('heartbeat', (data) => {
      const { chapterId } = data || {};
      if (chapterId && chapterRegistrationState[chapterId]) {
        chapterRegistrationState[chapterId].lastHeartbeat = Date.now();
        chapterRegistrationState[chapterId].status = 'online';
        if (chapterRegistrationState[chapterId].heartbeatTimeout) {
          clearTimeout(chapterRegistrationState[chapterId].heartbeatTimeout);
        }
        chapterRegistrationState[chapterId].heartbeatTimeout = setTimeout(() => {
          chapterRegistrationState[chapterId].status = 'offline';
        }, 10000); // 10 seconds
      }
      socket.emit('heartbeat:ack', { timestamp: new Date().toISOString() });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      const participant = activeConnections.get(socket.id);
      const chapter = activeChapters.get(socket.id);
      const connection = activeConnections_agents.get(socket.id);
      
      if (participant) {
        // Log participant leave
        logInteraction(participant.participantId, 'system_event', {
          event: 'participant_leave',
          socketId: socket.id
        });
        
        // Broadcast participant leave
        socket.broadcast.emit('participant:left', {
          participantId: participant.participantId,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
        
        activeConnections.delete(socket.id);
        logger.info(`Participant disconnected: ${participant.participantId}`);
      }
      
      if (chapter) {
        // Update chapter status to offline
        const db = getDatabase();
        db.run(
          'UPDATE chapters SET status = "offline" WHERE id = ?',
          [chapter.chapterId],
          (err) => {
            if (err) {
              logger.warn('Failed to update chapter status:', err);
            }
          }
        );
        
        // Broadcast chapter offline
        socket.broadcast.emit('chapter:offline', {
          chapterId: chapter.chapterId,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
        
        activeChapters.delete(socket.id);
        logger.info(`Chapter disconnected: ${chapter.name} (${chapter.chapterId})`);
      }
      
      if (connection) {
        // Update connection status to offline
        const db = getDatabase();
        db.run(
          'UPDATE connections SET status = "offline" WHERE id = ?',
          [connection.connectionId],
          (err) => {
            if (err) {
              logger.warn('Failed to update connection status:', err);
            }
          }
        );
        
        // Broadcast connection offline
        socket.broadcast.emit('connection:offline', {
          connectionId: connection.connectionId,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
        
        activeConnections_agents.delete(socket.id);
        logger.info(`Connection disconnected: ${connection.name} (${connection.connectionId})`);
      }
      
      logger.info(`WebSocket disconnected: ${socket.id}`);
    });
  });
  
  // Return connection stats
  return {
    getStats: () => ({
      participants: activeConnections.size,
      chapters: activeChapters.size,
      connections: activeConnections_agents.size,
      total: activeConnections.size + activeChapters.size + activeConnections_agents.size
    }),
    
    getActiveConnections: () => ({
      participants: Array.from(activeConnections.values()),
      chapters: Array.from(activeChapters.values()),
      connections: Array.from(activeConnections_agents.values())
    })
  };
}

function getChapterMonitorState() {
  // Return a summary of all CHAPTERS and their state
  return Object.entries(chapterRegistrationState).map(([chapterId, state]) => ({
    chapterId,
    participants: state.participants,
    min: state.min,
    max: state.max,
    timer: state.timer,
    sessionActive: state.sessionActive,
    sessionFinished: state.sessionFinished,
    lastHeartbeat: state.lastHeartbeat || null,
    status: state.status || 'offline',
    deregistered: Array.from(state.deregistered || []),
  }));
}

// Helper function to log interactions
async function logInteraction(participantId, type, payload) {
  return new Promise((resolve, reject) => {
    const interactionId = uuidv4();
    const db = getDatabase();
    
    db.run(
      'INSERT INTO interactions (id, participant_id, type, payload) VALUES (?, ?, ?, ?)',
      [interactionId, participantId, type, JSON.stringify(payload)],
      function(err) {
        if (err) {
          logger.error('Error logging interaction:', err);
          reject(err);
        } else {
          logger.info(`Interaction logged: ${interactionId} (${type}) for participant ${participantId}`);
          resolve(interactionId);
        }
      }
    );
  });
}

module.exports = { setupWebSocket, getChapterMonitorState }; 