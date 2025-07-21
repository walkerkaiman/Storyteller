# 📖 Storyteller System

## 🌟 What is Storyteller?

**Storyteller** is an innovative interactive storytelling platform designed for immersive live experiences, educational installations, and collaborative narrative adventures. It transforms traditional storytelling into a dynamic, multi-participant journey where users become active co-creators of unfolding narratives.

### 🎯 **What It's Used For**

- **Interactive Museums & Exhibits**: Create engaging, story-driven experiences where visitors influence the narrative through their actions and choices
- **Educational Workshops**: Facilitate collaborative storytelling sessions where students build stories together in real-time
- **Live Events & Performances**: Enable audience participation in theatrical productions and live storytelling events
- **Corporate Team Building**: Foster creativity and collaboration through shared narrative creation exercises
- **Digital Art Installations**: Power immersive art experiences that respond to participant interactions
- **Research & Studies**: Conduct experiments in collaborative storytelling and human-computer interaction

### 🎭 **How It Works**

1. **Participants** join through a web portal, scanning QR codes or entering session codes
2. **CHAPTER Agents** (physical nodes) collect participant interactions and story elements
3. **CONNECTION Agents** facilitate communication between different story chapters
4. **The Backend** orchestrates the entire experience, managing sessions and story flow
5. **The Dashboard** provides real-time monitoring and control for facilitators

---

## 🏗️ System Architecture

### **Core Components**

```
┌─────────────────────────────────────────────────────────────────┐
│                        STORYTELLER SYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Dashboard     │    │     Portal      │    │   Backend    │ │
│  │  (Admin UI)     │    │ (Participant)   │    │   (Node.js)  │ │
│  │                 │    │                 │    │              │ │
│  │ • Monitor       │    │ • Join Sessions │    │ • REST API   │ │
│  │ • Configure     │    │ • QR Check-in   │    │ • WebSocket  │ │
│  │ • Agent Mgmt    │    │ • Story Input   │    │ • Database   │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           │                       │                       │     │
│           └───────────────────────┼───────────────────────┘     │
│                                   │                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Agent Network                            │ │
│  │                                                             │ │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │ │
│  │  │   CHAPTER    │    │  CONNECTION  │    │   CHAPTER    │   │ │
│  │  │    Agent     │◄──►│    Agent     │◄──►│    Agent     │   │ │
│  │  │              │    │              │    │              │   │ │
│  │  │ • Story      │    │ • Routing    │    │ • Story      │   │ │
│  │  │   Elements   │    │ • Logic      │    │   Elements   │   │ │
│  │  │ • Sensors    │    │ • Flow       │    │ • Sensors    │   │ │
│  │  └──────────────┘    └──────────────┘    └──────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### **Technology Stack**

- **Backend**: Node.js + Express + WebSocket + SQLite
- **Frontend**: React + Vite + Modern CSS
- **Agents**: Node.js Express servers with web interfaces
- **Communication**: REST API + WebSocket + UDP Discovery
- **Database**: SQLite for persistence
- **Authentication**: HTTP Basic Auth for admin access

---

## 🚀 Quick Start

### **Windows Users:**
```cmd
# Double-click to start everything
start-system.bat
```

### **Linux/Mac Users:**
```bash
# Make executable and run
chmod +x start-system.sh
./start-system.sh
```

### **Manual Startup:**
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Build frontend
cd frontend && npm run build

# Start backend (serves everything)
cd backend && npm start
```

---

## 🌐 Access Points

Once started, access the system at:

### **Local Access (Same Device)**
- **Dashboard (Admin)**: http://localhost:3000/dashboard
  - Username: `admin`
  - Password: `1234`

- **Portal (Participants)**: http://localhost:3000

- **API Documentation**: http://localhost:3000/api

### **Network Access (Other Devices)**
- **Dashboard (Admin)**: http://YOUR_IP:3000/dashboard
- **Portal (Participants)**: http://YOUR_IP:3000

