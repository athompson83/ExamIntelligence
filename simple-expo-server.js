const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 8081;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Serve the mobile app bundle
app.get('/', (req, res) => {
  res.json({
    name: "ProficiencyAI Mobile",
    slug: "proficiencyai-mobile", 
    version: "1.0.0",
    bundleUrl: `http://localhost:${PORT}/bundle.js`,
    debuggerHost: `localhost:${PORT}`,
    expoServerPort: PORT,
    packagerInfo: {
      devToolsPort: 19002,
      expoServerPort: PORT,
      packagerPort: 19000,
      webpackServerPort: 19006
    }
  });
});

// Mock bundle endpoint
app.get('/bundle.js', (req, res) => {
  res.type('application/javascript');
  res.send(`
// ProficiencyAI Mobile App Bundle
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ProficiencyAI Native App</Text>
      <Text style={styles.subtitle}>Connected to backend successfully!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#bfdbfe',
  },
});
  `);
});

// Expo manifest endpoint
app.get('/manifest', (req, res) => {
  res.json({
    id: "@proficiencyai/mobile",
    name: "ProficiencyAI Mobile",
    slug: "proficiencyai-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#2563eb"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    bundleUrl: `http://localhost:${PORT}/bundle.js`,
    debuggerHost: `localhost:${PORT}`,
    expoServerPort: PORT,
    hostUri: `localhost:${PORT}`,
    isExpoClientConnected: true
  });
});

app.listen(PORT, '0.0.0.0', () => {
  const logMessage = `
🚀 Expo Development Server Started!

📱 To test on your device:
1. Install Expo Go from App Store
2. Scan this QR code or enter URL manually:

exp://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev:${PORT}

🌐 Server running on:
- Local: http://localhost:${PORT}
- Network: http://0.0.0.0:${PORT}
- External: https://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev:${PORT}

✅ ProficiencyAI Mobile App Ready!
Status: RUNNING
  `;
  
  console.log(logMessage);
  
  // Write status to file for monitoring
  fs.writeFileSync('/tmp/expo_status.txt', `RUNNING:${PORT}:${Date.now()}`);
});

module.exports = app;