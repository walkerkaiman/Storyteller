# Storyteller Setup Guide

This guide will walk you through setting up the complete Storyteller framework for local-network-based interactive experiences.

## Prerequisites

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **npm or yarn** - Package managers
- **Git** - For version control
- **Local network access** - All devices must be on the same network

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd Storyteller

# Install all dependencies
npm run install:all
```

### 2. Start the Backend Server

```bash
# Start the backend server
npm run server
```

The backend will start on `http://localhost:3000` and automatically:
- Initialize the SQLite database
- Create necessary tables
- Start the WebSocket server
- Log local network addresses for access

### 3. Start the Frontend

```bash
# In a new terminal, start the frontend
npm run dev
```

The frontend will start on `http://localhost:5173` and automatically:
- Connect to the backend via proxy
- Initialize participant management
- Establish WebSocket connection

### 4. Access the Application

- **Local access**: http://localhost:5173
- **Network access**: http://[your-ip]:5173 (IP shown in backend logs)
- **Backend API**: http://localhost:3000/health (health check)

## Configuration

### Environment Variables

Create `.env` files in the backend and agent directories:

#### Backend (.env)
```env
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
DB_PATH=./data/storyteller.db

# Logging
LOG_LEVEL=info

# CORS
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)
```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

#### Chapter Agent (.env)
```env
# Chapter Configuration
CHAPTER_ID=chapter-001
CHAPTER_NAME=Main Installation
LOCATION=Gallery A

# Server Connection
SERVER_URL=http://192.168.1.100:3000

# Hardware Configuration
GPIO_ENABLED=true
SENSOR_ENABLED=true
DISPLAY_ENABLED=true
```

#### Connection Agent (.env)
```env
# Connection Configuration
CONNECTION_ID=connection-001
CONNECTION_NAME=Mobile Performer
CONNECTION_TYPE=performer

# Server Connection
SERVER_URL=http://192.168.1.100:3000

# Web Interface
WEB_PORT=3001
FRONTEND_URL=http://192.168.1.100:5173
```

## Network Setup

### 1. Static IP Configuration

Configure your router to assign static IPs to the Storyteller server:

1. Access your router's admin panel
2. Find DHCP/DNS settings
3. Add static IP reservation for the Storyteller server
4. Recommended IP: `192.168.1.100`

### 2. Firewall Configuration

Ensure these ports are open on your network:

- **Port 3000**: Backend API and WebSocket
- **Port 5173**: Frontend development server
- **Port 3001**: Connection agent web interface

### 3. mDNS/Bonjour Setup (Optional)

For easier access, configure mDNS to resolve `storyteller.local`:

#### Windows
```bash
# Add to hosts file (C:\Windows\System32\drivers\etc\hosts)
192.168.1.100 storyteller.local
```

#### macOS/Linux
```bash
# Install avahi-daemon (Linux)
sudo apt-get install avahi-daemon

# Add to hosts file (/etc/hosts)
192.168.1.100 storyteller.local
```

## Creating CHAPTER Installations

### 1. Hardware Requirements

- **Raspberry Pi 4** (recommended) or mini PC
- **Sensors**: Motion, touch, proximity, etc.
- **Outputs**: LED strips, displays, speakers, motors
- **Network**: WiFi or Ethernet connection

### 2. Setup Chapter Agent

```bash
# Navigate to chapter template
cd agents/chapter-template

# Install dependencies
npm install

# Copy and customize configuration
cp .env.example .env
# Edit .env with your chapter settings

# Start the chapter agent
npm start
```

### 3. Hardware Integration

The chapter agent supports various hardware interfaces:

#### GPIO (Raspberry Pi)
```javascript
// Example: LED control
const { Gpio } = require('onoff');
const led = new Gpio(17, 'out');

// Turn on LED
led.writeSync(1);

// Turn off LED
led.writeSync(0);
```

#### I2C Sensors
```javascript
// Example: Temperature sensor
const I2C = require('i2c-bus');
const i2c = I2C.openSync(1);

// Read sensor data
const data = i2c.readByteSync(0x48);
```

