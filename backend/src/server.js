const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const basicAuth = require('express-basic-auth');
const path = require('path');
require('dotenv').config();

const { logger } = require('./utils/logger');
const { initDatabase } = require('./models/database');
const participantRoutes = require('./routes/participants');
const interactionRoutes = require('./routes/interactions');
const monitorRoutes = require('./routes/monitor');
const configRoutes = require('./routes/config');
const discoveryRoutes = require('./routes/discovery');
const { setupWebSocket } = require('./websocket/socketHandler');
const discoveryService = require('./services/discoveryService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", /^http:\/\/192\.168\.\d+\.\d+:3000$/, /^http:\/\/10\.\d+\.\d+\.\d+:3000$/],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';  // Listen on all network interfaces

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000", /^http:\/\/192\.168\.\d+\.\d+:3000$/, /^http:\/\/10\.\d+\.\d+\.\d+:3000$/],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helper to create basic auth middleware
function getBasicAuthMiddleware() {
  return basicAuth({
    users: { [process.env.DASHBOARD_USER || 'admin']: process.env.DASHBOARD_PASS || '1234' },
    challenge: true,
    realm: 'MonitorDashboard',
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'storyteller-backend'
  });
});

// API Routes
app.use('/api/participants', participantRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/monitor', getBasicAuthMiddleware(), monitorRoutes);
app.use('/api/config', getBasicAuthMiddleware(), configRoutes);
app.use('/api/discovery', getBasicAuthMiddleware(), discoveryRoutes);

// Dashboard routes with authentication
app.get('/dashboard', getBasicAuthMiddleware(), (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/dashboard.html'));
});

// Serve dashboard assets with authentication
app.use('/dashboard/assets', getBasicAuthMiddleware(), express.static(path.join(__dirname, '../../frontend/dist/assets')));
app.use('/dashboard/vite.svg', getBasicAuthMiddleware(), express.static(path.join(__dirname, '../../frontend/dist/vite.svg')));

// Serve PORTAL (participant interface) - no authentication required
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Serve PORTAL assets
app.use('/assets', express.static(path.join(__dirname, '../../frontend/dist/assets')));
app.use('/vite.svg', express.static(path.join(__dirname, '../../frontend/dist/vite.svg')));

// WebSocket setup
setupWebSocket(server);

// Start discovery service
discoveryService.start().catch(err => {
  logger.error('Failed to start discovery service:', err);
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    logger.info('Database initialized successfully');
    
    server.listen(PORT, HOST, () => {
      logger.info(`Storyteller backend server running on http://${HOST}:${PORT}`);
      logger.info(`WebSocket server ready for connections`);
      logger.info(`Dashboard available at http://${HOST}:${PORT}/dashboard (with authentication)`);
      
      // Log local network information
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      
      Object.keys(networkInterfaces).forEach((interfaceName) => {
        networkInterfaces[interfaceName].forEach((interface) => {
          if (interface.family === 'IPv4' && !interface.internal) {
            logger.info(`Local network access: http://${interface.address}:${PORT}`);
          }
        });
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer(); 