# ProficiencyAI Mobile Apps

## Overview

This directory contains the React Native mobile applications for ProficiencyAI, providing native iOS and Android access to the educational assessment platform.

## Applications

### Student App
- **Purpose**: Exam taking with offline capability
- **Features**:
  - Secure exam interface with proctoring
  - Offline exam download and completion
  - Progress synchronization
  - Push notifications for assignments
  - Study aids access

### Instructor App  
- **Purpose**: Teaching and monitoring interface
- **Features**:
  - Live exam monitoring
  - Quick grading interface
  - Analytics dashboard
  - Notification management
  - Real-time alerts

## Technical Architecture

### Framework
- **React Native**: Cross-platform development
- **TypeScript**: Type safety and development experience
- **Expo**: Development and deployment tooling

### Integration
- **API**: Existing REST API endpoints
- **Authentication**: Replit Auth integration via WebView
- **Real-time**: WebSocket integration for live features
- **Storage**: SQLite for offline data
- **Push Notifications**: Expo Push Notifications

### Security Features
- **Certificate Pinning**: API security
- **Biometric Authentication**: Device security
- **Encrypted Storage**: Local data protection
- **Screen Recording Detection**: Anti-cheating measures

## Development Status

### Phase 1: Foundation (Planned)
- [ ] Project setup with Expo
- [ ] Authentication flow implementation
- [ ] Basic navigation structure
- [ ] API integration layer

### Phase 2: Core Features (Planned)
- [ ] Student exam interface
- [ ] Instructor monitoring dashboard
- [ ] Offline exam capability
- [ ] Push notification system

### Phase 3: Advanced Features (Planned)
- [ ] Proctoring integration (camera/microphone)
- [ ] Advanced security measures
- [ ] Performance optimization
- [ ] Store deployment

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

## API Integration

The mobile apps will use the existing REST API with the following key endpoints:
- Authentication: `/api/auth/*`
- Exams: `/api/quizzes/*`
- Submissions: `/api/attempts/*`
- Analytics: `/api/analytics/*`
- Notifications: `/api/notifications/*`

## Security Considerations

1. **Network Security**: HTTPS only, certificate pinning
2. **Data Protection**: Encrypted local storage
3. **Anti-Cheating**: Screen recording detection, app switching detection
4. **Biometric Auth**: Device-level security for sensitive operations
5. **Session Management**: Secure token handling and renewal

## Deployment Strategy

### Development
- Expo Go for development testing
- Internal TestFlight/Firebase App Distribution

### Production
- App Store Connect (iOS)
- Google Play Console (Android)
- Enterprise distribution options for institutions