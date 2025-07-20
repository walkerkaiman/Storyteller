const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const { getDatabase } = require('../models/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Validation schemas
const participantSchema = z.object({
  metadata: z.record(z.any()).optional()
});

const participantUpdateSchema = z.object({
  metadata: z.record(z.any()).optional()
});

// Register a new participant
router.post('/', async (req, res) => {
  try {
    const result = participantSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation error', details: result.error.issues });
    }

    const participantId = uuidv4();
    const metadata = result.data.metadata || {};
    
    const db = getDatabase();
    
    db.run(
      'INSERT INTO participants (id, metadata) VALUES (?, ?)',
      [participantId, JSON.stringify(metadata)],
      function(err) {
        if (err) {
          logger.error('Error creating participant:', err);
          return res.status(500).json({ error: 'Failed to create participant' });
        }
        
        logger.info(`New participant created: ${participantId}`);
        
        res.status(201).json({
          id: participantId,
          created_at: new Date().toISOString(),
          metadata
        });
      }
    );
  } catch (error) {
    logger.error('Error in participant creation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get participant by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }
    
    const db = getDatabase();
    
    db.get(
      'SELECT * FROM participants WHERE id = ?',
      [id],
      (err, row) => {
        if (err) {
          logger.error('Error fetching participant:', err);
          return res.status(500).json({ error: 'Failed to fetch participant' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'Participant not found' });
        }
        
        // Parse metadata JSON
        try {
          row.metadata = JSON.parse(row.metadata);
        } catch (e) {
          row.metadata = {};
        }
        
        res.json(row);
      }
    );
  } catch (error) {
    logger.error('Error in participant retrieval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update participant
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = participantUpdateSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: 'Validation error', details: result.error.issues });
    }
    
    if (!id) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }
    
    const db = getDatabase();
    
    // First check if participant exists
    db.get('SELECT * FROM participants WHERE id = ?', [id], (err, row) => {
      if (err) {
        logger.error('Error checking participant existence:', err);
        return res.status(500).json({ error: 'Failed to check participant' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Participant not found' });
      }
      
      // Update participant
      const updateFields = [];
      const updateValues = [];
      
      if (result.data.metadata !== undefined) {
        updateFields.push('metadata = ?');
        updateValues.push(JSON.stringify(result.data.metadata));
      }
      
      updateFields.push('last_seen = CURRENT_TIMESTAMP');
      
      if (updateFields.length === 1) {
        // Only last_seen update
        db.run(
          'UPDATE participants SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
          [id],
          function(err) {
            if (err) {
              logger.error('Error updating participant:', err);
              return res.status(500).json({ error: 'Failed to update participant' });
            }
            
            logger.info(`Participant updated: ${id}`);
            res.json({ message: 'Participant updated successfully' });
          }
        );
      } else {
        // Update with metadata
        const sql = `UPDATE participants SET ${updateFields.join(', ')} WHERE id = ?`;
        updateValues.push(id);
        
        db.run(sql, updateValues, function(err) {
          if (err) {
            logger.error('Error updating participant:', err);
            return res.status(500).json({ error: 'Failed to update participant' });
          }
          
          logger.info(`Participant updated: ${id}`);
          res.json({ message: 'Participant updated successfully' });
        });
      }
    });
  } catch (error) {
    logger.error('Error in participant update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all participants (with pagination)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;
    
    const db = getDatabase();
    
    let sql = 'SELECT * FROM participants';
    let countSql = 'SELECT COUNT(*) as total FROM participants';
    let params = [];
    
    // Add status filter if provided
    if (status) {
      sql += ' WHERE status = ?';
      countSql += ' WHERE status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    // Get total count
    db.get(countSql, status ? [status] : [], (err, countRow) => {
      if (err) {
        logger.error('Error counting participants:', err);
        return res.status(500).json({ error: 'Failed to count participants' });
      }
      
      // Get participants
      db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Error fetching participants:', err);
          return res.status(500).json({ error: 'Failed to fetch participants' });
        }
        
        // Parse metadata for each participant
        rows.forEach(row => {
          try {
            row.metadata = JSON.parse(row.metadata);
          } catch (e) {
            row.metadata = {};
          }
        });
        
        res.json({
          participants: rows,
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
    logger.error('Error in participants list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 