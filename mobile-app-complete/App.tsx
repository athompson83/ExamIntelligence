import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput, 
  Switch, 
  Image,
  Dimensions,
  AppState
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ProgressBar } from 'react-native-progress';
import axios from 'axios';

// Create navigation instances
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// API Base URL - adjust this to match your backend
const API_BASE_URL = 'https://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev';

// API client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Type definitions (identical to web version)
interface Quiz {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  timeLimit: number;
  difficulty: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  dueDate: string;
  attempts: number;
  maxAttempts: number;
  bestScore?: number;
  tags: string[];
  allowCalculator: boolean;
  calculatorType: 'basic' | 'scientific' | 'graphing';
  proctoringEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Question {
  id: string;
  questionText: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer?: string;
  points: number;
  timeLimit?: number;
  difficulty: number;
}

interface ExamSession {
  id: string;
  quizId: string;
  studentId: string;
  startTime: Date;
  endTime?: Date;
  currentQuestionIndex: number;
  responses: Record<string, string>;
  timeRemaining: number;
  isPaused: boolean;
  violations: any[];
  proctoring: {
    cameraEnabled: boolean;
    micEnabled: boolean;
    screenSharing: boolean;
    tabSwitches: number;
    suspiciousActivity: any[];
  };
}

interface StudentProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profileImageUrl?: string;
  studentId: string;
  completedExams: number;
  averageScore: number;
  totalPoints: number;
  rank: string;
  achievements: Array<{
    name: string;
    icon: string;
    date: string;
  }>;
  recentScores: Array<{
    exam: string;
    score: number;
    date: string;
  }>;
}

interface DashboardStats {
  assignedQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  totalQuestions: number;
  upcomingDeadlines: number;
  recentActivity: Array<{
    id: string;
    title: string;
    status: string;
    questionCount: number;
    dueDate?: string;
  }>;
}

interface CalculatorState {
  display: string;
  previousValue: number;
  operator: string;
  waitingForNewValue: boolean;
  memory: number;
  history: string[];
}

// Custom hook for API requests
const useApiRequest = (url: string, options: any = {}) => {
  return useQuery({
    queryKey: [url],
    queryFn: async () => {
      const response = await apiClient.get(url, options);
      return response.data;
    },
    retry: false,
    ...options,
  });
};

