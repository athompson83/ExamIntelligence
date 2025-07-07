# 🚀 Mobile App Testing Instructions

## Current Status
Your mobile app is set up and ready to test! Here's how to get the QR code:

## Option 1: Install Required Dependencies First (Recommended)
```bash
cd mobile
npm install react-native-web @expo/metro-runtime
npm install -g @expo/ngrok
npx expo start --tunnel
```

## Option 2: Simple Local Testing
```bash
cd mobile
npx expo start
```

## Option 3: Web Version (Quick Test)
```bash
cd mobile
npm install react-native-web @expo/metro-runtime
npx expo start --web
```

## What the App Does
✅ **Simple Login Screen** - Uses test@example.com by default  
✅ **Real Quiz Data** - Connects to your ProficiencyAI backend  
✅ **Quiz List** - Shows all your quizzes with question counts  
✅ **Mobile UI** - Clean, professional mobile interface  

## Backend Connection
The app connects to your live backend at:
```
https://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev
```

## Files Created
- `SimpleApp.tsx` - Main mobile app component
- `App.tsx` - App entry point
- `assets/` - Icons and splash screens
- `app.json` - Expo configuration

## Expected QR Code Output
When you run `npx expo start --tunnel`, you'll see:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   To run the app with live reloading, choose one of:                       │
│   • Scan the QR code above with Expo Go (Android) or Camera app (iOS)      │
│   • Press a │ open Android                                                 │
│   • Press i │ open iOS simulator                                           │
│   • Press w │ open web                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

The QR code will be displayed above this message.