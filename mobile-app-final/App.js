import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { 
  PaperProvider, 
  MD3LightTheme,
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Snackbar,
  Avatar,
  Chip,
  ProgressBar,
  List,
  Divider
} from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

// API Configuration
const API_BASE_URL = 'https://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev';

// Custom theme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563eb',
    secondary: '#7c3aed',
    tertiary: '#10b981',
    surface: '#ffffff',
    background: '#f8fafc',
  },
};

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
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <SafeAreaView style={styles.container}>
            <StatusBar style="auto" />
            <ScrollView contentContainerStyle={styles.loginContainer}>
              <View style={styles.logoContainer}>
                <Avatar.Text size={80} label="P" style={styles.logo} />
                <Title style={styles.title}>ProficiencyAI</Title>
                <Paragraph style={styles.subtitle}>
                  Native Mobile Assessment Platform
                </Paragraph>
              </View>

              <Card style={styles.loginCard}>
                <Card.Content>
                  <View style={styles.connectionStatus}>
                    <Chip 
                      icon={connectionStatus === 'connected' ? 'check-circle' : 'wifi-off'}
                      mode="outlined"
                      style={[
                        styles.statusChip,
                        { backgroundColor: connectionStatus === 'connected' ? '#dcfce7' : '#fef3c7' }
                      ]}
                    >
                      {connectionStatus === 'connected' ? 'Backend Connected' : 'Demo Mode'}
                    </Chip>
                  </View>

                  <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  
                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry
                    style={styles.input}
                  />

                  <Button
                    mode="contained"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.loginButton}
                    contentStyle={styles.loginButtonContent}
                  >
                    {loading ? 'Signing In...' : 'Sign In to Mobile App'}
                  </Button>
                </Card.Content>
              </Card>

              <View style={styles.features}>
                <Text style={styles.featuresTitle}>Mobile Features</Text>
                <View style={styles.featuresList}>
                  <Text style={styles.feature}>📱 Native iOS Experience</Text>
                  <Text style={styles.feature}>🔒 Secure Authentication</Text>
                  <Text style={styles.feature}>📊 Real-time Analytics</Text>
                  <Text style={styles.feature}>🎯 Adaptive Testing</Text>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      </PaperProvider>
    );
  }

  // Main App Dashboard
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="auto" />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Avatar.Text size={40} label="P" style={styles.headerAvatar} />
              <View style={styles.headerText}>
                <Title style={styles.headerTitle}>Welcome Back!</Title>
                <Paragraph style={styles.headerSubtitle}>{email}</Paragraph>
              </View>
            </View>
          </View>

          <ScrollView style={styles.content}>
            {/* Stats Overview */}
            {userStats && (
              <Card style={styles.statsCard}>
                <Card.Content>
                  <Title>Your Progress</Title>
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
                  <View style={styles.progressSection}>
                    <Text style={styles.progressLabel}>
                      Quiz Progress: {userStats.completedQuizzes}/{userStats.totalQuizzes}
                    </Text>
                    <ProgressBar 
                      progress={userStats.completedQuizzes / userStats.totalQuizzes} 
                      color={theme.colors.primary}
                      style={styles.progressBar}
                    />
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Available Quizzes */}
            <Card style={styles.quizzesCard}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Available Assessments</Title>
                {quizzes.map((quiz) => (
                  <View key={quiz.id}>
                    <List.Item
                      title={quiz.title}
                      description={`${quiz.questions} questions • ${quiz.duration}`}
                      left={(props) => (
                        <Avatar.Icon 
                          {...props} 
                          icon={quiz.completed ? "check-circle" : "school"} 
                          style={[
                            styles.quizIcon,
                            { backgroundColor: quiz.completed ? '#10b981' : theme.colors.primary }
                          ]}
                        />
                      )}
                      right={(props) => (
                        <View style={styles.quizActions}>
                          <Chip 
                            style={[
                              styles.difficultyChip,
                              { backgroundColor: getDifficultyColor(quiz.difficulty) + '20' }
                            ]}
                            textStyle={{ color: getDifficultyColor(quiz.difficulty) }}
                          >
                            {quiz.difficulty}
                          </Chip>
                          <Button
                            mode="contained"
                            compact
                            onPress={() => handleTakeQuiz(quiz)}
                            disabled={quiz.completed}
                            style={styles.takeQuizButton}
                          >
                            {quiz.completed ? 'Completed' : 'Take Quiz'}
                          </Button>
                        </View>
                      )}
                      style={styles.quizItem}
                    />
                    <Divider />
                  </View>
                ))}
              </Card.Content>
            </Card>

            {/* Native App Features */}
            <Card style={styles.featuresCard}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Native Features</Title>
                <View style={styles.nativeFeatures}>
                  <Button 
                    mode="outlined" 
                    icon="camera"
                    style={styles.featureButton}
                    onPress={() => showSnackbar('Camera access ready for proctoring')}
                  >
                    Camera Access
                  </Button>
                  <Button 
                    mode="outlined" 
                    icon="microphone"
                    style={styles.featureButton}
                    onPress={() => showSnackbar('Microphone ready for audio recording')}
                  >
                    Audio Recording
                  </Button>
                  <Button 
                    mode="outlined" 
                    icon="bell"
                    style={styles.featureButton}
                    onPress={() => showSnackbar('Push notifications configured')}
                  >
                    Notifications
                  </Button>
                  <Button 
                    mode="outlined" 
                    icon="download"
                    style={styles.featureButton}
                    onPress={() => showSnackbar('Offline mode available')}
                  >
                    Offline Mode
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </ScrollView>

          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
            style={styles.snackbar}
          >
            {snackbarMessage}
          </Snackbar>
        </SafeAreaView>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#2563eb',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  loginCard: {
    marginBottom: 30,
    elevation: 4,
  },
  connectionStatus: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusChip: {
    marginBottom: 10,
  },
  input: {
    marginBottom: 15,
  },
  loginButton: {
    marginTop: 10,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  features: {
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 15,
  },
  featuresList: {
    alignItems: 'center',
  },
  feature: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 8,
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
    backgroundColor: '#1d4ed8',
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#bfdbfe',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statsCard: {
    marginBottom: 15,
    elevation: 2,
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
  progressSection: {
    marginTop: 15,
  },
  progressLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  quizzesCard: {
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 15,
    color: '#1f2937',
  },
  quizItem: {
    paddingVertical: 8,
  },
  quizIcon: {
    marginRight: 10,
  },
  quizActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  difficultyChip: {
    marginRight: 8,
  },
  takeQuizButton: {
    minWidth: 100,
  },
  featuresCard: {
    marginBottom: 20,
    elevation: 2,
  },
  nativeFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureButton: {
    flex: 1,
    minWidth: '45%',
  },
  snackbar: {
    backgroundColor: '#1f2937',
  },
});