// Dashboard Screen
const DashboardScreen = () => {
  const { data: dashboardStats, isLoading: statsLoading } = useApiRequest('/api/mobile/dashboard/stats');
  const { data: profile, isLoading: profileLoading } = useApiRequest('/api/mobile/student/profile');
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  Hello, {profile?.firstName || 'Student'}
                </Text>
                <Text style={styles.userSubtitle}>{profile?.studentId}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.notificationButton}>
                <Icon name="notifications" size={24} color="#666" />
                {notifications.length > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationCount}>{notifications.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.connectionStatus}>
                <Icon 
                  name={isOnline ? 'wifi' : 'wifi-off'} 
                  size={20} 
                  color={isOnline ? '#10b981' : '#ef4444'} 
                />
                <Text style={styles.connectionText}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Icon name="book" size={32} color="#3b82f6" />
              <Text style={styles.statValue}>{dashboardStats?.assignedQuizzes || 0}</Text>
              <Text style={styles.statLabel}>Assigned</Text>
            </View>
            
            <View style={styles.statCard}>
              <Icon name="check-circle" size={32} color="#10b981" />
              <Text style={styles.statValue}>{dashboardStats?.completedQuizzes || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            
            <View style={styles.statCard}>
              <Icon name="trending-up" size={32} color="#8b5cf6" />
              <Text style={styles.statValue}>{dashboardStats?.averageScore || 0}%</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            
            <View style={styles.statCard}>
              <Icon name="schedule" size={32} color="#f59e0b" />
              <Text style={styles.statValue}>{dashboardStats?.upcomingDeadlines || 0}</Text>
              <Text style={styles.statLabel}>Deadlines</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {dashboardStats?.recentActivity?.map((activity: any, index: number) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activitySubtitle}>{activity.questionCount} questions</Text>
                </View>
                <View style={styles.activityStatus}>
                  <Text style={styles.statusBadge}>{activity.status}</Text>
                </View>
              </View>
            )) || (
              <View style={styles.emptyState}>
                <Icon name="assignment" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No recent activity</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Assignments Screen
const AssignmentsScreen = ({ navigation }: any) => {
  const { data: assignments = [], isLoading: assignmentsLoading } = useApiRequest('/api/mobile/assignments');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  const startAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiClient.post(`/api/mobile/assignment/${assignmentId}/start`);
      return response.data;
    },
    onSuccess: (data) => {
      navigation.navigate('ExamScreen', { examSession: data });
    },
  });

  const filteredAssignments = assignments.filter((assignment: Quiz) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || assignment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return '#3b82f6';
      case 'in_progress': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'overdue': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return '#10b981';
    if (difficulty <= 4) return '#f59e0b';
    return '#ef4444';
  };

  const getDifficultyText = (difficulty: number) => {
    if (difficulty <= 2) return 'Easy';
    if (difficulty <= 4) return 'Medium';
    return 'Hard';
  };

  const startExam = (assignment: Quiz) => {
    startAssignmentMutation.mutate(assignment.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Assignments</Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Icon name="filter-list" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search assignments..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          
          {showFilters && (
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Filter by status:</Text>
              <View style={styles.filterButtons}>
                {['all', 'assigned', 'in_progress', 'completed', 'overdue'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterButton,
                      filterStatus === status && styles.activeFilterButton
                    ]}
                    onPress={() => setFilterStatus(status)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      filterStatus === status && styles.activeFilterButtonText
                    ]}>
                      {status.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Assignment List */}
      <ScrollView style={styles.scrollView}>
        {assignmentsLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading assignments...</Text>
          </View>
        ) : filteredAssignments.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="assignment" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No assignments found</Text>
            <Text style={styles.emptySubtitle}>Check back later for new assignments</Text>
          </View>
        ) : (
          <View style={styles.assignmentList}>
            {filteredAssignments.map((assignment: Quiz) => (
              <View key={assignment.id} style={styles.assignmentCard}>
                <View style={styles.assignmentHeader}>
                  <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                  <View style={styles.assignmentBadges}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(assignment.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(assignment.status) }]}>
                        {assignment.status.replace('_', ' ')}
                      </Text>
                    </View>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(assignment.difficulty) + '20' }]}>
                      <Text style={[styles.difficultyText, { color: getDifficultyColor(assignment.difficulty) }]}>
                        {getDifficultyText(assignment.difficulty)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.assignmentDescription}>{assignment.description}</Text>
                
                <View style={styles.assignmentDetails}>
                  <View style={styles.detailItem}>
                    <Icon name="quiz" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>{assignment.questionCount} questions</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Icon name="schedule" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>{assignment.timeLimit} mins</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Icon name="repeat" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>{assignment.attempts}/{assignment.maxAttempts} attempts</Text>
                  </View>
                </View>
                
                {assignment.proctoringEnabled && (
                  <View style={styles.proctoringNotice}>
                    <Icon name="security" size={16} color="#f59e0b" />
                    <Text style={styles.proctoringText}>Proctored exam</Text>
                  </View>
                )}
                
                {assignment.bestScore && (
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>Best Score: {assignment.bestScore}%</Text>
                    <ProgressBar
                      progress={assignment.bestScore / 100}
                      width={null}
                      height={8}
                      color="#10b981"
                      unfilledColor="#e5e7eb"
                      borderWidth={0}
                    />
                  </View>
                )}
                
                <View style={styles.assignmentActions}>
                  <View style={styles.tagContainer}>
                    {assignment.tags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.startButton,
                      (assignment.status === 'completed' || assignment.attempts >= assignment.maxAttempts) && styles.disabledButton
                    ]}
                    onPress={() => startExam(assignment)}
                    disabled={assignment.status === 'completed' || assignment.attempts >= assignment.maxAttempts}
                  >
                    <Text style={[
                      styles.startButtonText,
                      (assignment.status === 'completed' || assignment.attempts >= assignment.maxAttempts) && styles.disabledButtonText
                    ]}>
                      {assignment.status === 'completed' ? 'Completed' :
                       assignment.attempts >= assignment.maxAttempts ? 'No attempts left' :
                       assignment.status === 'in_progress' ? 'Continue' : 'Start'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Exam Screen
const ExamScreen = ({ route, navigation }: any) => {
  const { examSession } = route.params;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(examSession.timeLimit * 60);
  const [violations, setViolations] = useState<any[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorState, setCalculatorState] = useState<CalculatorState>({
    display: '0',
    previousValue: 0,
    operator: '',
    waitingForNewValue: false,
    memory: 0,
    history: []
  });
  const [cameraPermission, setCameraPermission] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const cameraRef = useRef(null);
  const queryClient = useQueryClient();

  const submitAssignmentMutation = useMutation({
    mutationFn: async ({ sessionId, responses, timeSpent }: { sessionId: string; responses: Record<string, string>; timeSpent: number }) => {
      const response = await apiClient.post(`/api/mobile/session/${sessionId}/submit`, {
        responses,
        timeSpent
      });
      return response.data;
    },
    onSuccess: (data) => {
      navigation.navigate('ResultsScreen', { examResult: data });
    },
  });

  // Initialize camera for proctoring
  useEffect(() => {
    if (examSession.proctoringEnabled) {
      initializeProctoring();
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleExamSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const initializeProctoring = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
      
      if (status === 'granted') {
        setCameraEnabled(true);
        setMicEnabled(true);
      }
    } catch (error) {
      console.error('Error initializing proctoring:', error);
      addViolation('camera_error', 'Failed to initialize camera');
    }
  };

  const addViolation = (type: string, description: string) => {
    const violation = {
      id: Date.now().toString(),
      type,
      description,
      timestamp: new Date().toISOString(),
      severity: type === 'tab_switch' ? 'high' : 'medium'
    };
    setViolations(prev => [...prev, violation]);
  };

  const handleExamSubmit = () => {
    const timeSpent = (examSession.timeLimit * 60) - timeRemaining;
    submitAssignmentMutation.mutate({
      sessionId: examSession.id,
      responses,
      timeSpent
    });
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const currentQuestion = examQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / examQuestions.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.examHeader}>
        <View style={styles.examHeaderContent}>
          <View>
            <Text style={styles.examTitle}>{examSession.title}</Text>
            <Text style={styles.examSubtitle}>
              Question {currentQuestionIndex + 1} of {examQuestions.length}
            </Text>
          </View>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            <Text style={styles.timerLabel}>Time remaining</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progress / 100}
            width={null}
            height={8}
            color="#10b981"
            unfilledColor="#e5e7eb"
            borderWidth={0}
          />
        </View>
      </View>

      {/* Proctoring Status */}
      {examSession.proctoringEnabled && (
        <View style={styles.proctoringStatus}>
          <View style={styles.proctoringStatusContent}>
            <View style={styles.proctoringStatusLeft}>
              <Icon name="security" size={16} color="#f59e0b" />
              <Text style={styles.proctoringStatusText}>Proctoring Active</Text>
            </View>
            <View style={styles.proctoringStatusRight}>
              <Icon name="videocam" size={16} color={cameraEnabled ? '#10b981' : '#ef4444'} />
              <Icon name="mic" size={16} color={micEnabled ? '#10b981' : '#ef4444'} />
            </View>
          </View>
          
          {violations.length > 0 && (
            <View style={styles.violationAlert}>
              <Icon name="warning" size={16} color="#ef4444" />
              <Text style={styles.violationText}>
                {violations.length} violation(s) detected. Please follow exam protocols.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Question Content */}
      <ScrollView style={styles.questionContainer}>
        {currentQuestion ? (
          <View style={styles.questionContent}>
            <View style={styles.questionBox}>
              <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
              
              {currentQuestion.type === 'multiple_choice' && (
                <View style={styles.optionsContainer}>
                  {currentQuestion.options?.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        responses[currentQuestion.id] === option && styles.selectedOption
                      ]}
                      onPress={() => handleAnswerChange(currentQuestion.id, option)}
                    >
                      <View style={styles.optionContent}>
                        <View style={[
                          styles.radioButton,
                          responses[currentQuestion.id] === option && styles.selectedRadio
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
                        responses[currentQuestion.id] === option && styles.selectedOption
                      ]}
                      onPress={() => handleAnswerChange(currentQuestion.id, option)}
                    >
                      <View style={styles.optionContent}>
                        <View style={[
                          styles.radioButton,
                          responses[currentQuestion.id] === option && styles.selectedRadio
                        ]} />
                        <Text style={styles.optionText}>{option}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') && (
                <TextInput
                  style={[
                    styles.textInput,
                    currentQuestion.type === 'essay' && styles.essayInput
                  ]}
                  value={responses[currentQuestion.id] || ''}
                  onChangeText={(text) => handleAnswerChange(currentQuestion.id, text)}
                  placeholder="Enter your answer..."
                  multiline={currentQuestion.type === 'essay'}
                  numberOfLines={currentQuestion.type === 'essay' ? 6 : 3}
                />
              )}
            </View>
            
            {currentQuestion.points && (
              <Text style={styles.pointsText}>Points: {currentQuestion.points}</Text>
            )}
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <Text>Loading question...</Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.examNavigation}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
          onPress={previousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Icon name="chevron-left" size={20} color={currentQuestionIndex === 0 ? '#9ca3af' : '#374151'} />
          <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.disabledButtonText]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        <View style={styles.navCenter}>
          {examSession.allowCalculator && (
            <TouchableOpacity
              style={styles.calculatorButton}
              onPress={() => setShowCalculator(true)}
            >
              <Icon name="calculate" size={20} color="#3b82f6" />
              <Text style={styles.calculatorButtonText}>Calculator</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleExamSubmit}
          >
            <Text style={styles.submitButtonText}>Submit Exam</Text>
          </TouchableOpacity>
        </View>
        
        {currentQuestionIndex < examQuestions.length - 1 ? (
          <TouchableOpacity
            style={styles.navButton}
            onPress={nextQuestion}
          >
            <Text style={styles.navButtonText}>Next</Text>
            <Icon name="chevron-right" size={20} color="#374151" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleExamSubmit}
          >
            <Text style={styles.finishButtonText}>Finish Exam</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Proctoring Camera */}
      {examSession.proctoringEnabled && cameraEnabled && cameraPermission && (
        <View style={styles.proctoringCamera}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={CameraType.front}
          />
          <View style={styles.recordingIndicator} />
        </View>
      )}

      {/* Calculator Modal */}
      <Modal visible={showCalculator} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.calculatorModal}>
            <View style={styles.calculatorHeader}>
              <Text style={styles.calculatorTitle}>Calculator</Text>
              <TouchableOpacity onPress={() => setShowCalculator(false)}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.calculatorDisplay}>
              <Text style={styles.displayText}>{calculatorState.display}</Text>
            </View>
            
            <View style={styles.calculatorButtons}>
              {/* Calculator buttons implementation */}
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>C</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>CE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>÷</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>7</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>8</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>9</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>-</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>4</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>5</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>6</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>1</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>2</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>3</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.calculatorButton, styles.equalsButton]} onPress={() => {}}>
                  <Text style={styles.buttonText}>=</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.calculatorButton, styles.zeroButton]} onPress={() => {}}>
                  <Text style={styles.buttonText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calculatorButton} onPress={() => {}}>
                  <Text style={styles.buttonText}>.</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Results Screen
