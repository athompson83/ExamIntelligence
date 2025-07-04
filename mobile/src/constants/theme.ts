import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3B82F6',
    primaryContainer: '#EBF4FF',
    secondary: '#6366F1',
    secondaryContainer: '#EEF2FF',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    background: '#FAFBFC',
    error: '#EF4444',
    errorContainer: '#FEF2F2',
    success: '#10B981',
    successContainer: '#ECFDF5',
    warning: '#F59E0B',
    warningContainer: '#FFFBEB',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#60A5FA',
    primaryContainer: '#1E3A8A',
    secondary: '#818CF8',
    secondaryContainer: '#312E81',
    surface: '#1F2937',
    surfaceVariant: '#374151',
    background: '#111827',
    error: '#F87171',
    errorContainer: '#7F1D1D',
    success: '#34D399',
    successContainer: '#064E3B',
    warning: '#FBBF24',
    warningContainer: '#92400E',
  },
};

export const theme = lightTheme;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};