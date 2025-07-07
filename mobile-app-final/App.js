import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password');

  const handleLogin = () => {
    if (email && password) {
      setIsLoggedIn(true);
      Alert.alert('Success', 'Connected to ProficiencyAI!');
    } else {
      Alert.alert('Error', 'Please enter email and password');
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.loginContainer}>
          <Text style={styles.title}>ProficiencyAI</Text>
          <Text style={styles.subtitle}>Mobile Assessment Platform</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
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
          
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
          
          <Text style={styles.hintText}>Demo: test@example.com</Text>
        </View>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ProficiencyAI Mobile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={() => setIsLoggedIn(false)}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome!</Text>
          <Text style={styles.welcomeText}>
            Successfully connected to ProficiencyAI platform
          </Text>
        </View>
        
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Available Features</Text>
          <Text style={styles.featureItem}>• Take Assessments</Text>
          <Text style={styles.featureItem}>• View Results</Text>
          <Text style={styles.featureItem}>• Study Materials</Text>
          <Text style={styles.featureItem}>• Progress Tracking</Text>
        </View>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Start Assessment</Text>
        </TouchableOpacity>
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2563eb',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  loginButton: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hintText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
    color: '#888',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  logoutButtonText: {
    color: '#2563eb',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  featuresCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  featureItem: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 10,
  },
  actionButton: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});