#### Serial Communication
```javascript
// Example: Arduino communication
const SerialPort = require('serialport');
const port = new SerialPort('/dev/ttyUSB0', { baudRate: 9600 });

port.on('data', (data) => {
  console.log('Received:', data);
});
```

## Creating CONNECTION Agents

### 1. Mobile Device Setup

- **Tablet or smartphone** with WiFi
- **Web browser** for interface
- **Optional**: QR code scanner app

### 2. Setup Connection Agent

```bash
# Navigate to connection template
cd agents/connection-template

# Install dependencies
npm install

# Copy and customize configuration
cp .env.example .env
# Edit .env with your connection settings

# Start the connection agent
npm start
```

### 3. Web Interface

The connection agent provides a web interface at `http://localhost:3001`:

- **Status dashboard**: Connection status and active participants
- **Interaction controls**: Trigger interactions with participants
- **QR code generation**: Create shareable QR codes
- **Broadcast messages**: Send messages to all participants

## Testing the System

### 1. Basic Functionality Test

1. Start backend and frontend
2. Open frontend in browser
3. Check that participant ID is generated
4. Verify WebSocket connection status
5. Test interaction logging

### 2. Chapter Integration Test

1. Start a chapter agent
2. Verify chapter registration in backend logs
3. Test hardware triggers from frontend
4. Check interaction logging

### 3. Connection Integration Test

1. Start a connection agent
2. Verify connection registration
3. Test participant interaction
4. Check message broadcasting

### 4. Network Test

1. Access from different devices on network
2. Test QR code sharing between devices
3. Verify real-time updates across devices

## Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check if port is in use
netstat -an | grep 3000

# Kill process if needed
kill -9 <PID>

# Check logs
tail -f backend/logs/combined.log
```

#### Frontend Can't Connect
```bash
# Check backend is running
curl http://localhost:3000/health

# Check CORS settings
# Verify FRONTEND_URL in backend .env
```

#### WebSocket Connection Fails
```bash
# Check firewall settings
# Verify network connectivity
# Check server URL in agent configs
```

#### Database Issues
```bash
# Reset database
rm backend/data/storyteller.db
npm run server
```

### Log Files

- **Backend**: `backend/logs/combined.log`
- **Chapter Agent**: `agents/chapter-template/logs/combined.log`
- **Connection Agent**: `agents/connection-template/logs/combined.log`

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=debug` in `.env` files.

## Production Deployment

### 1. Environment Setup

```bash
# Set production environment
NODE_ENV=production

# Use PM2 for process management
npm install -g pm2

# Start services with PM2
pm2 start backend/src/server.js --name storyteller-backend
pm2 start frontend --name storyteller-frontend
```

### 2. Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name storyteller.local;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 3. SSL Certificate

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d storyteller.local
```

## Security Considerations

### 1. Network Security

- Use WPA3 WiFi encryption
- Enable firewall rules
- Restrict access to local network only
- Use VPN for remote access if needed

### 2. Application Security

- Keep dependencies updated
- Use environment variables for secrets
- Implement rate limiting
- Monitor for suspicious activity

### 3. Data Privacy

- Store minimal participant data
- Implement data retention policies
- Provide data export/deletion options
- Comply with local privacy regulations

## Support and Maintenance

### Regular Maintenance

1. **Weekly**: Check logs for errors
2. **Monthly**: Update dependencies
3. **Quarterly**: Review and clean old data
4. **Annually**: Security audit and backup

### Monitoring

- Set up log monitoring
- Monitor system resources
- Track participant engagement
- Monitor network connectivity

### Backup Strategy

```bash
# Database backup
cp backend/data/storyteller.db backup/storyteller-$(date +%Y%m%d).db

# Configuration backup
tar -czf backup/config-$(date +%Y%m%d).tar.gz .env*
```

## Next Steps

1. **Customize the experience**: Modify frontend components
2. **Add hardware**: Integrate sensors and actuators
3. **Create content**: Design story narratives
4. **Scale up**: Add more chapters and connections
5. **Analyze data**: Use interaction data for insights

For more information, see the [API Documentation](API.md) and [Development Guide](DEVELOPMENT.md). 