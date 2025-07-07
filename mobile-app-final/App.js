import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Dimensions,
  SafeAreaView
} from 'react-native';

const { width, height } = Dimensions.get('window');
const API_BASE_URL = 'https://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    testConnection();
    loadSampleData();
  }, []);

  const testConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/user`);
      if (response.ok) {
        setConnectionStatus('connected');
        Alert.alert('Success', 'Connected to ProficiencyAI Backend!');
      } else {
        setConnectionStatus('demo');
        Alert.alert('Demo Mode', 'Running in demo mode - backend connection failed');
      }
    } catch (error) {
      setConnectionStatus('demo');
      Alert.alert('Demo Mode', 'Running in demo mode for testing');
    }
  };

  const loadSampleData = () => {
    setQuizzes([
      {
        id: 1,
        title: 'Mathematics Assessment',
        description: 'Basic algebra and geometry',
        questions: 25,
        duration: '45 minutes',
        difficulty: 'Medium'
      },
      {
        id: 2,
        title: 'Science Quiz',
        description: 'Physics and chemistry',
        questions: 20,
        duration: '30 minutes',
        difficulty: 'Easy'
      },
      {
        id: 3,
        title: 'Literature Review',
        description: 'Classical literature analysis',
        questions: 15,
        duration: '60 minutes',
        difficulty: 'Hard'
      }
    ]);
  };

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      setLoading(false);
      Alert.alert('Welcome!', 'Login successful! Welcome to ProficiencyAI Native App');
    }, 1500);
  };

  const handleTakeQuiz = (quiz) => {
    Alert.alert(
      'Start Quiz',
      `Ready to take "${quiz.title}"?\n\nQuestions: ${quiz.questions}\nDuration: ${quiz.duration}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Quiz', 
          onPress: () => Alert.alert('Quiz Started', `Starting ${quiz.title}...`)
        }
      ]
    );
  };

  const testNativeFeature = (feature) => {
    Alert.alert(
      `Native ${feature}`,
      `This demonstrates native ${feature} capability in React Native app. In production, this would access device ${feature}.`,
      [{ text: 'OK' }]
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#667eea" />
        <ScrollView contentContainerStyle={styles.loginContainer}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>P</Text>
            </View>
            <Text style={styles.title}>ProficiencyAI</Text>
            <Text style={styles.subtitle}>Native iOS Mobile App</Text>
          </View>

          {/* Connection Status */}
          <View style={[styles.statusCard, {
            backgroundColor: connectionStatus === 'connected' ? '#dcfce7' : '#fef3c7'
          }]}>
            <Text style={styles.statusText}>
              {connectionStatus === 'connected' ? '✅ Backend Connected' : '📱 Demo Mode Active'}
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.loginCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Signing In...' : 'Sign In to Native App'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Native iOS Features</Text>
            <Text style={styles.feature}>📱 True React Native App</Text>
            <Text style={styles.feature}>🔒 Secure Authentication</Text>
            <Text style={styles.feature}>📊 Real-time Backend</Text>
            <Text style={styles.feature}>🎯 Native Performance</Text>
            <Text style={styles.feature}>📷 Camera Access</Text>
            <Text style={styles.feature}>🔔 Push Notifications</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#2563eb" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>P</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Welcome Back!</Text>
            <Text style={styles.headerSubtitle}>{email}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Connection Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Backend:</Text>
            <Text style={[styles.statusValue, {
              color: connectionStatus === 'connected' ? '#10b981' : '#f59e0b'
            }]}>
              {connectionStatus === 'connected' ? 'Connected ✅' : 'Demo Mode 📱'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>App Type:</Text>
            <Text style={[styles.statusValue, { color: '#2563eb' }]}>
              Native React Native ⚡
            </Text>
          </View>
        </View>

        {/* Available Quizzes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Assessments</Text>
          {quizzes.map((quiz) => (
            <View key={quiz.id} style={styles.quizItem}>
              <View style={styles.quizInfo}>
                <Text style={styles.quizTitle}>{quiz.title}</Text>
                <Text style={styles.quizDescription}>
                  {quiz.questions} questions • {quiz.duration}
                </Text>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{quiz.difficulty}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.quizButton}
                onPress={() => handleTakeQuiz(quiz)}
              >
                <Text style={styles.quizButtonText}>Take Quiz</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Native Features Demo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Test Native Features</Text>
          <View style={styles.featuresGrid}>
            <TouchableOpacity 
              style={styles.featureButton}
              onPress={() => testNativeFeature('Camera')}
            >
              <Text style={styles.featureButtonText}>📷 Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureButton}
              onPress={() => testNativeFeature('Microphone')}
            >
              <Text style={styles.featureButtonText}>🎤 Microphone</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureButton}
              onPress={() => testNativeFeature('Notifications')}
            >
              <Text style={styles.featureButtonText}>🔔 Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureButton}
              onPress={() => testNativeFeature('Storage')}
            >
              <Text style={styles.featureButtonText}>💾 Storage</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Information</Text>
          <Text style={styles.infoText}>• Running on React Native</Text>
          <Text style={styles.infoText}>• Native iOS components</Text>
          <Text style={styles.infoText}>• Connected to ProficiencyAI backend</Text>
          <Text style={styles.infoText}>• Full touch and gesture support</Text>
          <Text style={styles.infoText}>• Native performance and feel</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  statusCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  loginCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  loginButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  featuresContainer: {
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
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
    width: 50,
    height: 50,
    backgroundColor: '#1d4ed8',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#bfdbfe',
    fontSize: 14,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#374151',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  quizButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  quizButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureButton: {
    width: '48%',
    backgroundColor: '#eff6ff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  featureButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 6,
  },
});
