const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

class Agent {
    constructor(config) {
        this.config = {
            id: null,
            name: 'New Agent',
            type: 'agent', // 'chapter' or 'connection'
            location: '',
            description: '',
            ip: '127.0.0.1',
            port: 8080,
            backendUrl: '',
            ...config
        };
        
        this.app = express();
        this.server = null;
        this.heartbeatInterval = null;
        this.registrationRetryCount = 0;
        this.maxRegistrationRetries = 5;
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    // Setup Express middleware
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '..')));
    }

    // Setup common API routes
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                type: this.config.type,
                id: this.config.id,
                name: this.config.name
            });
        });

        // Configuration endpoints
        this.app.get('/api/config', async (req, res) => {
            try {
                const config = await this.loadConfig();
                res.json(config);
            } catch (error) {
                res.status(500).json({ error: 'Failed to load configuration' });
            }
        });

        this.app.post('/api/config', async (req, res) => {
            try {
                const currentConfig = await this.loadConfig();
                const newConfig = { ...currentConfig, ...req.body };
                
                // Generate ID if not exists
                if (!newConfig.id) {
                    newConfig.id = this.generateId();
                }
                
                const success = await this.saveConfig(newConfig);
                
                if (success) {
                    this.config = newConfig;
                    res.json({ success: true, config: newConfig });
                } else {
                    res.status(500).json({ error: 'Failed to save configuration' });
                }
            } catch (error) {
                res.status(500).json({ error: 'Failed to save configuration' });
            }
        });

        // Status endpoint
        this.app.get('/api/status', async (req, res) => {
            try {
                const config = await this.loadConfig();
                const online = config.backendUrl ? true : false;
                
                res.json({
                    online,
                    config: config,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to get status' });
            }
        });

        // Registration endpoint
        this.app.post('/api/register', async (req, res) => {
            try {
                const config = await this.loadConfig();
                const { backendUrl } = req.body;
                
                if (!backendUrl) {
                    return res.status(400).json({ error: 'Backend URL required' });
                }
                
                const registrationData = this.buildRegistrationData(config, backendUrl);
                
                const response = await fetch(`${backendUrl}/api/discovery/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(registrationData)
                });
                
                if (response.ok) {
                    res.json({ success: true, message: 'Registered with backend successfully' });
                } else {
                    throw new Error('Backend registration failed');
                }
            } catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({ error: 'Registration failed: ' + error.message });
            }
        });

        // Test backend connection
        this.app.post('/api/test-backend', async (req, res) => {
            try {
                const { backendUrl } = req.body;
                
                if (!backendUrl) {
                    return res.json({ success: false, message: 'No backend URL provided' });
                }
                
                const response = await fetch(`${backendUrl}/api/monitor/chapters`);
                
                if (response.ok) {
                    res.json({ success: true, message: 'Backend connection successful' });
                } else {
                    res.json({ success: false, message: 'Backend not responding' });
                }
            } catch (error) {
                res.json({ success: false, message: 'Connection failed: ' + error.message });
            }
        });

        // Serve the main web interface
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'index.html'));
        });
    }

    // Load configuration from file
    async loadConfig() {
        try {
            const configFile = path.join(__dirname, '..', 'config.json');
            const data = await fs.readFile(configFile, 'utf8');
            return { ...this.config, ...JSON.parse(data) };
        } catch (error) {
            console.log('No config file found, using defaults');
            return this.config;
        }
    }

    // Save configuration to file
    async saveConfig(config) {
        try {
            const configFile = path.join(__dirname, '..', 'config.json');
            await fs.writeFile(configFile, JSON.stringify(config, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving config:', error);
            return false;
        }
    }

    // Build registration data for backend
    buildRegistrationData(config, backendUrl) {
        const baseData = {
            id: config.id || this.generateId(),
            name: config.name,
            type: this.config.type,
            location: config.location,
            description: config.description,
            ip: config.ip,
            port: config.port,
            configUrl: `http://${config.ip}:${config.port}`
        };

        // Add type-specific data
        if (this.config.type === 'chapter') {
            return {
                ...baseData,
                minParticipants: parseInt(config.minParticipants) || 2,
                maxParticipants: parseInt(config.maxParticipants) || 6,
                countdown: parseInt(config.countdown) || 60
            };
        } else if (this.config.type === 'connection') {
            return {
                ...baseData,
                connectionType: config.connectionType,
                deviceType: config.deviceType,
                serialPort: config.serialPort,
                baudRate: parseInt(config.baudRate) || 115200,
                wifiSSID: config.wifiSSID,
                deviceIP: config.deviceIP,
                devicePort: parseInt(config.devicePort) || 80
            };
        }

        return baseData;
    }

    // Auto-register with backend
    async autoRegister() {
        try {
            const config = await this.loadConfig();
            if (!config.backendUrl) {
                console.log('⚠️ No backend URL configured, skipping auto-registration');
                return;
            }

            const registrationData = this.buildRegistrationData(config, config.backendUrl);
            
            const response = await fetch(`${config.backendUrl}/api/discovery/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registrationData)
            });
            
            if (response.ok) {
                console.log('✅ Auto-registered with backend');
                this.registrationRetryCount = 0;
            } else {
                throw new Error('Backend registration failed');
            }
        } catch (error) {
            console.log('⚠️ Auto-registration error:', error.message);
            this.handleRegistrationRetry();
        }
    }

    // Handle registration retry with exponential backoff
    handleRegistrationRetry() {
        if (this.registrationRetryCount < this.maxRegistrationRetries) {
            this.registrationRetryCount++;
            const delay = Math.pow(2, this.registrationRetryCount) * 1000; // Exponential backoff
            console.log(`🔄 Retrying registration in ${delay/1000} seconds (attempt ${this.registrationRetryCount}/${this.maxRegistrationRetries})`);
            
            setTimeout(() => {
                this.autoRegister();
            }, delay);
        } else {
            console.log('❌ Max registration retries reached');
        }
    }

    // Start heartbeat to backend
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(async () => {
            try {
                const config = await this.loadConfig();
                if (config.backendUrl) {
                    const response = await fetch(`${config.backendUrl}/api/discovery/register`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            agentId: config.id,
                            agentType: this.config.type,
                            status: 'heartbeat',
                            timestamp: new Date().toISOString()
                        })
                    });

                    if (!response.ok) {
                        console.log('⚠️ Heartbeat failed');
                    }
                }
            } catch (error) {
                console.log('⚠️ Heartbeat error:', error.message);
            }
        }, 30000); // Heartbeat every 30 seconds
    }

    // Stop heartbeat
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // Generate unique ID
    generateId() {
        return `${this.config.type}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Start the agent server
    async start() {
        return new Promise((resolve) => {
            // Bind to all network interfaces (0.0.0.0)
            this.server = this.app.listen(this.config.port, '0.0.0.0', () => {
                console.log(`🚀 ${this.config.type.toUpperCase()} agent running on port ${this.config.port}`);
                console.log(`📋 Configuration interface available at:`);
                console.log(`   Local: http://localhost:${this.config.port}`);
                
                // Log network interfaces for external access
                const os = require('os');
                const networkInterfaces = os.networkInterfaces();
                
                Object.keys(networkInterfaces).forEach((interfaceName) => {
                    networkInterfaces[interfaceName].forEach((interface) => {
                        if (interface.family === 'IPv4' && !interface.internal) {
                            console.log(`   Network: http://${interface.address}:${this.config.port}`);
                        }
                    });
                });
                
                // Auto-register with backend after a short delay
                setTimeout(() => {
                    this.autoRegister();
                }, 2000);
                
                // Start heartbeat
                this.startHeartbeat();
                
                resolve();
            });
        });
    }

    // Stop the agent server
    stop() {
        this.stopHeartbeat();
        
        if (this.server) {
            this.server.close(() => {
                console.log(`🛑 ${this.config.type.toUpperCase()} agent stopped`);
            });
        }
    }

    // Add custom routes (to be implemented by subclasses)
    addCustomRoutes() {
        // Override this method in subclasses to add type-specific routes
    }

    // Get agent info for discovery
    getDiscoveryInfo() {
        return {
            type: this.config.type,
            id: this.config.id,
            name: this.config.name,
            port: this.config.port,
            capabilities: this.getCapabilities()
        };
    }

    // Get agent capabilities (to be implemented by subclasses)
    getCapabilities() {
        return [];
    }
}

module.exports = Agent; 