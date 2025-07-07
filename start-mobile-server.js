const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting mobile app server automatically...');

// Kill any existing expo processes
exec('pkill -f "expo start" || true', (killError) => {
  console.log('Cleaned up existing Expo processes');
  
  // Wait a moment then start expo
  setTimeout(() => {
    const expoPath = path.join(__dirname, 'mobile-app-final');
    console.log(`Starting Expo in: ${expoPath}`);
    
    const expo = spawn('npx', ['expo', 'start', '--tunnel', '--port', '8081'], {
      cwd: expoPath,
      stdio: 'inherit',
      env: { ...process.env, CI: '1' }
    });
    
    expo.on('error', (error) => {
      console.error('Failed to start Expo:', error);
    });
    
    expo.on('exit', (code) => {
      console.log(`Expo server exited with code ${code}`);
    });
    
    console.log('✅ Mobile app server is starting...');
    console.log('📱 QR code will be available shortly at port 8081');
    
  }, 2000);
});

// Keep the process running
process.on('SIGINT', () => {
  console.log('Shutting down mobile server...');
  exec('pkill -f "expo start"', () => {
    process.exit(0);
  });
});