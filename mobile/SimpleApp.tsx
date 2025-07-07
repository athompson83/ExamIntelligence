import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const API_BASE_URL = 'https://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev';

export default function SimpleApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [username, setUsername] = useState('test@example.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // For demo purposes, simulate login
      setIsLoggedIn(true);
      await fetchQuizzes();
    } catch (error) {
      Alert.alert('Login Error', 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    }
  };

  const startQuiz = (quiz: any) => {
    Alert.alert(
      'Start Quiz',
      `Would you like to start "${quiz.title}"?\n\nQuestions: ${quiz.questionCount || quiz.questions?.length || 0}\nTime Limit: ${quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No time limit'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => Alert.alert('Quiz Started', 'Quiz interface would open here') }
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.loginContainer}>
          <Text style={styles.title}>ProficiencyAI Mobile</Text>
          <Text style={styles.subtitle}>Educational Assessment Platform</Text>
          
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Exams</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setIsLoggedIn(false)}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {quizzes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No quizzes available</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchQuizzes}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          quizzes.map((quiz: any) => (
            <TouchableOpacity
              key={quiz.id}
              style={styles.quizCard}
              onPress={() => startQuiz(quiz)}
            >
              <Text style={styles.quizTitle}>{quiz.title}</Text>
              <Text style={styles.quizDescription}>
                {quiz.description || 'No description available'}
              </Text>
              <View style={styles.quizMeta}>
                <Text style={styles.metaText}>
                  📝 {quiz.questionCount || quiz.questions?.length || 0} questions
                </Text>
                {quiz.timeLimit && (
                  <Text style={styles.metaText}>⏱️ {quiz.timeLimit} min</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2563EB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#2563EB',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  refreshText: {
    color: '#fff',
    fontSize: 16,
  },
  quizCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  quizDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  quizMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
  },
});