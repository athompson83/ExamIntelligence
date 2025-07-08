#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ProficiencyAI Mobile App...');
console.log('📱 React Native with Expo');
console.log('⚡ Development Server');

const mobileDir = path.join(__dirname);
process.chdir(mobileDir);

// Start Expo development server
const expoProcess = spawn('npx', ['expo', 'start', '--port', '19006'], {
  stdio: 'inherit',
  shell: true,
  cwd: mobileDir
});

console.log('🔧 Mobile app server starting...');
console.log('📋 Scan QR code with Expo Go app to test on device');
console.log('🌐 Web version available at: http://localhost:19006');

expoProcess.on('close', (code) => {
  console.log(`Mobile app server exited with code ${code}`);
});

process.on('SIGINT', () => {
  console.log('\n👋 Stopping mobile app server...');
  expoProcess.kill();
  process.exit(0);
});