export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  timeLimit?: number;
  attemptsAllowed: number;
  passingScore?: number;
  status: 'draft' | 'published' | 'archived';
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'essay' | 'fill_in_blank';
  points: number;
  difficulty: number;
  answerOptions: AnswerOption[];
  correctAnswers: string[];
  feedback?: string;
  timeLimit?: number;
}

export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: Date;
  submittedAt?: Date;
  score?: number;
  status: 'in_progress' | 'submitted' | 'graded';
  responses: QuizResponse[];
  timeSpent: number;
  flaggedEvents: FlaggedEvent[];
}

export interface QuizResponse {
  id: string;
  questionId: string;
  selectedAnswers: string[];
  textResponse?: string;
  timeSpent: number;
  isCorrect?: boolean;
  points?: number;
}

export interface FlaggedEvent {
  id: string;
  type: 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'suspicious_behavior';
  timestamp: Date;
  details?: string;
}

export interface ExamSession {
  id: string;
  quizId: string;
  userId: string;
  sessionToken: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  proctorSettings: ProctoringSettings;
}

export interface ProctoringSettings {
  webcamRequired: boolean;
  microphoneRequired: boolean;
  screenRecording: boolean;
  lockdownMode: boolean;
  allowedApps: string[];
  flagSuspiciousBehavior: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'assignment' | 'grade' | 'alert' | 'reminder';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface StudyAid {
  id: string;
  title: string;
  type: 'summary' | 'flashcards' | 'practice_quiz' | 'concept_map';
  content: string;
  quizId?: string;
  userId: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type RootStackParamList = {
  AuthStack: undefined;
  MainTabs: undefined;
  ExamStack: { quizId: string };
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Exams: undefined;
  Grades: undefined;
  Profile: undefined;
};

export type ExamStackParamList = {
  ExamLobby: { quizId: string };
  ExamInterface: { quizId: string; attemptId: string };
  ExamReview: { attemptId: string };
};