#!/bin/bash

# Kill any existing expo processes
pkill -f "expo start" || true
sleep 2

# Navigate to mobile app directory
cd "$(dirname "$0")"

# Start Expo with proper settings
echo "Starting Expo development server..."
export EXPO_USE_DEV_SERVER=true
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Start expo in background and keep it running
nohup npx expo start --tunnel --port 8081 --non-interactive > expo.log 2>&1 &

echo "Expo server starting on port 8081..."
echo "PID: $!"

# Wait for server to be ready
sleep 15

# Check if server is running
if curl -s http://localhost:8081 > /dev/null; then
    echo "✅ Expo server is running successfully"
else
    echo "⚠️ Expo server may still be starting..."
fi

echo "Check expo.log for details"