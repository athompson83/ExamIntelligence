import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  TextInput,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { loginUser } from '@/store/slices/authSlice';

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setShowError(true);
      return;
    }

    try {
      await dispatch(loginUser({ username, password })).unwrap();
    } catch (err) {
      setShowError(true);
    }
  };

  const handleReplitAuth = async () => {
    try {
      await dispatch(loginUser({ replitAuth: true })).unwrap();
    } catch (err) {
      setShowError(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            ProficiencyAI
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Advanced Educational Assessment Platform
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="headlineSmall" style={styles.loginTitle}>
              Sign In
            </Text>

            <TextInput
              label="Username or Email"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
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
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                'Sign In'
              )}
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text variant="bodySmall" style={styles.dividerText}>
                or
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              mode="outlined"
              onPress={handleReplitAuth}
              disabled={isLoading}
              style={styles.replitButton}
              contentStyle={styles.buttonContent}
            >
              Continue with Replit
            </Button>

            <View style={styles.footer}>
              <Text variant="bodySmall" style={styles.footerText}>
                Don't have an account? Contact your administrator
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={showError}
        onDismiss={() => setShowError(false)}
        duration={4000}
        style={styles.snackbar}
      >
        {error || 'Please check your credentials and try again'}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#3B82F6',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    elevation: 4,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  loginTitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#1F2937',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  buttonContent: {
    height: 48,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7280',
  },
  replitButton: {
    marginBottom: 24,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  snackbar: {
    backgroundColor: '#EF4444',
  },
});