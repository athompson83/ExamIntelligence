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
  AppState,
  FlatList
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ProgressBar } from 'react-native-progress';
import axios from 'axios';
import ExamLockdown from './components/ExamLockdown';

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

// Type definitions
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
  allowCalculator: boolean;
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                <Icon name={isOnline ? "wifi" : "wifi-off"} size={16} color={isOnline ? "#16a34a" : "#dc2626"} />
                <Text style={[styles.connectionText, { color: isOnline ? "#16a34a" : "#dc2626" }]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardAssigned]}>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{dashboardStats?.assignedQuizzes || 0}</Text>
                <Text style={styles.statLabel}>Assigned</Text>
              </View>
              <Icon name="book" size={32} color="#3b82f6" />
            </View>
            
            <View style={[styles.statCard, styles.statCardCompleted]}>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{dashboardStats?.completedQuizzes || 0}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <Icon name="check-circle" size={32} color="#16a34a" />
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardAverage]}>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{dashboardStats?.averageScore || 0}%</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
              <Icon name="trending-up" size={32} color="#7c3aed" />
            </View>
            
            <View style={[styles.statCard, styles.statCardUpcoming]}>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{dashboardStats?.upcomingDeadlines || 0}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>
              <Icon name="schedule" size={32} color="#f59e0b" />
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {dashboardStats?.recentActivity?.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="assignment" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Recent Activity</Text>
              <Text style={styles.emptySubtitle}>Your recent exam activity will appear here</Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {dashboardStats?.recentActivity?.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Icon name="assignment" size={20} color="#3b82f6" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activitySubtitle}>
                      {activity.questionCount} questions
                    </Text>
                  </View>
                  <View style={[styles.activityStatus, activity.status === 'completed' ? styles.statusCompleted : styles.statusPending]}>
                    <Text style={[styles.statusText, activity.status === 'completed' ? styles.statusCompletedText : styles.statusPendingText]}>
                      {activity.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Assignments Screen
const AssignmentsScreen = ({ navigation }: any) => {
  const { data: assignments, isLoading } = useApiRequest('/api/mobile/assignments');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const filteredAssignments = assignments?.filter((assignment: Quiz) => {
    if (filterStatus !== 'all' && assignment.status !== filterStatus) {
      return false;
    }
    if (searchTerm && !assignment.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  const handleStartExam = (assignment: Quiz) => {
    navigation.navigate('Exam', { assignment });
  };

  const renderAssignmentItem = ({ item }: { item: Quiz }) => (
    <View style={styles.assignmentCard}>
      <View style={styles.assignmentHeader}>
        <View style={styles.assignmentInfo}>
          <Text style={styles.assignmentTitle}>{item.title}</Text>
          <Text style={styles.assignmentDescription}>{item.description}</Text>
        </View>
      </View>
      
      <View style={styles.assignmentBadges}>
        <View style={[styles.badge, getStatusBadgeStyle(item.status)]}>
          <Text style={[styles.badgeText, getStatusTextStyle(item.status)]}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
        <View style={[styles.badge, getDifficultyBadgeStyle(item.difficulty)]}>
          <Text style={[styles.badgeText, getDifficultyTextStyle(item.difficulty)]}>
            {getDifficultyText(item.difficulty)}
          </Text>
        </View>
        {item.proctoringEnabled && (
          <View style={[styles.badge, styles.proctoringBadge]}>
            <Icon name="security" size={12} color="#6b7280" />
            <Text style={[styles.badgeText, styles.proctoringText]}>Proctored</Text>
          </View>
        )}
      </View>
      
      <View style={styles.assignmentDetails}>
        <View style={styles.detailItem}>
          <Icon name="assignment" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.questionCount} questions</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="schedule" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.timeLimit} mins</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="track-changes" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.attempts}/{item.maxAttempts} attempts</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="event" size={16} color="#6b7280" />
          <Text style={styles.detailText}>Due {new Date(item.dueDate).toLocaleDateString()}</Text>
        </View>
      </View>
      
      {item.bestScore && (
        <View style={styles.scoreContainer}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>Best Score</Text>
            <Text style={styles.scoreValue}>{item.bestScore}%</Text>
          </View>
          <ProgressBar progress={item.bestScore / 100} width={null} height={8} color="#3b82f6" />
        </View>
      )}
      
      <View style={styles.assignmentActions}>
        <View style={styles.tagsContainer}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            (item.status === 'completed' || item.attempts >= item.maxAttempts) && styles.actionButtonDisabled
          ]}
          onPress={() => handleStartExam(item)}
          disabled={item.status === 'completed' || item.attempts >= item.maxAttempts}
        >
          <Text style={[
            styles.actionButtonText,
            (item.status === 'completed' || item.attempts >= item.maxAttempts) && styles.actionButtonTextDisabled
          ]}>
            {item.status === 'completed' ? 'Completed' :
             item.attempts >= item.maxAttempts ? 'No attempts left' :
             item.status === 'in_progress' ? 'Continue' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.assignmentsHeader}>
        <View style={styles.assignmentsTitle}>
          <Text style={styles.sectionTitle}>Assignments</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Icon name="search" size={20} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowFilter(!showFilter)}
            >
              <Icon name="filter-list" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
        
        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Icon name="search" size={20} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search assignments..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        )}
        
        {showFilter && (
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
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      ) : filteredAssignments.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="assignment" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No assignments found</Text>
          <Text style={styles.emptySubtitle}>Check back later for new assignments</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAssignments}
          renderItem={renderAssignmentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.assignmentList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// Exam Screen
const ExamScreen = ({ route }: any) => {
  const { assignment } = route.params;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [lockdownReady, setLockdownReady] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);

  useEffect(() => {
    // Initialize exam session
    const initExam = async () => {
      try {
        const response = await apiClient.post('/api/mobile/exam/start', {
          quizId: assignment.id
        });
        setExamSession(response.data.session);
        setExamQuestions(response.data.questions || []);
        setTimeRemaining(assignment.timeLimit * 60);
      } catch (error) {
        console.error('Error starting exam:', error);
      }
    };

    initExam();
  }, [assignment.id]);

  const handleViolation = (violation: string) => {
    setViolations(prev => [...prev, violation]);
  };

  const handleSubmitExam = async () => {
    if (!examSession) return;
    
    try {
      await apiClient.post('/api/mobile/exam/submit', {
        sessionId: examSession.id,
        responses,
        timeSpent: (assignment.timeLimit * 60) - timeRemaining
      });
      
      Alert.alert('Success', 'Exam submitted successfully!');
    } catch (error) {
      console.error('Error submitting exam:', error);
      Alert.alert('Error', 'Failed to submit exam. Please try again.');
    }
  };

  const currentQuestionData = examQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / examQuestions.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Exam Lockdown */}
      {assignment.proctoringEnabled && (
        <ExamLockdown
          isProctored={assignment.proctoringEnabled}
          onLockdownReady={setLockdownReady}
          onViolation={handleViolation}
          examTitle={assignment.title}
        />
      )}

      {/* Only show exam content if lockdown is ready (or not proctored) */}
      {(!assignment.proctoringEnabled || lockdownReady) && (
        <>
          {/* Header */}
          <View style={styles.examHeader}>
            <View style={styles.examInfo}>
              <Text style={styles.examTitle}>{assignment.title}</Text>
              <Text style={styles.examProgress}>
                Question {currentQuestion + 1} of {examQuestions.length}
              </Text>
            </View>
            <View style={styles.examTime}>
              <Text style={styles.timeDisplay}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </Text>
              <Text style={styles.timeLabel}>Time remaining</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <ProgressBar progress={progress / 100} width={null} height={8} color="#3b82f6" />
          </View>

          {/* Proctoring Status */}
          {assignment.proctoringEnabled && (
            <View style={styles.proctoringStatus}>
              <View style={styles.proctoringInfo}>
                <Icon name="security" size={16} color="#f59e0b" />
                <Text style={styles.proctoringText}>Proctoring Active</Text>
              </View>
              {violations.length > 0 && (
                <View style={styles.violationsContainer}>
                  <Icon name="warning" size={16} color="#dc2626" />
                  <Text style={styles.violationsText}>
                    {violations.length} violation(s) detected
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Question Content */}
          <ScrollView style={styles.questionContainer} showsVerticalScrollIndicator={false}>
            {currentQuestionData && (
              <View style={styles.questionContent}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionTitle}>
                    Question {currentQuestion + 1}
                  </Text>
                  <View style={styles.questionBadges}>
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsText}>
                        {currentQuestionData.points} point{currentQuestionData.points !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={[styles.difficultyBadge, getDifficultyBadgeStyle(currentQuestionData.difficulty)]}>
                      <Text style={[styles.difficultyText, getDifficultyTextStyle(currentQuestionData.difficulty)]}>
                        {getDifficultyText(currentQuestionData.difficulty)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.questionText}>{currentQuestionData.questionText}</Text>
                
                <View style={styles.answerOptions}>
                  {currentQuestionData.type === 'multiple_choice' && currentQuestionData.options?.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.answerOption,
                        responses[currentQuestionData.id] === option && styles.selectedAnswer
                      ]}
                      onPress={() => setResponses(prev => ({
                        ...prev,
                        [currentQuestionData.id]: option
                      }))}
                    >
                      <View style={[
                        styles.radioButton,
                        responses[currentQuestionData.id] === option && styles.radioButtonSelected
                      ]}>
                        {responses[currentQuestionData.id] === option && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                      <Text style={styles.answerText}>{option}</Text>
                    </TouchableOpacity>
                  ))}

                  {currentQuestionData.type === 'true_false' && (
                    <View style={styles.trueFalseContainer}>
                      {['True', 'False'].map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.answerOption,
                            responses[currentQuestionData.id] === option && styles.selectedAnswer
                          ]}
                          onPress={() => setResponses(prev => ({
                            ...prev,
                            [currentQuestionData.id]: option
                          }))}
                        >
                          <View style={[
                            styles.radioButton,
                            responses[currentQuestionData.id] === option && styles.radioButtonSelected
                          ]}>
                            {responses[currentQuestionData.id] === option && (
                              <View style={styles.radioButtonInner} />
                            )}
                          </View>
                          <Text style={styles.answerText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {(currentQuestionData.type === 'short_answer' || currentQuestionData.type === 'essay') && (
                    <TextInput
                      style={[
                        styles.textAnswerInput,
                        currentQuestionData.type === 'essay' && styles.essayInput
                      ]}
                      value={responses[currentQuestionData.id] || ''}
                      onChangeText={(text) => setResponses(prev => ({
                        ...prev,
                        [currentQuestionData.id]: text
                      }))}
                      placeholder="Enter your answer..."
                      placeholderTextColor="#9ca3af"
                      multiline={currentQuestionData.type === 'essay'}
                      numberOfLines={currentQuestionData.type === 'essay' ? 8 : 4}
                      textAlignVertical="top"
                    />
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Navigation */}
          <View style={styles.examNavigation}>
            <TouchableOpacity
              style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
              onPress={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              <Icon name="chevron-left" size={20} color={currentQuestion === 0 ? "#9ca3af" : "#374151"} />
              <Text style={[styles.navButtonText, currentQuestion === 0 && styles.navButtonTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>
            
            <View style={styles.navCenter}>
              {assignment.allowCalculator && (
                <TouchableOpacity
                  style={styles.calculatorButton}
                  onPress={() => setShowCalculator(true)}
                >
                  <Icon name="calculate" size={20} color="#3b82f6" />
                  <Text style={styles.calculatorText}>Calculator</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {currentQuestion === examQuestions.length - 1 ? (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitExam}
              >
                <Text style={styles.submitButtonText}>Submit Exam</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => setCurrentQuestion(Math.min(examQuestions.length - 1, currentQuestion + 1))}
              >
                <Text style={styles.navButtonText}>Next</Text>
                <Icon name="chevron-right" size={20} color="#374151" />
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

// Profile Screen
const ProfileScreen = () => {
  const { data: profile } = useApiRequest('/api/mobile/student/profile');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {profile?.firstName?.[0]}{profile?.lastName?.[0]}
            </Text>
          </View>
          <Text style={styles.profileName}>{profile?.fullName}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
          <Text style={styles.profileId}>Student ID: {profile?.studentId}</Text>
        </View>
        
        <View style={styles.profileStats}>
          <View style={styles.profileStatItem}>
            <Text style={styles.profileStatValue}>{profile?.completedExams || 0}</Text>
            <Text style={styles.profileStatLabel}>Completed Exams</Text>
          </View>
          <View style={styles.profileStatItem}>
            <Text style={styles.profileStatValue}>{profile?.averageScore || 0}%</Text>
            <Text style={styles.profileStatLabel}>Average Score</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Settings Screen
const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsContainer}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingDescription}>Receive exam reminders</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#f3f4f6', true: '#3b82f6' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Enable dark theme</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#f3f4f6', true: '#3b82f6' }}
              thumbColor={darkModeEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto-save</Text>
              <Text style={styles.settingDescription}>Auto-save exam responses</Text>
            </View>
            <Switch
              value={autoSaveEnabled}
              onValueChange={setAutoSaveEnabled}
              trackColor={{ false: '#f3f4f6', true: '#3b82f6' }}
              thumbColor={autoSaveEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper functions
const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'completed':
      return { backgroundColor: '#dcfce7', borderColor: '#16a34a' };
    case 'in_progress':
      return { backgroundColor: '#dbeafe', borderColor: '#3b82f6' };
    case 'overdue':
      return { backgroundColor: '#fef2f2', borderColor: '#dc2626' };
    default:
      return { backgroundColor: '#f3f4f6', borderColor: '#6b7280' };
  }
};

const getStatusTextStyle = (status: string) => {
  switch (status) {
    case 'completed':
      return { color: '#16a34a' };
    case 'in_progress':
      return { color: '#3b82f6' };
    case 'overdue':
      return { color: '#dc2626' };
    default:
      return { color: '#6b7280' };
  }
};

const getDifficultyBadgeStyle = (difficulty: number) => {
  if (difficulty <= 3) return { backgroundColor: '#dcfce7', borderColor: '#16a34a' };
  if (difficulty <= 6) return { backgroundColor: '#fef3c7', borderColor: '#f59e0b' };
  return { backgroundColor: '#fef2f2', borderColor: '#dc2626' };
};

const getDifficultyTextStyle = (difficulty: number) => {
  if (difficulty <= 3) return { color: '#16a34a' };
  if (difficulty <= 6) return { color: '#f59e0b' };
  return { color: '#dc2626' };
};

const getDifficultyText = (difficulty: number) => {
  if (difficulty <= 3) return 'Easy';
  if (difficulty <= 6) return 'Medium';
  return 'Hard';
};

// Navigation
const AppTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

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
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Assignments" component={AssignmentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const AppStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={AppTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Exam"
        component={ExamScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Main App Component
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppStack />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontWeight: 'bold',
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
    marginTop: 2,
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
    top: 4,
    right: 4,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    padding: 16,
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statCardAssigned: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  statCardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  statCardAverage: {
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
  },
  statCardUpcoming: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  recentActivity: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
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
    textAlign: 'center',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  statusPending: {
    backgroundColor: '#f3f4f6',
    borderColor: '#6b7280',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusCompletedText: {
    color: '#16a34a',
  },
  statusPendingText: {
    color: '#6b7280',
  },
  assignmentsHeader: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  assignmentsTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButton: {
    padding: 8,
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
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
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
  assignmentInfo: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  assignmentBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  proctoringBadge: {
    backgroundColor: '#f9fafb',
    borderColor: '#6b7280',
  },
  proctoringText: {
    color: '#6b7280',
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
    fontSize: 12,
    color: '#6b7280',
  },
  scoreContainer: {
    marginBottom: 12,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
  assignmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    color: '#6b7280',
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtonTextDisabled: {
    color: '#6b7280',
  },
  examHeader: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examInfo: {
    flex: 1,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  examProgress: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 4,
  },
  examTime: {
    alignItems: 'flex-end',
  },
  timeDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  timeLabel: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 4,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
  },
  proctoringStatus: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proctoringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proctoringText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400e',
  },
  violationsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  violationsText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  questionContent: {
    maxWidth: '100%',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  questionBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  pointsBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  pointsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  difficultyBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  questionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 24,
  },
  answerOptions: {
    gap: 12,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 12,
  },
  selectedAnswer: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#3b82f6',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  answerText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  trueFalseContainer: {
    gap: 12,
  },
  textAnswerInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    minHeight: 80,
  },
  essayInput: {
    minHeight: 120,
  },
  examNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  navButtonDisabled: {
    backgroundColor: '#f9fafb',
  },
  navButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  navButtonTextDisabled: {
    color: '#9ca3af',
  },
  navCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calculatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  calculatorText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#16a34a',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
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
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  profileStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  profileStatLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  settingsContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});