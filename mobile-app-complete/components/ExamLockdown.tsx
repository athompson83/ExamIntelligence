import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, AppState } from 'react-native';
import { Button, Card, Badge, ProgressBar } from 'react-native-paper';
import { Camera, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ScreenCapture from 'expo-screen-capture';
import * as MediaLibrary from 'expo-media-library';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ExamLockdownProps {
  isProctored: boolean;
  onLockdownReady: (ready: boolean) => void;
  onViolation: (violation: string) => void;
  examTitle: string;
}

interface LockdownState {
  cameraPermission: boolean;
  micPermission: boolean;
  screenRecordingBlocked: boolean;
  appSwitches: number;
  violations: string[];
}

export const ExamLockdown: React.FC<ExamLockdownProps> = ({
  isProctored,
  onLockdownReady,
  onViolation,
  examTitle
}) => {
  const [lockdownState, setLockdownState] = useState<LockdownState>({
    cameraPermission: false,
    micPermission: false,
    screenRecordingBlocked: false,
    appSwitches: 0,
    violations: []
  });

  const [cameraRef, setCameraRef] = useState<Camera | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Request camera permissions
  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status === 'granted') {
        setLockdownState(prev => ({
          ...prev,
          cameraPermission: true
        }));
      } else {
        onViolation('Camera permission denied');
      }
    } catch (error) {
      onViolation('Camera permission error');
    }
  };

  // Request microphone permissions
  const requestMicPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        setLockdownState(prev => ({
          ...prev,
          micPermission: true
        }));
      } else {
        onViolation('Microphone permission denied');
      }
    } catch (error) {
      onViolation('Microphone permission error');
    }
  };

  // Block screen recording
  const blockScreenRecording = async () => {
    try {
      await ScreenCapture.preventScreenCaptureAsync();
      setLockdownState(prev => ({
        ...prev,
        screenRecordingBlocked: true
      }));
    } catch (error) {
      onViolation('Screen recording blocking failed');
    }
  };

  // Monitor app state changes
  useEffect(() => {
    if (!isProctored) return;

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setLockdownState(prev => {
          const newAppSwitches = prev.appSwitches + 1;
          const violation = `App switched to background (${newAppSwitches} times)`;
          onViolation(violation);
          return { 
            ...prev, 
            appSwitches: newAppSwitches,
            violations: [...prev.violations, violation]
          };
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isProctored, onViolation]);

  // Setup initial permissions
  useEffect(() => {
    if (isProctored) {
      requestCameraPermission();
      requestMicPermission();
      blockScreenRecording();
    }
  }, [isProctored]);

  // Check if lockdown is ready
  useEffect(() => {
    if (!isProctored) {
      onLockdownReady(true);
      return;
    }

    const ready = lockdownState.cameraPermission && 
                  lockdownState.micPermission && 
                  lockdownState.screenRecordingBlocked;
    
    onLockdownReady(ready);
  }, [isProctored, lockdownState, onLockdownReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isProctored) {
        ScreenCapture.allowScreenCaptureAsync().catch(console.error);
      }
    };
  }, [isProctored]);

  if (!isProctored) {
    return (
      <Card style={styles.standardCard}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Icon name="security" size={24} color="#3b82f6" />
            <Text style={styles.standardTitle}>Standard Exam Mode</Text>
          </View>
          <Text style={styles.standardText}>
            This exam does not require proctoring. You may begin when ready.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  const allPermissionsGranted = lockdownState.cameraPermission && 
                               lockdownState.micPermission && 
                               lockdownState.screenRecordingBlocked;

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Icon name="security" size={24} color="#dc2626" />
          <Text style={styles.title}>Proctored Exam Setup</Text>
        </View>

        <View style={styles.warningContainer}>
          <Icon name="warning" size={20} color="#f59e0b" />
          <Text style={styles.warningText}>
            This exam requires proctoring. Please complete all setup steps below.
          </Text>
        </View>

        <View style={styles.permissionsList}>
          {/* Camera Permission */}
          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Icon name="videocam" size={20} color="#6b7280" />
              <Text style={styles.permissionLabel}>Camera Access</Text>
            </View>
            <View style={styles.permissionActions}>
              <Badge style={[
                styles.badge,
                lockdownState.cameraPermission ? styles.badgeSuccess : styles.badgeSecondary
              ]}>
                {lockdownState.cameraPermission ? 'Granted' : 'Required'}
              </Badge>
              {!lockdownState.cameraPermission && (
                <Button 
                  mode="contained" 
                  compact 
                  onPress={requestCameraPermission}
                  style={styles.actionButton}
                >
                  Grant
                </Button>
              )}
            </View>
          </View>

          {/* Microphone Permission */}
          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Icon name="mic" size={20} color="#6b7280" />
              <Text style={styles.permissionLabel}>Microphone Access</Text>
            </View>
            <View style={styles.permissionActions}>
              <Badge style={[
                styles.badge,
                lockdownState.micPermission ? styles.badgeSuccess : styles.badgeSecondary
              ]}>
                {lockdownState.micPermission ? 'Granted' : 'Required'}
              </Badge>
              {!lockdownState.micPermission && (
                <Button 
                  mode="contained" 
                  compact 
                  onPress={requestMicPermission}
                  style={styles.actionButton}
                >
                  Grant
                </Button>
              )}
            </View>
          </View>

          {/* Screen Recording Block */}
          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Icon name="screen-lock-portrait" size={20} color="#6b7280" />
              <Text style={styles.permissionLabel}>Screen Recording Blocked</Text>
            </View>
            <View style={styles.permissionActions}>
              <Badge style={[
                styles.badge,
                lockdownState.screenRecordingBlocked ? styles.badgeSuccess : styles.badgeSecondary
              ]}>
                {lockdownState.screenRecordingBlocked ? 'Active' : 'Required'}
              </Badge>
              {!lockdownState.screenRecordingBlocked && (
                <Button 
                  mode="contained" 
                  compact 
                  onPress={blockScreenRecording}
                  style={styles.actionButton}
                >
                  Enable
                </Button>
              )}
            </View>
          </View>
        </View>

        {/* Camera Preview */}
        {lockdownState.cameraPermission && (
          <View style={styles.cameraContainer}>
            <Text style={styles.cameraLabel}>Camera Preview</Text>
            <Camera
              ref={setCameraRef}
              style={styles.camera}
              type={CameraType.front}
              ratio="16:9"
            />
          </View>
        )}

        {/* Violations Counter */}
        {lockdownState.appSwitches > 0 && (
          <View style={styles.violationsContainer}>
            <Icon name="warning" size={20} color="#dc2626" />
            <Text style={styles.violationsText}>
              Security Violations: {lockdownState.appSwitches}
            </Text>
          </View>
        )}

        {/* Ready Status */}
        {allPermissionsGranted && (
          <View style={styles.readyContainer}>
            <Icon name="lock" size={20} color="#16a34a" />
            <Text style={styles.readyText}>
              Exam Environment Secured
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: '#ffffff',
  },
  standardCard: {
    margin: 16,
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#111827',
  },
  standardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1e40af',
  },
  standardText: {
    fontSize: 14,
    color: '#1e40af',
    marginTop: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
  },
  permissionsList: {
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    color: '#374151',
  },
  permissionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    marginRight: 8,
  },
  badgeSuccess: {
    backgroundColor: '#dcfce7',
  },
  badgeSecondary: {
    backgroundColor: '#f3f4f6',
  },
  actionButton: {
    minWidth: 60,
  },
  cameraContainer: {
    marginBottom: 16,
  },
  cameraLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  camera: {
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  violationsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  violationsText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
    marginLeft: 8,
  },
  readyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
  },
  readyText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ExamLockdown;