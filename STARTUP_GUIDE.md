# 🚀 Storyteller System Startup Guide

This guide shows you how to launch the backend and dashboard together.

## 🎯 Quick Start (Recommended)

### **Windows Users:**
```cmd
# Double-click the startup script
start-system.bat
```

### **Linux/Mac Users:**
```bash
# Make executable and run
chmod +x start-system.sh
./start-system.sh
```

## 🔧 Manual Startup

If you prefer to start components manually, follow these steps:

### **Step 1: Install Dependencies**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### **Step 2: Build Frontend**

```bash
# Build the frontend for production
cd frontend
npm run build
```

### **Step 3: Start Backend**

```bash
# Start the backend server (serves both API and dashboard)
cd backend
npm start
```

### **Step 4: Access the System**

Once the backend is running, you can access:

#### **Local Access (Same Device)**
- **Dashboard**: http://localhost:3000/dashboard
- **Portal**: http://localhost:3000
- **API**: http://localhost:3000/api

#### **Network Access (Other Devices)**
- **Dashboard**: http://YOUR_IP:3000/dashboard
- **Portal**: http://YOUR_IP:3000

**Dashboard Login:**
- Username: `admin`
- Password: `1234`

**To find your local IP address:**
- **Windows**: Run `ipconfig` in Command Prompt
- **Linux/Mac**: Run `ifconfig` in Terminal

## 🌐 What Gets Started

### **Backend Server (Port 3000)**
- ✅ **REST API**: All backend endpoints
- ✅ **Dashboard**: Admin interface (served from `/dashboard`)
- ✅ **Portal**: Participant interface (served from `/`)
- ✅ **WebSocket**: Real-time communication
- ✅ **Database**: SQLite database
- ✅ **Discovery Service**: Auto-discovery of agents

### **Available Endpoints**
- `GET /` - Portal (participant interface)
- `GET /dashboard` - Dashboard (admin interface)
- `GET /api/monitor/chapters` - Agent monitoring
- `GET /api/config` - Configuration management
- `GET /api/discovery/status` - Discovery service status

## 🔄 Development Mode

For development with hot reloading:

```bash
# Start backend in development mode
cd backend
npm run dev

# In another terminal, start frontend in development mode
cd frontend
npm run dev
```

This will start:
- Backend on port 3000
- Frontend dev server on port 5173
- Hot reloading for both

## 🤖 Starting Individual Agents

After the main system is running, you can start individual agents:

### **CHAPTER Agent:**
```bash
cd agents/chapter-template
npm install
npm start
# Or use: start.bat (Windows) / start.sh (Linux/Mac)
```

### **CONNECTION Agent:**
```bash
cd agents/connection-template
npm install
npm start
# Or use: start.bat (Windows) / start.sh (Linux/Mac)
```

## 📱 Accessing Agents

Each agent provides its own web interface:

### **Local Access**
- **CHAPTER Agent**: http://localhost:8080
- **CONNECTION Agent**: http://localhost:8080 (if only one running)

### **Network Access**
- **CHAPTER Agent**: http://YOUR_IP:8080
- **CONNECTION Agent**: http://YOUR_IP:8080 (if only one running)

## 🔍 Troubleshooting

### **Port Already in Use**
If port 3000 is already in use:
```bash
# Check what's using the port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Kill the process or change the port in backend/src/server.js
```

### **Dependencies Not Found**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### **Database Issues**
```bash
# Reset the database (WARNING: This will delete all data)
rm backend/database.sqlite
# Restart the backend
```

### **Agent Not Appearing in Dashboard**
1. Check if agent is running: http://localhost:8080/health
2. Verify backend URL in agent configuration
3. Check backend logs for registration errors
4. Ensure both are on the same network

## 🌍 Network Access

To access from other devices on the same network:

1. Find your local IP address:
   ```bash
   ipconfig  # Windows
   ifconfig  # Linux/Mac
   ```

2. Access using your local IP:
   - Dashboard: `http://YOUR_IP:3000/dashboard`
   - Portal: `http://YOUR_IP:3000`
   - Agents: `http://YOUR_IP:8080`

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │     Portal      │    │   Backend API   │
│  (Admin UI)     │    │ (Participant)   │    │   (Node.js)     │
│                 │    │                 │    │                 │
│ http://localhost│    │ http://localhost│    │ http://localhost│
│ :3000/dashboard │    │ :3000           │    │ :3000/api       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │   (SQLite)      │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Agents        │
                    │ (CHAPTER/CONN)  │
                    │ :8080           │
                    └─────────────────┘
```

## 🎯 Quick Commands Reference

```bash
# Start everything (Windows)
start-system.bat

# Start everything (Linux/Mac)
./start-system.sh

# Start backend only
cd backend && npm start

# Start backend in dev mode
cd backend && npm run dev

# Start frontend in dev mode
cd frontend && npm run dev

# Start CHAPTER agent
cd agents/chapter-template && npm start

# Start CONNECTION agent
cd agents/connection-template && npm start
```

---

**Happy Storytelling! 📖✨** 