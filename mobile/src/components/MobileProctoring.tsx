import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
  AppState,
  AppStateStatus,
  StatusBar,
  BackHandler,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as KeepAwake from 'expo-keep-awake';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Button, Surface, Card, Title, Paragraph, Badge, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface MobileProctoringProps {
  examId: string;
  onViolation: (violation: ProctoringViolation) => void;
  onStatusChange: (status: MobileProctoringStatus) => void;
  settings: {
    requireCamera: boolean;
    requireMicrophone: boolean;
    lockOrientation: boolean;
    preventBackgroundMode: boolean;
    allowScreenshots: boolean;
    monitorAudio: boolean;
    alertOnViolation: boolean;
  };
}

interface ProctoringViolation {
  id: string;
  type: 'camera_blocked' | 'microphone_blocked' | 'orientation_changed' | 'app_backgrounded' | 'screenshot_detected' | 'audio_anomaly' | 'device_disconnect' | 'suspicious_activity';
  timestamp: Date;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  deviceInfo: {
    platform: string;
    deviceType: string;
    screenSize: string;
    batteryLevel?: number;
  };
}

interface MobileProctoringStatus {
  isInitialized: boolean;
  cameraActive: boolean;
  microphoneActive: boolean;
  orientationLocked: boolean;
  screenKeptAwake: boolean;
  violationCount: number;
  batteryLevel: number;
  deviceStable: boolean;
}

