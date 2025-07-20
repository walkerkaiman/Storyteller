const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');
const { logger } = require('../utils/logger');

// Store active connections
const activeConnections = new Map();
const activeChapters = new Map();
const activeConnections_agents = new Map();

function setupWebSocket(io) {
  io.on('connection', (socket) => {
    logger.info(`New WebSocket connection: ${socket.id}`);
    
    // Handle participant connections
    socket.on('participant:join', async (data) => {
      try {
        const { participantId, metadata = {} } = data;
        
        if (!participantId) {
          socket.emit('error', { message: 'Participant ID is required' });
          return;
        }
        
        // Store connection info
        activeConnections.set(socket.id, {
          type: 'participant',
          participantId,
          metadata,
          connectedAt: new Date()
        });
        
        // Update participant's last_seen in database
        const db = getDatabase();
        db.run(
          'UPDATE participants SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
          [participantId],
          (err) => {
            if (err) {
              logger.warn('Failed to update participant last_seen:', err);
            }
          }
        );
        
        // Join participant room for targeted messages
        socket.join(`participant:${participantId}`);
        
        // Log participant join interaction
        logInteraction(participantId, 'system_event', {
          event: 'participant_join',
          socketId: socket.id,
          metadata
        });
        
        // Broadcast to all chapters and connections
        socket.broadcast.emit('participant:joined', {
          participantId,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
        
        logger.info(`Participant joined: ${participantId}`);
        socket.emit('participant:joined', { participantId, socketId: socket.id });
        
      } catch (error) {
        logger.error('Error in participant join:', error);
        socket.emit('error', { message: 'Failed to join participant' });
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
    socket.on('heartbeat', () => {
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

module.exports = { setupWebSocket }; 