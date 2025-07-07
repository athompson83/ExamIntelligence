#!/bin/bash

echo "🚀 Starting ProficiencyAI Mobile App Server"

# Kill any existing processes
pkill -f "expo start" 2>/dev/null || true
pkill -f "node.*8081" 2>/dev/null || true

# Wait for cleanup
sleep 3

# Navigate to mobile app directory
cd mobile-app-final || exit 1

# Start Expo development server
echo "Starting Expo server on port 8081..."
echo "This will take about 30-45 seconds to start up..."

# Use CI=1 to avoid interactive prompts and start tunnel
CI=1 npx expo start --tunnel --port 8081 --non-interactive > expo-server.log 2>&1 &
EXPO_PID=$!

echo "Expo server started with PID: $EXPO_PID"
echo "Logs available in mobile-app-final/expo-server.log"
echo ""
echo "📱 To use the mobile app:"
echo "1. Install 'Expo Go' app on your phone"
echo "2. Generate QR code in Settings → Mobile App tab"
echo "3. Scan QR code with your phone"
echo "4. Login with test@example.com"
echo ""
echo "Server will be ready in about 30 seconds..."