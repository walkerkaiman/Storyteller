# 🤖 Agent Base Classes

This directory contains the base Agent classes that provide common functionality for all Storyteller agents (CHAPTER and CONNECTION).

## 📁 File Structure

```
agent-base/
├── Agent.js           # Base Agent class with common functionality
├── ChapterAgent.js    # Chapter-specific agent implementation
├── ConnectionAgent.js # Connection-specific agent implementation
├── package.json       # Shared dependencies
└── README.md         # This file
```

## 🏗️ Architecture

### Base Agent Class (`Agent.js`)

The `Agent` class provides all common functionality that both CHAPTER and CONNECTION agents need:

#### **Core Features**
- ✅ **Express Server Setup**: Web interface and API endpoints
- ✅ **Configuration Management**: Load/save config from JSON files
- ✅ **Auto-Registration**: Automatic backend registration with retry logic
- ✅ **Heartbeat System**: Periodic status updates to backend
- ✅ **Health Checks**: Standard health endpoint
- ✅ **Graceful Shutdown**: Proper cleanup on exit

#### **Common API Endpoints**
- `GET /health` - Health check
- `GET /api/config` - Get configuration
- `POST /api/config` - Save configuration
- `GET /api/status` - Get agent status
- `POST /api/register` - Register with backend
- `POST /api/test-backend` - Test backend connection
- `GET /` - Serve web interface

#### **Registration & Discovery**
- **Auto-Registration**: Automatically registers with backend on startup
- **Exponential Backoff**: Smart retry logic for failed registrations
- **Heartbeat**: Sends periodic status updates every 30 seconds
- **Configuration URL**: Includes web interface URL in registration

### Chapter Agent (`ChapterAgent.js`)

Extends the base Agent with chapter-specific functionality:

#### **Additional Features**
- ✅ **QR Scanner Management**: Camera detection and QR scanning
- ✅ **Participant Sessions**: Session start/end management
- ✅ **QR Code Processing**: Handle scanned QR codes

#### **Additional API Endpoints**
- `GET /api/cameras` - List available cameras
- `POST /api/qr/start` - Start QR scanner
- `POST /api/qr/stop` - Stop QR scanner
- `GET /api/qr/results` - Get scan results

#### **Capabilities**
- `qr_code_scanning`
- `participant_registration`
- `session_management`
- `countdown_timer`
- `camera_control`

### Connection Agent (`ConnectionAgent.js`)

Extends the base Agent with connection-specific functionality:

#### **Additional Features**
- ✅ **Serial Communication**: USB/RS232 device connections
- ✅ **WiFi Communication**: Network device connections
- ✅ **Device Scanning**: Auto-detect available devices
- ✅ **Data Transmission**: Send/receive data to/from devices

#### **Additional API Endpoints**
- `POST /api/test-connection` - Test device connection
- `GET /api/scan-devices` - Scan for available devices
- `GET /api/serial-ports` - List serial ports
- `POST /api/connect` - Connect to device
- `POST /api/disconnect` - Disconnect from device
- `POST /api/send` - Send data to device
- `GET /api/receive` - Receive data from device

#### **Capabilities**
- `serial_communication`
- `wifi_communication`
- `device_control`
- `data_transmission`
- `hardware_interface`

## 🔧 Usage

### Creating a New Agent

```javascript
const ChapterAgent = require('./agent-base/ChapterAgent');

const agent = new ChapterAgent({
    port: 8080,
    name: 'My Chapter'
});

agent.start();
```

### Extending the Base Agent

```javascript
const Agent = require('./Agent');

class CustomAgent extends Agent {
    constructor(config = {}) {
        super({
            type: 'custom',
            ...config
        });
        
        this.addCustomRoutes();
    }
    
    addCustomRoutes() {
        // Add custom API endpoints
        this.app.get('/api/custom', (req, res) => {
            res.json({ message: 'Custom endpoint' });
        });
    }
    
    getCapabilities() {
        return ['custom_feature'];
    }
}
```

## 🚀 Benefits of This Architecture

### **1. Code Reuse**
- Common functionality is implemented once in the base class
- No duplication between CHAPTER and CONNECTION agents
- Easy to add new agent types

### **2. Consistent Behavior**
- All agents have the same registration process
- Standardized API endpoints
- Uniform error handling and logging

### **3. Easy Maintenance**
- Changes to common functionality only need to be made in one place
- Type-specific features are cleanly separated
- Clear inheritance hierarchy

### **4. Extensibility**
- Easy to add new agent types
- Simple to add new features to all agents
- Clean separation of concerns

### **5. Reliability**
- Robust registration with retry logic
- Proper error handling
- Graceful shutdown procedures

## 🔄 Registration Process

All agents follow the same registration process:

1. **Startup**: Agent starts and loads configuration
2. **Auto-Registration**: Attempts to register with backend
3. **Retry Logic**: Exponential backoff if registration fails
4. **Heartbeat**: Sends periodic status updates
5. **Reconnection**: Automatically reconnects if connection lost

## 📊 Configuration Management

All agents use the same configuration system:

- **JSON Files**: Configuration stored in `config.json`
- **Default Values**: Sensible defaults for all settings
- **Validation**: Type checking and validation
- **Persistence**: Changes saved automatically

## 🔗 Backend Integration

All agents integrate with the backend in the same way:

- **Discovery**: Announce themselves via UDP broadcasts
- **Registration**: Register with backend API
- **Heartbeat**: Send periodic status updates
- **Configuration URL**: Provide web interface URL

## 🛠️ Development

### Adding New Features

1. **Common Features**: Add to base `Agent` class
2. **Type-Specific Features**: Add to `ChapterAgent` or `ConnectionAgent`
3. **New Agent Types**: Create new class extending `Agent`

### Testing

```bash
# Test base functionality
node -e "const Agent = require('./Agent'); console.log('Base Agent loaded')"

# Test chapter agent
node -e "const ChapterAgent = require('./ChapterAgent'); console.log('Chapter Agent loaded')"

# Test connection agent
node -e "const ConnectionAgent = require('./ConnectionAgent'); console.log('Connection Agent loaded')"
```

## 📝 Future Enhancements

Potential features that could be added to the base Agent class:

- **Plugin System**: Load additional functionality dynamically
- **Metrics Collection**: Built-in performance monitoring
- **Logging Framework**: Structured logging with levels
- **Configuration Validation**: Schema-based validation
- **Security Features**: Authentication and authorization
- **Update System**: Automatic agent updates
- **Backup/Restore**: Configuration backup and restore
- **Multi-Language Support**: Internationalization
- **Event System**: Publish/subscribe for agent events
- **API Documentation**: Auto-generated API docs

---

**This architecture ensures all agents work consistently while allowing for type-specific functionality! 🎯** 