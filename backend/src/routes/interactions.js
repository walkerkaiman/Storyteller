const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const { getDatabase } = require('../models/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Validation schemas
const interactionSchema = z.object({
  participant_id: z.string(),
  type: z.enum(['chapter_visit', 'connection_event', 'choice', 'system_event']),
  payload: z.record(z.any()).optional()
});

const interactionUpdateSchema = z.object({
  payload: z.record(z.any()).optional()
});

// Log a new interaction
router.post('/', async (req, res) => {
  try {
    const result = interactionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation error', details: result.error.issues });
    }

    const interactionId = uuidv4();
    const { participant_id, type, payload = {} } = result.data;
    
    const db = getDatabase();
    
    // First verify participant exists
    db.get('SELECT id FROM participants WHERE id = ?', [participant_id], (err, participant) => {
      if (err) {
        logger.error('Error checking participant:', err);
        return res.status(500).json({ error: 'Failed to verify participant' });
      }
      
      if (!participant) {
        return res.status(404).json({ error: 'Participant not found' });
      }
      
      // Insert interaction
      db.run(
        'INSERT INTO interactions (id, participant_id, type, payload) VALUES (?, ?, ?, ?)',
        [interactionId, participant_id, type, JSON.stringify(payload)],
        function(err) {
          if (err) {
            logger.error('Error creating interaction:', err);
            return res.status(500).json({ error: 'Failed to create interaction' });
          }
          
          // Update participant's last_seen
          db.run(
            'UPDATE participants SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
            [participant_id],
            (updateErr) => {
              if (updateErr) {
                logger.warn('Failed to update participant last_seen:', updateErr);
              }
            }
          );
          
          logger.info(`New interaction logged: ${interactionId} (${type}) for participant ${participant_id}`);
          
          res.status(201).json({
            id: interactionId,
            participant_id,
            type,
            timestamp: new Date().toISOString(),
            payload
          });
        }
      );
    });
  } catch (error) {
    logger.error('Error in interaction creation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get interaction by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Interaction ID is required' });
    }
    
    const db = getDatabase();
    
    db.get(
      'SELECT * FROM interactions WHERE id = ?',
      [id],
      (err, row) => {
        if (err) {
          logger.error('Error fetching interaction:', err);
          return res.status(500).json({ error: 'Failed to fetch interaction' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'Interaction not found' });
        }
        
        // Parse payload JSON
        try {
          row.payload = JSON.parse(row.payload);
        } catch (e) {
          row.payload = {};
        }
        
        res.json(row);
      }
    );
  } catch (error) {
    logger.error('Error in interaction retrieval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get interactions for a specific participant
router.get('/participant/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;
    const { page = 1, limit = 50, type } = req.query;
    const offset = (page - 1) * limit;
    
    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }
    
    const db = getDatabase();
    
    // First verify participant exists
    db.get('SELECT id FROM participants WHERE id = ?', [participantId], (err, participant) => {
      if (err) {
        logger.error('Error checking participant:', err);
        return res.status(500).json({ error: 'Failed to verify participant' });
      }
      
      if (!participant) {
        return res.status(404).json({ error: 'Participant not found' });
      }
      
      let sql = 'SELECT * FROM interactions WHERE participant_id = ?';
      let countSql = 'SELECT COUNT(*) as total FROM interactions WHERE participant_id = ?';
      let params = [participantId];
      let countParams = [participantId];
      
      // Add type filter if provided
      if (type) {
        sql += ' AND type = ?';
        countSql += ' AND type = ?';
        params.push(type);
        countParams.push(type);
      }
      
      sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      // Get total count
      db.get(countSql, countParams, (err, countRow) => {
        if (err) {
          logger.error('Error counting interactions:', err);
          return res.status(500).json({ error: 'Failed to count interactions' });
        }
        
        // Get interactions
        db.all(sql, params, (err, rows) => {
          if (err) {
            logger.error('Error fetching interactions:', err);
            return res.status(500).json({ error: 'Failed to fetch interactions' });
          }
          
          // Parse payload for each interaction
          rows.forEach(row => {
            try {
              row.payload = JSON.parse(row.payload);
            } catch (e) {
              row.payload = {};
            }
          });
          
          res.json({
            participant_id: participantId,
            interactions: rows,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: countRow.total,
              pages: Math.ceil(countRow.total / limit)
            }
          });
        });
      });
    });
  } catch (error) {
    logger.error('Error in participant interactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all interactions (with pagination and filters)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, type, participant_id, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    
    const db = getDatabase();
    
    let sql = 'SELECT i.*, p.metadata as participant_metadata FROM interactions i LEFT JOIN participants p ON i.participant_id = p.id';
    let countSql = 'SELECT COUNT(*) as total FROM interactions i';
    let whereConditions = [];
    let params = [];
    let countParams = [];
    
    // Add filters
    if (type) {
      whereConditions.push('i.type = ?');
      params.push(type);
      countParams.push(type);
    }
    
    if (participant_id) {
      whereConditions.push('i.participant_id = ?');
      params.push(participant_id);
      countParams.push(participant_id);
    }
    
    if (start_date) {
      whereConditions.push('i.timestamp >= ?');
      params.push(start_date);
      countParams.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('i.timestamp <= ?');
      params.push(end_date);
      countParams.push(end_date);
    }
    
    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      sql += whereClause;
      countSql += whereClause;
    }
    
    sql += ' ORDER BY i.timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    // Get total count
    db.get(countSql, countParams, (err, countRow) => {
      if (err) {
        logger.error('Error counting interactions:', err);
        return res.status(500).json({ error: 'Failed to count interactions' });
      }
      
      // Get interactions
      db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Error fetching interactions:', err);
          return res.status(500).json({ error: 'Failed to fetch interactions' });
        }
        
        // Parse JSON fields
        rows.forEach(row => {
          try {
            row.payload = JSON.parse(row.payload);
            row.participant_metadata = JSON.parse(row.participant_metadata);
          } catch (e) {
            row.payload = {};
            row.participant_metadata = {};
          }
        });
        
        res.json({
          interactions: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countRow.total,
            pages: Math.ceil(countRow.total / limit)
          }
        });
      });
    });
  } catch (error) {
    logger.error('Error in interactions list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update interaction (limited to payload updates)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = interactionUpdateSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: 'Validation error', details: result.error.issues });
    }
    
    if (!id) {
      return res.status(400).json({ error: 'Interaction ID is required' });
    }
    
    const db = getDatabase();
    
    // First check if interaction exists
    db.get('SELECT * FROM interactions WHERE id = ?', [id], (err, row) => {
      if (err) {
        logger.error('Error checking interaction existence:', err);
        return res.status(500).json({ error: 'Failed to check interaction' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Interaction not found' });
      }
      
      // Update interaction payload
      const newPayload = { ...JSON.parse(row.payload), ...result.data.payload };
      
      db.run(
        'UPDATE interactions SET payload = ? WHERE id = ?',
        [JSON.stringify(newPayload), id],
        function(err) {
          if (err) {
            logger.error('Error updating interaction:', err);
            return res.status(500).json({ error: 'Failed to update interaction' });
          }
          
          logger.info(`Interaction updated: ${id}`);
          res.json({ 
            message: 'Interaction updated successfully',
            payload: newPayload
          });
        }
      );
    });
  } catch (error) {
    logger.error('Error in interaction update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 