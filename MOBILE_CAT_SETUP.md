# Mobile App CAT Exam & Assignment Setup

## Overview

The ProficiencyAI mobile app now includes comprehensive support for:
- **Computer Adaptive Testing (CAT)** with real-time difficulty adjustment
- **Regular Assignment completion** with full proctoring
- **Advanced Screen Sharing & Camera Access** for security
- **Cross-platform compatibility** (iOS and Android)

## Key Features

### ✅ CAT Exam Functionality
- **Adaptive Question Selection**: Questions adjust based on student performance
- **Real-time Proficiency Estimation**: Continuous assessment of student capability
- **Dynamic Completion**: Exam ends when proficiency is established
- **Category-based Testing**: Questions from specific item banks with percentage distribution

### ✅ Advanced Proctoring
- **Camera Monitoring**: Front-facing camera records during exams
- **Screen Capture Prevention**: Blocks screenshots and screen recording
- **App Switching Detection**: Monitors when students leave the exam app
- **Microphone Recording**: Audio monitoring for exam integrity
- **Violation Tracking**: Real-time logging of security violations

### ✅ Assignment Management
- **Assignment List**: View all assigned quizzes and CAT exams
- **Progress Tracking**: Monitor completion status and attempts
- **Due Date Management**: Clear visibility of deadlines
- **Results Dashboard**: Detailed score and performance analytics

## Mobile App Components

### 1. CATExamInterface.tsx
- Complete CAT exam taking interface
- Adaptive question progression
- Real-time proficiency tracking
- Violation monitoring and reporting

### 2. ScreenShareProctoring.tsx  
- Advanced proctoring setup and management
- Device capability detection
- Permission management for camera/microphone
- Screen capture prevention
- App state monitoring

### 3. ExamLockdown.tsx
- Core security enforcement
- Camera and microphone access
- Background app detection
- Security violation logging

## Setup Instructions

### 1. Install Dependencies
```bash
cd mobile-app-complete
npm install
```

### 2. Required Expo Modules
All necessary modules are included in package.json:
- `expo-camera`: Camera access and recording
- `expo-av`: Audio recording capabilities  
- `expo-screen-capture`: Screen recording prevention
- `expo-media-library`: Media access management
- `expo-keep-awake`: Prevent screen sleep during exams
- `expo-device`: Device information and capabilities

### 3. Permissions Setup

#### iOS (ios/Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required for exam proctoring and security monitoring</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone access is required for audio monitoring during proctored exams</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Photo library access is required for exam security features</string>
```

#### Android (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### 4. Start Development Server
```bash
npm start
# or
expo start
```

## API Integration

### Backend Endpoints
The mobile app connects to these API endpoints:

- `POST /api/mobile/cat-exam/:id/start` - Start CAT exam
- `GET /api/cat-sessions/:sessionId/next-question` - Get adaptive question
- `POST /api/cat-sessions/:sessionId/submit-answer` - Submit answer
- `POST /api/cat-sessions/:sessionId/complete` - Complete CAT exam
- `POST /api/mobile/assignment/:id/start` - Start regular assignment
- `POST /api/mobile/session/:sessionId/submit` - Submit assignment
- `GET /api/mobile/dashboard/stats` - Dashboard statistics
- `GET /api/mobile/student/profile` - Student profile data

### Configuration
Update the API_BASE_URL in the mobile app components to match your backend:
```javascript
const API_BASE_URL = 'https://your-backend-domain.replit.dev';
```

## Security Features

### 1. Camera Monitoring
- **Front-facing camera** active during exams
- **Continuous recording** with exam session
- **Real-time violation detection** for unauthorized movements
- **Small overlay display** showing camera feed to student

### 2. Screen Protection
- **Screen capture prevention** blocks screenshots
- **Screen recording blocking** prevents video capture
- **App state monitoring** detects backgrounding
- **Violation logging** tracks security events

### 3. Exam Integrity
- **Time tracking** for each question and overall exam
- **Response validation** ensures proper submission
- **Session management** maintains exam state
- **Automatic submission** on time expiration

## Testing the Mobile App

### 1. Development Testing
```bash
cd mobile-app-complete
npm start
```
- Use Expo Go app on your device
- Scan QR code to load the app
- Test with real device camera and microphone

### 2. Production Build
```bash
# iOS
expo build:ios

# Android  
expo build:android
```

### 3. Feature Testing Checklist
- [ ] CAT exam starts and loads first question
- [ ] Questions adapt based on answers (harder/easier)
- [ ] Camera permission requested and working
- [ ] Microphone permission requested and working
- [ ] Screen capture blocked during exam
- [ ] App switching violations detected
- [ ] Exam completes when proficiency established
- [ ] Results properly submitted and displayed

## Deployment Considerations

### App Store Guidelines
- **Privacy Policy**: Required for camera/microphone access
- **Purpose Limitation**: Clearly explain proctoring use case
- **Data Retention**: Specify how long recordings are kept
- **Student Consent**: Ensure proper consent for monitoring

### Technical Requirements
- **Network Connectivity**: Stable internet for real-time communication
- **Device Performance**: Modern devices for smooth camera/audio processing
- **Storage Space**: Adequate space for temporary recording files
- **Battery Management**: Optimize for extended exam sessions

## Troubleshooting

### Common Issues
1. **Camera not working**: Check permissions in device settings
2. **Screen capture not blocked**: May not work in development mode
3. **API connection failed**: Verify backend URL and authentication
4. **App crashes on exam start**: Check Expo module versions

### Debug Mode
Enable debug logging in the mobile app:
```javascript
console.log('CAT Exam Debug:', {
  sessionId,
  currentQuestion,
  proctoringState
});
```

## Future Enhancements

### Planned Features
- **Biometric Authentication**: Fingerprint/Face ID verification
- **Offline Exam Support**: Download exams for offline completion
- **Advanced Analytics**: Detailed performance insights
- **Multi-language Support**: Interface localization
- **Accessibility Features**: Screen reader and motor impairment support

### Integration Opportunities
- **LMS Integration**: Direct connection to Canvas, Blackboard, etc.
- **Student Information Systems**: Grade passback integration
- **Analytics Platforms**: Learning analytics and insights
- **Identity Providers**: SSO integration with school systems

## Support and Documentation

For technical support or questions about the mobile CAT exam system:
1. Check the troubleshooting section above
2. Review the API documentation in server/routes.ts
3. Test with the development setup first
4. Ensure all required permissions are granted

The mobile app provides a comprehensive, secure platform for adaptive testing and assignment completion with industry-standard proctoring capabilities.