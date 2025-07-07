#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Start Expo development server
console.log('Starting Expo development server...');

const expo = spawn('npx', ['expo', 'start', '--tunnel', '--port', '8081'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_USE_DEV_SERVER: 'true',
    EXPO_TUNNEL: 'true'
  }
});

expo.on('close', (code) => {
  console.log(`Expo server exited with code ${code}`);
});

expo.on('error', (err) => {
  console.error('Failed to start Expo server:', err);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('Shutting down Expo server...');
  expo.kill();
  process.exit(0);
});

console.log('Expo server starting on port 8081...');