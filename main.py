import subprocess
import time
import webbrowser
import sys

# Start backend (Node.js/Express)
backend = subprocess.Popen(['npm', 'run', 'dev', '--prefix', 'backend'])

# Start dashboard UI (Vite/React)
dashboard = subprocess.Popen(['npm', 'run', 'dev', '--prefix', 'frontend'])

# Wait a bit for servers to start
print('Waiting for servers to start...')
time.sleep(5)

# Open dashboard in browser
try:
    webbrowser.open('http://localhost:5173')  # Adjust port if needed
    print('Dashboard opened in browser.')
except Exception as e:
    print(f'Could not open browser: {e}', file=sys.stderr)

try:
    backend.wait()
    dashboard.wait()
except KeyboardInterrupt:
    print('Shutting down...')
    backend.terminate()
    dashboard.terminate() 