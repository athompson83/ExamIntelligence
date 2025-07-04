import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExamStackParamList } from '@/types';

import ExamListScreen from '@/screens/exam/ExamListScreen';
import ExamDetailScreen from '@/screens/exam/ExamDetailScreen';
import ExamPrepScreen from '@/screens/exam/ExamPrepScreen';
import ExamInterfaceScreen from '@/screens/exam/ExamInterfaceScreen';
import ExamResultScreen from '@/screens/exam/ExamResultScreen';

const Stack = createNativeStackNavigator<ExamStackParamList>();

export default function ExamNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="ExamList" 
        component={ExamListScreen}
        options={{
          title: 'Available Exams',
        }}
      />
      
      <Stack.Screen 
        name="ExamDetail" 
        component={ExamDetailScreen}
        options={{
          title: 'Exam Details',
        }}
      />
      
      <Stack.Screen 
        name="ExamPrep" 
        component={ExamPrepScreen}
        options={{
          title: 'Exam Preparation',
        }}
      />
      
      <Stack.Screen 
        name="ExamInterface" 
        component={ExamInterfaceScreen}
        options={{
          title: 'Taking Exam',
          headerLeft: () => null, // Disable back button during exam
          gestureEnabled: false, // Disable swipe back
        }}
      />
      
      <Stack.Screen 
        name="ExamResult" 
        component={ExamResultScreen}
        options={{
          title: 'Exam Results',
          headerLeft: () => null, // Disable back button after completion
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}