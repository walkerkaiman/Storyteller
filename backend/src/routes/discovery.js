const express = require('express');
const discoveryService = require('../services/discoveryService');

const router = express.Router();

// GET /api/discovery/agents - Get all discovered agents
router.get('/agents', (req, res) => {
  try {
    const discoveredAgents = discoveryService.getDiscoveredAgents();
    res.json({ agents: discoveredAgents });
  } catch (error) {
    console.error('Error fetching discovered agents:', error);
    res.status(500).json({ error: 'Failed to fetch discovered agents' });
  }
});

// POST /api/discovery/scan - Trigger manual network scan
router.post('/scan', async (req, res) => {
  try {
    // Trigger immediate scan
    await discoveryService.scanNetwork();
    res.json({ message: 'Network scan initiated' });
  } catch (error) {
    console.error('Error triggering scan:', error);
    res.status(500).json({ error: 'Failed to trigger scan' });
  }
});

// POST /api/discovery/broadcast - Send presence broadcast
router.post('/broadcast', (req, res) => {
  try {
    discoveryService.broadcastPresence();
    res.json({ message: 'Presence broadcast sent' });
  } catch (error) {
    console.error('Error sending broadcast:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// GET /api/discovery/status - Get discovery service status
router.get('/status', (req, res) => {
  try {
    const status = {
      active: discoveryService.discoveryInterval !== null,
      discoveredCount: discoveryService.getDiscoveredAgents().length,
      udpListener: discoveryService.udpSocket !== null,
      lastScan: new Date().toISOString()
    };
    res.json(status);
  } catch (error) {
    console.error('Error fetching discovery status:', error);
    res.status(500).json({ error: 'Failed to fetch discovery status' });
  }
});

// POST /api/discovery/register - Agent registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { agentId, agentType, capabilities, status, participants } = req.body;
    
    if (!agentId || !agentType) {
      return res.status(400).json({ error: 'agentId and agentType are required' });
    }
    
    const result = await discoveryService.handleAgentRegistration(agentId, agentType, {
      capabilities,
      status,
      participants
    });
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error registering agent:', error);
    res.status(500).json({ error: 'Failed to register agent' });
  }
});

module.exports = router; 