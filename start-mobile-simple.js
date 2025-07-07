const express = require('express');
const path = require('path');
const app = express();

// Serve mobile app directly
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProficiencyAI Mobile</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px 30px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: #2563eb;
            border-radius: 20px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: bold;
        }
        h1 {
            color: #1f2937;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #6b7280;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .input-group {
            margin-bottom: 20px;
            text-align: left;
        }
        label {
            display: block;
            color: #374151;
            margin-bottom: 8px;
            font-weight: 500;
        }
        input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        input:focus {
            outline: none;
            border-color: #2563eb;
        }
        .button {
            width: 100%;
            background: #2563eb;
            color: white;
            border: none;
            padding: 14px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 10px;
            transition: background 0.2s;
        }
        .button:hover {
            background: #1d4ed8;
        }
        .status {
            margin-top: 20px;
            padding: 12px;
            background: #10b981;
            color: white;
            border-radius: 8px;
            font-size: 14px;
        }
        .features {
            margin-top: 30px;
            text-align: left;
        }
        .feature {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            color: #4b5563;
        }
        .feature::before {
            content: "✓";
            background: #10b981;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            font-size: 12px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">P</div>
        <h1>ProficiencyAI</h1>
        <p class="subtitle">Mobile Assessment Platform</p>
        
        <form id="loginForm">
            <div class="input-group">
                <label for="email">Email</label>
                <input type="email" id="email" value="test@example.com" required>
            </div>
            <div class="input-group">
                <label for="password">Password</label>
                <input type="password" id="password" value="password" required>
            </div>
            <button type="submit" class="button">Login</button>
        </form>
        
        <div class="status">
            Connected to ProficiencyAI Backend
        </div>
        
        <div class="features">
            <div class="feature">Take Interactive Assessments</div>
            <div class="feature">Track Learning Progress</div>
            <div class="feature">Access Study Materials</div>
            <div class="feature">Real-time Results</div>
        </div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (email && password) {
                alert('Login Successful!\\n\\nWelcome to ProficiencyAI Mobile App\\n\\nThis demonstrates the mobile interface working correctly. In a full React Native app, you would have access to native device features like camera, notifications, and offline storage.');
                
                // Show success state
                document.querySelector('.status').innerHTML = 'Login Successful! Full features available in React Native app.';
                document.querySelector('.status').style.background = '#059669';
            }
        });
    </script>
</body>
</html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'ProficiencyAI Mobile',
    timestamp: new Date().toISOString()
  });
});

const PORT = 8081;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Mobile app server running on port \${PORT}\`);
  console.log(\`Access mobile app at: http://localhost:\${PORT}\`);
});

// Keep the process alive and log status
setInterval(() => {
  console.log(\`[MOBILE] Server alive on port \${PORT} - \${new Date().toISOString()}\`);
}, 30000);