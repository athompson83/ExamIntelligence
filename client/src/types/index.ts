export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: 'teacher' | 'student' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Testbank {
  id: number;
  title: string;
  description: string | null;
  creatorId: string;
  createdAt: Date;
  tags: string[];
  learningObjectives: string[];
  lastRevalidatedAt: Date | null;
  isPublic: boolean;
}

export interface Question {
  id: number;
  testbankId: number | null;
  questionText: string;
  questionType: 'multiple_choice' | 'multiple_response' | 'constructed_response' | 'hot_spot' | 'categorization' | 'formula' | 'true_false' | 'fill_blank' | 'essay' | 'matching' | 'ordering';
  difficultyScore: string;
  createdAt: Date;
  lastValidated: Date | null;
  tags: string[];
  aiFeedback: string | null;
  additionalData: any;
  points: number;
  timeLimit: number | null;
  bloomsLevel: string | null;
  answerOptions?: AnswerOption[];
}

export interface AnswerOption {
  id: number;
  questionId: number;
  answerText: string;
  isCorrect: boolean;
  displayOrder: number;
  mediaUrl: string | null;
  explanation: string | null;
}

export interface Quiz {
  id: number;
  title: string;
  description: string | null;
  creatorId: string;
  createdAt: Date;
  scheduleStartTime: Date | null;
  scheduleEndTime: Date | null;
  timeLimit: number | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  passwordProtected: boolean;
  password: string | null;
  ipLocking: boolean;
  allowedIps: string[];
  proctoringEnabled: boolean;
  adaptiveTesting: boolean;
  isPublished: boolean;
  settings: any;
  questions?: Question[];
}

export interface QuizResult {
  id: number;
  quizId: number;
  studentId: string;
  submissionDate: Date;
  score: string;
  totalPoints: number;
  timeSpent: number;
  attemptNumber: number;
  status: 'in_progress' | 'completed' | 'abandoned' | 'paused';
  overallAnalytics: any;
}

export interface QuizResponseItem {
  id: number;
  quizResultId: number;
  questionId: number;
  studentAnswer: any;
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent: number;
  feedbackProvided: string | null;
  flaggedForReview: boolean;
}

export interface ProctoringLog {
  id: number;
  quizResultId: number;
  eventTimestamp: Date;
  eventDescription: string | null;
  eventType: string | null;
  severity: 'low' | 'medium' | 'high';
  screenshotUrl: string | null;
  flagged: boolean;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  resolutionStatus: 'pending' | 'resolved' | 'dismissed';
}

export interface Resource {
  id: number;
  resourceType: 'study_guide' | 'lecture_notes' | 'improvement_plan';
  title: string;
  content: string | null;
  associatedTestbankId: number | null;
  associatedQuizId: number | null;
  createdAt: Date;
  createdBy: string | null;
  mediaAttachments: string[];
  isAiGenerated: boolean;
}

export interface Notification {
  id: number;
  userId: string;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
  readAt: Date | null;
  actionUrl: string | null;
  priority: 'low' | 'normal' | 'high';
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  difficultyScore: number;
  confidenceScore: number;
}

export interface SystemAnalytics {
  users: {
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
  };
  testbanks: {
    totalTestbanks: number;
  };
  quizzes: {
    totalQuizzes: number;
    activeQuizzes: number;
  };
  questions: {
    totalQuestions: number;
  };
}

export interface ProctoringSession {
  sessionId: string;
  studentId: string;
  quizId: number;
  startTime: Date;
  isActive: boolean;
  totalViolations: number;
  violationBreakdown: {
    low: number;
    medium: number;
    high: number;
    byType: Record<string, number>;
  };
}
