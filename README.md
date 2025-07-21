# Storyteller System

## Overview
This project is a modular, real-time interactive system for live installations, featuring:
- Backend (Node.js/Express + WebSocket) serving both frontends
- CHAPTER nodes (Raspberry Pi or similar)
- PORTAL (Participant UI, React) - served at root
- MONITORING DASHBOARD (Admin UI, React) - served at /dashboard

---

## Key Features
- Real-time group registration and session management
- QR code check-in for participants
- CHAPTER-to-backend and backend-to-PORTAL communication
- Monitoring dashboard for live CHAPTER status, participant counts, timers, and heartbeat
- HTTP Basic Auth protection for monitoring dashboard and API
- Unified launcher script - everything runs on port 3000
- Database-driven CHAPTER management with names, locations, and metadata

---

## Running the System

### 1. Install Dependencies
```sh
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Launch Everything
```sh
python main.py
```
- This will build the frontend, start the backend, and open the dashboard in your browser.
- Everything runs on a single port (3000) for easy deployment.

### 3. Access the Interfaces
- **PORTAL (Participant Interface)**: [http://localhost:3000](http://localhost:3000) - No authentication required
- **DASHBOARD (Admin Interface)**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard) - Requires authentication:
  - **Username:** `admin` (default, or set with `DASHBOARD_USER` env variable)
  - **Password:** `1234` (default, or set with `DASHBOARD_PASS` env variable)

### 4. Network Access for Other Devices
For smartphones, tablets, and other devices on your local network:
- **Find your local IP**: The launcher will show your local IP address (e.g., `192.168.1.100`)
- **PORTAL for devices**: `http://YOUR_LOCAL_IP:3000` (e.g., `http://192.168.1.100:3000`)
- **DASHBOARD for admin**: `http://YOUR_LOCAL_IP:3000/dashboard`
- **Requirements**: All devices must be on the same WiFi network

---

## Dashboard Features
- **Summary Cards**: Total CHAPTERS, online count, active sessions, total participants
- **CHAPTER Management**: Add new CHAPTERS with names and locations
- **Real-time Status**: Live participant counts, timers, session states, heartbeat monitoring
- **Database Integration**: Persistent CHAPTER information with metadata
- **Enhanced Organization**: CHAPTER names, locations, and detailed status information

---

## Protecting Other Pages
- The backend uses a helper (`getBasicAuthMiddleware`) to easily add HTTP Basic Auth to any route.
- To protect another route, add:
  ```js
  app.use('/your/route', getBasicAuthMiddleware(), yourRouteHandler);
  ```

---

## Customization
- Change dashboard credentials with environment variables:
  - `DASHBOARD_USER` and `DASHBOARD_PASS`
- Adjust dashboard polling interval or add WebSocket for real-time updates
- Modify CHAPTER metadata for additional custom fields

---

## Questions?
See the `agents/CHAPTER/README.md` for CHAPTER deployment, or ask for help in this repo!