**To find your local IP address:**
- **Easy way**: Run `node find-network-ip.js` (shows all access URLs)
- **Windows**: Run `ipconfig` in Command Prompt
- **Linux/Mac**: Run `ifconfig` or `ip addr` in Terminal

---

## 🤖 Agent System

### **CHAPTER Agents**
- **Purpose**: Collect story elements and participant interactions
- **Features**: 
  - Web interface for configuration
  - Sensor integration capabilities
  - Story element collection
  - Auto-registration with backend
- **Access**: 
  - Local: http://localhost:8080
  - Network: http://YOUR_IP:8080 (when running)

### **CONNECTION Agents**
- **Purpose**: Facilitate communication and story flow between chapters
- **Features**:
  - Logic routing between story elements
  - Flow control and branching
  - State management
  - Auto-registration with backend
- **Access**: 
  - Local: http://localhost:8080
  - Network: http://YOUR_IP:8080 (when running)

### **Agent Management**
- **Auto-Discovery**: Agents automatically find and register with the backend
- **Configuration**: Each agent provides its own web interface for settings
- **Monitoring**: Real-time status, health checks, and participant counts
- **Dashboard Integration**: Click agent names to access their configuration

---

## 📊 Dashboard Features

### **Monitor Tab**
- **Real-time Agent Status**: Live monitoring of all connected agents
- **Participant Counts**: Current session participants across all agents
- **Health Monitoring**: Heartbeat status and connection quality
- **Discovery Status**: Network discovery service status
- **Agent Links**: Click agent names to access their configuration interfaces

### **Configure Tab**
- **System Settings**: Global configuration and preferences
- **Agent Management**: Add, remove, and configure agents
- **Session Control**: Start, stop, and manage active sessions
- **User Management**: Admin accounts and permissions

---

## 🔧 Development

### **Project Structure**
```
Storyteller/
├── backend/                 # Main backend server
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── websocket/      # Real-time communication
├── frontend/               # React application
│   ├── src/
│   │   ├── DASHBOARD/      # Admin interface
│   │   ├── contexts/       # React contexts
│   │   └── services/       # API services
├── agents/                 # Agent templates
│   ├── agent-base/         # Base agent class
│   ├── chapter-template/   # CHAPTER agent template
│   └── connection-template/ # CONNECTION agent template
└── docs/                   # Documentation
```

### **Development Mode**
   ```bash
# Backend with hot reload
cd backend && npm run dev

# Frontend with hot reload
cd frontend && npm run dev
```

---

## 🌍 Network Deployment

### **Local Network Access**
   ```bash
# Find your local IP
ipconfig  # Windows
ifconfig  # Linux/Mac

# Access from other devices
Dashboard: http://YOUR_IP:3000/dashboard
Portal: http://YOUR_IP:3000
Agents: http://YOUR_IP:8080
```

### **Production Deployment**
- **Backend**: Deploy to cloud server (AWS, DigitalOcean, etc.)
- **Agents**: Deploy to Raspberry Pi or similar devices
- **Database**: Use PostgreSQL or MySQL for production
- **SSL**: Configure HTTPS for secure communication

---

## 🔒 Security

- **Dashboard Protection**: HTTP Basic Auth for admin access
- **API Security**: Rate limiting and input validation
- **Network Security**: Agent authentication and encryption
- **Data Privacy**: Secure participant data handling

---

## 📚 Documentation

- **[Startup Guide](STARTUP_GUIDE.md)**: Detailed startup instructions
- **[Agent Development](agents/agent-base/README.md)**: Creating custom agents
- **[API Reference](docs/API.md)**: Backend API documentation
- **[Deployment Guide](docs/DEPLOYMENT.md)**: Production deployment

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Issues**: Report bugs and feature requests on GitHub
- **Documentation**: Check the `docs/` folder for detailed guides
- **Community**: Join our community discussions

---

**Transform storytelling into an interactive adventure with Storyteller! 📖✨**