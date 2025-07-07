# 📱 ProficiencyAI Mobile App - iPhone Testing

## 🚀 Quick Start (RECOMMENDED)

**Run this single command to get the QR code:**

```bash
cd mobile-app && npx expo@latest start --tunnel
```

When prompted to install packages, type `y` and press Enter.

## 📋 Step-by-Step Instructions

1. **Open Terminal in Replit**
2. **Navigate to mobile app:**
   ```bash
   cd mobile-app
   ```

3. **Start Expo (this will show the QR code):**
   ```bash
   npx expo@latest start --tunnel
   ```

4. **When prompted to install @expo/ngrok:**
   - Type `y` and press Enter

5. **Scan QR Code:**
   - Open Expo Go app on your iPhone
   - Scan the QR code that appears in the terminal

## 📱 What You'll See

The mobile app connects to your live ProficiencyAI backend and shows:
- Login screen (test@example.com prefilled)
- Real quiz data from your platform
- Quiz list with question counts
- Mobile-optimized interface

## 🔧 Troubleshooting

If you get dependency errors, try:
```bash
cd mobile-app
npm install --legacy-peer-deps
npx expo@latest start --tunnel
```

## 📂 Files Created

- `mobile-app/App.js` - Main mobile app
- `mobile-app/package.json` - Dependencies
- `mobile-app/app.json` - Expo configuration

## 🌐 Backend Connection

The app connects to your live backend:
```
https://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev
```

This means you'll see your actual quiz data on your iPhone!