export const MobileProctoring: React.FC<MobileProctoringProps> = ({
  examId,
  onViolation,
  onStatusChange,
  settings
}) => {
  // State management
  const [status, setStatus] = useState<MobileProctoringStatus>({
    isInitialized: false,
    cameraActive: false,
    microphoneActive: false,
    orientationLocked: false,
    screenKeptAwake: false,
    violationCount: 0,
    batteryLevel: 100,
    deviceStable: true
  });

  const [cameraPermission, setCameraPermission] = useState<boolean>(false);
  const [audioPermission, setAudioPermission] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Refs
  const cameraRef = useRef<Camera>(null);
  const audioRecordingRef = useRef<Audio.Recording | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const violationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Device info
  const deviceInfo = {
    platform: Platform.OS,
    deviceType: Device.deviceType ? Device.DeviceType[Device.deviceType] : 'Unknown',
    screenSize: `${Dimensions.get('window').width}x${Dimensions.get('window').height}`,
    batteryLevel: status.batteryLevel
  };

  // Generate violation
  const generateViolation = useCallback((
    type: ProctoringViolation['type'],
    description: string,
    severity: ProctoringViolation['severity'] = 'medium'
  ) => {
    const violation: ProctoringViolation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date(),
      description,
      severity,
      deviceInfo
    };

    setViolations(prev => [...prev, violation]);
    setStatus(prev => ({
      ...prev,
      violationCount: prev.violationCount + 1,
      deviceStable: severity !== 'critical'
    }));

    onViolation(violation);

    // Show alert for high severity violations
    if (settings.alertOnViolation && ['high', 'critical'].includes(severity)) {
      Alert.alert(
        'Proctoring Alert',
        description,
        [{ text: 'OK', style: 'default' }],
        { cancelable: false }
      );
    }

    // Send notification for critical violations
    if (severity === 'critical') {
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Critical Proctoring Violation',
          body: description,
          priority: Notifications.AndroidNotificationPriority.HIGH
        },
        trigger: null
      });
    }
  }, [onViolation, settings.alertOnViolation, deviceInfo]);

  // Request camera permissions
  const requestCameraPermission = useCallback(async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
      
      if (status !== 'granted') {
        generateViolation('camera_blocked', 'Camera permission denied', 'critical');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      generateViolation('camera_blocked', 'Failed to request camera permission', 'critical');
      return false;
    }
  }, [generateViolation]);

  // Request audio permissions
  const requestAudioPermission = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setAudioPermission(status === 'granted');
      
      if (status !== 'granted') {
        generateViolation('microphone_blocked', 'Microphone permission denied', 'critical');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Audio permission error:', error);
      generateViolation('microphone_blocked', 'Failed to request microphone permission', 'critical');
      return false;
    }
  }, [generateViolation]);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    if (!settings.requireCamera) return true;

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return false;

      setStatus(prev => ({ ...prev, cameraActive: true }));
      return true;
    } catch (error) {
      console.error('Camera initialization error:', error);
      generateViolation('camera_blocked', 'Failed to initialize camera', 'high');
      return false;
    }
  }, [settings.requireCamera, requestCameraPermission, generateViolation]);

  // Initialize audio recording
  const initializeAudio = useCallback(async () => {
    if (!settings.requireMicrophone) return true;

    try {
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) return false;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true
      });

      if (settings.monitorAudio) {
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        await recording.startAsync();
        audioRecordingRef.current = recording;
        setIsRecording(true);
      }

      setStatus(prev => ({ ...prev, microphoneActive: true }));
      return true;
    } catch (error) {
      console.error('Audio initialization error:', error);
      generateViolation('microphone_blocked', 'Failed to initialize microphone', 'high');
      return false;
    }
  }, [settings.requireMicrophone, settings.monitorAudio, requestAudioPermission, generateViolation]);

  // Lock screen orientation
  const lockOrientation = useCallback(async () => {
    if (!settings.lockOrientation) return true;

    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setStatus(prev => ({ ...prev, orientationLocked: true }));
      return true;
    } catch (error) {
      console.error('Orientation lock error:', error);
      generateViolation('orientation_changed', 'Failed to lock screen orientation', 'medium');
      return false;
    }
  }, [settings.lockOrientation, generateViolation]);

  // Keep screen awake
  const keepScreenAwake = useCallback(async () => {
    try {
      KeepAwake.activateKeepAwake();
      setStatus(prev => ({ ...prev, screenKeptAwake: true }));
      return true;
    } catch (error) {
      console.error('Keep awake error:', error);
      return false;
    }
  }, []);

  // Monitor app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App became active
        console.log('App became active');
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App went to background
        if (settings.preventBackgroundMode) {
          generateViolation('app_backgrounded', 'App was moved to background during exam', 'high');
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [settings.preventBackgroundMode, generateViolation]);

  // Monitor orientation changes
  useEffect(() => {
    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      if (settings.lockOrientation && event.orientationInfo.orientation !== ScreenOrientation.Orientation.PORTRAIT_UP) {
        generateViolation('orientation_changed', 'Screen orientation changed during exam', 'medium');
      }
    });

    return () => subscription?.remove();
  }, [settings.lockOrientation, generateViolation]);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backAction = () => {
        generateViolation('suspicious_activity', 'Back button pressed during exam', 'high');
        Alert.alert(
          'Exit Exam?',
          'Are you sure you want to exit the exam? This will be recorded as a violation.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() }
          ]
        );
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
  }, [generateViolation]);

  // Main initialization function
  const initializeProctoring = useCallback(async () => {
    try {
      setInitializationError(null);
      
      // Initialize camera
      const cameraSuccess = await initializeCamera();
      if (!cameraSuccess && settings.requireCamera) {
        throw new Error('Camera initialization failed');
      }

      // Initialize audio
      const audioSuccess = await initializeAudio();
      if (!audioSuccess && settings.requireMicrophone) {
        throw new Error('Audio initialization failed');
      }

      // Lock orientation
      await lockOrientation();

      // Keep screen awake
      await keepScreenAwake();

      // Set fullscreen mode
      StatusBar.setHidden(true);

      setStatus(prev => ({ ...prev, isInitialized: true }));

      Alert.alert(
        'Proctoring Initialized',
        'Mobile proctoring is now active. Any violations will be recorded.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Proctoring initialization failed:', error);
      setInitializationError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [initializeCamera, initializeAudio, lockOrientation, keepScreenAwake, settings]);

  // Cleanup function
  const cleanup = useCallback(async () => {
    try {
      // Stop audio recording
      if (audioRecordingRef.current) {
        await audioRecordingRef.current.stopAndUnloadAsync();
        audioRecordingRef.current = null;
        setIsRecording(false);
      }

      // Unlock orientation
      await ScreenOrientation.unlockAsync();

      // Deactivate keep awake
      KeepAwake.deactivateKeepAwake();

      // Show status bar
      StatusBar.setHidden(false);

      // Clear violation timer
      if (violationTimerRef.current) {
        clearTimeout(violationTimerRef.current);
      }

      setStatus(prev => ({ ...prev, isInitialized: false }));
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, []);

  // Update parent component
  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const getSeverityColor = (severity: ProctoringViolation['severity']) => {
    switch (severity) {
      case 'low':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'high':
        return '#F44336';
      case 'critical':
        return '#9C27B0';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusColor = (active: boolean) => {
    return active ? '#4CAF50' : '#F44336';
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Mobile Proctoring</Title>
          <Paragraph style={styles.subtitle}>
            {Device.deviceName} - {Platform.OS.toUpperCase()}
          </Paragraph>

          {/* Camera View */}
          {status.cameraActive && cameraPermission && (
            <View style={styles.cameraContainer}>
              <Camera
                ref={cameraRef}
                style={styles.camera}
                type={CameraType.front}
                ratio="4:3"
              />
              <View style={styles.cameraOverlay}>
                <View style={styles.recordingIndicator}>
                  <MaterialIcons name="videocam" size={16} color="#fff" />
                  <Text style={styles.recordingText}>LIVE</Text>
                </View>
              </View>
            </View>
          )}

          {/* Status Grid */}
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <MaterialIcons 
                name="videocam" 
                size={20} 
                color={getStatusColor(status.cameraActive)} 
              />
              <Text style={styles.statusText}>Camera</Text>
              <Badge style={{ backgroundColor: getStatusColor(status.cameraActive) }}>
                {status.cameraActive ? 'Active' : 'Inactive'}
              </Badge>
            </View>

            <View style={styles.statusItem}>
              <MaterialIcons 
                name="mic" 
                size={20} 
                color={getStatusColor(status.microphoneActive)} 
              />
              <Text style={styles.statusText}>Microphone</Text>
              <Badge style={{ backgroundColor: getStatusColor(status.microphoneActive) }}>
                {status.microphoneActive ? 'Active' : 'Inactive'}
              </Badge>
            </View>

            <View style={styles.statusItem}>
              <MaterialIcons 
                name="screen-lock-rotation" 
                size={20} 
                color={getStatusColor(status.orientationLocked)} 
              />
              <Text style={styles.statusText}>Orientation</Text>
              <Badge style={{ backgroundColor: getStatusColor(status.orientationLocked) }}>
                {status.orientationLocked ? 'Locked' : 'Unlocked'}
              </Badge>
            </View>

            <View style={styles.statusItem}>
              <MaterialIcons 
                name="security" 
                size={20} 
                color={getStatusColor(status.deviceStable)} 
              />
              <Text style={styles.statusText}>Security</Text>
              <Badge style={{ backgroundColor: getStatusColor(status.deviceStable) }}>
                {status.deviceStable ? 'Stable' : 'Alert'}
              </Badge>
            </View>
          </View>

          {/* Violations */}
          {violations.length > 0 && (
            <View style={styles.violationsContainer}>
              <Text style={styles.violationsTitle}>
                Recent Violations ({violations.length})
              </Text>
              {violations.slice(-3).map((violation, index) => (
                <View key={violation.id} style={styles.violationItem}>
                  <Chip
                    style={{ backgroundColor: getSeverityColor(violation.severity) }}
                    textStyle={{ color: '#fff' }}
                  >
                    {violation.severity.toUpperCase()}
                  </Chip>
                  <Text style={styles.violationText}>
                    {violation.description}
                  </Text>
                  <Text style={styles.violationTime}>
                    {violation.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Error Message */}
          {initializationError && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error" size={24} color="#F44336" />
              <Text style={styles.errorText}>{initializationError}</Text>
            </View>
          )}

          {/* Action Button */}
          <View style={styles.actionContainer}>
            <Button
              mode={status.isInitialized ? "outlined" : "contained"}
              onPress={initializeProctoring}
              style={styles.actionButton}
              disabled={status.isInitialized}
            >
              {status.isInitialized ? 'Proctoring Active' : 'Initialize Proctoring'}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  cameraContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  recordingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  violationsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  violationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#856404',
  },
  violationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  violationText: {
    flex: 1,
    fontSize: 14,
  },
  violationTime: {
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: '#721c24',
  },
  actionContainer: {
    marginTop: 16,
  },
  actionButton: {
    paddingVertical: 8,
  },
});

export default MobileProctoring;