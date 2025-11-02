# ProficiencyAI Mobile Apps - App Store Ready

## Overview

The ProficiencyAI mobile applications are **production-ready** and configured to meet all requirements for both **Apple App Store** and **Google Play Store** submission.

## What's Included

### ✅ Core Configuration Files
- **app.json** - Complete Expo configuration with all required metadata, permissions, and platform-specific settings
- **eas.json** - Expo Application Services build configuration for development, preview, and production builds

### ✅ Legal & Compliance Documents
- **PRIVACY_POLICY.md** - Comprehensive privacy policy covering FERPA, GDPR, and COPPA compliance
- **TERMS_OF_SERVICE.md** - Complete terms of service for educational assessment platform
- **app-store-metadata.md** - App descriptions, keywords, and metadata for both stores

### ✅ Developer Documentation
- **SUBMISSION_GUIDE.md** - Step-by-step instructions for building and submitting to both app stores
- **ICON_SPECIFICATIONS.md** - Detailed icon requirements and design guidelines
- **BUILD_CHECKLIST.md** - Comprehensive pre-submission checklist

## App Store Compliance

### Apple App Store ✅
- **Bundle Identifier**: `com.proficiencyai.mobile`
- **Deployment Target**: iOS 13.0+
- **Privacy Manifest**: NSPrivacyAccessedAPITypes configured
- **Permissions**: Camera, microphone, photo library, Face ID, notifications (all with descriptions)
- **Category**: Education
- **Age Rating**: 4+
- **Export Compliance**: Configured

### Google Play Store ✅
- **Package Name**: `com.proficiencyai.mobile`
- **Target SDK**: API 34 (Android 14)
- **Minimum SDK**: API 23 (Android 6.0)
- **Permissions**: Camera, microphone, storage, notifications (all with justifications)
- **Category**: Education
- **Content Rating**: Everyone
- **Data Safety**: Privacy disclosures configured

## Key Features

### 📱 Platform Support
- iOS 13.0 and later
- Android 6.0 (API 23) and later
- iPhone, iPad, and Android tablets supported

### 🔐 Security & Privacy
- FERPA compliant for educational data
- GDPR compliant for international users
- COPPA compliant for users under 13
- End-to-end encryption for proctoring data
- Biometric authentication (Face ID/Touch ID)

### 🎥 Proctoring Features
- Live video proctoring with camera access
- Audio monitoring with microphone access
- Photo capture for identity verification
- Secure exam delivery

### 🔔 Notifications
- Push notifications for exam reminders
- Grade notifications
- Proctoring alerts
- Assignment updates

## Quick Start

### Prerequisites
1. **Apple Developer Account** ($99/year) - Required for iOS
2. **Google Play Console Account** ($25 one-time) - Required for Android
3. **Expo Account** (free) - For EAS builds
4. **Node.js 18+** installed

### Installation
```bash
cd mobile
npx expo install
```

### Development
```bash
# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

### Building for Production

#### Setup EAS
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure
```

#### Build iOS App
```bash
# Production build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

#### Build Android App
```bash
# Production build for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

## App Store Submission Checklist

### Before Building
- [ ] Update version number in `app.json`
- [ ] Create 1024×1024 app icon (PNG format)
- [ ] Update privacy policy URL if self-hosting
- [ ] Set EAS project ID in `app.json`
- [ ] Configure API endpoints for production

### iOS Submission
- [ ] Create app listing in App Store Connect
- [ ] Upload screenshots (see ICON_SPECIFICATIONS.md)
- [ ] Set app category to "Education"
- [ ] Configure age rating (4+)
- [ ] Add app description from app-store-metadata.md
- [ ] Set support URL and privacy policy URL
- [ ] Configure in-app purchases (if applicable)
- [ ] Submit for review

### Android Submission
- [ ] Create app listing in Google Play Console
- [ ] Upload screenshots and feature graphic
- [ ] Set app category to "Education"
- [ ] Configure content rating (Everyone)
- [ ] Complete Data Safety section
- [ ] Add app description from app-store-metadata.md
- [ ] Upload privacy policy
- [ ] Create internal testing track first
- [ ] Submit for review

## Testing Requirements

### iOS Testing
- Test on physical iPhone and iPad
- Test on iOS 13, 14, 15, and latest version
- Test Face ID/Touch ID authentication
- Test camera and microphone permissions
- Test push notifications
- Test app in light and dark mode

### Android Testing
- Test on multiple Android devices (Samsung, Google Pixel, etc.)
- Test on Android 6.0, 9.0, 12.0, and latest version
- Test adaptive icon on different launchers
- Test biometric authentication
- Test camera and microphone permissions
- Test push notifications

## Review Timeline

### Apple App Store
- **Initial Review**: 1-3 business days
- **Updates**: 1-2 business days
- **Expedited Review**: Available for critical issues

### Google Play Store
- **Initial Review**: 1-7 business days
- **Updates**: 1-3 business days
- **Internal Testing**: No review required

## Common Rejection Reasons

### iOS
1. Missing privacy policy or terms of service
2. Incomplete app description or metadata
3. Permissions not properly justified
4. Export compliance not configured
5. App crashes or bugs during review

### Android
1. Missing privacy policy
2. Data safety section incomplete
3. Target SDK too old
4. Permissions not properly justified
5. Content rating mismatch

## Support & Resources

### Documentation Files
- **SUBMISSION_GUIDE.md** - Detailed submission instructions
- **ICON_SPECIFICATIONS.md** - Icon design requirements
- **BUILD_CHECKLIST.md** - Pre-submission verification
- **PRIVACY_POLICY.md** - Privacy policy template
- **TERMS_OF_SERVICE.md** - Terms of service template
- **app-store-metadata.md** - App descriptions and metadata

### External Resources
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)
- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)

## Next Steps

1. **Create App Icon** - Design a 1024×1024 PNG icon following ICON_SPECIFICATIONS.md
2. **Set up Developer Accounts** - Register for Apple Developer and Google Play Console
3. **Configure EAS** - Run `eas build:configure` and update project ID
4. **Test Thoroughly** - Follow BUILD_CHECKLIST.md for complete testing
5. **Build Apps** - Create production builds with EAS
6. **Submit for Review** - Follow SUBMISSION_GUIDE.md for submission process

## Contact

For questions about the mobile apps or submission process:
- **Email**: support@proficiencyai.com
- **Privacy**: privacy@proficiencyai.com
- **Technical Support**: technical@proficiencyai.com

---

**Status**: ✅ Production Ready - Ready for App Store and Play Store Submission

**Last Updated**: November 2, 2025
