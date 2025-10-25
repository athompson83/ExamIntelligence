import {
  users,
  testbanks,
  questions,
  answerOptions,
  quizzes,
  quizQuestions,
  questionGroups,
  quizAttempts,
  quizResponses,
  accounts,
  catExams,
  catExamCategories,
  systemSettings,
  quizProgress,
  proctoringLogs,
  referenceBanks,
  references,
  scheduledAssignments,
  studyAids,
  assignmentSubmissions,
  mobileDevices,
  promptTemplates,
  llmProviders,
  customInstructions,
  activityLogs,
  subscriptions,
  invoices,
  notifications,
  type User,
  type UpsertUser,
  type Testbank,
  type InsertTestbank,
  type Question,
  type InsertQuestion,
  type AnswerOption,
  type InsertAnswerOption,
  type Quiz,
  type InsertQuiz,
  type QuizAttempt,
  type InsertQuizAttempt,
  type QuizResponse,
  type InsertQuizResponse,
  type Account,
  type InsertAccount,
  type QuestionGroup,
  type InsertQuestionGroup,
  type QuizQuestion,
  type InsertQuizQuestion,
  type QuizProgress,
  type InsertQuizProgress,
  type CatExam,
  type InsertCatExam,
  type CatExamCategory,
  type InsertCatExamCategory,
  type ProctoringLog,
  type InsertProctoringLog,
  type ReferenceBank,
  type InsertReferenceBank,
  type Reference,
  type InsertReference,
  type ScheduledAssignment,
  type InsertScheduledAssignment,
  type StudyAid,
  type InsertStudyAid,
  type AssignmentSubmission,
  type InsertAssignmentSubmission,
  type MobileDevice,
  type InsertMobileDevice,
  type PromptTemplate,
  type InsertPromptTemplate,
  type LlmProvider,
  type InsertLlmProvider,
  type CustomInstruction,
  type InsertCustomInstruction,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray, like, or, gte, lte, isNull, ne, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

// Generate unique IDs for new records
const generateId = () => nanoid();

// Optimized Storage Interface with proper typing
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(userId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getAllUsersWithAccountInfo(): Promise<(User & { account: Account | null })[]>;
  getUsersByAccount(accountId: string): Promise<User[]>;
  updateUserRole(userId: string, role: User['role']): Promise<User | undefined>;
  updateUserOnboardingStatus(userId: string, status: Record<string, unknown>): Promise<User | undefined>;
  bulkCreateUsers(users: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<User[]>;
  
  // System statistics
  getSystemStatistics(): Promise<{
    totalUsers: number;
    totalQuizzes: number;
    totalQuestions: number;
    totalAttempts: number;
    averageScore: number;
  }>;
  
  // Testbank operations
  createTestbank(testbank: InsertTestbank): Promise<Testbank>;
  getTestbank(id: string): Promise<Testbank | undefined>;
  getTestbankById(id: string): Promise<Testbank | undefined>;
  getTestbanksByAccount(accountId: string): Promise<Testbank[]>;
  getTestbanksByUser(userId: string): Promise<Testbank[]>;
  updateTestbank(id: string, testbank: Partial<InsertTestbank>): Promise<Testbank | undefined>;
  deleteTestbank(id: string): Promise<boolean>;
  
  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestionById(id: string): Promise<Question | undefined>;
  getQuestions(testbankId: string): Promise<Question[]>;
  getQuestionsByTestbank(testbankId: string): Promise<Question[]>;
  updateQuestion(id: string, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<boolean>;
  
  // Answer option operations
  createAnswerOption(option: InsertAnswerOption): Promise<AnswerOption>;
  getAnswerOptionsByQuestion(questionId: string): Promise<AnswerOption[]>;
  deleteAnswerOption(id: string): Promise<boolean>;
  
  // Quiz operations
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizzesByAccount(accountId: string): Promise<Quiz[]>;
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]>;
  getQuizById(id: string): Promise<Quiz | undefined>;
  updateQuiz(id: string, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  updateQuizQuestions(quizId: string, questions: InsertQuizQuestion[]): Promise<void>;
  updateQuizGroups(quizId: string, groups: InsertQuestionGroup[]): Promise<void>;
  addQuestionsToQuiz(quizId: string, questionIds: string[]): Promise<void>;
  deleteQuiz(id: string): Promise<boolean>;
  
  // Quiz management operations
  copyQuiz(originalQuizId: string, newTitle: string, userId: string): Promise<Quiz>;
  assignQuizToStudents(quizId: string, studentIds: string[], dueDate?: Date): Promise<ScheduledAssignment[]>;
  startLiveExam(quizId: string, teacherId: string): Promise<{ examId: string; joinCode: string }>;
  
  // Live exam operations
  createLiveExam(examData: {
    quizId: string;
    teacherId: string;
    startTime: Date;
    endTime: Date;
    joinCode?: string;
  }): Promise<{ examId: string; joinCode: string }>;
  updateLiveExam(id: string, examData: Partial<{
    startTime: Date;
    endTime: Date;
    status: string;
  }>): Promise<{ success: boolean }>;
  getLiveExams(teacherId: string): Promise<Array<{
    id: string;
    quizId: string;
    startTime: Date;
    endTime: Date;
    status: string;
    participantCount: number;
  }>>;
  deleteLiveExam(id: string): Promise<boolean>;
  
  // Quiz attempt operations
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempt(id: string): Promise<QuizAttempt | undefined>;
  getActiveQuizAttempts(userId: string): Promise<QuizAttempt[]>;
  updateQuizAttempt(id: string, data: Partial<QuizAttempt>): Promise<QuizAttempt | undefined>;
  getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]>;
  
  // Quiz response operations
  createQuizResponse(response: InsertQuizResponse): Promise<QuizResponse>;
  getQuizResponsesByAttempt(attemptId: string): Promise<QuizResponse[]>;
  
  // Mobile API operations
  getDashboardStats(userId: string): Promise<{
    assignedQuizzes: number;
    completedQuizzes: number;
    averageScore: number;
    upcomingDeadlines: number;
  }>;
  getAdditionalDashboardStats(userId?: string): Promise<{
    totalStudents: number;
    activeExams: number;
    totalSubmissions: number;
    averageCompletionRate: number;
  }>;
  getMobileAssignments(userId: string): Promise<ScheduledAssignment[]>;
  getStudentProfile(userId: string): Promise<User | undefined>;
  getAssignmentQuestions(assignmentId: string): Promise<Question[]>;
  startAssignment(userId: string, assignmentId: string): Promise<QuizAttempt>;
  submitAssignment(sessionId: string, responses: Record<string, unknown>, timeSpent: number): Promise<AssignmentSubmission>;
  getActiveExamSessions(userId: string): Promise<QuizAttempt[]>;
  getQuizzesByUser(userId: string): Promise<Quiz[]>;
  getTestbanksByUser(userId: string): Promise<Testbank[]>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  
  // Proctoring and validation operations
  createProctoringLog(log: InsertProctoringLog): Promise<ProctoringLog>;
  updateProctoringLog(id: string, data: Partial<ProctoringLog>): Promise<ProctoringLog | undefined>;
  createValidationLog(log: { userId: string; action: string; metadata: Record<string, unknown> }): Promise<ActivityLog>;
  markNotificationAsRead(id: string): Promise<{ success: boolean }>;
  
  // Analytics operations
  getQuizAnalytics(quizId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    completionRate: number;
    averageTime: number;
  }>;
  getTestbankAnalytics(testbankId: string): Promise<{
    totalQuestions: number;
    usageCount: number;
    averageDifficulty: number;
  }>;
  
  // Reference management operations
  createReferenceBank(data: InsertReferenceBank): Promise<ReferenceBank>;
  getReferenceBanksByUser(userId: string): Promise<ReferenceBank[]>;
  getReferenceBank(id: string): Promise<ReferenceBank | undefined>;
  updateReferenceBank(id: string, data: Partial<ReferenceBank>): Promise<ReferenceBank | undefined>;
  deleteReferenceBank(id: string): Promise<boolean>;
  createReference(data: InsertReference): Promise<Reference>;
  getReferencesByBank(bankId: string): Promise<Reference[]>;
  updateReference(id: string, data: Partial<Reference>): Promise<Reference | undefined>;
  deleteReference(id: string): Promise<boolean>;
  
  // Account management operations
  getAccountById(accountId: string): Promise<Account | undefined>;
  getAccountsByUser(userId: string): Promise<Account[]>;
  updateAccount(accountId: string, data: Partial<Account>): Promise<Account | undefined>;
  getAccountCount(): Promise<number>;
  
  // Scheduled assignments operations
  getScheduledAssignmentsByStudent(studentId: string): Promise<ScheduledAssignment[]>;
  getScheduledAssignmentsByAccount(accountId: string): Promise<ScheduledAssignment[]>;
  createScheduledAssignment(data: InsertScheduledAssignment): Promise<ScheduledAssignment>;
  
  // Assignment submissions operations
  getAssignmentSubmissionsByStudent(studentId: string): Promise<AssignmentSubmission[]>;
  getAssignmentSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]>;
  createAssignmentSubmission(data: InsertAssignmentSubmission): Promise<AssignmentSubmission>;
  
  // Mobile device operations
  getMobileDevicesByUser(userId: string): Promise<MobileDevice[]>;
  createMobileDevice(data: InsertMobileDevice): Promise<MobileDevice>;
  
  // Prompt Template Methods
  getAllPromptTemplates(): Promise<PromptTemplate[]>;
  createPromptTemplate(template: InsertPromptTemplate): Promise<PromptTemplate>;
  updatePromptTemplate(id: string, template: Partial<InsertPromptTemplate>): Promise<PromptTemplate | undefined>;
  deletePromptTemplate(id: string): Promise<boolean>;
  getPromptTemplate(id: string): Promise<PromptTemplate | undefined>;
  getPromptTemplatesByCategory(category: string, accountId?: string): Promise<PromptTemplate[]>;
  getPromptTemplatesByAccount(accountId: string): Promise<PromptTemplate[]>;
  getSystemDefaultPromptTemplates(): Promise<PromptTemplate[]>;
  
  // LLM Provider Methods
  getAllLlmProviders(): Promise<LlmProvider[]>;
  getLlmProvider(id: string): Promise<LlmProvider | undefined>;
  getLlmProvidersByAccount(accountId: string): Promise<LlmProvider[]>;
  getActiveLlmProviders(): Promise<LlmProvider[]>;
  createLlmProvider(providerData: InsertLlmProvider): Promise<LlmProvider>;
  updateLlmProvider(id: string, providerData: Partial<LlmProvider>): Promise<LlmProvider | undefined>;
  
  // Custom Instructions Methods
  createCustomInstruction(instructionData: InsertCustomInstruction): Promise<CustomInstruction>;
  getCustomInstruction(id: string): Promise<CustomInstruction | undefined>;
  getCustomInstructionsByCategory(category: string): Promise<CustomInstruction[]>;
  getCustomInstructionsByAccount(accountId: string): Promise<CustomInstruction[]>;
  getPublicCustomInstructions(): Promise<CustomInstruction[]>;
  updateCustomInstruction(id: string, instructionData: Partial<CustomInstruction>): Promise<CustomInstruction | undefined>;
  deleteCustomInstruction(id: string): Promise<boolean>;
  
  // Question Group Methods
  getQuestionGroupsByQuiz(quizId: string): Promise<QuestionGroup[]>;
  createQuestionGroup(groupData: InsertQuestionGroup): Promise<QuestionGroup>;
  updateQuestionGroup(id: string, groupData: Partial<QuestionGroup>): Promise<QuestionGroup | undefined>;
  deleteQuestionGroup(id: string): Promise<boolean>;
  assignQuestionsToGroup(groupId: string, questionIds: string[]): Promise<void>;
  getQuestionsByQuiz(quizId: string): Promise<Question[]>;
  
  // Shared Content Methods
  getSharedTestbanksByAccount(accountId: string): Promise<Testbank[]>;
  getSharedQuizzesByAccount(accountId: string): Promise<Quiz[]>;
  
  // CAT Exam Methods
  createCATExam(examData: InsertCatExam): Promise<CatExam>;
  updateCATExam(id: string, examData: Partial<CatExam>): Promise<CatExam | undefined>;
  getCATExam(id: string): Promise<CatExam | undefined>;
  getCATExams(accountId: string): Promise<CatExam[]>;
  deleteCATExam(id: string): Promise<boolean>;
  
  // CAT Exam Category Methods
  createCATExamCategory(data: InsertCatExamCategory): Promise<CatExamCategory>;
  updateCATExamCategory(id: string, data: Partial<CatExamCategory>): Promise<CatExamCategory | undefined>;
  getCATExamCategories(catExamId: string): Promise<CatExamCategory[]>;
  deleteCATExamCategory(id: string): Promise<boolean>;
  
  // Study Aid Methods
  getStudyAids(userId: string): Promise<StudyAid[]>;
  getStudyAidsByUser(userId: string): Promise<StudyAid[]>;
  getStudyAidsByStudent(studentId: string): Promise<StudyAid[]>;
  createStudyAid(data: InsertStudyAid): Promise<StudyAid>;
  
  // Billing & Subscription Methods
  getSubscriptionByAccountId(accountId: string): Promise<any | undefined>;
  createSubscription(data: any): Promise<any>;
  updateSubscription(id: string, data: any): Promise<any | undefined>;
  getInvoicesByAccountId(accountId: string): Promise<any[]>;
  createInvoice(data: any): Promise<any>;
  
  // System Settings Methods
  getSystemSetting(key: string): Promise<string | undefined>;
  updateSystemSetting(setting: { key: string; value: string; isSecret?: boolean; description?: string; updatedBy?: string }): Promise<any>;
  getAllSystemSettings(): Promise<any[]>;
  
  // Activity Log Methods
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(filters?: { userId?: string; accountId?: string; action?: string; startDate?: Date; endDate?: Date }): Promise<ActivityLog[]>;
  
  // Notification Methods
  getNotifications(userId: string): Promise<any[]>;
  createNotification(data: any): Promise<any>;
  markNotificationRead(id: string, userId: string): Promise<boolean>;
  
  // Quiz Progress Methods
  getQuizProgress(attemptId: string): Promise<QuizProgress | undefined>;
  upsertQuizProgress(progress: InsertQuizProgress): Promise<QuizProgress>;
  
  // Proctoring Log Methods
  getProctoringLogs(attemptId: string): Promise<ProctoringLog[]>;
  
  // Comprehensive Analytics Methods
  getQuestionPerformanceMetrics(questionId: string): Promise<{
    totalResponses: number;
    correctRate: number;
    averageTimeSpent: number;
    discriminationIndex: number;
  }>;
  
  getStudentPerformanceMetrics(studentId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    completionRate: number;
    timeSpentTotal: number;
  }>;
}

// Export the storage interface implementation
export { storage } from "./storage-simple";