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
import type { IStorage } from "./storage";

const generateId = () => nanoid();

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserById(userId: string): Promise<User | undefined> {
    return this.getUser(userId);
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const result = await db.insert(users).values(user)
      .onConflictDoUpdate({ target: users.id, set: user })
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllUsersWithAccountInfo(): Promise<(User & { account: Account | null })[]> {
    // OPTIMIZED: Use a single JOIN query instead of two separate queries
    const result = await db.select({
      // User fields
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      role: users.role,
      accountId: users.accountId,
      accessibilitySettings: users.accessibilitySettings,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      // Account fields
      accountName: accounts.name,
      accountTier: accounts.subscriptionTier,
      accountIsActive: accounts.isActive,
    })
    .from(users)
    .leftJoin(accounts, eq(users.accountId, accounts.id))
    .orderBy(desc(users.createdAt));
    
    return result.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      profileImageUrl: row.profileImageUrl,
      role: row.role,
      accountId: row.accountId,
      accessibilitySettings: row.accessibilitySettings,
      isActive: row.isActive,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      account: row.accountId ? {
        id: row.accountId,
        name: row.accountName!,
        subscriptionTier: row.accountTier!,
        isActive: row.accountIsActive!
      } as Account : null
    }));
  }

  async getUsersByAccount(accountId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.accountId, accountId));
  }

  async updateUserRole(userId: string, role: User['role']): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ role } as any)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserOnboardingStatus(userId: string, status: Record<string, unknown>): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ onboardingStatus: status } as any)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async bulkCreateUsers(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<User[]> {
    if (userData.length === 0) return [];
    const usersToInsert = userData.map(u => ({ ...u, id: generateId() }));
    return await db.insert(users).values(usersToInsert as any).returning();
  }

  // System statistics
  async getSystemStatistics() {
    const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
    const totalQuizzes = await db.select({ count: sql`count(*)` }).from(quizzes);
    const totalQuestions = await db.select({ count: sql`count(*)` }).from(questions);
    const totalAttempts = await db.select({ count: sql`count(*)` }).from(quizAttempts);
    const avgScore = await db.select({ avg: sql`avg(score)` }).from(quizAttempts);
    
    return {
      totalUsers: Number(totalUsers[0]?.count || 0),
      totalQuizzes: Number(totalQuizzes[0]?.count || 0),
      totalQuestions: Number(totalQuestions[0]?.count || 0),
      totalAttempts: Number(totalAttempts[0]?.count || 0),
      averageScore: Number(avgScore[0]?.avg || 0)
    };
  }

  // Testbank operations
  async createTestbank(testbank: InsertTestbank): Promise<Testbank> {
    const result = await db.insert(testbanks).values(testbank as any).returning();
    return result[0];
  }

  async getTestbank(id: string): Promise<Testbank | undefined> {
    const result = await db.select().from(testbanks).where(eq(testbanks.id, id)).limit(1);
    return result[0];
  }

  async getTestbankById(id: string): Promise<Testbank | undefined> {
    return this.getTestbank(id);
  }

  async getTestbanksByAccount(accountId: string): Promise<Testbank[]> {
    return await db.select().from(testbanks).where(eq(testbanks.accountId, accountId));
  }

  async updateTestbank(id: string, testbank: Partial<InsertTestbank>): Promise<Testbank | undefined> {
    const result = await db.update(testbanks)
      .set(testbank as any)
      .where(eq(testbanks.id, id))
      .returning();
    return result[0];
  }

  async deleteTestbank(id: string): Promise<boolean> {
    const result = await db.delete(testbanks).where(eq(testbanks.id, id));
    return result.rowCount > 0;
  }

  // Question operations
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const result = await db.insert(questions).values(question as any).returning();
    return result[0];
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const result = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
    return result[0];
  }

  async getQuestionById(id: string): Promise<Question | undefined> {
    return this.getQuestion(id);
  }

  async getQuestions(testbankId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.testbankId, testbankId));
  }

  async getQuestionsByTestbank(testbankId: string): Promise<Question[]> {
    return this.getQuestions(testbankId);
  }

  async updateQuestion(id: string, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    const result = await db.update(questions)
      .set(question as any)
      .where(eq(questions.id, id))
      .returning();
    return result[0];
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const result = await db.delete(questions).where(eq(questions.id, id));
    return result.rowCount > 0;
  }

  // Implement all other required methods with basic functionality
  async createAnswerOption(option: InsertAnswerOption): Promise<AnswerOption> {
    const result = await db.insert(answerOptions).values(option as any).returning();
    return result[0];
  }

  async getAnswerOptionsByQuestion(questionId: string): Promise<AnswerOption[]> {
    return await db.select().from(answerOptions).where(eq(answerOptions.questionId, questionId));
  }

  async deleteAnswerOption(id: string): Promise<boolean> {
    const result = await db.delete(answerOptions).where(eq(answerOptions.id, id));
    return result.rowCount > 0;
  }

  // Quiz operations
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const result = await db.insert(quizzes).values(quiz as any).returning();
    return result[0];
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const result = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
    return result[0];
  }

  async getQuizById(id: string): Promise<Quiz | undefined> {
    return this.getQuiz(id);
  }

  async getQuizzesByAccount(accountId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.accountId, accountId));
  }

  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    return await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId));
  }

  async updateQuiz(id: string, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const result = await db.update(quizzes)
      .set(quiz as any)
      .where(eq(quizzes.id, id))
      .returning();
    return result[0];
  }

  async updateQuizQuestions(quizId: string, questions: InsertQuizQuestion[]): Promise<void> {
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));
    if (questions.length > 0) {
      await db.insert(quizQuestions).values(questions as any);
    }
  }

  async updateQuizGroups(quizId: string, groups: InsertQuestionGroup[]): Promise<void> {
    await db.delete(questionGroups).where(eq(questionGroups.quizId, quizId));
    if (groups.length > 0) {
      await db.insert(questionGroups).values(groups as any);
    }
  }

  async addQuestionsToQuiz(quizId: string, questionIds: string[]): Promise<void> {
    const quizQuestionsToAdd = questionIds.map((qId, index) => ({
      quizId,
      questionId: qId,
      order: index
    }));
    await db.insert(quizQuestions).values(quizQuestionsToAdd);
  }

  async deleteQuiz(id: string): Promise<boolean> {
    const result = await db.delete(quizzes).where(eq(quizzes.id, id));
    return result.rowCount > 0;
  }

  // Implement the remaining required methods with basic functionality
  async copyQuiz(originalQuizId: string, newTitle: string, userId: string): Promise<Quiz> {
    const original = await this.getQuiz(originalQuizId);
    if (!original) throw new Error("Quiz not found");
    
    const newQuiz: any = {
      ...original,
      id: undefined,
      title: newTitle,
      creatorId: userId
    };
    
    return await this.createQuiz(newQuiz);
  }

  async assignQuizToStudents(quizId: string, studentIds: string[], dueDate?: Date): Promise<ScheduledAssignment[]> {
    const assignments = studentIds.map(studentId => ({
      quizId,
      studentId,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }));
    
    const results = await db.insert(scheduledAssignments).values(assignments as any).returning();
    return results;
  }

  async startLiveExam(quizId: string, teacherId: string): Promise<{ examId: string; joinCode: string }> {
    const examId = generateId();
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    return { examId, joinCode };
  }

  async createLiveExam(examData: any): Promise<{ examId: string; joinCode: string }> {
    const examId = generateId();
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    return { examId, joinCode };
  }

  async updateLiveExam(id: string, examData: any): Promise<{ success: boolean }> {
    return { success: true };
  }

  async getLiveExams(teacherId: string): Promise<any[]> {
    return [];
  }

  async deleteLiveExam(id: string): Promise<boolean> {
    return true;
  }

  // Implement all other methods with basic/mock implementations
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const result = await db.insert(quizAttempts).values(attempt as any).returning();
    return result[0];
  }

  async getQuizAttempt(id: string): Promise<QuizAttempt | undefined> {
    const result = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id)).limit(1);
    return result[0];
  }

  async getActiveQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts)
      .where(and(
        eq(quizAttempts.studentId, userId),
        eq(quizAttempts.status, 'in_progress')
      ));
  }

  async updateQuizAttempt(id: string, data: Partial<QuizAttempt>): Promise<QuizAttempt | undefined> {
    const result = await db.update(quizAttempts)
      .set(data)
      .where(eq(quizAttempts.id, id))
      .returning();
    return result[0];
  }

  async getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.studentId, userId));
  }

  // Implement remaining methods with basic implementations
  async createQuizResponse(response: InsertQuizResponse): Promise<QuizResponse> {
    const result = await db.insert(quizResponses).values(response as any).returning();
    return result[0];
  }

  async getQuizResponsesByAttempt(attemptId: string): Promise<QuizResponse[]> {
    return await db.select().from(quizResponses).where(eq(quizResponses.attemptId, attemptId));
  }

  // Mobile API operations
  async getDashboardStats(userId: string) {
    return {
      assignedQuizzes: 0,
      completedQuizzes: 0,
      averageScore: 0,
      upcomingDeadlines: 0
    };
  }

  async getAdditionalDashboardStats(userId?: string) {
    const totalStudents = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.role, 'student'));
    
    const activeExams = await db.select({ count: sql`count(*)` })
      .from(quizAttempts)
      .where(sql`${quizAttempts.status} = 'in_progress'`);
    
    const totalSubmissions = await db.select({ count: sql`count(*)` })
      .from(assignmentSubmissions);
    
    const completedAttempts = await db.select({ count: sql`count(*)` })
      .from(quizAttempts)
      .where(sql`${quizAttempts.status} = 'completed'`);
    
    const allAttempts = await db.select({ count: sql`count(*)` })
      .from(quizAttempts);
    
    const totalAttemptsCount = Number(allAttempts[0]?.count || 1);
    const completedCount = Number(completedAttempts[0]?.count || 0);
    
    return {
      totalStudents: Number(totalStudents[0]?.count || 0),
      activeExams: Number(activeExams[0]?.count || 0),
      totalSubmissions: Number(totalSubmissions[0]?.count || 0),
      averageCompletionRate: totalAttemptsCount > 0 ? (completedCount / totalAttemptsCount) * 100 : 0
    };
  }

  async getMobileAssignments(userId: string): Promise<ScheduledAssignment[]> {
    // Get the user to access their accountId
    const user = await this.getUser(userId);
    if (!user || !user.accountId) return [];
    
    const now = new Date();
    
    // Query scheduledAssignments directly by student
    // Return all assignments where:
    // 1. The assignment is for the user's account
    // 2. The current time is between availableFrom and availableUntil
    // 3. Either targetAll is true OR userId is in targetStudents array
    // 4. Assignment is active
    const assignments = await db.select()
      .from(scheduledAssignments)
      .where(
        and(
          eq(scheduledAssignments.accountId, user.accountId),
          lte(scheduledAssignments.availableFrom, now),
          gte(scheduledAssignments.availableUntil, now),
          eq(scheduledAssignments.isActive, true),
          or(
            eq(scheduledAssignments.targetAll, true),
            sql`${scheduledAssignments.targetStudents}::jsonb @> ${JSON.stringify([userId])}::jsonb`
          )
        )
      );
    
    return assignments;
  }

  async getStudentProfile(userId: string): Promise<User | undefined> {
    return this.getUser(userId);
  }

  async getAssignmentQuestions(assignmentId: string): Promise<Question[]> {
    return [];
  }

  async startAssignment(userId: string, assignmentId: string): Promise<QuizAttempt> {
    const attempt = {
      quizId: assignmentId,
      studentId: userId,
      startedAt: new Date(),
      status: 'in_progress' as const
    };
    const result = await db.insert(quizAttempts).values(attempt).returning();
    return result[0];
  }

  async submitAssignment(sessionId: string, responses: Record<string, unknown>, timeSpent: number): Promise<AssignmentSubmission> {
    const submission = {
      assignmentId: sessionId,
      studentId: 'unknown',
      submittedAt: new Date(),
      score: 0,
      responses,
      timeSpent
    };
    const result = await db.insert(assignmentSubmissions).values(submission as any).returning();
    return result[0];
  }

  async getActiveExamSessions(userId: string): Promise<QuizAttempt[]> {
    return this.getActiveQuizAttempts(userId);
  }

  async getQuizzesByUser(userId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.creatorId, userId));
  }

  async getTestbanksByUser(userId: string): Promise<Testbank[]> {
    return await db.select().from(testbanks).where(eq(testbanks.creatorId, userId));
  }

  async getNotificationsByUser(userId: string): Promise<any[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  // Implement all other required methods
  async createProctoringLog(log: InsertProctoringLog): Promise<ProctoringLog> {
    const result = await db.insert(proctoringLogs).values(log as any).returning();
    return result[0];
  }

  async updateProctoringLog(id: string, data: Partial<ProctoringLog>): Promise<ProctoringLog | undefined> {
    const result = await db.update(proctoringLogs)
      .set(data)
      .where(eq(proctoringLogs.id, id))
      .returning();
    return result[0];
  }

  async createValidationLog(log: any): Promise<ActivityLog> {
    const result = await db.insert(activityLogs).values(log).returning();
    return result[0];
  }

  async markNotificationAsRead(id: string): Promise<{ success: boolean }> {
    const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    if (result.length > 0) {
      await db.update(notifications)
        .set({})
        .where(eq(notifications.id, id));
    }
    return { success: true };
  }

  // Analytics operations
  async getQuizAnalytics(quizId: string) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      completionRate: 0,
      averageTime: 0
    };
  }

  async getTestbankAnalytics(testbankId: string) {
    return {
      totalQuestions: 0,
      usageCount: 0,
      averageDifficulty: 0
    };
  }

  // Reference management
  async createReferenceBank(data: InsertReferenceBank): Promise<ReferenceBank> {
    const result = await db.insert(referenceBanks).values(data as any).returning();
    return result[0];
  }

  async getReferenceBanksByUser(userId: string): Promise<ReferenceBank[]> {
    return await db.select().from(referenceBanks).where(eq(referenceBanks.creatorId, userId));
  }

  async getReferenceBank(id: string): Promise<ReferenceBank | undefined> {
    const result = await db.select().from(referenceBanks).where(eq(referenceBanks.id, id)).limit(1);
    return result[0];
  }

  async updateReferenceBank(id: string, data: Partial<ReferenceBank>): Promise<ReferenceBank | undefined> {
    const result = await db.update(referenceBanks)
      .set(data)
      .where(eq(referenceBanks.id, id))
      .returning();
    return result[0];
  }

  async deleteReferenceBank(id: string): Promise<boolean> {
    const result = await db.delete(referenceBanks).where(eq(referenceBanks.id, id));
    return result.rowCount > 0;
  }

  async createReference(data: InsertReference): Promise<Reference> {
    const result = await db.insert(references).values(data as any).returning();
    return result[0];
  }

  async getReferencesByBank(bankId: string): Promise<Reference[]> {
    return await db.select().from(references).where(eq(references.bankId, bankId));
  }

  async updateReference(id: string, data: Partial<Reference>): Promise<Reference | undefined> {
    const result = await db.update(references)
      .set(data)
      .where(eq(references.id, id))
      .returning();
    return result[0];
  }

  async deleteReference(id: string): Promise<boolean> {
    const result = await db.delete(references).where(eq(references.id, id));
    return result.rowCount > 0;
  }

  // Account management
  async getAccountById(accountId: string): Promise<Account | undefined> {
    const result = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    return result[0];
  }

  async getAccountsByUser(userId: string): Promise<Account[]> {
    const user = await this.getUser(userId);
    if (!user?.accountId) return [];
    const account = await this.getAccountById(user.accountId);
    return account ? [account] : [];
  }

  async updateAccount(accountId: string, data: Partial<Account>): Promise<Account | undefined> {
    const result = await db.update(accounts)
      .set(data)
      .where(eq(accounts.id, accountId))
      .returning();
    return result[0];
  }

  async getAccountCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(accounts);
    return Number(result[0]?.count || 0);
  }

  // Scheduled assignments
  async getScheduledAssignmentsByStudent(studentId: string): Promise<ScheduledAssignment[]> {
    // Get the user to access their accountId
    const user = await this.getUser(studentId);
    if (!user || !user.accountId) return [];
    
    const now = new Date();
    
    // Query scheduledAssignments directly by student
    // Return all assignments where:
    // 1. The assignment is for the user's account
    // 2. The current time is between availableFrom and availableUntil
    // 3. Either targetAll is true OR studentId is in targetStudents array
    // 4. Assignment is active
    const assignments = await db.select()
      .from(scheduledAssignments)
      .where(
        and(
          eq(scheduledAssignments.accountId, user.accountId),
          lte(scheduledAssignments.availableFrom, now),
          gte(scheduledAssignments.availableUntil, now),
          eq(scheduledAssignments.isActive, true),
          or(
            eq(scheduledAssignments.targetAll, true),
            sql`${scheduledAssignments.targetStudents}::jsonb @> ${JSON.stringify([studentId])}::jsonb`
          )
        )
      );
    
    return assignments;
  }

  async getScheduledAssignmentsByAccount(accountId: string): Promise<ScheduledAssignment[]> {
    return await db.select().from(scheduledAssignments).where(eq(scheduledAssignments.accountId, accountId));
  }

  async createScheduledAssignment(data: InsertScheduledAssignment): Promise<ScheduledAssignment> {
    const result = await db.insert(scheduledAssignments).values(data as any).returning();
    return result[0];
  }

  // Assignment submissions
  async getAssignmentSubmissionsByStudent(studentId: string): Promise<AssignmentSubmission[]> {
    return await db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.studentId, studentId));
  }

  async getAssignmentSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]> {
    return await db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.assignmentId, assignmentId));
  }

  async createAssignmentSubmission(data: InsertAssignmentSubmission): Promise<AssignmentSubmission> {
    const result = await db.insert(assignmentSubmissions).values(data as any).returning();
    return result[0];
  }

  // Mobile devices
  async getMobileDevicesByUser(userId: string): Promise<MobileDevice[]> {
    return await db.select().from(mobileDevices).where(eq(mobileDevices.userId, userId));
  }

  async createMobileDevice(data: InsertMobileDevice): Promise<MobileDevice> {
    const result = await db.insert(mobileDevices).values(data as any).returning();
    return result[0];
  }

  // Prompt templates
  async getAllPromptTemplates(): Promise<PromptTemplate[]> {
    return await db.select().from(promptTemplates);
  }

  async createPromptTemplate(template: InsertPromptTemplate): Promise<PromptTemplate> {
    const result = await db.insert(promptTemplates).values(template as any).returning();
    return result[0];
  }

  async updatePromptTemplate(id: string, template: Partial<InsertPromptTemplate>): Promise<PromptTemplate | undefined> {
    const result = await db.update(promptTemplates)
      .set(template as any)
      .where(eq(promptTemplates.id, id))
      .returning();
    return result[0];
  }

  async deletePromptTemplate(id: string): Promise<boolean> {
    const result = await db.delete(promptTemplates).where(eq(promptTemplates.id, id));
    return result.rowCount > 0;
  }

  // LLM providers
  async getAllLlmProviders(): Promise<LlmProvider[]> {
    return await db.select().from(llmProviders);
  }

  async createLlmProvider(provider: InsertLlmProvider): Promise<LlmProvider> {
    const result = await db.insert(llmProviders).values(provider as any).returning();
    return result[0];
  }

  async updateLlmProvider(id: string, provider: Partial<InsertLlmProvider>): Promise<LlmProvider | undefined> {
    const result = await db.update(llmProviders)
      .set(provider as any)
      .where(eq(llmProviders.id, id))
      .returning();
    return result[0];
  }

  async deleteLlmProvider(id: string): Promise<boolean> {
    const result = await db.delete(llmProviders).where(eq(llmProviders.id, id));
    return result.rowCount > 0;
  }

  // Custom instructions
  async getAllCustomInstructions(): Promise<CustomInstruction[]> {
    return await db.select().from(customInstructions);
  }

  async createCustomInstruction(instruction: InsertCustomInstruction): Promise<CustomInstruction> {
    const result = await db.insert(customInstructions).values(instruction as any).returning();
    return result[0];
  }

  async updateCustomInstruction(id: string, instruction: Partial<InsertCustomInstruction>): Promise<CustomInstruction | undefined> {
    const result = await db.update(customInstructions)
      .set(instruction as any)
      .where(eq(customInstructions.id, id))
      .returning();
    return result[0];
  }

  async deleteCustomInstruction(id: string): Promise<boolean> {
    const result = await db.delete(customInstructions).where(eq(customInstructions.id, id));
    return result.rowCount > 0;
  }

  // System settings
  async getSystemSetting(key: string): Promise<any | undefined> {
    const result = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
    return result[0]?.value;
  }

  async updateSystemSetting(setting: { key: string; value: string; isSecret?: boolean; description?: string; updatedBy?: string }): Promise<void> {
    await db.insert(systemSettings)
      .values({
        key: setting.key,
        value: setting.value,
        isSecret: setting.isSecret,
        description: setting.description,
        updatedBy: setting.updatedBy
      } as any)
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { 
          value: setting.value, 
          isSecret: setting.isSecret,
          description: setting.description,
          updatedBy: setting.updatedBy,
          updatedAt: new Date() 
        } as any
      });
  }

  async getAllSystemSettings(): Promise<any[]> {
    return await db.select().from(systemSettings);
  }

  // Activity logs
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLogs).values(log as any).returning();
    return result[0];
  }

  async getActivityLogs(filters?: any): Promise<ActivityLog[]> {
    let query = db.select().from(activityLogs);
    
    if (filters) {
      const conditions = [];
      if (filters.userId) conditions.push(eq(activityLogs.userId, filters.userId));
      if (filters.accountId) conditions.push(eq(activityLogs.accountId, filters.accountId));
      if (filters.action) conditions.push(eq(activityLogs.action, filters.action));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }
    
    return await query;
  }

  // Notifications
  async getNotifications(userId: string): Promise<any[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async createNotification(data: any): Promise<any> {
    const result = await db.insert(notifications).values(data).returning();
    return result[0];
  }

  async markNotificationRead(id: string, userId: string): Promise<boolean> {
    const existing = await db.select().from(notifications)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, userId)
      ))
      .limit(1);
    
    if (existing.length === 0) return false;
    
    await db.update(notifications)
      .set({})
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, userId)
      ));
    return true;
  }

  // Quiz progress
  async getQuizProgress(attemptId: string): Promise<QuizProgress | undefined> {
    const result = await db.select().from(quizProgress).where(eq(quizProgress.attemptId, attemptId)).limit(1);
    return result[0];
  }

  async upsertQuizProgress(progress: InsertQuizProgress): Promise<QuizProgress> {
    const result = await db.insert(quizProgress)
      .values(progress as any)
      .onConflictDoUpdate({
        target: quizProgress.attemptId,
        set: progress as any
      })
      .returning();
    return result[0];
  }

  // Proctoring logs
  async getProctoringLogs(attemptId: string): Promise<ProctoringLog[]> {
    return await db.select().from(proctoringLogs).where(eq(proctoringLogs.attemptId, attemptId));
  }

  // Study Aids methods
  async getStudyAids(userId: string): Promise<StudyAid[]> {
    return await db.select().from(studyAids).where(eq(studyAids.studentId, userId));
  }

  async getStudyAidsByUser(userId: string): Promise<StudyAid[]> {
    return await db.select().from(studyAids).where(eq(studyAids.studentId, userId));
  }

  async getStudyAidsByStudent(studentId: string): Promise<StudyAid[]> {
    return await db.select().from(studyAids).where(eq(studyAids.studentId, studentId));
  }

  async createStudyAid(data: InsertStudyAid): Promise<StudyAid> {
    const result = await db.insert(studyAids).values(data as any).returning();
    return result[0];
  }

  // Analytics methods
  async getQuestionPerformanceMetrics(questionId: string) {
    return {
      totalResponses: 0,
      correctRate: 0,
      averageTimeSpent: 0,
      discriminationIndex: 0
    };
  }

  async getStudentPerformanceMetrics(studentId: string) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      completionRate: 0,
      timeSpentTotal: 0
    };
  }
}

// Create and export the storage instance
export const storage = new DatabaseStorage();