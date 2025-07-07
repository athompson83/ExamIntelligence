# Mobile App QR Code Setup

The mobile app is now integrated into the Super Admin settings with a complete QR code generator.

## How to Access

1. **Navigate to Settings**
   - Click the Settings link in the top navigation bar
   - Click the "Mobile App" tab in the settings interface

2. **Generate QR Code**
   - Click the "Generate QR Code" button
   - The system will start the Expo development server automatically
   - A QR code will appear that you can scan with your iPhone

3. **Scan with iPhone**
   - Install "Expo Go" app from the App Store
   - Use your iPhone camera or the Expo Go app to scan the QR code
   - The mobile app will load in Expo Go

## Mobile App Features

- Login with test@example.com
- View real quiz data from your backend
- Material Design interface optimized for touch
- Native mobile experience

## Technical Details

- **Backend API**: Connected to your live ProficiencyAI backend
- **Framework**: React Native with Expo
- **UI**: Material Design components
- **Data**: Real-time data from your quiz system

## Troubleshooting

If the mobile app times out:
1. Use the run-mobile-app.sh script to start the Expo server
2. Ensure your device is connected to the internet
3. Try regenerating the QR code
4. Verify the Replit domain is accessible

## Manual Setup (If needed)

If automatic startup fails, manually start the mobile app:
```bash
cd mobile-app-final
npx expo start --tunnel --port 8081
```

## Features in Mobile App

✓ Clean login interface with test@example.com
✓ Quiz list display with real backend data
✓ Touch-optimized Material Design UI
✓ Proper error handling and offline support
✓ Responsive layout for phones and tablets

The mobile app is now fully functional and ready for testing!