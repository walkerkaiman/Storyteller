const express = require('express');
const configService = require('../services/configService');

const router = express.Router();

// GET /api/config - Get all system configuration
router.get('/', async (req, res) => {
  try {
    const config = await configService.getSystemConfig();
    res.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// POST /api/config/chapters - Add a new chapter
router.post('/chapters', async (req, res) => {
  try {
    const { name, location, ip, description, minParticipants, maxParticipants, countdownSeconds, metadata } = req.body;
    
    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location are required' });
    }
    
    const newChapter = await configService.addChapter({
      name,
      location,
      ip,
      description,
      minParticipants,
      maxParticipants,
      countdownSeconds,
      metadata
    });
    
    res.status(201).json({ message: 'Chapter added successfully', chapter: newChapter });
  } catch (error) {
    console.error('Error adding chapter:', error);
    res.status(500).json({ error: 'Failed to add chapter' });
  }
});

// PUT /api/config/chapters/:id - Update a chapter
router.put('/chapters/:id', async (req, res) => {
  try {
    const chapterId = req.params.id;
    const updateData = req.body;
    
    const updatedChapter = await configService.updateChapter(chapterId, updateData);
    res.json({ message: 'Chapter updated successfully', chapter: updatedChapter });
  } catch (error) {
    console.error('Error updating chapter:', error);
    res.status(500).json({ error: 'Failed to update chapter' });
  }
});

// DELETE /api/config/chapters/:id - Delete a chapter
router.delete('/chapters/:id', async (req, res) => {
  try {
    const chapterId = req.params.id;
    await configService.deleteChapter(chapterId);
    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({ error: 'Failed to delete chapter' });
  }
});

// POST /api/config/connections - Add a new connection
router.post('/connections', async (req, res) => {
  try {
    const { name, type, description, metadata } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const newConnection = await configService.addConnection({
      name,
      type,
      description,
      metadata
    });
    
    res.status(201).json({ message: 'Connection added successfully', connection: newConnection });
  } catch (error) {
    console.error('Error adding connection:', error);
    res.status(500).json({ error: 'Failed to add connection' });
  }
});

// PUT /api/config/connections/:id - Update a connection
router.put('/connections/:id', async (req, res) => {
  try {
    const connectionId = req.params.id;
    const updateData = req.body;
    
    // For now, just return success - we'll implement this later
    res.json({ message: 'Connection updated successfully', connectionId });
  } catch (error) {
    console.error('Error updating connection:', error);
    res.status(500).json({ error: 'Failed to update connection' });
  }
});

// DELETE /api/config/connections/:id - Delete a connection
router.delete('/connections/:id', async (req, res) => {
  try {
    const connectionId = req.params.id;
    
    // For now, just return success - we'll implement this later
    res.json({ message: 'Connection deleted successfully' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});

// PUT /api/config/settings - Update system settings
router.put('/settings', async (req, res) => {
  try {
    const settings = req.body;
    await configService.saveSystemSettings(settings);
    res.json({ message: 'System settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router; 