const ResultsScreen = ({ route, navigation }: any) => {
  const { examResult } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.resultsContainer}>
        <View style={styles.resultsCard}>
          <View style={styles.resultsHeader}>
            <View style={styles.resultIcon}>
              <Icon 
                name={examResult.passed ? 'check-circle' : 'error'} 
                size={64} 
                color={examResult.passed ? '#10b981' : '#ef4444'} 
              />
            </View>
            <Text style={styles.resultsTitle}>
              {examResult.passed ? 'Congratulations!' : 'Keep Studying!'}
            </Text>
            <Text style={styles.resultsSubtitle}>{examResult.feedback}</Text>
          </View>
          
          <View style={styles.scoreSection}>
            <Text style={styles.scoreValue}>{examResult.score}%</Text>
            <ProgressBar
              progress={examResult.score / 100}
              width={200}
              height={12}
              color="#3b82f6"
              unfilledColor="#e5e7eb"
              borderWidth={0}
            />
          </View>
          
          <View style={styles.resultsStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Questions</Text>
              <Text style={styles.statValue}>{examResult.answeredQuestions}/{examResult.totalQuestions}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Time Spent</Text>
              <Text style={styles.statValue}>{Math.floor(examResult.timeSpent / 60)}m {examResult.timeSpent % 60}s</Text>
            </View>
          </View>
          
          <View style={styles.examDetails}>
            <Text style={styles.detailsTitle}>Exam Details</Text>
            <Text style={styles.detailsText}>
              Submitted: {new Date(examResult.submittedAt).toLocaleString()}
            </Text>
            <Text style={styles.detailsText}>
              Session ID: {examResult.sessionId}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('AssignmentsScreen')}
          >
            <Text style={styles.backButtonText}>Back to Assignments</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Profile Screen
