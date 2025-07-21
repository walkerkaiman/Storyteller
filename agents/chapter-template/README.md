# 📖 CHAPTER Agent Template

A complete template for creating interactive story chapter agents with QR code scanning capabilities and a web-based configuration interface.

## 🚀 Quick Start

### Windows
1. **Double-click** `start.bat` or run:
   ```cmd
   start.bat
   ```

### Linux/Mac
1. **Make executable and run**:
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

### Manual Start
1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Agent**
   ```bash
   npm start
   ```

### Access Web Interface
The web interface will automatically open at: `http://localhost:8080`

## 🌐 Web Interface Features

### 📋 Configuration Tab
- **Basic Information**: Name, location, description
- **Network Settings**: IP address, port, backend URL
- **Participant Settings**: Min/max participants, countdown timer
- **QR Scanner Settings**: Camera device, scan interval

### 🔧 Configuration Options

#### Basic Information
- **Chapter Name**: Display name for the chapter
- **Location**: Physical location description
- **Description**: Detailed description of the chapter

#### Network Configuration
- **IP Address**: Automatically detected
- **Port**: Web interface port (default: 8080)
- **Backend URL**: URL of the main storyteller backend

#### Participant Settings
- **Minimum Participants**: Minimum required participants
- **Maximum Participants**: Maximum allowed participants
- **Countdown Timer**: Session countdown in seconds

#### QR Scanner Settings
- **Camera Device**: Select camera for QR scanning
- **Scan Interval**: How often to scan for QR codes (ms)

## 🔌 API Endpoints

### Configuration
- `GET /api/config` - Get current configuration
- `POST /api/config` - Save configuration
- `GET /api/status` - Get agent status

### QR Scanner
- `GET /api/cameras` - List available cameras
- `POST /api/qr/start` - Start QR scanner
- `POST /api/qr/stop` - Stop QR scanner
- `GET /api/qr/results` - Get scan results

### Backend Communication
- `POST /api/test-backend` - Test backend connection
- `GET /health` - Health check endpoint

## 📁 File Structure

```
chapter-template/
├── index.html          # Web interface
├── src/
│   └── index.js        # Express server
├── package.json        # Dependencies
├── config.json         # Configuration file (auto-generated)
└── README.md          # This file
```

## 🔧 Configuration File

The agent automatically creates a `config.json` file with your settings:

```json
{
  "id": "chapter_abc123",
  "name": "Chapter 1 - The Beginning",
  "location": "Main Hall",
  "description": "The opening chapter of our story",
  "ip": "192.168.1.100",
  "port": 8080,
  "backendUrl": "http://192.168.1.50:3000",
  "minParticipants": 1,
  "maxParticipants": 10,
  "countdown": 60,
  "cameraDevice": "0",
  "scanInterval": 500
}
```

## 🎯 Usage Workflow

1. **Initial Setup**
   - Start the agent: `npm start`
   - Open web interface: `http://localhost:8080`
   - Configure basic settings
   - Set backend URL
   - Save configuration

2. **QR Scanner Setup**
   - Select camera device
   - Set scan interval
   - Test QR scanner
   - Start scanning

3. **Backend Integration**
   - Test backend connection
   - Verify registration
   - Monitor status

4. **Operation**
   - Agent automatically registers with backend
   - QR scanner runs continuously
   - Real-time status updates
   - Automatic reconnection

## 🔍 Troubleshooting

### Common Issues

**Web interface not loading**
- Check if port 8080 is available
- Verify firewall settings
- Check console for errors

**QR scanner not working**
- Ensure camera permissions
- Check camera device selection
- Verify camera is not in use by other applications

**Backend connection failed**
- Verify backend URL is correct
- Check network connectivity
- Ensure backend is running

**Configuration not saving**
- Check file permissions
- Verify disk space
- Check console for errors

### Debug Mode

Run in development mode for detailed logging:
```bash
npm run dev
```

## 🔗 Integration with Main System

The CHAPTER agent integrates with the main Storyteller system:

1. **Auto-Discovery**: Agent announces itself via UDP broadcasts
2. **Registration**: Automatically registers with backend
3. **Heartbeat**: Sends periodic status updates
4. **QR Processing**: Scans and processes participant QR codes
5. **Session Management**: Manages participant sessions

## 📱 Mobile Compatibility

The web interface is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones
- Touch devices

## 🔒 Security Considerations

- Configuration is stored locally
- No sensitive data transmitted
- CORS enabled for local development
- Health check endpoint for monitoring

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs
3. Verify configuration settings
4. Test network connectivity

---

**Happy Storytelling! 📖✨** 