# 🔌 CONNECTION Agent Template

A complete template for creating microcontroller connection agents with support for serial, WiFi, Bluetooth, and custom protocols, featuring a comprehensive web-based configuration interface.

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
- **Basic Information**: Name, connection type, device type, description
- **Network Settings**: IP address, port, backend URL
- **Serial Connection**: Port, baud rate, data bits, parity, stop bits
- **WiFi Connection**: SSID, password, device IP, device port
- **Communication Settings**: Timeout, retry attempts, heartbeat interval
- **Data Protocol**: Protocol type, encoding, custom format

### 🔧 Configuration Options

#### Basic Information
- **Connection Name**: Display name for the connection
- **Connection Type**: Serial, WiFi, Bluetooth, Ethernet, Custom
- **Device Type**: ESP32, Arduino, Raspberry Pi, etc.
- **Description**: Detailed description of the device

#### Network Configuration
- **IP Address**: Automatically detected
- **Port**: Web interface port (default: 8080)
- **Backend URL**: URL of the main storyteller backend

#### Serial Connection Settings
- **Serial Port**: COM1, COM2, /dev/ttyUSB0, etc.
- **Baud Rate**: 9600, 19200, 115200, etc.
- **Data Bits**: 7 or 8
- **Parity**: None, Even, Odd
- **Stop Bits**: 1 or 2

#### WiFi Connection Settings
- **WiFi SSID**: Network name
- **WiFi Password**: Network password
- **Device IP**: Target device IP address
- **Device Port**: Target device port

#### Communication Settings
- **Connection Timeout**: Timeout in milliseconds
- **Retry Attempts**: Number of retry attempts
- **Heartbeat Interval**: Heartbeat frequency in milliseconds

#### Data Protocol
- **Protocol Type**: JSON, CSV, Custom, Binary
- **Encoding**: UTF-8, ASCII, Latin-1
- **Custom Protocol**: Custom format definition

## 🔌 API Endpoints

### Configuration
- `GET /api/config` - Get current configuration
- `POST /api/config` - Save configuration
- `GET /api/status` - Get agent status

### Device Management
- `POST /api/test-connection` - Test device connection
- `GET /api/scan-devices` - Scan for available devices
- `GET /api/serial-ports` - List available serial ports
- `POST /api/connect` - Connect to device
- `POST /api/disconnect` - Disconnect from device

### Data Communication
- `POST /api/send` - Send data to device
- `GET /api/receive` - Receive data from device

### Backend Communication
- `POST /api/test-backend` - Test backend connection
- `GET /health` - Health check endpoint

## 📁 File Structure

```
connection-template/
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
  "id": "connection_xyz789",
  "name": "ESP32 Sensor Hub",
  "connectionType": "wifi",
  "deviceType": "ESP32",
  "description": "Main sensor hub for environmental data",
  "ip": "192.168.1.100",
  "port": 8080,
  "backendUrl": "http://192.168.1.50:3000",
  "serialPort": "",
  "baudRate": 115200,
  "dataBits": 8,
  "parity": "none",
  "stopBits": 1,
  "wifiSSID": "MyNetwork",
  "wifiPassword": "password123",
  "deviceIP": "192.168.1.101",
  "devicePort": 80,
  "timeout": 5000,
  "retryAttempts": 3,
  "heartbeatInterval": 10000,
  "protocol": "json",
  "encoding": "utf8",
  "customProtocol": ""
}
```

## 🎯 Usage Workflow

1. **Initial Setup**
   - Start the agent: `npm start`
   - Open web interface: `http://localhost:8080`
   - Configure basic settings
   - Select connection type
   - Set backend URL
   - Save configuration

2. **Device Connection Setup**
   - Scan for available devices
   - Configure connection parameters
   - Test connection
   - Establish connection

3. **Protocol Configuration**
   - Select data protocol
   - Configure encoding
   - Set custom protocol if needed
   - Test data communication

4. **Backend Integration**
   - Test backend connection
   - Verify registration
   - Monitor status

5. **Operation**
   - Agent automatically registers with backend
   - Maintains device connection
   - Handles data communication
   - Real-time status updates

## 🔍 Troubleshooting

### Common Issues

**Web interface not loading**
- Check if port 8080 is available
- Verify firewall settings
- Check console for errors

**Serial connection failed**
- Verify serial port exists
- Check device permissions
- Ensure device is not in use
- Verify baud rate settings

**WiFi connection failed**
- Verify SSID and password
- Check device IP address
- Ensure device is on same network
- Test network connectivity

**Device not found**
- Run device scan
- Check device power
- Verify connection type
- Check device compatibility

**Configuration not saving**
- Check file permissions
- Verify disk space
- Check console for errors

### Debug Mode

Run in development mode for detailed logging:
```bash
npm run dev
```

## 🔗 Supported Connection Types

### Serial (USB/RS232)
- **Devices**: Arduino, ESP32, Raspberry Pi
- **Ports**: COM1-COM10 (Windows), /dev/ttyUSB* (Linux)
- **Baud Rates**: 9600-921600
- **Features**: Real-time communication, reliable

### WiFi (ESP32/ESP8266)
- **Devices**: ESP32, ESP8266, WiFi-enabled microcontrollers
- **Protocol**: HTTP/HTTPS, WebSocket, TCP/UDP
- **Features**: Wireless, remote access, multiple devices

### Bluetooth
- **Devices**: Bluetooth-enabled microcontrollers
- **Protocol**: Serial over Bluetooth
- **Features**: Wireless, short-range, low power

### Ethernet
- **Devices**: Ethernet-enabled microcontrollers
- **Protocol**: TCP/IP
- **Features**: Wired, reliable, high speed

### Custom Protocol
- **Devices**: Any microcontroller
- **Protocol**: User-defined
- **Features**: Flexible, customizable

## 🔗 Integration with Main System

The CONNECTION agent integrates with the main Storyteller system:

1. **Auto-Discovery**: Agent announces itself via UDP broadcasts
2. **Registration**: Automatically registers with backend
3. **Heartbeat**: Sends periodic status updates
4. **Data Processing**: Handles device data communication
5. **Session Management**: Manages device connections

## 📱 Mobile Compatibility

The web interface is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones
- Touch devices

## 🔒 Security Considerations

- Configuration is stored locally
- WiFi passwords are encrypted
- CORS enabled for local development
- Health check endpoint for monitoring
- Connection timeouts prevent hanging

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

## 📊 Data Protocol Examples

### JSON Protocol
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "sensor": "temperature",
  "value": 23.5,
  "unit": "celsius"
}
```

### CSV Protocol
```
timestamp,sensor,value,unit
2024-01-01T12:00:00Z,temperature,23.5,celsius
```

### Custom Protocol
```
START|TEMP|23.5|C|END
```

## 🔧 Advanced Configuration

### Environment Variables
```bash
PORT=8080                    # Web interface port
BACKEND_URL=http://localhost:3000  # Backend URL
LOG_LEVEL=debug             # Logging level
```

### Custom Protocols
Define custom protocols in the configuration:
```
START|COMMAND|PARAM1|PARAM2|END
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs
3. Verify configuration settings
4. Test device connectivity
5. Check network settings

---

**Happy Connecting! 🔌✨** 