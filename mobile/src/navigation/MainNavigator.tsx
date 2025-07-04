import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { MainTabParamList } from '@/types';
import { AuthService } from '@/services/authService';

// Icons
import { MaterialIcons } from '@expo/vector-icons';

// Screens
import DashboardScreen from '@/screens/main/DashboardScreen';
import ExamsScreen from '@/screens/main/ExamsScreen';
import GradesScreen from '@/screens/main/GradesScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  const authService = AuthService.getInstance();
  const user = authService.getUser();
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Exams':
              iconName = isStudent ? 'quiz' : 'assignment';
              break;
            case 'Grades':
              iconName = isStudent ? 'grade' : 'grading';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'home';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        headerStyle: {
          backgroundColor: '#3B82F6',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
        }}
      />
      
      <Tab.Screen 
        name="Exams" 
        component={ExamsScreen}
        options={{
          title: isStudent ? 'My Exams' : 'Manage Exams',
          tabBarLabel: 'Exams',
        }}
      />
      
      <Tab.Screen 
        name="Grades" 
        component={GradesScreen}
        options={{
          title: isStudent ? 'My Grades' : 'Grade Exams',
          tabBarLabel: 'Grades',
        }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}