const ProfileScreen = () => {
  const { data: profile, isLoading: profileLoading } = useApiRequest('/api/mobile/student/profile');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {profile?.firstName?.[0]}{profile?.lastName?.[0]}
            </Text>
          </View>
          <Text style={styles.profileName}>{profile?.fullName}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
          <Text style={styles.profileId}>ID: {profile?.studentId}</Text>
        </View>

        {/* Profile Stats */}
        <View style={styles.profileStats}>
          <View style={styles.profileStatCard}>
            <Icon name="emoji-events" size={32} color="#fbbf24" />
            <Text style={styles.profileStatValue}>{profile?.completedExams || 0}</Text>
            <Text style={styles.profileStatLabel}>Completed Exams</Text>
          </View>
          
          <View style={styles.profileStatCard}>
            <Icon name="trending-up" size={32} color="#10b981" />
            <Text style={styles.profileStatValue}>{profile?.averageScore || 0}%</Text>
            <Text style={styles.profileStatLabel}>Average Score</Text>
          </View>
          
          <View style={styles.profileStatCard}>
            <Icon name="star" size={32} color="#3b82f6" />
            <Text style={styles.profileStatValue}>{profile?.totalPoints || 0}</Text>
            <Text style={styles.profileStatLabel}>Total Points</Text>
          </View>
          
          <View style={styles.profileStatCard}>
            <Icon name="military-tech" size={32} color="#8b5cf6" />
            <Text style={styles.profileStatValue}>{profile?.rank || 'Beginner'}</Text>
            <Text style={styles.profileStatLabel}>Current Rank</Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Achievements</Text>
          {profile?.achievements?.length > 0 ? (
            <View style={styles.achievementsList}>
              {profile.achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementItem}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <View style={styles.achievementContent}>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                    <Text style={styles.achievementDate}>
                      {new Date(achievement.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="military-tech" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No achievements yet</Text>
              <Text style={styles.emptySubtext}>Complete exams to earn achievements</Text>
            </View>
          )}
        </View>

        {/* Recent Scores */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Scores</Text>
          {profile?.recentScores?.length > 0 ? (
            <View style={styles.scoresList}>
              {profile.recentScores.map((score, index) => (
                <View key={index} style={styles.scoreItem}>
                  <View style={styles.scoreContent}>
                    <Text style={styles.scoreName}>{score.exam}</Text>
                    <Text style={styles.scoreDate}>
                      {new Date(score.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.scoreValue}>{score.score}%</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="bar-chart" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No recent scores</Text>
              <Text style={styles.emptySubtext}>Take an exam to see your scores</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Settings Screen
const SettingsScreen = () => {
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [dataUsage, setDataUsage] = useState(true);
  const [biometricLock, setBiometricLock] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Exam Preferences */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Exam Preferences</Text>
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Get notified about new assignments</Text>
              </View>
              <Switch value={notifications} onValueChange={setNotifications} />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Sound Effects</Text>
                <Text style={styles.settingDescription}>Play sounds during exams</Text>
              </View>
              <Switch value={soundEffects} onValueChange={setSoundEffects} />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Vibration</Text>
                <Text style={styles.settingDescription}>Vibrate for alerts</Text>
              </View>
              <Switch value={vibration} onValueChange={setVibration} />
            </View>
          </View>
        </View>

        {/* Privacy & Security */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Privacy & Security</Text>
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Data Usage</Text>
                <Text style={styles.settingDescription}>Allow app to use cellular data</Text>
              </View>
              <Switch value={dataUsage} onValueChange={setDataUsage} />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Biometric Lock</Text>
                <Text style={styles.settingDescription}>Use fingerprint/face ID</Text>
              </View>
              <Switch value={biometricLock} onValueChange={setBiometricLock} />
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <View style={styles.aboutList}>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Platform</Text>
              <Text style={styles.aboutValue}>React Native</Text>
            </View>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Last Updated</Text>
              <Text style={styles.aboutValue}>January 2025</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Assignments':
              iconName = 'assignment';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Assignments" component={AssignmentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// Main App Component
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen name="ExamScreen" component={ExamScreen} />
              <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  userSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  activityStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  searchContainer: {
    marginTop: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    marginTop: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  activeFilterButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#374151',
    textTransform: 'capitalize',
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  assignmentList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
  },
  assignmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  assignmentBadges: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  assignmentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  proctoringNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
  },
  proctoringText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  scoreContainer: {
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  assignmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
  },
  startButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
  examHeader: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  examHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  examTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  examSubtitle: {
    fontSize: 14,
    color: '#d1d5db',
  },
  timerContainer: {
    alignItems: 'flex-end',
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  timerLabel: {
    fontSize: 12,
    color: '#d1d5db',
  },
  progressContainer: {
    marginTop: 12,
  },
  proctoringStatus: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fcd34d',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  proctoringStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proctoringStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proctoringStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400e',
  },
  proctoringStatusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  violationAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
  },
  violationText: {
    flex: 1,
    fontSize: 12,
    color: '#dc2626',
  },
  questionContainer: {
    flex: 1,
  },
  questionContent: {
    padding: 16,
  },
  questionBox: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedOption: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  selectedRadio: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
  },
  essayInput: {
    minHeight: 120,
  },
  pointsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  examNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  navButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  navCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calculatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#ffffff',
  },
  calculatorButtonText: {
    fontSize: 14,
    color: '#3b82f6',
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#dc2626',
  },
  submitButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  finishButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#059669',
  },
  finishButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  proctoringCamera: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 128,
    height: 96,
    backgroundColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  camera: {
    flex: 1,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculatorModal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    width: '90%',
    maxWidth: 400,
  },
  calculatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calculatorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  calculatorDisplay: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  displayText: {
    fontSize: 32,
    color: '#ffffff',
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  calculatorButtons: {
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  equalsButton: {
    backgroundColor: '#3b82f6',
  },
  zeroButton: {
    flex: 2,
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  resultsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultIcon: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 12,
  },
  resultsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  examDetails: {
    width: '100%',
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  backButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  profileHeader: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '600',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: '#9ca3af',
  },
  profileStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileStatValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginVertical: 8,
  },
  profileStatLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    gap: 12,
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  achievementDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  scoresList: {
    gap: 12,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  scoreContent: {
    flex: 1,
  },
  scoreName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  scoreDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingsList: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  aboutList: {
    gap: 12,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aboutLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  aboutValue: {
    fontSize: 16,
    color: '#111827',
  },
});