# Storyteller System

## Overview
This project is a modular, real-time interactive system for live installations, featuring:
- Backend (Node.js/Express + WebSocket)
- CHAPTER nodes (Raspberry Pi or similar)
- PORTAL (Participant UI, React)
- MONITORING DASHBOARD (Admin UI, React)

---

## Key Features
- Real-time group registration and session management
- QR code check-in for participants
- CHAPTER-to-backend and backend-to-PORTAL communication
- Monitoring dashboard for live CHAPTER status, participant counts, timers, and heartbeat
- HTTP Basic Auth protection for monitoring endpoints
- Unified launcher script for backend and dashboard

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
- This will start the backend, the dashboard UI, and open the dashboard in your browser.

### 3. Access the Monitoring Dashboard
- Open [http://localhost:5173](http://localhost:5173) in your browser.
- You will be prompted for a username and password (HTTP Basic Auth):
  - **Username:** `admin` (default, or set with `DASHBOARD_USER` env variable)
  - **Password:** `changeme` (default, or set with `DASHBOARD_PASS` env variable)

---

## Protecting Other Pages
- The backend uses a helper (`getBasicAuthMiddleware`) to easily add HTTP Basic Auth to any route.
- To protect another route, add:
  ```js
  app.use('/your/route', getBasicAuthMiddleware(), yourRouteHandler);
  ```

---

## Monitoring Dashboard Features
- Lists all CHAPTERS with:
  - ID, status (online/offline), participant count, timer, session state, last heartbeat
- Auto-refreshes every 2 seconds
- Easy to extend for more details or drill-downs

---

## Customization
- Change dashboard credentials with environment variables:
  - `DASHBOARD_USER` and `DASHBOARD_PASS`
- Adjust dashboard polling interval or add WebSocket for real-time updates

---

## Questions?
See the `agents/CHAPTER/README.md` for CHAPTER deployment, or ask for help in this repo!