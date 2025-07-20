import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  AppState,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Badge, ProgressBar } from 'react-native-paper';
import { Camera, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as ScreenCapture from 'expo-screen-capture';
import * as KeepAwake from 'expo-keep-awake';
import * as Device from 'expo-device';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

interface CATExamProps {
  catExamId: string;
  onComplete: (results: any) => void;
  onError: (error: string) => void;
}

interface CATSession {
  id: string;
  catExamId: string;
  studentId: string;
  currentQuestionId?: string;
  questionsAnswered: number;
  proficiencyEstimate: number;
  isComplete: boolean;
  violations: any[];
  startedAt: string;
}

interface CATQuestion {
  id: string;
  questionText: string;
  options: string[];
  difficulty: number;
  category: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
}

interface ProctoringState {
  cameraActive: boolean;
  micActive: boolean;
  screenRecordingBlocked: boolean;
  appSwitches: number;
  violations: string[];
  recording?: any;
}

export const CATExamInterface: React.FC<CATExamProps> = ({
  catExamId,
  onComplete,
  onError
}) => {
  const [catSession, setCatSession] = useState<CATSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<CATQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [proctoringState, setProctoringState] = useState<ProctoringState>({
    cameraActive: false,
    micActive: false,
    screenRecordingBlocked: false,
    appSwitches: 0,
    violations: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showProctoringSetup, setShowProctoringSetup] = useState(true);

  const cameraRef = useRef<Camera>(null);
  const appState = useRef(AppState.currentState);

  // API Base URL - should match your backend
  const API_BASE_URL = 'https://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev';

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Initialize CAT exam session
  useEffect(() => {
    initializeCATSession();
  }, [catExamId]);

  // Monitor app state changes for proctoring
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        handleViolation('app_switch', 'Application was minimized or switched');
        setProctoringState(prev => ({
          ...prev,
          appSwitches: prev.appSwitches + 1
        }));
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const initializeCATSession = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.post(`/api/cat-exams/${catExamId}/start`);
      setCatSession(response.data);
      
      // Get first question
      await getNextQuestion(response.data.id);
    } catch (error) {
      console.error('Error initializing CAT session:', error);
      onError('Failed to start CAT exam');
    } finally {
      setIsLoading(false);
    }
  };

  const getNextQuestion = async (sessionId: string) => {
    try {
      const response = await apiClient.get(`/api/cat-sessions/${sessionId}/next-question`);
      
      if (response.data.isComplete) {
        // CAT exam is complete
        onComplete(response.data);
        return;
      }
      
      setCurrentQuestion(response.data.question);
      setSelectedAnswer('');
    } catch (error) {
      console.error('Error getting next question:', error);
      onError('Failed to load next question');
    }
  };

  const submitAnswer = async () => {
    if (!catSession || !currentQuestion || !selectedAnswer) return;

    try {
      const response = await apiClient.post(`/api/cat-sessions/${catSession.id}/submit-answer`, {
        questionId: currentQuestion.id,
        selectedAnswers: [selectedAnswer],
        timeSpent: 30 // Track actual time spent
      });

      if (response.data.isComplete) {
        // CAT exam is complete
        completeCATExam();
      } else {
        // Get next question based on adaptive algorithm
        await getNextQuestion(catSession.id);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      onError('Failed to submit answer');
    }
  };

  const completeCATExam = async () => {
    if (!catSession) return;

    try {
      const response = await apiClient.post(`/api/cat-sessions/${catSession.id}/complete`);
      onComplete(response.data);
    } catch (error) {
      console.error('Error completing CAT exam:', error);
      onError('Failed to complete exam');
    }
  };

  const setupProctoring = async () => {
    try {
      // Request camera permissions
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        throw new Error('Camera permission denied');
      }

      // Request microphone permissions
      const audioPermission = await Audio.requestPermissionsAsync();
      if (audioPermission.status !== 'granted') {
        throw new Error('Microphone permission denied');
      }

      // Request media library permissions for screen recording detection
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();

      // Block screen recording
      await ScreenCapture.preventScreenCaptureAsync();

      // Keep screen awake during exam
      KeepAwake.activateKeepAwake();

      setProctoringState(prev => ({
        ...prev,
        cameraActive: true,
        micActive: true,
        screenRecordingBlocked: true
      }));

      setShowProctoringSetup(false);
    } catch (error) {
      console.error('Proctoring setup error:', error);
      Alert.alert(
        'Proctoring Setup Failed',
        'Camera and microphone access are required for this exam. Please enable permissions in settings.',
        [
          { text: 'Retry', onPress: setupProctoring },
          { text: 'Cancel', onPress: () => onError('Proctoring setup cancelled') }
        ]
      );
    }
  };

  const handleViolation = (type: string, description: string) => {
    const violation = {
      type,
      description,
      timestamp: new Date().toISOString(),
      severity: type === 'app_switch' ? 'high' : 'medium'
    };

    setProctoringState(prev => ({
      ...prev,
      violations: [...prev.violations, violation]
    }));

    // Send violation to backend
    if (catSession) {
      apiClient.post(`/api/cat-sessions/${catSession.id}/violation`, violation)
        .catch(error => console.error('Error reporting violation:', error));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing CAT Exam...</Text>
      </View>
    );
  }

  // Proctoring setup modal
  if (showProctoringSetup) {
    return (
      <Modal visible={true} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.proctoringSetupContainer}>
            <Icon name="security" size={64} color="#3b82f6" />
            <Text style={styles.proctoringSetupTitle}>Exam Security Setup</Text>
            <Text style={styles.proctoringSetupText}>
              This is a proctored Computer Adaptive Test. We need to enable security features:
            </Text>
            
            <View style={styles.proctoringFeatures}>
              <View style={styles.featureItem}>
                <Icon name="videocam" size={24} color="#10b981" />
                <Text style={styles.featureText}>Camera monitoring</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="mic" size={24} color="#10b981" />
                <Text style={styles.featureText}>Audio recording</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="screen-lock-portrait" size={24} color="#10b981" />
                <Text style={styles.featureText}>Screen recording prevention</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="phonelink-lock" size={24} color="#10b981" />
                <Text style={styles.featureText}>App switching monitoring</Text>
              </View>
            </View>
            
            <Button
              mode="contained"
              onPress={setupProctoring}
              style={styles.setupButton}
            >
              Enable Security Features
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Proctoring Status Bar */}
      <View style={styles.proctoringStatusBar}>
        <View style={styles.proctoringStatus}>
          <Icon name="security" size={16} color="#f59e0b" />
          <Text style={styles.proctoringStatusText}>CAT Exam - Proctored</Text>
        </View>
        <View style={styles.proctoringIndicators}>
          <Icon name="videocam" size={16} color={proctoringState.cameraActive ? '#10b981' : '#ef4444'} />
          <Icon name="mic" size={16} color={proctoringState.micActive ? '#10b981' : '#ef4444'} />
          {proctoringState.violations.length > 0 && (
            <Badge style={styles.violationBadge}>{proctoringState.violations.length}</Badge>
          )}
        </View>
      </View>

      {/* Camera View (Small overlay) */}
      {proctoringState.cameraActive && (
        <View style={styles.cameraOverlay}>
          <Camera
            ref={cameraRef}
            style={styles.cameraPreview}
            type={CameraType.front}
          />
        </View>
      )}

      {/* CAT Progress */}
      <View style={styles.catProgress}>
        <Text style={styles.catTitle}>Computer Adaptive Test</Text>
        <Text style={styles.catStats}>
          Questions Answered: {catSession?.questionsAnswered || 0} | 
          Proficiency: {Math.round((catSession?.proficiencyEstimate || 0) * 100)}%
        </Text>
      </View>

      {/* Question Display */}
      {currentQuestion && (
        <ScrollView style={styles.questionContainer}>
          <Card style={styles.questionCard}>
            <Card.Content>
              <View style={styles.questionHeader}>
                <Text style={styles.questionType}>
                  {currentQuestion.type.replace('_', ' ').toUpperCase()}
                </Text>
                <Badge style={styles.difficultyBadge}>
                  Difficulty: {currentQuestion.difficulty}/10
                </Badge>
              </View>
              
              <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
              
              {currentQuestion.type === 'multiple_choice' && (
                <View style={styles.optionsContainer}>
                  {currentQuestion.options.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        selectedAnswer === option && styles.selectedOption
                      ]}
                      onPress={() => setSelectedAnswer(option)}
                    >
                      <View style={styles.optionContent}>
                        <View style={[
                          styles.radioButton,
                          selectedAnswer === option && styles.selectedRadio
                        ]} />
                        <Text style={styles.optionText}>{option}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {currentQuestion.type === 'true_false' && (
                <View style={styles.optionsContainer}>
                  {['True', 'False'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionButton,
                        selectedAnswer === option && styles.selectedOption
                      ]}
                      onPress={() => setSelectedAnswer(option)}
                    >
                      <View style={styles.optionContent}>
                        <View style={[
                          styles.radioButton,
                          selectedAnswer === option && styles.selectedRadio
                        ]} />
                        <Text style={styles.optionText}>{option}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      )}

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          mode="contained"
          onPress={submitAnswer}
          disabled={!selectedAnswer}
          style={[styles.submitButton, !selectedAnswer && styles.disabledButton]}
        >
          Submit Answer
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
  },
  proctoringSetupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  proctoringSetupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 12,
  },
  proctoringSetupText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  proctoringFeatures: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  setupButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  proctoringStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b',
  },
  proctoringStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proctoringStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 8,
  },
  proctoringIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  violationBadge: {
    backgroundColor: '#ef4444',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 80,
    right: 16,
    zIndex: 1000,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  cameraPreview: {
    width: 120,
    height: 160,
  },
  catProgress: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  catTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  catStats: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  questionCard: {
    marginVertical: 16,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  difficultyBadge: {
    backgroundColor: '#e0e7ff',
  },
  questionText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  selectedOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
  },
  selectedRadio: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  optionText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  submitContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    paddingVertical: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default CATExamInterface;