const express = require('express');
const { getDatabase } = require('../models/database');
const configService = require('../services/configService');

const router = express.Router();

// GET /api/monitor/chapters - Get all agents (chapters and connections) with real-time data
router.get('/chapters', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get configuration data
    const config = await configService.getSystemConfig();
    
    // Get real-time data from database
    const chapters = db.prepare('SELECT * FROM chapters ORDER BY name').all();
    const connections = db.prepare('SELECT * FROM connections ORDER BY name').all();
    
    // Get participant counts for each agent
    const participantCounts = db.prepare(`
      SELECT participant_id, COUNT(*) as count 
      FROM interactions 
      WHERE type = 'registration' 
      GROUP BY participant_id
    `).all();
    
    // Get recent interactions for session status
    const recentInteractions = db.prepare(`
      SELECT * FROM interactions 
      WHERE timestamp > datetime('now', '-5 minutes')
      ORDER BY timestamp DESC
    `).all();
    
    // Combine chapters and connections into agents
    const agents = [];
    
    // Process chapters
    chapters.forEach(chapter => {
      const configChapter = config.chapters.find(c => c.id === chapter.id);
      const agent = {
        id: chapter.id,
        name: chapter.name || configChapter?.name || chapter.id,
        type: 'chapter',
        location: chapter.location || configChapter?.location || 'Unknown',
        configUrl: configChapter?.configUrl || `http://${configChapter?.ip || 'localhost'}:8080`,
        isOnline: false,
        participantCount: 0,
        min: configChapter?.minParticipants || 2,
        max: configChapter?.maxParticipants || 6,
        timer: 0,
        sessionActive: false,
        sessionFinished: false,
        last_heartbeat: chapter.last_heartbeat,
        timeSinceHeartbeat: 0
      };
      
      // Check if agent is online (has recent heartbeat)
      if (chapter.last_heartbeat) {
        const timeSince = Math.floor((Date.now() - new Date(chapter.last_heartbeat).getTime()) / 1000);
        agent.isOnline = timeSince < 60; // Online if heartbeat within last minute
        agent.timeSinceHeartbeat = timeSince;
      }
      
      agents.push(agent);
    });
    
    // Process connections
    connections.forEach(connection => {
      const configConnection = config.connections.find(c => c.id === connection.id);
      const agent = {
        id: connection.id,
        name: connection.name || configConnection?.name || connection.id,
        type: 'connection',
        location: configConnection?.location || 'Hardware Device',
        deviceType: configConnection?.deviceType || 'unknown',
        configUrl: configConnection?.configUrl || `http://${configConnection?.ipAddress || 'localhost'}:8080`,
        isOnline: false,
        participantCount: 0,
        min: 1,
        max: 1, // Connections typically handle one participant at a time
        timer: 0,
        sessionActive: false,
        sessionFinished: false,
        last_heartbeat: connection.last_heartbeat,
        timeSinceHeartbeat: 0
      };
      
      // Check if agent is online (has recent heartbeat)
      if (connection.last_heartbeat) {
        const timeSince = Math.floor((Date.now() - new Date(connection.last_heartbeat).getTime()) / 1000);
        agent.isOnline = timeSince < 60; // Online if heartbeat within last minute
        agent.timeSinceHeartbeat = timeSince;
      }
      
      agents.push(agent);
    });
    
    // Calculate summary statistics
    const summary = {
      total: agents.length,
      online: agents.filter(a => a.isOnline).length,
      activeSessions: agents.filter(a => a.sessionActive).length,
      totalParticipants: participantCounts.length,
      chapters: agents.filter(a => a.type === 'chapter').length,
      connections: agents.filter(a => a.type === 'connection').length
    };
    
    res.json({
      agents: agents,
      summary: summary
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

module.exports = router; 