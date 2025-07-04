import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { initializeAuth } from '@/store/slices/authSlice';
import { RootStackParamList } from '@/types';

import LoadingScreen from '@/screens/LoadingScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import ExamNavigator from './ExamNavigator';
import SettingsScreen from '@/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading, isInitialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen 
          name="AuthStack" 
          component={AuthNavigator}
          options={{ animationTypeForReplace: 'pop' }}
        />
      ) : (
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={MainNavigator}
            options={{ animationTypeForReplace: 'push' }}
          />
          <Stack.Screen 
            name="ExamStack" 
            component={ExamNavigator}
            options={{
              presentation: 'fullScreenModal',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Settings',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}