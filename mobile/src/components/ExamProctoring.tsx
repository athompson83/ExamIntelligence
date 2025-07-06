import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Surface, Button, Portal, Modal } from 'react-native-paper';
import { Camera, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as KeepAwake from 'expo-keep-awake';
import { MaterialIcons } from '@expo/vector-icons';

interface ExamProctoringProps {
  examId: string;
  isActive: boolean;
  onViolation: (violation: string) => void;
  onSecurityEvent: (event: string) => void;
}

export default function ExamProctoring({ 
  examId, 
  isActive, 
  onViolation, 
  onSecurityEvent 
}: ExamProctoringProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.front);
  const [isRecording, setIsRecording] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [showViolationModal, setShowViolationModal] = useState(false);
  
  const cameraRef = useRef<Camera>(null);
  const focusCheckInterval = useRef<NodeJS.Timeout>();
  const orientationListener = useRef<ScreenOrientation.OrientationChangeListener>();

  useEffect(() => {
    if (isActive) {
      initializeProctoring();
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [isActive]);

  const initializeProctoring = async () => {
    try {
      // Request camera permissions
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      
      if (cameraStatus !== 'granted' || audioStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and microphone access are required for exam proctoring.',
          [{ text: 'OK' }]
        );
        setHasPermission(false);
        return;
      }

      setHasPermission(true);

      // Lock screen orientation to portrait
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

      // Keep screen awake during exam
      KeepAwake.activateKeepAwake();

      // Start camera recording
      startCameraRecording();

    } catch (error) {
      console.error('Error initializing proctoring:', error);
      onSecurityEvent('proctoring_initialization_failed');
    }
  };

  const startMonitoring = () => {
    // Monitor app focus
    focusCheckInterval.current = setInterval(() => {
      // In a real implementation, this would check if the app lost focus
      // For now, we'll simulate violation detection
    }, 1000);

    // Listen for orientation changes
    orientationListener.current = ScreenOrientation.addOrientationChangeListener((event) => {
      if (event.orientationInfo.orientation !== ScreenOrientation.Orientation.PORTRAIT_UP) {
        handleViolation('screen_rotation_detected');
      }
    });
  };

  const stopMonitoring = () => {
    if (focusCheckInterval.current) {
      clearInterval(focusCheckInterval.current);
    }

    if (orientationListener.current) {
      ScreenOrientation.removeOrientationChangeListener(orientationListener.current);
    }

    // Unlock screen orientation
    ScreenOrientation.unlockAsync();

    // Allow screen to sleep
    KeepAwake.deactivateKeepAwake();

    // Stop camera recording
    stopCameraRecording();
  };

  const startCameraRecording = async () => {
    try {
      if (cameraRef.current && hasPermission) {
        setIsRecording(true);
        onSecurityEvent('camera_monitoring_started');
      }
    } catch (error) {
      console.error('Error starting camera recording:', error);
      handleViolation('camera_monitoring_failed');
    }
  };

  const stopCameraRecording = async () => {
    try {
      if (cameraRef.current && isRecording) {
        setIsRecording(false);
        onSecurityEvent('camera_monitoring_stopped');
      }
    } catch (error) {
      console.error('Error stopping camera recording:', error);
    }
  };

  const handleViolation = (violationType: string) => {
    const violation = `${violationType}_${Date.now()}`;
    setViolations(prev => [...prev, violation]);
    onViolation(violationType);
    
    // Show violation warning
    setShowViolationModal(true);
    
    // Log violation details
    console.log(`Exam violation detected: ${violationType}`);
  };

  const takeProctoringSnapshot = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        });
        
        onSecurityEvent('proctoring_snapshot_taken');
        return photo;
      }
    } catch (error) {
      console.error('Error taking proctoring snapshot:', error);
      handleViolation('snapshot_capture_failed');
    }
  };

  // Simulate violation detection for demo purposes
  const simulateViolation = () => {
    const violationTypes = [
      'multiple_faces_detected',
      'no_face_detected',
      'looking_away_detected',
      'suspicious_movement',
      'background_noise_detected'
    ];
    
    const randomViolation = violationTypes[Math.floor(Math.random() * violationTypes.length)];
    handleViolation(randomViolation);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialIcons name="warning" size={48} color="#EF4444" />
        <Text style={styles.permissionText}>
          Camera access is required for exam proctoring
        </Text>
        <Button mode="contained" onPress={initializeProctoring}>
          Grant Permissions
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <Surface style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={cameraType}
          ratio="4:3"
        />
        
        <View style={styles.cameraOverlay}>
          <View style={styles.recordingIndicator}>
            <View style={[styles.recordingDot, isRecording && styles.recording]} />
            <Text style={styles.recordingText}>
              {isRecording ? 'Recording' : 'Monitoring'}
            </Text>
          </View>
        </View>
      </Surface>

      {/* Proctoring Status */}
      <Surface style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <MaterialIcons name="security" size={20} color="#10B981" />
          <Text style={styles.statusText}>Exam Proctoring Active</Text>
        </View>
        
        <View style={styles.statusRow}>
          <MaterialIcons name="videocam" size={20} color={isRecording ? "#EF4444" : "#6B7280"} />
          <Text style={styles.statusText}>
            Camera: {isRecording ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <MaterialIcons name="warning" size={20} color="#F59E0B" />
          <Text style={styles.statusText}>
            Violations: {violations.length}
          </Text>
        </View>
      </Surface>

      {/* Development Controls */}
      <Surface style={styles.controlsContainer}>
        <Text variant="bodySmall" style={styles.controlsTitle}>
          Development Controls
        </Text>
        <View style={styles.controlsRow}>
          <Button mode="outlined" onPress={simulateViolation} style={styles.controlButton}>
            Simulate Violation
          </Button>
          <Button mode="outlined" onPress={takeProctoringSnapshot} style={styles.controlButton}>
            Take Snapshot
          </Button>
        </View>
      </Surface>

      {/* Violation Warning Modal */}
      <Portal>
        <Modal
          visible={showViolationModal}
          onDismiss={() => setShowViolationModal(false)}
          contentContainerStyle={styles.violationModal}
        >
          <Surface style={styles.violationContent}>
            <MaterialIcons name="warning" size={48} color="#EF4444" />
            <Text variant="headlineSmall" style={styles.violationTitle}>
              Exam Violation Detected
            </Text>
            <Text variant="bodyMedium" style={styles.violationMessage}>
              Suspicious activity has been detected during your exam. Please ensure you:
            </Text>
            <View style={styles.violationGuidelines}>
              <Text style={styles.guideline}>• Keep your face visible to the camera</Text>
              <Text style={styles.guideline}>• Look directly at the screen</Text>
              <Text style={styles.guideline}>• Avoid unnecessary movements</Text>
              <Text style={styles.guideline}>• Maintain a quiet environment</Text>
            </View>
            <Button
              mode="contained"
              onPress={() => setShowViolationModal(false)}
              style={styles.acknowledgeButton}
            >
              I Understand
            </Button>
          </Surface>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  permissionText: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 16,
  },
  cameraContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  camera: {
    width: '100%',
    height: 200,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: 12,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280',
  },
  recording: {
    backgroundColor: '#EF4444',
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statusContainer: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    color: '#1F2937',
    fontWeight: '500',
  },
  controlsContainer: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  controlsTitle: {
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
  },
  violationModal: {
    margin: 20,
    justifyContent: 'center',
  },
  violationContent: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 16,
  },
  violationTitle: {
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  violationMessage: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  violationGuidelines: {
    alignSelf: 'stretch',
    gap: 8,
  },
  guideline: {
    color: '#1F2937',
    fontSize: 14,
  },
  acknowledgeButton: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
});