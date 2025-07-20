const { io } = require('socket.io-client');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const { logger } = require('./utils/logger');
const { ChapterManager } = require('./managers/ChapterManager');
const { HardwareManager } = require('./managers/HardwareManager');
const { ConfigManager } = require('./managers/ConfigManager');

class ChapterAgent {
  constructor() {
    this.config = new ConfigManager();
    this.chapterId = this.config.get('chapterId') || uuidv4();
    this.chapterName = this.config.get('chapterName') || 'Unnamed Chapter';
    this.location = this.config.get('location') || 'Unknown Location';
    
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    
    this.chapterManager = new ChapterManager(this);
    this.hardwareManager = new HardwareManager(this);
    
    this.heartbeatInterval = null;
    this.statusUpdateInterval = null;
  }

  async start() {
    logger.info(`Starting Chapter Agent: ${this.chapterName} (${this.chapterId})`);
    
    try {
      // Initialize hardware
      await this.hardwareManager.initialize();
      
      // Connect to Storyteller server
      await this.connectToServer();
      
      // Start periodic tasks
      this.startPeriodicTasks();
      
      // Register with server
      await this.registerChapter();
      
      logger.info('Chapter Agent started successfully');
      
    } catch (error) {
      logger.error('Failed to start Chapter Agent:', error);
      process.exit(1);
    }
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

  async registerChapter() {
    if (!this.isConnected) {
      throw new Error('Not connected to server');
    }

    const metadata = {
      version: this.config.get('version') || '1.0.0',
      hardware: this.hardwareManager.getHardwareInfo(),
      capabilities: this.hardwareManager.getCapabilities(),
      timestamp: new Date().toISOString()
    };

    this.socket.emit('chapter:register', {
      chapterId: this.chapterId,
      name: this.chapterName,
      location: this.location,
      metadata
    });

    logger.info(`Chapter registered: ${this.chapterName}`);
  }

  handleIncomingMessage(data) {
    const { message, payload, from } = data;
    logger.info(`Message received: ${message} from ${from}`);

    switch (message) {
      case 'trigger_effect':
        this.hardwareManager.triggerEffect(payload);
        break;
      case 'update_display':
        this.hardwareManager.updateDisplay(payload);
        break;
      case 'play_sound':
        this.hardwareManager.playSound(payload);
        break;
      case 'activate_sensor':
        this.hardwareManager.activateSensor(payload);
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
    
    // Trigger welcome sequence
    this.hardwareManager.triggerWelcomeSequence(participantId);
    
    // Update chapter status
    this.updateStatus('participant_present');
  }

  handleParticipantLeft(data) {
    const { participantId, socketId } = data;
    logger.info(`Participant left: ${participantId}`);
    
    // Trigger goodbye sequence
    this.hardwareManager.triggerGoodbyeSequence(participantId);
    
    // Update chapter status
    this.updateStatus('idle');
  }

  handleInteractionLogged(data) {
    const { participantId, type, payload } = data;
    logger.info(`Interaction logged: ${type} by ${participantId}`);
    
    // React to specific interaction types
    switch (type) {
      case 'choice':
        this.hardwareManager.reactToChoice(payload);
        break;
      case 'chapter_visit':
        this.hardwareManager.reactToVisit(payload);
        break;
      case 'connection_event':
        this.hardwareManager.reactToConnectionEvent(payload);
        break;
    }
  }

  handleSystemCommand(payload) {
    const { command, parameters } = payload;
    
    switch (command) {
      case 'restart':
        logger.info('Restarting chapter agent...');
        this.restart();
        break;
      case 'update_config':
        this.config.update(parameters);
        logger.info('Configuration updated');
        break;
      case 'test_hardware':
        this.hardwareManager.runSelfTest();
        break;
      default:
        logger.warn(`Unknown system command: ${command}`);
    }
  }

  updateStatus(status) {
    if (!this.isConnected) return;

    const metadata = {
      status,
      hardware: this.hardwareManager.getHardwareInfo(),
      timestamp: new Date().toISOString()
    };

    this.socket.emit('chapter:update', {
      chapterId: this.chapterId,
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

    // Hardware health check every 5 minutes
    setInterval(() => {
      this.hardwareManager.checkHealth();
    }, 300000);
  }

  async restart() {
    logger.info('Restarting Chapter Agent...');
    
    // Cleanup
    this.cleanup();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Restart
    this.start();
  }

  cleanup() {
    logger.info('Cleaning up Chapter Agent...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    this.hardwareManager.cleanup();
  }

  // Graceful shutdown
  async shutdown() {
    logger.info('Shutting down Chapter Agent...');
    
    this.updateStatus('shutdown');
    this.cleanup();
    
    process.exit(0);
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
const agent = new ChapterAgent();
agent.start().catch((error) => {
  logger.error('Failed to start agent:', error);
  process.exit(1);
}); 