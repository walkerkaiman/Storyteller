const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Database file path
const dbPath = path.join(__dirname, '../../data/storyteller.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

// Initialize database connection and tables
async function initDatabase() {
  try {
    db = new Database(dbPath);
    logger.info('Connected to SQLite database');
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Create tables
    await createTables();
    logger.info('Database tables created successfully');
  } catch (error) {
    logger.error('Error initializing database:', error);
    throw error;
  }
}

// Create database tables
async function createTables() {
  const tables = [
    // Participants table
    `CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT DEFAULT '{}'
    )`,
    
    // Interactions table
    `CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL,
      type TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      payload TEXT DEFAULT '{}',
      FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE
    )`,
    
    // Chapters table (for tracking physical installations)
    `CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT DEFAULT '{}'
    )`,
    
    // Connections table (for tracking mobile performers)
    `CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'performer',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT DEFAULT '{}'
    )`
  ];
  
  for (const sql of tables) {
    try {
      db.exec(sql);
    } catch (error) {
      logger.error('Error creating table:', error);
      throw error;
    }
  }
}

// Get database instance
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Close database connection
function closeDatabase() {
  if (db) {
    try {
      db.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database:', error);
      throw error;
    }
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
}; 