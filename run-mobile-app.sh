#!/bin/bash

# Kill any existing expo processes
pkill -f "expo start" || true

# Navigate to mobile app directory
cd mobile-app-final

# Start Expo with tunnel
echo "Starting Expo development server..."
npx expo start --tunnel --port 8081 --non-interactive

echo "Mobile app server started!"
echo "Scan the QR code with Expo Go app on your phone"
echo "Login with: test@example.com"