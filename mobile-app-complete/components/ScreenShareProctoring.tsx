import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  AppState,
  Platform,
  Modal,
  TouchableOpacity
} from 'react-native';
import { Button, Card, Badge } from 'react-native-paper';
import { Camera, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ScreenCapture from 'expo-screen-capture';
import * as MediaLibrary from 'expo-media-library';
import * as KeepAwake from 'expo-keep-awake';
import * as Device from 'expo-device';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ScreenShareProctoringProps {
  isEnabled: boolean;
  examId: string;
  onViolation: (violation: any) => void;
  onReady: (ready: boolean) => void;
}

interface ProctoringCapabilities {
  hasCamera: boolean;
  hasMicrophone: boolean;
  canBlockScreenCapture: boolean;
  canDetectScreenShare: boolean;
  canMonitorAppSwitching: boolean;
  supportsBiometrics: boolean;
}

interface ProctoringState {
  cameraPermission: boolean;
  microphonePermission: boolean;
  screenCaptureBlocked: boolean;
  isRecording: boolean;
  violations: any[];
  capabilities: ProctoringCapabilities;
  isSetupComplete: boolean;
}

export const ScreenShareProctoring: React.FC<ScreenShareProctoringProps> = ({
  isEnabled,
  examId,
  onViolation,
  onReady
}) => {
  const [proctoringState, setProctoringState] = useState<ProctoringState>({
    cameraPermission: false,
    microphonePermission: false,
    screenCaptureBlocked: false,
    isRecording: false,
    violations: [],
    capabilities: {
      hasCamera: false,
      hasMicrophone: false,
      canBlockScreenCapture: false,
      canDetectScreenShare: false,
      canMonitorAppSwitching: true,
      supportsBiometrics: false
    },
    isSetupComplete: false
  });
  
  const [showSetupModal, setShowSetupModal] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const recordingRef = useRef<any>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (isEnabled) {
      initializeProctoringCapabilities();
      setShowSetupModal(true);
    } else {
      cleanupProctoring();
    }
  }, [isEnabled]);

  // Monitor app state changes
  useEffect(() => {
    if (!proctoringState.isSetupComplete) return;

    const handleAppStateChange = (nextAppState: string) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App returned from background
        reportViolation('app_return', 'Application returned to foreground', 'medium');
      }
      
      if (nextAppState.match(/inactive|background/)) {
        // App went to background
        reportViolation('app_switch', 'Application moved to background/inactive', 'high');
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [proctoringState.isSetupComplete]);

  const initializeProctoringCapabilities = async () => {
    try {
      const capabilities: ProctoringCapabilities = {
        hasCamera: await Camera.isAvailableAsync(),
        hasMicrophone: true, // Assume microphone is available
        canBlockScreenCapture: Platform.OS === 'ios' || Platform.OS === 'android',
        canDetectScreenShare: Platform.OS === 'ios',
        canMonitorAppSwitching: true,
        supportsBiometrics: Device.deviceType === Device.DeviceType.PHONE
      };

      setProctoringState(prev => ({ ...prev, capabilities }));
    } catch (error) {
      console.error('Error detecting proctoring capabilities:', error);
    }
  };

  const setupProctoring = async () => {
    try {
      let allPermissionsGranted = true;
      const newState = { ...proctoringState };

      // Request camera permissions
      if (proctoringState.capabilities.hasCamera) {
        const cameraPermission = await Camera.requestCameraPermissionsAsync();
        newState.cameraPermission = cameraPermission.status === 'granted';
        if (!newState.cameraPermission) allPermissionsGranted = false;
      }

      // Request microphone permissions
      if (proctoringState.capabilities.hasMicrophone) {
        const micPermission = await Audio.requestPermissionsAsync();
        newState.microphonePermission = micPermission.status === 'granted';
        if (!newState.microphonePermission) allPermissionsGranted = false;
      }

      // Block screen capture
      if (proctoringState.capabilities.canBlockScreenCapture) {
        try {
          await ScreenCapture.preventScreenCaptureAsync();
          newState.screenCaptureBlocked = true;
        } catch (error) {
          console.warn('Could not block screen capture:', error);
          reportViolation('screen_capture_block_failed', 'Failed to block screen capture', 'medium');
        }
      }

      // Keep screen awake
      KeepAwake.activateKeepAwake();

      // Start camera recording if available
      if (newState.cameraPermission && cameraRef.current) {
        try {
          const recording = await cameraRef.current.recordAsync({
            quality: Camera.Constants.VideoQuality['720p'],
            maxDuration: 3600, // 1 hour max
            mute: false
          });
          recordingRef.current = recording;
          newState.isRecording = true;
        } catch (error) {
          console.warn('Could not start camera recording:', error);
        }
      }

      newState.isSetupComplete = allPermissionsGranted;
      setProctoringState(newState);
      
      if (allPermissionsGranted) {
        setShowSetupModal(false);
        onReady(true);
        reportViolation('proctoring_started', 'Proctoring session initialized successfully', 'info');
      } else {
        throw new Error('Not all permissions granted');
      }
    } catch (error) {
      console.error('Proctoring setup failed:', error);
      Alert.alert(
        'Proctoring Setup Failed',
        'All security features must be enabled to take this exam. Please grant the required permissions.',
        [
          { text: 'Retry', onPress: setupProctoring },
          { text: 'Cancel', onPress: () => onReady(false) }
        ]
      );
    }
  };

  const cleanupProctoring = async () => {
    try {
      // Stop camera recording
      if (recordingRef.current) {
        await recordingRef.current.stopAsync();
        recordingRef.current = null;
      }

      // Allow screen capture again
      if (proctoringState.capabilities.canBlockScreenCapture) {
        await ScreenCapture.allowScreenCaptureAsync();
      }

      // Deactivate keep awake
      KeepAwake.deactivateKeepAwake();

      setProctoringState(prev => ({
        ...prev,
        isRecording: false,
        screenCaptureBlocked: false,
        isSetupComplete: false
      }));
    } catch (error) {
      console.error('Error cleaning up proctoring:', error);
    }
  };

  const reportViolation = (type: string, description: string, severity: 'info' | 'low' | 'medium' | 'high') => {
    const violation = {
      id: Date.now().toString(),
      type,
      description,
      severity,
      timestamp: new Date().toISOString(),
      examId,
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version,
        deviceType: Device.deviceType,
        modelName: Device.modelName
      }
    };

    setProctoringState(prev => ({
      ...prev,
      violations: [...prev.violations, violation]
    }));

    onViolation(violation);
  };

  const getStatusColor = (isActive: boolean) => isActive ? '#10b981' : '#ef4444';
  const getStatusIcon = (isActive: boolean) => isActive ? 'check-circle' : 'error';

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* Proctoring Status Indicator */}
      {proctoringState.isSetupComplete && (
        <View style={styles.statusBar}>
          <View style={styles.statusLeft}>
            <Icon name="security" size={16} color="#f59e0b" />
            <Text style={styles.statusText}>Proctored Exam</Text>
          </View>
          <View style={styles.statusRight}>
            <View style={styles.statusItem}>
              <Icon 
                name="videocam" 
                size={14} 
                color={getStatusColor(proctoringState.cameraPermission && proctoringState.isRecording)} 
              />
            </View>
            <View style={styles.statusItem}>
              <Icon 
                name="mic" 
                size={14} 
                color={getStatusColor(proctoringState.microphonePermission)} 
              />
            </View>
            <View style={styles.statusItem}>
              <Icon 
                name="screen-lock-portrait" 
                size={14} 
                color={getStatusColor(proctoringState.screenCaptureBlocked)} 
              />
            </View>
            {proctoringState.violations.length > 0 && (
              <Badge style={styles.violationBadge}>
                {proctoringState.violations.length}
              </Badge>
            )}
          </View>
        </View>
      )}

      {/* Live Camera Preview */}
      {proctoringState.isSetupComplete && proctoringState.cameraPermission && (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={CameraType.front}
          />
          <View style={styles.cameraOverlay}>
            <View style={styles.recordingIndicator}>
              <Icon name="fiber-manual-record" size={12} color="#ef4444" />
              <Text style={styles.recordingText}>REC</Text>
            </View>
          </View>
        </View>
      )}

      {/* Setup Modal */}
      <Modal visible={showSetupModal} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Icon name="security" size={64} color="#3b82f6" />
            <Text style={styles.modalTitle}>Exam Security Setup</Text>
            <Text style={styles.modalText}>
              This exam requires advanced proctoring. We need to enable security features to ensure exam integrity.
            </Text>

            <View style={styles.capabilitiesList}>
              <View style={styles.capabilityItem}>
                <Icon 
                  name={getStatusIcon(proctoringState.capabilities.hasCamera)} 
                  size={24} 
                  color={getStatusColor(proctoringState.capabilities.hasCamera)} 
                />
                <Text style={styles.capabilityText}>Camera Access (Required)</Text>
              </View>
              
              <View style={styles.capabilityItem}>
                <Icon 
                  name={getStatusIcon(proctoringState.capabilities.hasMicrophone)} 
                  size={24} 
                  color={getStatusColor(proctoringState.capabilities.hasMicrophone)} 
                />
                <Text style={styles.capabilityText}>Microphone Access (Required)</Text>
              </View>
              
              <View style={styles.capabilityItem}>
                <Icon 
                  name={getStatusIcon(proctoringState.capabilities.canBlockScreenCapture)} 
                  size={24} 
                  color={getStatusColor(proctoringState.capabilities.canBlockScreenCapture)} 
                />
                <Text style={styles.capabilityText}>Screen Capture Prevention</Text>
              </View>
              
              <View style={styles.capabilityItem}>
                <Icon 
                  name={getStatusIcon(proctoringState.capabilities.canMonitorAppSwitching)} 
                  size={24} 
                  color={getStatusColor(proctoringState.capabilities.canMonitorAppSwitching)} 
                />
                <Text style={styles.capabilityText}>App Switching Detection</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                mode="contained"
                onPress={setupProctoring}
                style={styles.setupButton}
              >
                Enable Security Features
              </Button>
              <Button
                mode="text"
                onPress={() => onReady(false)}
                style={styles.cancelButton}
              >
                Cancel Exam
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 6,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusItem: {
    padding: 2,
  },
  violationBadge: {
    backgroundColor: '#ef4444',
    fontSize: 10,
    minWidth: 20,
    height: 20,
  },
  cameraContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 100,
    height: 130,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recordingText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: '90%',
    width: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  capabilitiesList: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  capabilityText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
    fontWeight: '500',
  },
  modalActions: {
    alignSelf: 'stretch',
  },
  setupButton: {
    marginBottom: 12,
    paddingVertical: 4,
  },
  cancelButton: {
    paddingVertical: 4,
  },
});

export default ScreenShareProctoring;