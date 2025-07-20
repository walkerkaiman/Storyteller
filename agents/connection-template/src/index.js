const { io } = require('socket.io-client');
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { logger } = require('./utils/logger');
const { ConnectionManager } = require('./managers/ConnectionManager');
const { ConfigManager } = require('./managers/ConfigManager');

class ConnectionAgent {
  constructor() {
    this.config = new ConfigManager();
    this.connectionId = this.config.get('connectionId') || uuidv4();
    this.connectionName = this.config.get('connectionName') || 'Unnamed Connection';
    this.connectionType = this.config.get('connectionType') || 'performer';
    
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    
    this.connectionManager = new ConnectionManager(this);
    this.app = express();
    this.server = null;
    
    this.heartbeatInterval = null;
    this.statusUpdateInterval = null;
    
    this.activeParticipants = new Set();
    this.interactionHistory = [];
  }

  async start() {
    logger.info(`Starting Connection Agent: ${this.connectionName} (${this.connectionId})`);
    
    try {
      // Setup local web interface
      await this.setupWebInterface();
      
      // Connect to Storyteller server
      await this.connectToServer();
      
      // Start periodic tasks
      this.startPeriodicTasks();
      
      // Register with server
      await this.registerConnection();
      
      logger.info('Connection Agent started successfully');
      
    } catch (error) {
      logger.error('Failed to start Connection Agent:', error);
      process.exit(1);
    }
  }

  async setupWebInterface() {
    const port = this.config.get('webPort') || 3001;
    
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    // API routes
    this.app.get('/api/status', (req, res) => {
      res.json({
        connectionId: this.connectionId,
        connectionName: this.connectionName,
        connectionType: this.connectionType,
        isConnected: this.isConnected,
        activeParticipants: Array.from(this.activeParticipants),
        interactionHistory: this.interactionHistory.slice(-10)
      });
    });
    
    this.app.post('/api/interact', (req, res) => {
      const { participantId, interactionType, payload } = req.body;
      this.triggerInteraction(participantId, interactionType, payload);
      res.json({ success: true });
    });
    
    this.app.post('/api/broadcast', (req, res) => {
      const { message, payload } = req.body;
      this.broadcastMessage(message, payload);
      res.json({ success: true });
    });
    
    this.app.get('/api/qr/:participantId', (req, res) => {
      const { participantId } = req.params;
      const qrData = this.generateQRCode(participantId);
      res.json({ qrData });
    });
    
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, () => {
        logger.info(`Web interface running on http://localhost:${port}`);
        resolve();
      });
      
