const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');
const { logger } = require('../utils/logger');

class ConfigService {
  constructor() {
    // Don't initialize database in constructor - lazy load it
    this._db = null;
  }

  get db() {
    if (!this._db) {
      this._db = getDatabase();
    }
    return this._db;
  }

  // Get system configuration
  async getSystemConfig() {
    try {
      const configs = this.db.prepare('SELECT * FROM system_config ORDER BY config_type').all();
      const systemConfig = {
        chapters: [],
        connections: [],
        settings: {}
      };

      configs.forEach(config => {
        const data = JSON.parse(config.config_data);
        switch (config.config_type) {
          case 'chapters':
            systemConfig.chapters = data;
            break;
          case 'connections':
            systemConfig.connections = data;
            break;
          case 'settings':
            systemConfig.settings = data;
            break;
        }
      });

      return systemConfig;
    } catch (error) {
      logger.error('Error getting system config:', error);
      throw error;
    }
  }

  // Save chapters configuration
  async saveChaptersConfig(chapters) {
    try {
      const configId = 'chapters-config';
      const configData = JSON.stringify(chapters);
      
      this.db.prepare(`
        INSERT OR REPLACE INTO system_config (id, config_type, config_data, updated_at) 
        VALUES (?, 'chapters', ?, CURRENT_TIMESTAMP)
      `).run(configId, configData);
      
      logger.info('Chapters configuration saved successfully');
      return true;
    } catch (error) {
      logger.error('Error saving chapters config:', error);
      throw error;
    }
  }

  // Save connections configuration
  async saveConnectionsConfig(connections) {
    try {
      const configId = 'connections-config';
      const configData = JSON.stringify(connections);
      
      this.db.prepare(`
        INSERT OR REPLACE INTO system_config (id, config_type, config_data, updated_at) 
        VALUES (?, 'connections', ?, CURRENT_TIMESTAMP)
      `).run(configId, configData);
      
      logger.info('Connections configuration saved successfully');
      return true;
    } catch (error) {
      logger.error('Error saving connections config:', error);
      throw error;
    }
  }

  // Save system settings
  async saveSystemSettings(settings) {
    try {
      const configId = 'system-settings';
      const configData = JSON.stringify(settings);
      
      this.db.prepare(`
        INSERT OR REPLACE INTO system_config (id, config_type, config_data, updated_at) 
        VALUES (?, 'settings', ?, CURRENT_TIMESTAMP)
      `).run(configId, configData);
      
      logger.info('System settings saved successfully');
      return true;
    } catch (error) {
      logger.error('Error saving system settings:', error);
      throw error;
    }
  }

  // Add a new chapter
  async addChapter(chapterData) {
    try {
      const chapters = await this.getSystemConfig();
      const newChapter = {
        id: `CHAPTER_${uuidv4().substring(0, 8).toUpperCase()}`,
        name: chapterData.name,
        location: chapterData.location,
        ip: chapterData.ip,
        description: chapterData.description || '',
        minParticipants: chapterData.minParticipants || 2,
        maxParticipants: chapterData.maxParticipants || 6,
        countdownSeconds: chapterData.countdownSeconds || 60,
        metadata: chapterData.metadata || {},
        createdAt: new Date().toISOString(),
        status: 'inactive'
      };

      chapters.chapters.push(newChapter);
      await this.saveChaptersConfig(chapters.chapters);
      
      // Also add to chapters table for compatibility
      this.db.prepare(`
        INSERT INTO chapters (id, name, location, metadata) 
        VALUES (?, ?, ?, ?)
      `).run(newChapter.id, newChapter.name, newChapter.location, JSON.stringify(newChapter.metadata));
      
      logger.info(`Chapter added: ${newChapter.name} (${newChapter.id})`);
      return newChapter;
    } catch (error) {
      logger.error('Error adding chapter:', error);
      throw error;
    }
  }

  // Add a new connection
  async addConnection(connectionData) {
    try {
      const config = await this.getSystemConfig();
      const newConnection = {
        id: `CONNECTION_${uuidv4().substring(0, 8).toUpperCase()}`,
        name: connectionData.name,
        type: connectionData.type || 'performer',
        description: connectionData.description || '',
        // Microcontroller-specific fields
        deviceType: connectionData.deviceType || 'esp32', // esp32, arduino, raspberry-pi, etc.
        serialPort: connectionData.serialPort || '', // COM port or device path
        baudRate: connectionData.baudRate || 115200,
        ipAddress: connectionData.ipAddress || '', // For WiFi-enabled devices
        macAddress: connectionData.macAddress || '', // Device MAC address
        // Connection behavior
        autoConnect: connectionData.autoConnect !== false, // Default to true
        heartbeatInterval: connectionData.heartbeatInterval || 30, // seconds
        // Hardware configuration
        sensors: connectionData.sensors || [], // List of connected sensors
        actuators: connectionData.actuators || [], // List of connected actuators
        // Metadata for future extensibility
        metadata: connectionData.metadata || {},
        createdAt: new Date().toISOString(),
        status: 'inactive'
      };

      config.connections.push(newConnection);
      await this.saveConnectionsConfig(config.connections);
      
      // Also add to connections table for compatibility
      this.db.prepare(`
        INSERT INTO connections (id, name, type, metadata) 
        VALUES (?, ?, ?, ?)
      `).run(newConnection.id, newConnection.name, newConnection.type, JSON.stringify(newConnection.metadata));
      
      logger.info(`Connection added: ${newConnection.name} (${newConnection.id})`);
      return newConnection;
    } catch (error) {
      logger.error('Error adding connection:', error);
      throw error;
    }
  }

  // Update chapter
  async updateChapter(chapterId, updateData) {
    try {
      const config = await this.getSystemConfig();
      const chapterIndex = config.chapters.findIndex(c => c.id === chapterId);
      
      if (chapterIndex === -1) {
        throw new Error('Chapter not found');
      }

      config.chapters[chapterIndex] = { ...config.chapters[chapterIndex], ...updateData };
      await this.saveChaptersConfig(config.chapters);
      
      // Also update chapters table
      this.db.prepare(`
        UPDATE chapters SET name = ?, location = ?, metadata = ? WHERE id = ?
      `).run(updateData.name, updateData.location, JSON.stringify(updateData.metadata || {}), chapterId);
      
      logger.info(`Chapter updated: ${updateData.name} (${chapterId})`);
      return config.chapters[chapterIndex];
    } catch (error) {
      logger.error('Error updating chapter:', error);
      throw error;
    }
  }

  // Delete chapter
  async deleteChapter(chapterId) {
    try {
      const config = await this.getSystemConfig();
      config.chapters = config.chapters.filter(c => c.id !== chapterId);
      await this.saveChaptersConfig(config.chapters);
      
      // Also remove from chapters table
      this.db.prepare('DELETE FROM chapters WHERE id = ?').run(chapterId);
      
      logger.info(`Chapter deleted: ${chapterId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting chapter:', error);
      throw error;
    }
  }
}

module.exports = new ConfigService(); 