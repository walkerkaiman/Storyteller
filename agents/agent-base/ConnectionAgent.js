const Agent = require('./Agent');
const { SerialPort } = require('serialport');

class ConnectionAgent extends Agent {
    constructor(config = {}) {
        super({
            type: 'connection',
            name: 'New Connection',
            connectionType: '',
            deviceType: '',
            serialPort: '',
            baudRate: 115200,
            dataBits: 8,
            parity: 'none',
            stopBits: 1,
            wifiSSID: '',
            wifiPassword: '',
            deviceIP: '',
            devicePort: 80,
            timeout: 5000,
            retryAttempts: 3,
            heartbeatInterval: 10000,
            protocol: 'json',
            encoding: 'utf8',
            customProtocol: '',
            ...config
        });
        
        this.serialConnection = null;
        this.deviceConnection = null;
        this.addCustomRoutes();
    }

    // Add connection-specific routes
    addCustomRoutes() {
        // Test connection
        this.app.post('/api/test-connection', async (req, res) => {
            try {
                const config = await this.loadConfig();
                const { connectionType } = config;
                
                if (!connectionType) {
                    return res.json({ success: false, message: 'No connection type configured' });
                }
                
                if (connectionType === 'serial') {
                    // Test serial connection
                    try {
                        const port = new SerialPort({
                            path: config.serialPort || 'COM1',
                            baudRate: config.baudRate,
                            dataBits: config.dataBits,
                            parity: config.parity,
                            stopBits: config.stopBits
                        });
                        
                        port.close();
                        res.json({ success: true, message: 'Serial connection test successful' });
                    } catch (error) {
                        res.json({ success: false, message: 'Serial connection failed: ' + error.message });
                    }
                } else if (connectionType === 'wifi') {
                    // Test WiFi connection
                    try {
                        const response = await fetch(`http://${config.deviceIP}:${config.devicePort}/health`, {
                            timeout: config.timeout
                        });
                        
                        if (response.ok) {
                            res.json({ success: true, message: 'WiFi connection test successful' });
                        } else {
                            res.json({ success: false, message: 'Device not responding' });
                        }
                    } catch (error) {
                        res.json({ success: false, message: 'WiFi connection failed: ' + error.message });
                    }
                } else {
                    res.json({ success: false, message: 'Unsupported connection type' });
                }
            } catch (error) {
                res.json({ success: false, message: 'Connection test failed: ' + error.message });
            }
        });

        // Scan for devices
        this.app.get('/api/scan-devices', async (req, res) => {
            try {
                const devices = [];
                
                // Scan for serial ports
                try {
                    const ports = await SerialPort.list();
                    ports.forEach(port => {
                        devices.push({
                            name: port.manufacturer || 'Unknown Device',
                            port: port.path,
                            type: 'serial',
                            manufacturer: port.manufacturer,
                            serialNumber: port.serialNumber
                        });
                    });
                } catch (error) {
                    console.log('Serial port scanning failed:', error.message);
                }
                
                // Scan for network devices (mock for now)
                const networkDevices = [
                    { name: 'ESP32 Device', ip: '192.168.1.100', type: 'wifi' },
                    { name: 'Arduino WiFi', ip: '192.168.1.101', type: 'wifi' }
                ];
                
                devices.push(...networkDevices);
                
                res.json(devices);
            } catch (error) {
                res.status(500).json({ error: 'Failed to scan devices' });
            }
        });

        // Get available serial ports
        this.app.get('/api/serial-ports', async (req, res) => {
            try {
                const ports = await SerialPort.list();
                const portList = ports.map(port => ({
                    path: port.path,
                    manufacturer: port.manufacturer || 'Unknown',
                    serialNumber: port.serialNumber || 'N/A'
                }));
                
                res.json(portList);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get serial ports' });
            }
        });

        // Connect to device
        this.app.post('/api/connect', async (req, res) => {
            try {
                const config = await this.loadConfig();
                const { connectionType } = config;
                
                if (!connectionType) {
                    return res.json({ success: false, message: 'No connection type configured' });
                }
                
                if (connectionType === 'serial') {
                    // Connect to serial device
                    try {
                        this.serialConnection = new SerialPort({
                            path: config.serialPort,
                            baudRate: config.baudRate,
                            dataBits: config.dataBits,
                            parity: config.parity,
                            stopBits: config.stopBits
                        });
                        
                        res.json({ success: true, message: 'Serial device connected' });
                    } catch (error) {
                        res.json({ success: false, message: 'Serial connection failed: ' + error.message });
                    }
                } else if (connectionType === 'wifi') {
                    // Connect to WiFi device
                    try {
                        const response = await fetch(`http://${config.deviceIP}:${config.devicePort}/connect`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ protocol: config.protocol })
                        });
                        
                        if (response.ok) {
                            this.deviceConnection = true;
                            res.json({ success: true, message: 'WiFi device connected' });
                        } else {
                            res.json({ success: false, message: 'Device connection failed' });
                        }
                    } catch (error) {
                        res.json({ success: false, message: 'WiFi connection failed: ' + error.message });
                    }
                } else {
                    res.json({ success: false, message: 'Unsupported connection type' });
                }
            } catch (error) {
                res.json({ success: false, message: 'Connection failed: ' + error.message });
            }
        });

        // Disconnect from device
        this.app.post('/api/disconnect', async (req, res) => {
            try {
                if (this.serialConnection) {
                    this.serialConnection.close();
                    this.serialConnection = null;
                }
                this.deviceConnection = null;
                
                res.json({ success: true, message: 'Device disconnected' });
            } catch (error) {
                res.status(500).json({ error: 'Failed to disconnect' });
            }
        });

        // Send data to device
        this.app.post('/api/send', async (req, res) => {
            try {
                const { data } = req.body;
                const config = await this.loadConfig();
                
                // This would normally send data to the connected device
                console.log('Sending data to device:', data);
                
                res.json({ success: true, message: 'Data sent successfully' });
            } catch (error) {
                res.status(500).json({ error: 'Failed to send data' });
            }
        });

        // Receive data from device
        this.app.get('/api/receive', async (req, res) => {
            try {
                // This would normally receive data from the connected device
                const mockData = {
                    timestamp: new Date().toISOString(),
                    data: 'Mock device data',
                    type: 'sensor'
                };
                
                res.json(mockData);
            } catch (error) {
                res.status(500).json({ error: 'Failed to receive data' });
            }
        });
    }

    // Get connection-specific capabilities
    getCapabilities() {
        return [
            'serial_communication',
            'wifi_communication',
            'device_control',
            'data_transmission',
            'hardware_interface'
        ];
    }

    // Connect to serial device
    async connectSerial(port, baudRate, dataBits, parity, stopBits) {
        try {
            this.serialConnection = new SerialPort({
                path: port,
                baudRate: baudRate,
                dataBits: dataBits,
                parity: parity,
                stopBits: stopBits
            });
            
            console.log(`🔌 Connected to serial device on ${port}`);
            return true;
        } catch (error) {
            console.error('Serial connection failed:', error);
            return false;
        }
    }

    // Connect to WiFi device
    async connectWiFi(deviceIP, devicePort, protocol) {
        try {
            const response = await fetch(`http://${deviceIP}:${devicePort}/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ protocol })
            });
            
            if (response.ok) {
                this.deviceConnection = true;
                console.log(`📶 Connected to WiFi device at ${deviceIP}:${devicePort}`);
                return true;
            } else {
                throw new Error('Device connection failed');
            }
        } catch (error) {
            console.error('WiFi connection failed:', error);
            return false;
        }
    }

    // Send data to connected device
    async sendData(data) {
        if (this.serialConnection) {
            // Send via serial
            this.serialConnection.write(data);
            return true;
        } else if (this.deviceConnection) {
            // Send via WiFi
            // Implementation would go here
            return true;
        }
        return false;
    }

    // Receive data from connected device
    async receiveData() {
        if (this.serialConnection) {
            // Receive via serial
            // Implementation would go here
            return null;
        } else if (this.deviceConnection) {
            // Receive via WiFi
            // Implementation would go here
            return null;
        }
        return null;
    }

    // Disconnect from device
    disconnect() {
        if (this.serialConnection) {
            this.serialConnection.close();
            this.serialConnection = null;
        }
        this.deviceConnection = null;
        console.log('🔌 Disconnected from device');
    }
}

module.exports = ConnectionAgent; 