#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ProficiencyAI Mobile App Server...');

// Change to mobile app directory
process.chdir(path.join(__dirname));

// Start Expo development server
const expo = spawn('npx', ['expo', 'start', '--tunnel', '--port', '8081'], {
  stdio: 'inherit',
  shell: true
});

expo.on('error', (error) => {
  console.error('Failed to start Expo server:', error);
});

expo.on('close', (code) => {
  console.log(`Expo server exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down mobile app server...');
  expo.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down mobile app server...');
  expo.kill('SIGTERM');
  process.exit(0);
});

console.log('✅ Mobile app server started successfully!');
console.log('📱 Open Expo Go app on your phone and scan the QR code');
console.log('🌐 The app will connect to the ProficiencyAI backend automatically');