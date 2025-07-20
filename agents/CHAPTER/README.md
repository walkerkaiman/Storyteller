# CHAPTERS: Work Summary & Documentation

## 1. Purpose
CHAPTERS are physical nodes (e.g., Raspberry Pi) at installation sites. They:
- Handle participant registration via QR code scanning.
- Manage group session logic (min/max participants, countdown timer).
- Start and monitor the local “black box” (art installation).
- Communicate with the backend to keep participant UIs in sync.

---

## 2. Directory Structure

```
agents/
  chapter-template/
    main.py                # Main entry point and orchestration logic
    backend_client.py      # Handles REST communication with backend
    qr_scanner.py          # Scans QR codes via webcam
    black_box_adapter.py   # Starts/stops the black box process
    config.json            # Editable settings for each CHAPTER
    requirements.txt       # Python dependencies
    README.md              # Setup and usage documentation
```

---

## 3. Key Features Implemented

### A. Configurable Settings
- Each CHAPTER uses its own `config.json` for:
  - `chapter_id`
  - `backend_url`
  - `black_box_command`
  - `qr_camera_index`
  - `min_participants`
  - `max_participants`
  - `countdown_seconds`

### B. QR Code Registration
- Uses a webcam to scan participant QR codes.
- Extracts user IDs for registration.

### C. Group Registration Logic
- Tracks registered participants.
- Starts a countdown timer when the minimum is reached.
- Resets the timer on new registrations (if max not reached).
- Closes registration and starts the session when the timer runs out or max is reached.
- Resets for the next group after a session finishes.

### D. Black Box Control
- Launches the black box process when registration closes.
- Waits for the black box to finish (currently simulated with manual input).
- Sends session results to the backend.

### E. Backend Communication
- Registers the CHAPTER on boot.
- Sends registration status (including config values) to the backend for real-time UI updates.
- Sends participant state changes and session results.
- Batch sends session start state to all participants.

---

## 4. How to Deploy a CHAPTER

1. **Copy the `chapter-template` directory to the CHAPTER device.**
2. **Edit `config.json`** with unique settings for that CHAPTER.
3. **Install dependencies:**  
   `pip install -r requirements.txt`
4. **Run the CHAPTER:**  
   `python main.py`
5. **The CHAPTER will:**
   - Register with the backend.
   - Wait for participants to check in via QR code.
   - Manage group registration and session start.
   - Start the black box and report results.
   - Reset for the next group.

---

## 5. Extensibility & Next Steps

- The backend and SPA (participant UI) should use the registration status and config sent by the CHAPTER to keep users informed in real time.
- The black box adapter can be extended to listen for real signals from the installation.
- Error handling, persistent logging, and advanced session management can be added as needed.

---

## 6. Example `config.json`

```json
{
  "chapter_id": "CHAPTER_001",
  "backend_url": "http://localhost:5000/api",
  "black_box_command": "python black_box.py",
  "qr_camera_index": 0,
  "min_participants": 2,
  "max_participants": 6,
  "countdown_seconds": 30
}
```

---

## 7. Documentation Location
- All setup and usage instructions are in `agents/chapter-template/README.md`. 