#!/bin/bash
# Mobile App QR Code Generator Script

echo "🚀 Starting ProficiencyAI Mobile App..."
echo ""
echo "This will generate a QR code for testing on your iPhone"
echo ""

# Navigate to mobile app directory
cd mobile-app

# Create minimal package.json if it doesn't exist
cat > package.json << EOF
{
  "name": "proficiencyai-mobile-demo",
  "version": "1.0.0",
  "main": "App.js",
  "scripts": {
    "start": "expo start"
  },
  "dependencies": {
    "expo": "^51.0.0",
    "react": "18.2.0",
    "react-native": "0.74.1"
  }
}
EOF

echo "📱 Installing Expo globally..."
npm install -g @expo/cli || echo "Expo may already be installed"

echo "📦 Installing dependencies..."
npm install || npm install --legacy-peer-deps

echo "🎯 Starting Expo development server..."
echo ""
echo "The QR code will appear below. Scan it with Expo Go on your iPhone:"
echo ""

npx expo start --tunnel