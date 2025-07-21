const dgram = require('dgram');
const net = require('net');
const { getDatabase } = require('../models/database');
const configService = require('./configService');
const { logger } = require('../utils/logger');

class DiscoveryService {
  constructor() {
    this._db = null;
    this.discoveredAgents = new Map(); // Store discovered agents
    this.discoveryInterval = null;
    this.udpSocket = null;
    this.tcpScanner = null;
  }

  get db() {
    if (!this._db) {
      this._db = getDatabase();
    }
    return this._db;
  }

  // Start the discovery service
  async start() {
    logger.info('Starting network discovery service...');
    
    // Start UDP broadcast listener for agent announcements
    this.startUDPListener();
    
    // Start periodic network scanning
    this.startPeriodicScan();
    
    // Start TCP port scanner for common agent ports
    this.startTCPScanner();
    
    logger.info('Network discovery service started');
  }

  // Stop the discovery service
  stop() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
    
    if (this.udpSocket) {
      this.udpSocket.close();
      this.udpSocket = null;
    }
    
    logger.info('Network discovery service stopped');
  }

  // Start UDP listener for agent announcements
  startUDPListener() {
    this.udpSocket = dgram.createSocket('udp4');
    
    this.udpSocket.on('error', (err) => {
      logger.error('UDP discovery socket error:', err);
    });

    this.udpSocket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        this.handleAgentAnnouncement(data, rinfo.address);
      } catch (error) {
        logger.error('Error parsing UDP message:', error);
      }
    });

    this.udpSocket.bind(8888, () => {
      logger.info('UDP discovery listener bound to port 8888');
    });
  }

  // Handle agent announcements via UDP
  async handleAgentAnnouncement(data, ipAddress) {
    const { type, id, name, deviceType, capabilities, version, port } = data;
    
    const agentInfo = {
      id: id || `AUTO_${type.toUpperCase()}_${Date.now()}`,
      name: name || `${type} Device`,
      type: type, // 'chapter' or 'connection'
      ipAddress: ipAddress,
      port: port || 8080,
      configUrl: `http://${ipAddress}:${port || 8080}`,
      deviceType: deviceType || 'unknown',
      capabilities: capabilities || [],
      version: version || '1.0.0',
      lastSeen: new Date().toISOString(),
      discovered: true
    };

    this.discoveredAgents.set(agentInfo.id, agentInfo);
    
    // Auto-add to configuration if not already configured
    await this.autoAddAgent(agentInfo);
    
    // Trigger automatic registration
    await this.triggerAgentRegistration(agentInfo);
    
    logger.info(`Discovered ${type} agent: ${name} (${ipAddress})`);
  }

  // Start periodic network scanning
  startPeriodicScan() {
    this.discoveryInterval = setInterval(async () => {
      await this.scanNetwork();
    }, 30000); // Scan every 30 seconds
  }

  // Scan network for potential agents
  async scanNetwork() {
    const localIP = this.getLocalIP();
    if (!localIP) return;

    const baseIP = localIP.substring(0, localIP.lastIndexOf('.'));
    
    // Scan common ports for agent services
    const commonPorts = [3000, 8080, 8888, 5000, 8000];
    
    for (let i = 1; i <= 254; i++) {
      const targetIP = `${baseIP}.${i}`;
      
      // Skip localhost
      if (targetIP === localIP) continue;
      
      for (const port of commonPorts) {
        await this.checkAgentPort(targetIP, port);
      }
    }
  }

  // Check if a specific IP:port is running an agent service
  async checkAgentPort(ip, port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(1000); // 1 second timeout
      
      socket.on('connect', async () => {
        // Try to identify the service
        await this.identifyService(ip, port);
        socket.destroy();
        resolve();
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve();
      });
      
      socket.on('error', () => {
        socket.destroy();
        resolve();
      });
      
      socket.connect(port, ip);
    });
  }

  // Try to identify what service is running on a port
  async identifyService(ip, port) {
    try {
      // Try to fetch agent info from common endpoints
      const endpoints = [
        '/api/agent/info',
        '/api/status',
        '/info',
        '/health'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://${ip}:${port}${endpoint}`, {
            timeout: 2000
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.type && (data.type === 'chapter' || data.type === 'connection')) {
              await this.handleAgentAnnouncement(data, ip);
              return;
            }
          }
        } catch (error) {
          // Continue to next endpoint
        }
      }
    } catch (error) {
      // Service identification failed
    }
  }

  // Start TCP scanner for common agent ports
  startTCPScanner() {
    // This runs in parallel with the periodic scan
    setInterval(async () => {
      await this.scanCommonPorts();
    }, 60000); // Scan common ports every minute
  }

  // Scan for common agent service ports
  async scanCommonPorts() {
    const localIP = this.getLocalIP();
    if (!localIP) return;

    const baseIP = localIP.substring(0, localIP.lastIndexOf('.'));
    
    // Common ports where agents might be running
    const agentPorts = [
      { port: 3000, service: 'storyteller-chapter' },
      { port: 8080, service: 'storyteller-connection' },
      { port: 8888, service: 'agent-discovery' },
      { port: 5000, service: 'flask-agent' },
      { port: 8000, service: 'django-agent' }
    ];
    
    for (let i = 1; i <= 254; i++) {
      const targetIP = `${baseIP}.${i}`;
      if (targetIP === localIP) continue;
      
      for (const { port, service } of agentPorts) {
        await this.checkAgentPort(targetIP, port);
      }
    }
  }

  // Get local IP address
  getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    return null;
  }

  // Auto-add discovered agent to configuration
  async autoAddAgent(agentInfo) {
    try {
      const config = await configService.getSystemConfig();
      
      // Check if agent already exists
      const existingAgent = config.chapters.find(c => c.id === agentInfo.id) ||
                           config.connections.find(c => c.id === agentInfo.id);
      
      if (existingAgent) {
        // Update last seen
        existingAgent.lastSeen = agentInfo.lastSeen;
        return;
      }
      
      // Auto-add new agent
      if (agentInfo.type === 'chapter') {
        await configService.addChapter({
          name: agentInfo.name,
          location: 'Auto-discovered',
          ip: agentInfo.ipAddress,
          configUrl: agentInfo.configUrl,
          description: `Auto-discovered ${agentInfo.deviceType} device`,
          minParticipants: 2,
          maxParticipants: 6,
          countdownSeconds: 60,
          metadata: {
            discovered: true,
            capabilities: agentInfo.capabilities,
            version: agentInfo.version
          }
        });
      } else if (agentInfo.type === 'connection') {
        await configService.addConnection({
          name: agentInfo.name,
          type: 'performer',
          description: `Auto-discovered ${agentInfo.deviceType} device`,
          deviceType: agentInfo.deviceType,
          ipAddress: agentInfo.ipAddress,
          configUrl: agentInfo.configUrl,
          metadata: {
            discovered: true,
            capabilities: agentInfo.capabilities,
            version: agentInfo.version
          }
        });
      }
      
      logger.info(`Auto-added ${agentInfo.type} agent: ${agentInfo.name}`);
    } catch (error) {
      logger.error('Error auto-adding agent:', error);
    }
  }

  // Trigger automatic registration for a discovered agent
  async triggerAgentRegistration(agentInfo) {
    try {
      const config = await configService.getSystemConfig();
      const agentConfig = config.chapters.find(c => c.id === agentInfo.id) ||
                           config.connections.find(c => c.id === agentInfo.id);

      if (agentConfig) {
        // If the agent is already configured, update its last seen
        agentConfig.lastSeen = agentInfo.lastSeen;
        logger.info(`Updated last seen for existing ${agentInfo.type} agent: ${agentInfo.name}`);
      } else {
        // If the agent is not configured, add it
        if (agentInfo.type === 'chapter') {
          await configService.addChapter({
            name: agentInfo.name,
            location: 'Auto-discovered',
            ip: agentInfo.ipAddress,
            configUrl: agentInfo.configUrl,
            description: `Auto-discovered ${agentInfo.deviceType} device`,
            minParticipants: 2,
            maxParticipants: 6,
            countdownSeconds: 60,
            metadata: {
              discovered: true,
              capabilities: agentInfo.capabilities,
              version: agentInfo.version
            }
          });
        } else if (agentInfo.type === 'connection') {
          await configService.addConnection({
            name: agentInfo.name,
            type: 'performer',
            description: `Auto-discovered ${agentInfo.deviceType} device`,
            deviceType: agentInfo.deviceType,
            ipAddress: agentInfo.ipAddress,
            configUrl: agentInfo.configUrl,
            metadata: {
              discovered: true,
              capabilities: agentInfo.capabilities,
              version: agentInfo.version
            }
          });
        }
        logger.info(`Auto-added ${agentInfo.type} agent: ${agentInfo.name}`);
      }
    } catch (error) {
      logger.error('Error triggering agent registration:', error);
    }
  }

  // Get all discovered agents
  getDiscoveredAgents() {
    return Array.from(this.discoveredAgents.values());
  }

  // Send discovery broadcast to announce this server
  broadcastPresence() {
    if (!this.udpSocket) return;
    
    const broadcastMessage = JSON.stringify({
      type: 'server',
      id: 'storyteller-backend',
      name: 'Storyteller Backend Server',
      version: '1.0.0',
      capabilities: ['participant_registration', 'session_management', 'monitoring']
    });
    
    this.udpSocket.send(broadcastMessage, 8888, '255.255.255.255');
  }

  // Handle agent registration request
  async handleAgentRegistration(agentId, agentType, registrationData = {}) {
    try {
      const db = this.db;
      const now = new Date().toISOString();
      
      // Update agent heartbeat in database
      if (agentType === 'chapter') {
        db.prepare(`
          UPDATE chapters 
          SET last_heartbeat = ?, status = 'active' 
          WHERE id = ?
        `).run(now, agentId);
      } else if (agentType === 'connection') {
        db.prepare(`
          UPDATE connections 
          SET last_heartbeat = ?, status = 'active' 
          WHERE id = ?
        `).run(now, agentId);
      }
      
      // Log the registration
      logger.info(`Agent registered: ${agentId} (${agentType})`);
      
      return {
        success: true,
        message: 'Agent registered successfully',
        timestamp: now,
        agentId: agentId,
        agentType: agentType
      };
    } catch (error) {
      logger.error('Error handling agent registration:', error);
      return {
        success: false,
        message: 'Registration failed',
        error: error.message
      };
    }
  }

  // Get registration endpoint URL for agents
  getRegistrationEndpoint() {
    return '/api/discovery/register';
  }
}

module.exports = new DiscoveryService(); 