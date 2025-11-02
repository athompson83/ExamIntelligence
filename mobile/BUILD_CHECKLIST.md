# ProficiencyAI Mobile App Build Checklist

Comprehensive checklist to ensure successful builds and submissions for iOS and Android.

---

## Table of Contents

1. [Pre-Build Verification](#pre-build-verification)
2. [Code Signing Setup](#code-signing-setup)
3. [Environment Variables](#environment-variables)
4. [Testing on Physical Devices](#testing-on-physical-devices)
5. [App Store Listing Preparation](#app-store-listing-preparation)
6. [Build Execution](#build-execution)
7. [Post-Build Validation](#post-build-validation)
8. [Submission Checklist](#submission-checklist)
9. [Post-Submission Monitoring](#post-submission-monitoring)

---

## Pre-Build Verification

### Project Configuration

- [ ] **app.json** is properly configured
  - [ ] App name is correct: "ProficiencyAI"
  - [ ] Version number is correct (e.g., "1.0.0")
  - [ ] iOS bundle identifier: `com.proficiencyai.mobile`
  - [ ] Android package name: `com.proficiencyai.mobile`
  - [ ] All required permissions are listed
  - [ ] Privacy policy URL is valid: https://proficiencyai.com/privacy
  - [ ] Terms of service URL is valid: https://proficiencyai.com/terms

- [ ] **eas.json** is properly configured
  - [ ] Production profile exists for iOS
  - [ ] Production profile exists for Android
  - [ ] Submit profiles are configured
  - [ ] API URLs point to production (not localhost)
  - [ ] EAS project ID is set correctly

- [ ] **package.json** dependencies
  - [ ] All dependencies are up-to-date
  - [ ] No conflicting dependency versions
  - [ ] No unused dependencies
  - [ ] Run `npm audit` and fix critical vulnerabilities

### Code Quality

- [ ] **Linting**
  ```bash
  npm run lint
  # Fix all errors and warnings
  ```

- [ ] **TypeScript compilation**
  ```bash
  npx tsc --noEmit
  # Verify no type errors
  ```

- [ ] **No console.log statements** in production code
  - [ ] Remove or guard with `__DEV__` checks
  - [ ] Use proper logging library if needed

- [ ] **No hardcoded credentials**
  - [ ] API keys in environment variables
  - [ ] No test credentials in code
  - [ ] Sensitive data not logged

- [ ] **Assets are optimized**
  - [ ] Images compressed (use TinyPNG)
  - [ ] SVGs optimized (use SVGOMG)
  - [ ] No unnecessarily large files

### Icons & Splash Screens

- [ ] **App icon** (`assets/icon.png` or `icon.svg`)
  - [ ] Size: 1024×1024 pixels
  - [ ] Format: PNG (32-bit with alpha) or SVG
  - [ ] File size < 1MB
  - [ ] Design is clear and recognizable

- [ ] **Adaptive icon** (`assets/adaptive-icon.png` or `adaptive-icon.svg`)
  - [ ] Size: 1024×1024 pixels
  - [ ] Content within 864×864 safe zone
  - [ ] Background color set in app.json
  - [ ] Tested with circle, square, squircle masks

- [ ] **Splash screen** (`assets/splash.png` or `splash.svg`)
  - [ ] Proper dimensions for target devices
  - [ ] Background color set in app.json
  - [ ] Loads quickly (optimized file size)

- [ ] **Favicon** (`assets/favicon.svg` or `favicon.png`)
  - [ ] Size: 48×48 or vector SVG
  - [ ] For web builds

### Permissions & Privacy

- [ ] **iOS Info.plist permissions** (in app.json)
  - [ ] `NSCameraUsageDescription` - Clear explanation
  - [ ] `NSMicrophoneUsageDescription` - Clear explanation
  - [ ] `NSPhotoLibraryUsageDescription` - Clear explanation
  - [ ] `NSLocationWhenInUseUsageDescription` - If using location
  - [ ] `NSFaceIDUsageDescription` - If using Face ID
  - [ ] All descriptions are user-friendly (not technical)

- [ ] **Android permissions** (in app.json)
  - [ ] Only necessary permissions requested
  - [ ] Dangerous permissions have runtime requests
  - [ ] Unused permissions removed from `blockedPermissions`

- [ ] **Privacy policy**
  - [ ] URL is publicly accessible: https://proficiencyai.com/privacy
  - [ ] Accurately describes data collection
  - [ ] Updated within last 12 months
  - [ ] HTTPS (not HTTP)

### Functionality Testing

- [ ] **App launches successfully**
  - [ ] On iOS simulator/device
  - [ ] On Android emulator/device
  - [ ] No crashes during launch

- [ ] **Core features work**
  - [ ] Login/authentication
  - [ ] Exam taking flow
  - [ ] Camera/proctoring (if applicable)
  - [ ] Results display
  - [ ] Navigation between screens

- [ ] **Error handling**
  - [ ] Network errors handled gracefully
  - [ ] API errors show user-friendly messages
  - [ ] App doesn't crash on errors
  - [ ] Retry mechanisms work

- [ ] **Offline mode** (if applicable)
  - [ ] App works without internet
  - [ ] Data syncs when connection restored
  - [ ] User informed of offline status

---

## Code Signing Setup

### iOS Code Signing (Automatic - EAS Managed)

- [ ] **Create Apple Developer account**
  - [ ] Account is active ($99/year paid)
  - [ ] Apple ID verified
  - [ ] Two-factor authentication enabled

- [ ] **Let EAS manage credentials** (recommended)
  ```bash
  eas credentials
  ```
  - [ ] Select iOS
  - [ ] Choose "Set up new credentials"
  - [ ] Let EAS create Distribution Certificate
  - [ ] Let EAS create Provisioning Profile

- [ ] **Verify credentials**
  ```bash
  eas credentials --platform ios
  ```
  - [ ] Distribution Certificate exists
  - [ ] Provisioning Profile exists
  - [ ] Bundle identifier matches: `com.proficiencyai.mobile`

### iOS Code Signing (Manual - Advanced)

Only if NOT using EAS-managed credentials:

- [ ] **Distribution Certificate**
  - [ ] Created in Apple Developer Portal
  - [ ] Downloaded and installed on keychain
  - [ ] Not expired

- [ ] **Provisioning Profile**
  - [ ] Created for bundle ID: `com.proficiencyai.mobile`
  - [ ] Type: App Store Distribution
  - [ ] Includes Distribution Certificate
  - [ ] Downloaded and uploaded to EAS

### Android Code Signing (Automatic - EAS Managed)

- [ ] **Let EAS generate keystore** (recommended for first build)
  ```bash
  eas credentials
  ```
  - [ ] Select Android
  - [ ] Choose "Set up new keystore"
  - [ ] EAS generates and stores keystore securely

- [ ] **Verify keystore**
  ```bash
  eas credentials --platform android
  ```
  - [ ] Keystore exists
  - [ ] Package name matches: `com.proficiencyai.mobile`

### Android Code Signing (Manual - Advanced)

Only if using existing keystore:

- [ ] **Keystore file exists**
  - [ ] Generated with `keytool` command
  - [ ] Stored securely (backup in safe location)
  - [ ] Password documented

- [ ] **Upload keystore to EAS**
  ```bash
  eas credentials
  ```
  - [ ] Select Android
  - [ ] Choose "Upload existing keystore"
  - [ ] Provide keystore file, alias, passwords

---

## Environment Variables

### Development Environment

- [ ] **Local `.env` file** (not committed to git)
  ```
  API_URL=http://localhost:5000
  WEBSOCKET_URL=ws://localhost:5000
  ```

- [ ] **EAS development profile** (in eas.json)
  ```json
  "development": {
    "env": {
      "API_URL": "http://localhost:5000",
      "WEBSOCKET_URL": "ws://localhost:5000"
    }
  }
  ```

### Production Environment

- [ ] **Production API URLs**
  - [ ] API_URL: `https://api.proficiencyai.com`
  - [ ] WEBSOCKET_URL: `wss://api.proficiencyai.com`
  - [ ] Both URLs are HTTPS/WSS (secure)
  - [ ] URLs are reachable from public internet

- [ ] **EAS production profile** (in eas.json)
  ```json
  "production": {
    "env": {
      "API_URL": "https://api.proficiencyai.com",
      "WEBSOCKET_URL": "wss://api.proficiencyai.com"
    }
  }
  ```

- [ ] **No secrets in app.json or eas.json**
  - [ ] API keys not hardcoded
  - [ ] Passwords not in config
  - [ ] Use EAS Secrets for sensitive data

### EAS Secrets (for sensitive data)

If you have API keys or secrets:

```bash
# Set secret
eas secret:create --scope project --name STRIPE_PUBLISHABLE_KEY --value pk_live_xxx

# List secrets
eas secret:list

# Use in eas.json
{
  "production": {
    "env": {
      "STRIPE_PUBLISHABLE_KEY": "@STRIPE_PUBLISHABLE_KEY"
    }
  }
}
```

- [ ] All API keys stored as EAS secrets
- [ ] Secrets referenced with `@SECRET_NAME` syntax
- [ ] No secrets committed to git

### Verify Environment Variables

- [ ] **Check build logs** for environment variable values
- [ ] **Test API connectivity** after build
- [ ] **Verify URLs** point to correct environment

---

## Testing on Physical Devices

### iOS Testing

- [ ] **Install on iOS device**
  - [ ] Build with `--profile development` or `--profile preview`
  - [ ] Install via TestFlight or direct download
  - [ ] Test on iPhone (various sizes if possible)
  - [ ] Test on iPad (if supported)

- [ ] **Device testing checklist**
  - [ ] App launches without crashing
  - [ ] All screens load correctly
  - [ ] Navigation works smoothly
  - [ ] Buttons and interactions responsive
  - [ ] Camera permission request appears
  - [ ] Microphone permission request appears
  - [ ] Camera/proctoring features work
  - [ ] Photos/media access works (if applicable)
  - [ ] Notifications work (if implemented)
  - [ ] Face ID/Touch ID works (if implemented)
  - [ ] Deep links work (proficiencyai://...)
  - [ ] No memory leaks (test for 15+ minutes)

- [ ] **Performance testing**
  - [ ] App launches in < 3 seconds
  - [ ] Smooth scrolling (60 fps)
  - [ ] No lag or freezing
  - [ ] Battery usage is reasonable
  - [ ] Network requests complete quickly

- [ ] **Landscape orientation** (if supported)
  - [ ] UI adapts correctly
  - [ ] No content cut off
  - [ ] Interactions still work

### Android Testing

- [ ] **Install on Android device**
  - [ ] Build with `--profile development` or `--profile preview`
  - [ ] Install APK or AAB file
  - [ ] Test on various screen sizes
  - [ ] Test on various Android versions (8.0+)

- [ ] **Device testing checklist**
  - [ ] App launches without crashing
  - [ ] All screens load correctly
  - [ ] Navigation works smoothly
  - [ ] Buttons and interactions responsive
  - [ ] Camera permission request appears
  - [ ] Microphone permission request appears
  - [ ] Camera/proctoring features work
  - [ ] Storage access works (if applicable)
  - [ ] Notifications work (if implemented)
  - [ ] Biometric auth works (if implemented)
  - [ ] Deep links work (proficiencyai://...)
  - [ ] Back button behaves correctly
  - [ ] No ANRs (Application Not Responding)

- [ ] **Adaptive icon testing**
  - [ ] Test on Pixel Launcher (circle mask)
  - [ ] Test on Samsung Launcher (squircle mask)
  - [ ] Test on other launchers if available
  - [ ] Icon animates correctly (parallax effect)

- [ ] **Performance testing**
  - [ ] App launches in < 3 seconds
  - [ ] Smooth scrolling (60 fps)
  - [ ] No lag or freezing
  - [ ] Battery usage is reasonable
  - [ ] Network requests complete quickly

### Cross-Platform Testing

- [ ] **Feature parity**
  - [ ] All features work on both platforms
  - [ ] No platform-specific bugs
  - [ ] UI/UX consistent across platforms

- [ ] **Network conditions**
  - [ ] Test with WiFi
  - [ ] Test with cellular (3G, 4G, 5G)
  - [ ] Test with poor connection
  - [ ] Test offline mode (airplane mode)
  - [ ] Test reconnection after offline

### Beta Tester Feedback

- [ ] **Recruit beta testers** (5-10 people minimum)
  - [ ] Mix of iOS and Android users
  - [ ] Various device types and OS versions
  - [ ] Different network conditions

- [ ] **Collect feedback**
  - [ ] Create feedback form or channel
  - [ ] Ask specific questions:
    - Any crashes?
    - Any confusing features?
    - Any performance issues?
    - Any bugs found?
  - [ ] Monitor crash reports in EAS dashboard

- [ ] **Fix critical issues** before production submission

---

## App Store Listing Preparation

### Apple App Store Connect

- [ ] **Create app listing**
  - [ ] Log in to [App Store Connect](https://appstoreconnect.apple.com)
  - [ ] Navigate to "My Apps"
  - [ ] Create new app or select existing
  - [ ] Bundle ID: `com.proficiencyai.mobile`
  - [ ] SKU: `proficiencyai-mobile-ios`

- [ ] **App information**
  - [ ] Name: ProficiencyAI
  - [ ] Subtitle: AI-Powered Assessment Platform
  - [ ] Privacy Policy URL: https://proficiencyai.com/privacy
  - [ ] Category: Education (primary), Productivity (secondary)

- [ ] **Pricing and availability**
  - [ ] Price: Free
  - [ ] Available in all territories (or select specific)

- [ ] **App Privacy**
  - [ ] Complete privacy questionnaire
  - [ ] Reference `app-store-metadata.md` for data types
  - [ ] Submit privacy nutrition label

- [ ] **Version information** (for v1.0.0)
  - [ ] Screenshots prepared (see below)
  - [ ] Description: Copy from `app-store-metadata.md`
  - [ ] Keywords: education,exam,quiz,test,ai,proctoring...
  - [ ] Support URL: https://help.proficiencyai.com
  - [ ] Marketing URL: https://proficiencyai.com
  - [ ] Promotional text (170 chars)
  - [ ] What's New (release notes)

- [ ] **Screenshots** (required sizes)
  - [ ] iPhone 6.7" (1290×2796) - Min 3, max 10
  - [ ] iPhone 6.5" (1242×2688) - Min 3, max 10
  - [ ] iPad Pro 12.9" (2048×2732) - Min 3, max 10
  - [ ] All screenshots show actual app content
  - [ ] No placeholder or mockup images
  - [ ] Captions are clear and readable

- [ ] **App preview videos** (optional but recommended)
  - [ ] Duration: 15-30 seconds
  - [ ] Portrait orientation for iPhone
  - [ ] Shows key features and value proposition

- [ ] **App Review Information**
  - [ ] First name, last name, phone, email
  - [ ] Demo account credentials (if login required)
    - Username: testuser@proficiencyai.com
    - Password: [Create secure test password]
  - [ ] Notes for reviewer:
    ```
    Demo Account:
    Email: testuser@proficiencyai.com
    Password: TestPassword123!
    
    Camera/Microphone:
    The app requires camera and microphone permissions
    for proctoring features during exams. Please allow
    these permissions when prompted.
    
    Test Exam:
    After logging in, tap "Available Exams" and select
    "Demo Exam" to test the core functionality.
    ```

- [ ] **Build for Review**
  - [ ] Select TestFlight build
  - [ ] Answer Export Compliance:
    - Uses encryption: Yes (HTTPS)
    - Exempt from regulations: Yes
  - [ ] Set to "Automatic release" or "Manual release"

### Google Play Console

- [ ] **Create app listing**
  - [ ] Log in to [Google Play Console](https://play.google.com/console)
  - [ ] Create app or select existing
  - [ ] Package name: `com.proficiencyai.mobile`

- [ ] **Main store listing**
  - [ ] App name: ProficiencyAI
  - [ ] Short description (80 chars): From `app-store-metadata.md`
  - [ ] Full description (4000 chars): From `app-store-metadata.md`
  - [ ] App icon: 512×512 PNG
  - [ ] Feature graphic: 1024×500 PNG/JPEG
  - [ ] Screenshots:
    - Phone: Min 2 (1080×1920 recommended)
    - 7" Tablet: Min 1 (1536×2048 recommended)
    - 10" Tablet: Min 1 (2048×1536 recommended)
  - [ ] Category: Education
  - [ ] Tags: Education, Productivity
  - [ ] Contact email: support@proficiencyai.com
  - [ ] Privacy policy: https://proficiencyai.com/privacy
  - [ ] Website: https://proficiencyai.com

- [ ] **Store settings**
  - [ ] App category: Education
  - [ ] Tags selected (relevant to education/assessment)

- [ ] **App content** (complete all questionnaires)
  - [ ] Privacy policy submitted
  - [ ] App access: Login required, demo credentials provided
  - [ ] Ads declaration: No ads
  - [ ] Content rating: Complete IARC questionnaire
  - [ ] Target audience: 13+, Educators, Adults
  - [ ] News apps: Not a news app
  - [ ] Data safety: Complete data collection form
    - Collects email, name, photos
    - Data encrypted in transit
    - Users can delete data
  - [ ] Government apps: No

- [ ] **Pricing & distribution**
  - [ ] Free
  - [ ] Countries: Select all or specific
  - [ ] Content guidelines: Accepted
  - [ ] US export laws: Accepted

- [ ] **Release notes** prepared
  ```
  Initial release of ProficiencyAI!
  
  ✨ Features:
  • AI-powered question generation
  • Computer Adaptive Testing (CAT)
  • Live proctoring with camera monitoring
  • Comprehensive analytics and reports
  • Study aids and learning recommendations
  • Accessibility features (screen reader, text size)
  
  📱 Perfect for:
  • Students taking exams
  • Teachers creating assessments
  • Educational institutions
  
  📧 Support: support@proficiencyai.com
  ```

### Assets Checklist

**iOS**:
- [ ] App icon: 1024×1024 PNG (no transparency)
- [ ] iPhone screenshots: 6.7" and 6.5" displays
- [ ] iPad screenshots: 12.9" display
- [ ] App preview video: Optional, 15-30s

**Android**:
- [ ] App icon: 512×512 PNG (32-bit)
- [ ] Feature graphic: 1024×500 PNG/JPEG
- [ ] Phone screenshots: Min 2 (1080×1920)
- [ ] Tablet screenshots: 7" and 10"
- [ ] Promo video: Optional, YouTube URL

---

## Build Execution

### Pre-Build Commands

- [ ] **Clean install dependencies**
  ```bash
  cd mobile
  rm -rf node_modules
  npm install
  ```

- [ ] **Verify Expo configuration**
  ```bash
  npx expo-doctor
  ```
  Fix any issues reported.

- [ ] **Authenticate with EAS**
  ```bash
  eas login
  ```
  Ensure you're logged in with correct account.

- [ ] **Verify project info**
  ```bash
  eas project:info
  ```
  Check project ID, owner, and name.

### iOS Production Build

```bash
# Build for iOS App Store
eas build --platform ios --profile production

# Monitor build progress
# Check EAS dashboard or wait for email
```

- [ ] Build started successfully
- [ ] Build completed without errors
- [ ] Build artifact (.ipa) available for download
- [ ] Build size is reasonable (< 200MB)

**If build fails:**
1. Check build logs in EAS dashboard
2. Fix errors in code or configuration
3. Retry build

### Android Production Build

```bash
# Build for Google Play Store
eas build --platform android --profile production

# Monitor build progress
# Check EAS dashboard or wait for email
```

- [ ] Build started successfully
- [ ] Build completed without errors
- [ ] Build artifact (.aab) available for download
- [ ] Build size is reasonable (< 150MB)

**If build fails:**
1. Check build logs in EAS dashboard
2. Fix errors in code or configuration
3. Retry build

### Build Both Platforms

```bash
# Build both iOS and Android simultaneously
eas build --platform all --profile production
```

- [ ] iOS build successful
- [ ] Android build successful
- [ ] Both artifacts ready for submission

---

## Post-Build Validation

### Download Build Artifacts

- [ ] **iOS**: Download .ipa file
  ```bash
  # From EAS CLI
  eas build:list
  # Note the build ID, then:
  eas build:download --id [BUILD_ID]
  ```

- [ ] **Android**: Download .aab file
  ```bash
  # From EAS CLI
  eas build:list
  # Note the build ID, then:
  eas build:download --id [BUILD_ID]
  ```

### iOS Validation

- [ ] **Install on TestFlight**
  ```bash
  eas submit --platform ios
  # Or upload .ipa via Transporter app
  ```

- [ ] **Wait for processing** (5-15 minutes)
- [ ] **Install from TestFlight**
  - [ ] Download TestFlight app
  - [ ] Accept internal tester invitation
  - [ ] Install build

- [ ] **Test installed build**
  - [ ] App launches successfully
  - [ ] No crashes or freezes
  - [ ] All features work as expected
  - [ ] Camera/microphone permissions work
  - [ ] UI looks correct on device
  - [ ] Performance is acceptable

### Android Validation

- [ ] **Install on device**
  ```bash
  # Convert .aab to .apk for local testing (using bundletool)
  bundletool build-apks --bundle=app.aab --output=app.apks
  bundletool install-apks --apks=app.apks
  ```
  Or submit to internal testing track:
  ```bash
  eas submit --platform android --track internal
  ```

- [ ] **Test installed build**
  - [ ] App launches successfully
  - [ ] No crashes or ANRs
  - [ ] All features work as expected
  - [ ] Camera/microphone permissions work
  - [ ] Adaptive icon displays correctly
  - [ ] UI looks correct on device
  - [ ] Performance is acceptable

### Final Checks

- [ ] **Version numbers match**
  - [ ] `app.json` version matches listing
  - [ ] iOS build number incremented (if updating)
  - [ ] Android version code incremented (if updating)

- [ ] **Build settings correct**
  - [ ] Production API URLs in build
  - [ ] No development/debug flags enabled
  - [ ] Proper code signing applied

- [ ] **No console warnings** in build logs
- [ ] **File sizes acceptable**
  - iOS: Typically 50-200MB
  - Android: Typically 30-150MB

---

## Submission Checklist

### iOS Submission to App Store

- [ ] **Build uploaded to TestFlight**
  - [ ] Build shows in App Store Connect
  - [ ] Build status: "Ready to Submit"
  - [ ] Export compliance answered

- [ ] **App listing complete**
  - [ ] All required fields filled
  - [ ] Screenshots uploaded (all required sizes)
  - [ ] Description, keywords, URLs provided
  - [ ] Privacy policy reviewed and accurate
  - [ ] Demo account credentials provided
  - [ ] Notes for reviewer added

- [ ] **Select build for review**
  - [ ] Click "+ Build" button
  - [ ] Select TestFlight build
  - [ ] Confirm version number

- [ ] **Submit for review**
  - [ ] Click "Add for Review"
  - [ ] Answer questionnaire:
    - Advertising Identifier: No (unless using ads)
    - Content Rights: Yes
    - Export Compliance: Yes, exempt
  - [ ] Click "Submit for Review"
  - [ ] Confirmation email received

- [ ] **Review status**: "Waiting for Review"

### Android Submission to Google Play

- [ ] **Build uploaded to Play Console**
  - [ ] .aab file uploaded to production track
  - [ ] Or submitted via `eas submit --platform android`
  - [ ] Build shows in "Release" tab

- [ ] **App listing complete**
  - [ ] Main store listing filled out
  - [ ] Screenshots uploaded (all required sizes)
  - [ ] Feature graphic uploaded
  - [ ] Privacy policy, contact info provided
  - [ ] All app content questionnaires completed
  - [ ] Content rating received (Everyone)
  - [ ] Data safety form submitted

- [ ] **Countries/regions selected**
  - [ ] All countries or specific markets chosen
  - [ ] Pricing set (Free)

- [ ] **Release notes added**
  - [ ] What's new in this version
  - [ ] Clear and concise
  - [ ] Highlights key features

- [ ] **Rollout strategy chosen**
  - [ ] Staged rollout (5%, 10%, 25%, 50%, 100%)
  - [ ] Or full rollout (100%)

- [ ] **Submit for review**
  - [ ] Click "Review release"
  - [ ] Verify all details
  - [ ] Click "Start rollout to Production"
  - [ ] Confirmation screen shown

- [ ] **Review status**: "Under review"

---

## Post-Submission Monitoring

### iOS Monitoring

- [ ] **Check review status daily**
  - [ ] Log in to App Store Connect
  - [ ] Check "My Apps" → ProficiencyAI → "App Store" tab
  - [ ] Monitor status changes:
    - Waiting for Review
    - In Review
    - Pending Developer Release
    - Ready for Sale

- [ ] **Respond to rejections** (if any)
  - [ ] Read rejection reason carefully
  - [ ] Fix issues in code/listing
  - [ ] Respond in Resolution Center
  - [ ] Resubmit with fixes

- [ ] **Monitor after approval**
  - [ ] **Crash reports**: Check Xcode Organizer or App Store Connect
  - [ ] **Reviews**: Respond within 24-48 hours
  - [ ] **Analytics**: Track downloads, usage, retention
  - [ ] **Revenue**: Monitor subscriptions (if applicable)

### Android Monitoring

- [ ] **Check review status daily**
  - [ ] Log in to Google Play Console
  - [ ] Check "Release" → "Production"
  - [ ] Monitor status:
    - Under review
    - Approved
    - Rejected

- [ ] **Respond to rejections** (if any)
  - [ ] Read rejection email carefully
  - [ ] Fix issues in code/listing
  - [ ] Resubmit new release

- [ ] **Monitor after approval**
  - [ ] **Crashes & ANRs**: Check "Quality" → "Crashes & ANRs"
  - [ ] **Reviews**: Respond to negative reviews
  - [ ] **Statistics**: Track installs, uninstalls, ratings
  - [ ] **Pre-launch reports**: Review automated testing results

### Key Metrics to Track

**First 24 Hours**:
- [ ] Crash rate < 1%
- [ ] 0 critical bugs reported
- [ ] Average rating > 4.0 stars
- [ ] No major user complaints

**First Week**:
- [ ] Crash rate < 0.5%
- [ ] User retention > 40% (day 1)
- [ ] Positive reviews outnumber negative 3:1
- [ ] Download trend is stable or growing

**First Month**:
- [ ] Crash rate < 0.1%
- [ ] User retention > 20% (day 7)
- [ ] Average rating > 4.5 stars
- [ ] Active user growth

### Crash Report Response

If crash rate > 1%:
1. [ ] Identify top crashes in dashboards
2. [ ] Reproduce crashes locally
3. [ ] Fix crashes in code
4. [ ] Build new version
5. [ ] Submit hotfix update ASAP
6. [ ] Monitor crash rate improvement

### Review Response

For negative reviews:
1. [ ] Respond within 24 hours
2. [ ] Acknowledge issue
3. [ ] Offer solution or timeline for fix
4. [ ] Thank user for feedback
5. [ ] Follow up when issue is fixed

Example:
```
Thank you for your feedback! We're sorry to hear about
the issue with [specific problem]. Our team is actively
working on a fix and will release an update within
[timeframe]. Please contact support@proficiencyai.com
if you need immediate assistance.
```

### Update Planning

- [ ] **Gather feedback** from users and analytics
- [ ] **Prioritize fixes** (critical bugs first)
- [ ] **Plan feature updates** (based on user requests)
- [ ] **Schedule regular updates** (every 2-4 weeks ideal)
- [ ] **Communicate updates** in release notes and to users

---

## Emergency Procedures

### Critical Bug Found After Release

1. [ ] **Assess severity**
   - [ ] Does it crash the app?
   - [ ] Does it affect core functionality?
   - [ ] How many users are affected?

2. [ ] **Immediate actions**
   - [ ] Document the bug (steps to reproduce)
   - [ ] Create hotfix branch
   - [ ] Fix bug and test thoroughly
   - [ ] Build new version

3. [ ] **iOS Emergency Submission**
   - [ ] Submit new build to TestFlight
   - [ ] Update version number (e.g., 1.0.0 → 1.0.1)
   - [ ] Request expedited review:
     - App Store Connect → Version → "Request Expedited Review"
     - Explain critical nature and user impact
   - [ ] Submit for review

4. [ ] **Android Emergency Update**
   - [ ] Submit new build to production
   - [ ] Use staged rollout (5% initially)
   - [ ] Monitor for 2-4 hours
   - [ ] Increase rollout if stable (25% → 50% → 100%)

5. [ ] **User communication**
   - [ ] Post update on social media
   - [ ] Email affected users (if identifiable)
   - [ ] Update support pages

### Rollback (Android Only)

If new version causes issues:
1. [ ] Go to Google Play Console
2. [ ] Navigate to Release → Production
3. [ ] Click "Halt rollout" (if staged rollout)
4. [ ] Users on old version stay on old version
5. [ ] Users on new version: Submit hotfix

Note: iOS does not support rollback. Must submit new version.

---

## Version Update Checklist

When releasing a new version (e.g., v1.0.0 → v1.1.0):

- [ ] **Update version in app.json**
  ```json
  "version": "1.1.0"
  ```

- [ ] **iOS: Increment build number**
  ```json
  "ios": {
    "buildNumber": "2"
  }
  ```

- [ ] **Android: Increment version code**
  ```json
  "android": {
    "versionCode": 2
  }
  ```

- [ ] **Update release notes** in:
  - [ ] App Store Connect (What's New)
  - [ ] Play Console (Release notes)
  - [ ] CHANGELOG.md (if you have one)

- [ ] **Repeat build process**
  - [ ] Build → Test → Submit → Monitor

---

## Automation Tips

### Continuous Integration (CI)

Set up CI/CD for automatic builds:

```yaml
# Example: GitHub Actions workflow
name: EAS Build
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install -g eas-cli
      - run: eas build --platform all --non-interactive --no-wait
```

### Automated Submission

Use EAS Submit in CI:

```bash
# Submit iOS build automatically
eas submit --platform ios --latest --non-interactive

# Submit Android build automatically
eas submit --platform android --latest --track production --non-interactive
```

### Scheduled Builds

Build and submit on a schedule (e.g., every Friday):

```bash
# Cron job or CI schedule
0 9 * * 5 cd mobile && eas build --platform all --profile production && eas submit --platform all --latest
```

---

## Support Resources

### Official Documentation
- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- EAS Submit: https://docs.expo.dev/submit/introduction/
- Apple App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play Policy: https://play.google.com/about/developer-content-policy/

### Community Support
- Expo Discord: https://chat.expo.dev
- Expo Forums: https://forums.expo.dev
- Stack Overflow: Tag questions with `expo`, `eas`, `react-native`

### Tools
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console
- EAS Dashboard: https://expo.dev/accounts/[your-account]/projects

---

## Final Pre-Submission Checklist

Before clicking "Submit for Review":

- [ ] App works perfectly on physical devices (iOS and Android)
- [ ] No crashes or critical bugs
- [ ] All permissions have clear descriptions
- [ ] Privacy policy is accurate and accessible
- [ ] Demo account credentials work
- [ ] Screenshots show actual app (not mockups)
- [ ] Description is clear and accurate
- [ ] App icon looks professional
- [ ] Version numbers are correct
- [ ] Beta testers gave positive feedback
- [ ] Team has reviewed and approved
- [ ] Support email is monitored
- [ ] Ready to respond to reviews within 24 hours
- [ ] Update plan in place for post-launch fixes

✅ **Ready to submit!**

---

**Document Version**: 1.0.0  
**Last Updated**: November 2025  
**Maintained By**: ProficiencyAI Development Team
