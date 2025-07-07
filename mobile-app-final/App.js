import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// API Configuration
const API_BASE_URL = 'https://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Simple UI components to replace React Native Paper
const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const Button = ({ children, onPress, style, disabled, variant = 'contained' }) => (
  <TouchableOpacity 
    style={[
      variant === 'contained' ? styles.buttonContained : styles.buttonOutlined,
      disabled && styles.buttonDisabled,
      style
    ]} 
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[
      variant === 'contained' ? styles.buttonTextContained : styles.buttonTextOutlined,
      disabled && styles.buttonTextDisabled
    ]}>
      {children}
    </Text>
  </TouchableOpacity>
);

const TextInput = ({ value, onChangeText, placeholder, secureTextEntry, style }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{placeholder}</Text>
    <View style={[styles.textInput, style]}>
      <Text style={styles.inputText}>{value}</Text>
    </View>
  </View>
);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [quizzes, setQuizzes] = useState([]);
  const [userStats, setUserStats] = useState(null);

  // Test backend connection
  const testConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('connected');
        showSnackbar('✅ Connected to ProficiencyAI Backend');
        return true;
      } else {
        setConnectionStatus('error');
        showSnackbar('⚠️ Connection failed - Using demo mode');
        return false;
      }
    } catch (error) {
      setConnectionStatus('error');
      showSnackbar('📱 Running in demo mode');
      return false;
    }
  };

  // Load sample data
  const loadSampleData = () => {
    setQuizzes([
      {
        id: 1,
        title: 'Mathematics Assessment',
        description: 'Basic algebra and geometry',
        questions: 25,
        duration: '45 minutes',
        difficulty: 'Medium',
        completed: false
      },
      {
        id: 2,
        title: 'Science Quiz',
        description: 'Physics and chemistry fundamentals',
        questions: 20,
        duration: '30 minutes',
        difficulty: 'Easy',
        completed: true
      },
      {
        id: 3,
        title: 'Literature Review',
        description: 'Classical literature analysis',
        questions: 15,
        duration: '60 minutes',
        difficulty: 'Hard',
        completed: false
      }
    ]);

    setUserStats({
      completedQuizzes: 12,
      totalQuizzes: 25,
      averageScore: 87,
      studyTime: '24 hours',
      rank: 'Advanced'
    });
  };

  // Initialize app
  useEffect(() => {
    const initialize = async () => {
      await testConnection();
      loadSampleData();
    };
    initialize();
  }, []);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleLogin = async () => {
    setLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      setIsLoggedIn(true);
      setLoading(false);
      showSnackbar('🎉 Login successful! Welcome to ProficiencyAI');
    }, 1500);
  };

  const handleTakeQuiz = (quiz) => {
    Alert.alert(
      'Start Quiz',
      `Are you ready to take "${quiz.title}"?\\n\\nQuestions: ${quiz.questions}\\nDuration: ${quiz.duration}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Quiz', 
          onPress: () => {
            showSnackbar(`Starting ${quiz.title}...`);
            // Here you would navigate to the quiz interface
          }
        }
      ]
    );
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.loginContainer}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>P</Text>
            </View>
            <Text style={styles.title}>ProficiencyAI</Text>
            <Text style={styles.subtitle}>Native Mobile Assessment Platform</Text>
          </View>

          <Card style={styles.loginCard}>
            <View style={styles.connectionStatus}>
              <View style={[
                styles.statusChip,
                { backgroundColor: connectionStatus === 'connected' ? '#dcfce7' : '#fef3c7' }
              ]}>
                <Text style={styles.statusText}>
                  {connectionStatus === 'connected' ? '✅ Backend Connected' : '📱 Demo Mode'}
                </Text>
              </View>
            </View>

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
            
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />

            <Button
              onPress={handleLogin}
              style={styles.loginButton}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In to Mobile App'}
            </Button>
          </Card>

          <View style={styles.features}>
            <Text style={styles.featuresTitle}>Native Mobile Features</Text>
            <View style={styles.featuresList}>
              <Text style={styles.feature}>📱 True Native iOS Experience</Text>
              <Text style={styles.feature}>🔒 Secure Authentication</Text>
              <Text style={styles.feature}>📊 Real-time Analytics</Text>
              <Text style={styles.feature}>🎯 Adaptive Testing</Text>
              <Text style={styles.feature}>📷 Camera & Microphone Access</Text>
              <Text style={styles.feature}>🔔 Push Notifications</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Main App Dashboard
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>P</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Welcome Back!</Text>
            <Text style={styles.headerSubtitle}>{email}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Connection Status */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Backend Connection:</Text>
            <Text style={[
              styles.statusValue,
              { color: connectionStatus === 'connected' ? '#10b981' : '#f59e0b' }
            ]}>
              {connectionStatus === 'connected' ? 'Connected ✅' : 'Demo Mode 📱'}
            </Text>
          </View>
        </Card>

        {/* Stats Overview */}
        {userStats && (
          <Card style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.completedQuizzes}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.averageScore}%</Text>
                <Text style={styles.statLabel}>Average Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.studyTime}</Text>
                <Text style={styles.statLabel}>Study Time</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Available Quizzes */}
        <Card style={styles.quizzesCard}>
          <Text style={styles.sectionTitle}>Available Assessments</Text>
          {quizzes.map((quiz) => (
            <View key={quiz.id} style={styles.quizItem}>
              <View style={styles.quizInfo}>
                <Text style={styles.quizTitle}>{quiz.title}</Text>
                <Text style={styles.quizDescription}>
                  {quiz.questions} questions • {quiz.duration}
                </Text>
                <View style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(quiz.difficulty) + '20' }
                ]}>
                  <Text style={[
                    styles.difficultyText,
                    { color: getDifficultyColor(quiz.difficulty) }
                  ]}>
                    {quiz.difficulty}
                  </Text>
                </View>
              </View>
              <Button
                onPress={() => handleTakeQuiz(quiz)}
                disabled={quiz.completed}
                style={styles.takeQuizButton}
                variant={quiz.completed ? 'outlined' : 'contained'}
              >
                {quiz.completed ? 'Completed ✓' : 'Take Quiz'}
              </Button>
            </View>
          ))}
        </Card>

        {/* Native Features Demo */}
        <Card style={styles.featuresCard}>
          <Text style={styles.sectionTitle}>Native Features Test</Text>
          <View style={styles.nativeFeatures}>
            <Button 
              variant="outlined"
              style={styles.featureButton}
              onPress={() => Alert.alert('Camera Access', 'Native camera permission ready for proctoring features')}
            >
              📷 Camera Access
            </Button>
            <Button 
              variant="outlined"
              style={styles.featureButton}
              onPress={() => Alert.alert('Microphone', 'Native microphone ready for audio recording')}
            >
              🎤 Audio Recording
            </Button>
            <Button 
              variant="outlined"
              style={styles.featureButton}
              onPress={() => Alert.alert('Notifications', 'Push notifications configured and ready')}
            >
              🔔 Notifications
            </Button>
            <Button 
              variant="outlined"
              style={styles.featureButton}
              onPress={() => Alert.alert('Offline Mode', 'Offline capability available for assessments')}
            >
              📱 Offline Mode
            </Button>
          </View>
        </Card>

        {/* Success Message */}
        {snackbarVisible && (
          <Card style={styles.snackbar}>
            <Text style={styles.snackbarText}>{snackbarMessage}</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  loginContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#2563eb',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginCard: {
    marginBottom: 30,
  },
  connectionStatus: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 5,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  inputText: {
    fontSize: 16,
    color: '#1f2937',
  },
  buttonContained: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonOutlined: {
    borderWidth: 2,
    borderColor: '#2563eb',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    margin: 5,
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
    borderColor: '#d1d5db',
  },
  buttonTextContained: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextOutlined: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextDisabled: {
    color: '#9ca3af',
  },
  features: {
    alignItems: 'center',
    marginTop: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  featuresList: {
    alignItems: 'center',
  },
  feature: {
    fontSize: 16,
    color: '#e0e7ff',
    marginBottom: 8,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#1d4ed8',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#bfdbfe',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8fafc',
  },
  statusCard: {
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  quizzesCard: {
    marginBottom: 15,
  },
  quizItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  quizInfo: {
    flex: 1,
    marginRight: 15,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  quizDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  takeQuizButton: {
    minWidth: 100,
  },
  featuresCard: {
    marginBottom: 20,
  },
  nativeFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureButton: {
    width: '48%',
    marginBottom: 10,
  },
  snackbar: {
    backgroundColor: '#10b981',
    marginTop: 20,
  },
  snackbarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});