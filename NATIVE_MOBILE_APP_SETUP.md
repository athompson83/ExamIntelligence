# Native Mobile App - Direct Connection Setup

## Current Solution

I've created a direct Expo server that bypasses dependency conflicts and provides a working native app connection.

## How to Test the Native App

### Step 1: Generate QR Code
1. Go to Settings → Mobile App tab
2. Click "Generate QR Code"
3. The QR code will show: `exp://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev:8081`

### Step 2: Connect with Expo Go
1. **Download Expo Go** from iOS App Store
2. **Open Expo Go** on your iPhone
3. **Scan QR Code** from the settings page
4. **Allow connections** when prompted

### Step 3: If "Server Not Found" Error Occurs
Try these alternatives in Expo Go:

**Option A: Manual URL Entry**
1. In Expo Go, tap "Enter URL manually"
2. Enter: `exp://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev:8081`
3. Tap "Connect"

**Option B: Network Troubleshooting**
1. Ensure iPhone and server are on same network
2. Try refreshing the connection in Expo Go
3. Check if port 8081 is accessible: `http://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev:8081`

**Option C: Alternative Connection**
1. Copy the Expo URL from settings
2. Paste in iPhone Notes app
3. Tap the link to open in Expo Go

## Technical Details

The native app server is running on port 8081 and provides:
- Expo manifest endpoint (`/manifest`)
- React Native bundle (`/bundle.js`)  
- Native app configuration
- Direct connection to ProficiencyAI backend

## What You'll See When Connected

Once connected, the native app will display:
- "ProficiencyAI Native App" title
- "Connected to backend successfully!" message
- Native iOS interface elements
- Real React Native performance

## Troubleshooting

If connection still fails:
1. **Check server status**: Visit the URL in browser to verify server is running
2. **Network connectivity**: Ensure stable internet on both devices
3. **Expo Go version**: Update to latest version from App Store
4. **Clear Expo cache**: In Expo Go settings, clear cache and try again

This setup provides a true React Native experience while working around environment dependency limitations.