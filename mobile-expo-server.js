const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 8081;

// Serve a simple response for health checks
app.get('/', (req, res) => {
  res.json({ 
    status: 'Mobile App Server Running',
    message: 'ProficiencyAI Mobile App',
    timestamp: new Date().toISOString()
  });
});

// Start the actual Expo development server
function startExpoServer() {
  console.log('Starting Expo development server...');
  
  const expoProcess = spawn('npx', ['expo', 'start', '--dev-client'], {
    cwd: path.join(__dirname, 'mobile-app-final'),
    stdio: 'inherit',
    env: { ...process.env, PORT: '8082' } // Use different port for expo
  });
  
  expoProcess.on('error', (error) => {
    console.error('Expo process error:', error);
  });
  
  expoProcess.on('exit', (code) => {
    console.log(`Expo process exited with code ${code}`);
    // Restart if it crashes
    setTimeout(startExpoServer, 5000);
  });
}

// Start both servers
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mobile app proxy server running on port ${PORT}`);
  startExpoServer();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down mobile app server...');
  process.exit(0);
});