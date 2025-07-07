# Mobile App Testing Instructions

## Method 1: Quick Web Test
Run this in a new terminal:
```bash
cd mobile
npx expo start --web --port 3001
```

Then visit: http://localhost:3001

## Method 2: Expo Go QR Code
Run this in a new terminal:
```bash
cd mobile
npx expo start --tunnel
```

The QR code will appear in the terminal output. Scan it with your iPhone using the Expo Go app.

## Method 3: Simple Server Start
```bash
cd mobile
npx expo start
```

Look for output like:
```
Metro waiting on exp://192.168.1.100:8081
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   To run the app with live reloading, choose one of:                       │
│   • Scan the QR code above with Expo Go (Android) or the Camera app (iOS)  │
│   • Use the Expo CLI: exp://192.168.1.100:8081                            │
│   • Run on Android device/emulator                                         │
│   • Run on iOS simulator                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## What the Mobile App Does:
- Simple login screen (uses test@example.com by default)
- Fetches quiz data from your ProficiencyAI backend
- Shows quiz list with question counts and time limits
- Demonstrates mobile UI/UX for the platform
- Connects to: https://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev

## Files Created:
- `mobile/SimpleApp.tsx` - Main app component
- `mobile/assets/` - App icons and splash screens
- `mobile/app.json` - Expo configuration
- `mobile/package.json` - Dependencies