      this.server.on('error', (error) => {
        reject(error);
      });
    });
  }

  async connectToServer() {
    const serverUrl = this.config.get('serverUrl') || 'http://localhost:3000';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      logger.info('Connected to Storyteller server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn('Disconnected from Storyteller server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      logger.error('Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('Max reconnection attempts reached. Exiting...');
        process.exit(1);
      }
    });

    // Handle incoming messages
    this.socket.on('message:received', (data) => {
      this.handleIncomingMessage(data);
    });

    // Handle participant events
    this.socket.on('participant:joined', (data) => {
      this.handleParticipantJoined(data);
    });

    this.socket.on('participant:left', (data) => {
      this.handleParticipantLeft(data);
    });

    // Handle interaction events
    this.socket.on('interaction:logged', (data) => {
      this.handleInteractionLogged(data);
    });

    // Wait for connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async registerConnection() {
    if (!this.isConnected) {
      throw new Error('Not connected to server');
    }

    const metadata = {
      version: this.config.get('version') || '1.0.0',
      capabilities: this.getCapabilities(),
      timestamp: new Date().toISOString()
    };

    this.socket.emit('connection:register', {
      connectionId: this.connectionId,
      name: this.connectionName,
      type: this.connectionType,
      metadata
    });

    logger.info(`Connection registered: ${this.connectionName}`);
  }

  handleIncomingMessage(data) {
    const { message, payload, from } = data;
    logger.info(`Message received: ${message} from ${from}`);

    switch (message) {
      case 'participant_interaction':
        this.handleParticipantInteraction(payload);
        break;
      case 'story_update':
        this.handleStoryUpdate(payload);
        break;
      case 'system_command':
        this.handleSystemCommand(payload);
        break;
      default:
        logger.warn(`Unknown message type: ${message}`);
    }
  }

  handleParticipantJoined(data) {
    const { participantId, socketId } = data;
    logger.info(`Participant joined: ${participantId}`);
    
    this.activeParticipants.add(participantId);
    
    // Send welcome message
    this.sendMessageToParticipant(participantId, 'welcome', {
      connectionName: this.connectionName,
      connectionType: this.connectionType,
      timestamp: new Date().toISOString()
    });
    
    // Update status
    this.updateStatus('participant_present');
  }

  handleParticipantLeft(data) {
    const { participantId, socketId } = data;
    logger.info(`Participant left: ${participantId}`);
    
    this.activeParticipants.delete(participantId);
    
    // Update status
    this.updateStatus('idle');
  }

  handleInteractionLogged(data) {
    const { participantId, type, payload } = data;
    logger.info(`Interaction logged: ${type} by ${participantId}`);
    
    // Store in history
    this.interactionHistory.push({
      participantId,
      type,
      payload,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 interactions
    if (this.interactionHistory.length > 100) {
      this.interactionHistory = this.interactionHistory.slice(-100);
    }
    
    // React to specific interaction types
    switch (type) {
      case 'choice':
        this.reactToChoice(participantId, payload);
        break;
      case 'chapter_visit':
        this.reactToChapterVisit(participantId, payload);
        break;
      case 'connection_event':
        this.reactToConnectionEvent(participantId, payload);
        break;
    }
  }

  handleParticipantInteraction(payload) {
    const { participantId, interactionType, data } = payload;
    logger.info(`Participant interaction: ${interactionType} from ${participantId}`);
    
    // Handle different interaction types
    switch (interactionType) {
      case 'touch':
        this.handleTouchInteraction(participantId, data);
        break;
      case 'gesture':
        this.handleGestureInteraction(participantId, data);
        break;
      case 'voice':
        this.handleVoiceInteraction(participantId, data);
        break;
      default:
        logger.warn(`Unknown interaction type: ${interactionType}`);
    }
  }

  handleStoryUpdate(payload) {
    const { storyState, participants, chapters } = payload;
    logger.info('Story update received:', storyState);
    
    // Update local story state
    this.connectionManager.updateStoryState(storyState);
    
    // React to story changes
    this.reactToStoryUpdate(storyState);
  }

  handleSystemCommand(payload) {
    const { command, parameters } = payload;
    
    switch (command) {
      case 'restart':
        logger.info('Restarting connection agent...');
        this.restart();
        break;
      case 'update_config':
        this.config.update(parameters);
        logger.info('Configuration updated');
        break;
      case 'test_connection':
        this.runConnectionTest();
        break;
      default:
        logger.warn(`Unknown system command: ${command}`);
    }
  }

  triggerInteraction(participantId, interactionType, payload = {}) {
    if (!this.isConnected) return;

    this.socket.emit('interaction:log', {
      participantId,
      type: 'connection_event',
      payload: {
        interactionType,
        connectionId: this.connectionId,
        connectionName: this.connectionName,
        ...payload
      }
    });
  }

  broadcastMessage(message, payload = {}) {
    if (!this.isConnected) return;

    // Send to all active participants
    this.activeParticipants.forEach(participantId => {
      this.sendMessageToParticipant(participantId, message, payload);
    });
  }

  sendMessageToParticipant(participantId, message, payload = {}) {
    if (!this.isConnected) return;

    this.socket.emit('message:send', {
      targetType: 'participant',
      targetId: participantId,
      message,
      payload: {
        connectionId: this.connectionId,
        connectionName: this.connectionName,
        timestamp: new Date().toISOString(),
        ...payload
      }
    });
  }

  generateQRCode(participantId) {
    const baseUrl = this.config.get('frontendUrl') || 'http://localhost:5173';
    return `${baseUrl}?participant=${participantId}&connection=${this.connectionId}`;
  }

  getCapabilities() {
    return {
      qrCodeGeneration: true,
      participantInteraction: true,
      storyUpdates: true,
      broadcastMessages: true,
      webInterface: true
    };
  }

  updateStatus(status) {
    if (!this.isConnected) return;

    const metadata = {
      status,
      activeParticipants: Array.from(this.activeParticipants),
      timestamp: new Date().toISOString()
    };

    this.socket.emit('connection:update', {
      connectionId: this.connectionId,
      status,
      metadata
    });
  }

  startPeriodicTasks() {
    // Heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.socket.emit('heartbeat');
      }
    }, 30000);

    // Status update every 60 seconds
    this.statusUpdateInterval = setInterval(() => {
      this.updateStatus('active');
    }, 60000);
  }

  async restart() {
    logger.info('Restarting Connection Agent...');
    
    // Cleanup
    this.cleanup();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Restart
    this.start();
  }

  cleanup() {
    logger.info('Cleaning up Connection Agent...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    if (this.server) {
      this.server.close();
    }
  }

  // Graceful shutdown
  async shutdown() {
    logger.info('Shutting down Connection Agent...');
    
    this.updateStatus('shutdown');
    this.cleanup();
    
    process.exit(0);
  }

  // Reaction methods (to be implemented by specific connection types)
  reactToChoice(participantId, payload) {
    logger.info(`Reacting to choice from ${participantId}:`, payload);
  }

  reactToChapterVisit(participantId, payload) {
    logger.info(`Reacting to chapter visit from ${participantId}:`, payload);
  }

  reactToConnectionEvent(participantId, payload) {
    logger.info(`Reacting to connection event from ${participantId}:`, payload);
  }

  reactToStoryUpdate(storyState) {
    logger.info('Reacting to story update:', storyState);
  }

  handleTouchInteraction(participantId, data) {
    logger.info(`Touch interaction from ${participantId}:`, data);
  }

  handleGestureInteraction(participantId, data) {
    logger.info(`Gesture interaction from ${participantId}:`, data);
  }

  handleVoiceInteraction(participantId, data) {
    logger.info(`Voice interaction from ${participantId}:`, data);
  }

  runConnectionTest() {
    logger.info('Running connection test...');
    // Implement connection test logic
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  logger.info('SIGINT received');
  await agent.shutdown();
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received');
  await agent.shutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the agent
const agent = new ConnectionAgent();
agent.start().catch((error) => {
  logger.error('Failed to start agent:', error);
  process.exit(1);
}); 