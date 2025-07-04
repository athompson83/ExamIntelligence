import Constants from 'expo-constants';

// API Configuration
export const API_CONFIG = {
  BASE_URL: Constants.expoConfig?.extra?.apiUrl || 'https://your-domain.replit.app',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/login',
    LOGOUT: '/api/logout',
    USER: '/api/auth/user',
    REFRESH: '/api/auth/refresh',
  },
  
  // Quizzes
  QUIZZES: {
    LIST: '/api/quizzes',
    DETAIL: (id: string) => `/api/quizzes/${id}`,
    START: (id: string) => `/api/quizzes/${id}/start`,
    SUBMIT: (id: string) => `/api/quizzes/${id}/submit`,
    ATTEMPTS: (id: string) => `/api/quizzes/${id}/attempts`,
  },
  
  // Attempts
  ATTEMPTS: {
    DETAIL: (id: string) => `/api/attempts/${id}`,
    RESPONSES: (id: string) => `/api/attempts/${id}/responses`,
    SUBMIT_RESPONSE: (id: string) => `/api/attempts/${id}/responses`,
    FLAG_EVENT: (id: string) => `/api/attempts/${id}/flag`,
  },
  
  // Dashboard
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    RECENT_ACTIVITY: '/api/dashboard/recent-activity',
    UPCOMING_EXAMS: '/api/dashboard/upcoming-exams',
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/mark-all-read',
  },
  
  // Study Aids
  STUDY_AIDS: {
    LIST: '/api/study-aids',
    CREATE: '/api/study-aids',
    DETAIL: (id: string) => `/api/study-aids/${id}`,
  },
  
  // Analytics
  ANALYTICS: {
    PERFORMANCE: '/api/analytics/performance',
    PROGRESS: '/api/analytics/progress',
  },
  
  // User Management
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    DEVICE_REGISTRATION: '/api/users/devices',
  },
};

// WebSocket Configuration
export const WS_CONFIG = {
  BASE_URL: Constants.expoConfig?.extra?.wsUrl || 'wss://your-domain.replit.app/ws',
  RECONNECT_INTERVAL: 5000,
  MAX_RECONNECT_ATTEMPTS: 5,
  PING_INTERVAL: 30000,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  LANGUAGE: 'language',
  THEME: 'theme',
  LAST_SYNC: 'last_sync',
  OFFLINE_DATA: 'offline_data',
  DEVICE_ID: 'device_id',
  BIOMETRIC_ENABLED: 'biometric_enabled',
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'ProficiencyAI',
  VERSION: Constants.expoConfig?.version || '1.0.0',
  BUILD_NUMBER: Constants.expoConfig?.ios?.buildNumber || '1',
  
  // Feature Flags
  FEATURES: {
    BIOMETRIC_AUTH: true,
    OFFLINE_MODE: true,
    PUSH_NOTIFICATIONS: true,
    CAMERA_PROCTORING: true,
    SCREEN_RECORDING: true,
    ANTI_CHEATING: true,
  },
  
  // Exam Configuration
  EXAM: {
    MAX_OFFLINE_EXAMS: 5,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    INACTIVITY_WARNING: 300000, // 5 minutes
    SESSION_TIMEOUT: 3600000, // 1 hour
    MAX_TAB_SWITCHES: 3,
    MAX_APP_SWITCHES: 2,
  },
  
  // Notification Configuration
  NOTIFICATIONS: {
    CATEGORIES: {
      ASSIGNMENT: 'assignment',
      GRADE: 'grade', 
      ALERT: 'alert',
      REMINDER: 'reminder',
    },
    PRIORITY: {
      LOW: 'low',
      NORMAL: 'normal',
      HIGH: 'high',
      URGENT: 'urgent',
    },
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  EXAM_SESSION_EXPIRED: 'Your exam session has expired. Please contact your instructor.',
  CAMERA_PERMISSION_DENIED: 'Camera permission is required for proctored exams.',
  MICROPHONE_PERMISSION_DENIED: 'Microphone permission is required for proctored exams.',
  BIOMETRIC_NOT_AVAILABLE: 'Biometric authentication is not available on this device.',
  OFFLINE_MODE_DISABLED: 'Offline mode is not available for this exam.',
};