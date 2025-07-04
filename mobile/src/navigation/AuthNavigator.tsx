import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/types';

import LoginScreen from '@/screens/auth/LoginScreen';
import WelcomeScreen from '@/screens/auth/WelcomeScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="Login"
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
      />
      <Stack.Screen 
        name="Register" 
        component={WelcomeScreen}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={WelcomeScreen}
      />
    </Stack.Navigator>
  );
}