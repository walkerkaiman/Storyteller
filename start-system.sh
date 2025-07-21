#!/bin/bash

echo "Starting Storyteller System..."
echo

echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies"
    exit 1
fi

echo "Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install frontend dependencies"
    exit 1
fi

echo "Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "Failed to build frontend"
    exit 1
fi

echo
echo "Starting backend server..."
cd ../backend
npm start &
BACKEND_PID=$!

echo
echo "Waiting for server to start..."
sleep 5

echo
echo "Opening dashboard in browser..."
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000/dashboard
elif command -v open &> /dev/null; then
    open http://localhost:3000/dashboard
else
    echo "Please open http://localhost:3000/dashboard in your browser"
fi

echo
echo "========================================"
echo "Storyteller System Started Successfully!"
echo "========================================"
echo
echo "Local Access:"
echo "Backend API: http://localhost:3000"
echo "Dashboard: http://localhost:3000/dashboard"
echo "Portal: http://localhost:3000"
echo
echo "Network Access (for other devices):"
echo "Dashboard: http://YOUR_IP:3000/dashboard"
echo "Portal: http://YOUR_IP:3000"
echo
echo "Dashboard Login:"
echo "Username: admin"
echo "Password: 1234"
echo
echo "To find your network IP addresses, run: node find-network-ip.js"
echo "Or use: ifconfig"
echo
echo "Press Ctrl+C to stop the server..."

# Wait for interrupt signal
trap 'echo "Stopping server..."; kill $BACKEND_PID; exit 0' INT
wait $BACKEND_PID 