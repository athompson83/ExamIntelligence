const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting ProficiencyAI Mobile Server...');

// Ensure mobile-app-final directory exists
const mobileAppPath = path.join(__dirname, 'mobile-app-final');
if (!fs.existsSync(mobileAppPath)) {
  console.error('Mobile app directory not found:', mobileAppPath);
  process.exit(1);
}

// Change to mobile app directory
process.chdir(mobileAppPath);

// Start Expo server
const expo = spawn('npx', ['expo', 'start', '--tunnel'], {
  stdio: 'inherit',
  shell: true
});

expo.on('close', (code) => {
  console.log(`Expo server exited with code ${code}`);
});

expo.on('error', (error) => {
  console.error('Failed to start Expo server:', error);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('Shutting down mobile server...');
  expo.kill();
  process.exit(0);
});

console.log('Mobile server started. Use Ctrl+C to stop.');