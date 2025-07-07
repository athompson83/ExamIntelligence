const express = require('express');
const app = express();
const PORT = 8081;

// Serve basic mobile app response
app.get('/', (req, res) => {
  res.json({
    name: 'ProficiencyAI Mobile',
    status: 'running',
    message: 'Mobile app server is working',
    expo_url: 'exp://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev:8081'
  });
});

// Simple mobile app interface endpoint
app.get('/mobile', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>ProficiencyAI Mobile</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .container { max-width: 400px; margin: 0 auto; background: white; padding: 20px; border-radius: 12px; }
            .title { color: #2563eb; text-align: center; margin-bottom: 20px; }
            .message { text-align: center; color: #666; }
            .button { background: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 8px; margin: 10px; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="title">ProficiencyAI Mobile</h1>
            <p class="message">Mobile app is working correctly!</p>
            <p class="message">Use Expo Go app to scan QR code for full React Native experience.</p>
            <button class="button" onclick="window.location.reload()">Refresh</button>
        </div>
    </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mobile app server running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}/mobile`);
});

// Keep alive
setInterval(() => {
  console.log(`Mobile server heartbeat: ${new Date().toISOString()}`);
}, 30000);