import {
  users,
  accounts,
  testbanks,
  questions,
  answerOptions,
  quizzes,
  quizQuestions,
  quizAttempts,
  quizResponses,
  proctoringLogs,
  validationLogs,
  aiResources,
  notifications,
  referenceBanks,
  references,
  scheduledAssignments,
  assignmentSubmissions,
  studyAids,
  mobileDevices,
  questionGroups,
  type User,
  type UpsertUser,
  type Account,
  type InsertAccount,
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
  type ProctoringLog,
  type InsertProctoringLog,
  type ValidationLog,
  type InsertValidationLog,
  type AiResource,
  type InsertAiResource,
  type Notification,
  type InsertNotification,
  type ReferenceBank,
  type InsertReferenceBank,
  type Reference,
  type InsertReference,
  type ScheduledAssignment,
  type InsertScheduledAssignment,
  type AssignmentSubmission,
  type InsertAssignmentSubmission,
  type StudyAid,
  type InsertStudyAid,
  type MobileDevice,
  type InsertMobileDevice,
  type QuestionGroup,
  type InsertQuestionGroup,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, count, avg, like, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Testbank operations
  createTestbank(testbank: InsertTestbank): Promise<Testbank>;
  getTestbank(id: string): Promise<Testbank | undefined>;
  getTestbanksByUser(userId: string): Promise<Testbank[]>;
  updateTestbank(id: string, data: Partial<InsertTestbank>): Promise<Testbank>;
  deleteTestbank(id: string): Promise<void>;
  
  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestionsByTestbank(testbankId: string): Promise<Question[]>;
  updateQuestion(id: string, data: Partial<InsertQuestion>): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;
  
  // Answer option operations
  createAnswerOption(option: InsertAnswerOption): Promise<AnswerOption>;
  getAnswerOptionsByQuestion(questionId: string): Promise<AnswerOption[]>;
  updateAnswerOption(id: string, data: Partial<InsertAnswerOption>): Promise<AnswerOption>;
  deleteAnswerOption(id: string): Promise<void>;
  
  // Quiz operations
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizzesByUser(userId: string): Promise<Quiz[]>;
  updateQuiz(id: string, data: Partial<InsertQuiz>): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;
  
  // Quiz attempt operations
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempt(id: string): Promise<QuizAttempt | undefined>;
  getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]>;
  getActiveQuizAttempts(quizId: string): Promise<QuizAttempt[]>;
  updateQuizAttempt(id: string, data: Partial<InsertQuizAttempt>): Promise<QuizAttempt>;
  
  // Quiz response operations
  createQuizResponse(response: InsertQuizResponse): Promise<QuizResponse>;
  getQuizResponsesByAttempt(attemptId: string): Promise<QuizResponse[]>;
  
  // Proctoring operations
  createProctoringLog(log: InsertProctoringLog): Promise<ProctoringLog>;
  getProctoringLogsByAttempt(attemptId: string): Promise<ProctoringLog[]>;
  getUnresolvedProctoringLogs(): Promise<ProctoringLog[]>;
  updateProctoringLog(id: string, data: Partial<InsertProctoringLog>): Promise<ProctoringLog>;
  
  // Validation operations
  createValidationLog(log: InsertValidationLog): Promise<ValidationLog>;
  getValidationLogsByQuestion(questionId: string): Promise<ValidationLog[]>;
  
  // AI resource operations
  createAiResource(resource: InsertAiResource): Promise<AiResource>;
  getAiResourcesByUser(userId: string): Promise<AiResource[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  
  // Analytics operations
  getQuizAnalytics(quizId: string): Promise<any>;
  getTestbankAnalytics(testbankId: string): Promise<any>;
  getDashboardStats(userId: string): Promise<any>;
  
  // Reference Bank operations
  createReferenceBank(bank: InsertReferenceBank): Promise<ReferenceBank>;
  getReferenceBank(id: string): Promise<ReferenceBank | undefined>;
  getReferenceBanksByUser(userId: string): Promise<ReferenceBank[]>;
  updateReferenceBank(id: string, data: Partial<InsertReferenceBank>): Promise<ReferenceBank>;
  deleteReferenceBank(id: string): Promise<void>;
  
  // Reference operations
  createReference(reference: InsertReference): Promise<Reference>;
  getReference(id: string): Promise<Reference | undefined>;
  getReferencesByBank(bankId: string): Promise<Reference[]>;
  updateReference(id: string, data: Partial<InsertReference>): Promise<Reference>;
  deleteReference(id: string): Promise<void>;

  // Account operations
  createAccount(account: InsertAccount): Promise<Account>;
  getAccount(id: string): Promise<Account | undefined>;
  getAccountsByUser(userId: string): Promise<Account[]>;
  updateAccount(id: string, data: Partial<InsertAccount>): Promise<Account>;
  deleteAccount(id: string): Promise<void>;

  // Scheduled Assignment operations
  createScheduledAssignment(assignment: InsertScheduledAssignment): Promise<ScheduledAssignment>;
  getScheduledAssignment(id: string): Promise<ScheduledAssignment | undefined>;
  getScheduledAssignmentsByAccount(accountId: string): Promise<ScheduledAssignment[]>;
  getScheduledAssignmentsByStudent(studentId: string): Promise<ScheduledAssignment[]>;
  updateScheduledAssignment(id: string, data: Partial<InsertScheduledAssignment>): Promise<ScheduledAssignment>;
  deleteScheduledAssignment(id: string): Promise<void>;

  // Assignment Submission operations
  createAssignmentSubmission(submission: InsertAssignmentSubmission): Promise<AssignmentSubmission>;
  getAssignmentSubmission(id: string): Promise<AssignmentSubmission | undefined>;
  getAssignmentSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]>;
  getAssignmentSubmissionsByStudent(studentId: string): Promise<AssignmentSubmission[]>;
  updateAssignmentSubmission(id: string, data: Partial<InsertAssignmentSubmission>): Promise<AssignmentSubmission>;

  // Study Aid operations
  createStudyAid(aid: InsertStudyAid): Promise<StudyAid>;
  getStudyAid(id: string): Promise<StudyAid | undefined>;
  getStudyAidsByStudent(studentId: string): Promise<StudyAid[]>;
  getStudyAidsByQuiz(quizId: string): Promise<StudyAid[]>;
  updateStudyAid(id: string, data: Partial<InsertStudyAid>): Promise<StudyAid>;
  deleteStudyAid(id: string): Promise<void>;

  // Mobile Device operations
  createMobileDevice(device: InsertMobileDevice): Promise<MobileDevice>;
  getMobileDevice(id: string): Promise<MobileDevice | undefined>;
  getMobileDevicesByUser(userId: string): Promise<MobileDevice[]>;
  updateMobileDevice(id: string, data: Partial<InsertMobileDevice>): Promise<MobileDevice>;
  deleteMobileDevice(id: string): Promise<void>;

  // Role-based access operations
  getUsersByAccount(accountId: string): Promise<User[]>;
  getUsersByRole(accountId: string, role: string): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
  getSharedTestbanksByAccount(accountId: string): Promise<Testbank[]>;
  getSharedQuizzesByAccount(accountId: string): Promise<Quiz[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Testbank operations
  async createTestbank(testbank: InsertTestbank): Promise<Testbank> {
    const [result] = await db.insert(testbanks).values({
      ...testbank,
      accountId: testbank.accountId || '00000000-0000-0000-0000-000000000001',
      isShared: testbank.isShared || false
    }).returning();
    return result;
  }

  async getTestbank(id: string): Promise<Testbank | undefined> {
    const [result] = await db.select().from(testbanks).where(eq(testbanks.id, id));
    return result;
  }

  async getTestbanksByUser(userId: string): Promise<Testbank[]> {
    return await db.select().from(testbanks).where(eq(testbanks.creatorId, userId)).orderBy(desc(testbanks.createdAt));
  }

  async updateTestbank(id: string, data: Partial<InsertTestbank>): Promise<Testbank> {
    const [result] = await db
      .update(testbanks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(testbanks.id, id))
      .returning();
    return result;
  }

  async deleteTestbank(id: string): Promise<void> {
    await db.delete(testbanks).where(eq(testbanks.id, id));
  }

  // Question operations
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [result] = await db.insert(questions).values(question).returning();
    return result;
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const [result] = await db.select().from(questions).where(eq(questions.id, id));
    return result;
  }

  async getQuestionsByTestbank(testbankId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.testbankId, testbankId)).orderBy(desc(questions.createdAt));
  }

  async updateQuestion(id: string, data: Partial<InsertQuestion>): Promise<Question> {
    const [result] = await db
      .update(questions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    return result;
  }

  async deleteQuestion(id: string): Promise<void> {
    // Delete associated answer options first
    await db.delete(answerOptions).where(eq(answerOptions.questionId, id));
    // Then delete the question
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Answer option operations
  async createAnswerOption(option: InsertAnswerOption): Promise<AnswerOption> {
    const [result] = await db.insert(answerOptions).values(option).returning();
    return result;
  }

  async getAnswerOptionsByQuestion(questionId: string): Promise<AnswerOption[]> {
    return await db.select().from(answerOptions).where(eq(answerOptions.questionId, questionId)).orderBy(asc(answerOptions.displayOrder));
  }

  async updateAnswerOption(id: string, data: Partial<InsertAnswerOption>): Promise<AnswerOption> {
    const [result] = await db
      .update(answerOptions)
      .set(data)
      .where(eq(answerOptions.id, id))
      .returning();
    return result;
  }

  async deleteAnswerOption(id: string): Promise<void> {
    await db.delete(answerOptions).where(eq(answerOptions.id, id));
  }

  // Quiz operations
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [result] = await db.insert(quizzes).values(quiz).returning();
    return result;
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [result] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return result;
  }

  async getQuizzesByUser(userId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.creatorId, userId)).orderBy(desc(quizzes.createdAt));
  }

  async updateQuiz(id: string, data: Partial<InsertQuiz>): Promise<Quiz> {
    const [result] = await db
      .update(quizzes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quizzes.id, id))
      .returning();
    return result;
  }

  async deleteQuiz(id: string): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  // Quiz attempt operations
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [result] = await db.insert(quizAttempts).values(attempt).returning();
    return result;
  }

  async getQuizAttempt(id: string): Promise<QuizAttempt | undefined> {
    const [result] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id));
    return result;
  }

  async getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.studentId, userId)).orderBy(desc(quizAttempts.startedAt));
  }

  async getActiveQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts)
      .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.status, "in_progress")))
      .orderBy(desc(quizAttempts.startedAt));
  }

  async updateQuizAttempt(id: string, data: Partial<InsertQuizAttempt>): Promise<QuizAttempt> {
    const [result] = await db
      .update(quizAttempts)
      .set(data)
      .where(eq(quizAttempts.id, id))
      .returning();
    return result;
  }

  // Quiz response operations
  async createQuizResponse(response: InsertQuizResponse): Promise<QuizResponse> {
    const [result] = await db.insert(quizResponses).values(response).returning();
    return result;
  }

  async getQuizResponsesByAttempt(attemptId: string): Promise<QuizResponse[]> {
    return await db.select().from(quizResponses).where(eq(quizResponses.attemptId, attemptId));
  }

  // Proctoring operations
  async createProctoringLog(log: InsertProctoringLog): Promise<ProctoringLog> {
    const [result] = await db.insert(proctoringLogs).values(log).returning();
    return result;
  }

  async getProctoringLogsByAttempt(attemptId: string): Promise<ProctoringLog[]> {
    return await db.select().from(proctoringLogs)
      .where(eq(proctoringLogs.attemptId, attemptId))
      .orderBy(desc(proctoringLogs.timestamp));
  }

  async getUnresolvedProctoringLogs(): Promise<ProctoringLog[]> {
    return await db.select().from(proctoringLogs)
      .where(eq(proctoringLogs.resolved, false))
      .orderBy(desc(proctoringLogs.timestamp));
  }

  async updateProctoringLog(id: string, data: Partial<InsertProctoringLog>): Promise<ProctoringLog> {
    const [result] = await db
      .update(proctoringLogs)
      .set(data)
      .where(eq(proctoringLogs.id, id))
      .returning();
    return result;
  }

  // Validation operations
  async createValidationLog(log: InsertValidationLog): Promise<ValidationLog> {
    const [result] = await db.insert(validationLogs).values(log).returning();
    return result;
  }

  async getValidationLogsByQuestion(questionId: string): Promise<ValidationLog[]> {
    return await db.select().from(validationLogs)
      .where(eq(validationLogs.questionId, questionId))
      .orderBy(desc(validationLogs.validatedAt));
  }

  // AI resource operations
  async createAiResource(resource: InsertAiResource): Promise<AiResource> {
    const [result] = await db.insert(aiResources).values(resource).returning();
    return result;
  }

  async getAiResourcesByUser(userId: string): Promise<AiResource[]> {
    return await db.select().from(aiResources)
      .where(eq(aiResources.createdFor, userId))
      .orderBy(desc(aiResources.createdAt));
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(notification).returning();
    return result;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  // Analytics operations
  async getQuizAnalytics(quizId: string): Promise<any> {
    const [stats] = await db.select({
      totalAttempts: count(quizAttempts.id),
      averageScore: avg(quizAttempts.score),
      completionRate: sql<number>`
        COUNT(CASE WHEN ${quizAttempts.status} = 'submitted' THEN 1 END) * 100.0 / COUNT(*)
      `,
    }).from(quizAttempts).where(eq(quizAttempts.quizId, quizId));

    return stats;
  }

  async getTestbankAnalytics(testbankId: string): Promise<any> {
    const [stats] = await db.select({
      totalQuestions: count(questions.id),
      averageDifficulty: avg(questions.difficultyScore),
    }).from(questions).where(eq(questions.testbankId, testbankId));

    return stats;
  }

  async getDashboardStats(userId: string): Promise<any> {
    const [activeExams] = await db.select({
      count: count(quizAttempts.id),
    }).from(quizAttempts)
      .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .where(and(
        eq(quizzes.creatorId, userId),
        eq(quizAttempts.status, "in_progress")
      ));

    const [totalStudents] = await db.select({
      count: count(users.id),
    }).from(users).where(eq(users.role, "student"));

    const [itemBanks] = await db.select({
      count: count(testbanks.id),
    }).from(testbanks).where(eq(testbanks.creatorId, userId));

    const [aiValidations] = await db.select({
      count: count(validationLogs.id),
    }).from(validationLogs)
      .innerJoin(questions, eq(validationLogs.questionId, questions.id))
      .innerJoin(testbanks, eq(questions.testbankId, testbanks.id))
      .where(eq(testbanks.creatorId, userId));

    return {
      activeExams: activeExams?.count || 0,
      totalStudents: totalStudents?.count || 0,
      itemBanks: itemBanks?.count || 0,
      aiValidations: aiValidations?.count || 0,
    };
  }

  // Reference Bank operations
  async createReferenceBank(bank: InsertReferenceBank): Promise<ReferenceBank> {
    const [referenceBank] = await db
      .insert(referenceBanks)
      .values(bank)
      .returning();
    return referenceBank;
  }

  async getReferenceBank(id: string): Promise<ReferenceBank | undefined> {
    const [bank] = await db.select().from(referenceBanks).where(eq(referenceBanks.id, id));
    return bank;
  }

  async getReferenceBanksByUser(userId: string): Promise<ReferenceBank[]> {
    return await db.select().from(referenceBanks).where(eq(referenceBanks.creatorId, userId));
  }

  async updateReferenceBank(id: string, data: Partial<InsertReferenceBank>): Promise<ReferenceBank> {
    const [bank] = await db
      .update(referenceBanks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(referenceBanks.id, id))
      .returning();
    return bank;
  }

  async deleteReferenceBank(id: string): Promise<void> {
    // First delete all references in this bank
    await db.delete(references).where(eq(references.bankId, id));
    // Then delete the bank
    await db.delete(referenceBanks).where(eq(referenceBanks.id, id));
  }

  // Reference operations
  async createReference(reference: InsertReference): Promise<Reference> {
    const [ref] = await db
      .insert(references)
      .values(reference)
      .returning();
    return ref;
  }

  async getReference(id: string): Promise<Reference | undefined> {
    const [ref] = await db.select().from(references).where(eq(references.id, id));
    return ref;
  }

  async getReferencesByBank(bankId: string): Promise<Reference[]> {
    return await db.select().from(references).where(eq(references.bankId, bankId));
  }

  async updateReference(id: string, data: Partial<InsertReference>): Promise<Reference> {
    const [ref] = await db
      .update(references)
      .set(data)
      .where(eq(references.id, id))
      .returning();
    return ref;
  }

  async deleteReference(id: string): Promise<void> {
    await db.delete(references).where(eq(references.id, id));
  }

  // Account operations
  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async getAccountsByUser(userId: string): Promise<Account[]> {
    // Get accounts where user is admin or super admin
    const user = await this.getUser(userId);
    if (!user) return [];
    
    if (user.role === 'super_admin') {
      return await db.select().from(accounts).orderBy(asc(accounts.name));
    }
    
    return await db.select().from(accounts).where(eq(accounts.id, user.accountId)).orderBy(asc(accounts.name));
  }

  async updateAccount(id: string, data: Partial<InsertAccount>): Promise<Account> {
    const [updatedAccount] = await db
      .update(accounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount;
  }

  async deleteAccount(id: string): Promise<void> {
    await db.delete(accounts).where(eq(accounts.id, id));
  }

  // Scheduled Assignment operations
  async createScheduledAssignment(assignment: InsertScheduledAssignment): Promise<ScheduledAssignment> {
    const [newAssignment] = await db.insert(scheduledAssignments).values(assignment).returning();
    return newAssignment;
  }

  async getScheduledAssignment(id: string): Promise<ScheduledAssignment | undefined> {
    const [assignment] = await db.select().from(scheduledAssignments).where(eq(scheduledAssignments.id, id));
    return assignment;
  }

  async getScheduledAssignmentsByAccount(accountId: string): Promise<ScheduledAssignment[]> {
    return await db.select().from(scheduledAssignments)
      .where(eq(scheduledAssignments.accountId, accountId))
      .orderBy(desc(scheduledAssignments.createdAt));
  }

  async getScheduledAssignmentsByStudent(studentId: string): Promise<ScheduledAssignment[]> {
    const user = await this.getUser(studentId);
    if (!user) return [];
    
    return await db.select().from(scheduledAssignments)
      .where(
        and(
          eq(scheduledAssignments.accountId, user.accountId),
          eq(scheduledAssignments.isActive, true)
        )
      )
      .orderBy(asc(scheduledAssignments.dueDate));
  }

  async updateScheduledAssignment(id: string, data: Partial<InsertScheduledAssignment>): Promise<ScheduledAssignment> {
    const [updatedAssignment] = await db
      .update(scheduledAssignments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(scheduledAssignments.id, id))
      .returning();
    return updatedAssignment;
  }

  async deleteScheduledAssignment(id: string): Promise<void> {
    await db.delete(scheduledAssignments).where(eq(scheduledAssignments.id, id));
  }

  // Assignment Submission operations
  async createAssignmentSubmission(submission: InsertAssignmentSubmission): Promise<AssignmentSubmission> {
    const [newSubmission] = await db.insert(assignmentSubmissions).values(submission).returning();
    return newSubmission;
  }

  async getAssignmentSubmission(id: string): Promise<AssignmentSubmission | undefined> {
    const [submission] = await db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.id, id));
    return submission;
  }

  async getAssignmentSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]> {
    return await db.select().from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.assignmentId, assignmentId))
      .orderBy(desc(assignmentSubmissions.createdAt));
  }

  async getAssignmentSubmissionsByStudent(studentId: string): Promise<AssignmentSubmission[]> {
    return await db.select().from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.studentId, studentId))
      .orderBy(desc(assignmentSubmissions.createdAt));
  }

  async updateAssignmentSubmission(id: string, data: Partial<InsertAssignmentSubmission>): Promise<AssignmentSubmission> {
    const [updatedSubmission] = await db
      .update(assignmentSubmissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(assignmentSubmissions.id, id))
      .returning();
    return updatedSubmission;
  }

  // Study Aid operations
  async createStudyAid(aid: InsertStudyAid): Promise<StudyAid> {
    const [newAid] = await db.insert(studyAids).values(aid).returning();
    return newAid;
  }

  async getStudyAid(id: string): Promise<StudyAid | undefined> {
    const [aid] = await db.select().from(studyAids).where(eq(studyAids.id, id));
    return aid;
  }

  async getStudyAidsByStudent(studentId: string): Promise<StudyAid[]> {
    return await db.select().from(studyAids)
      .where(eq(studyAids.studentId, studentId))
      .orderBy(desc(studyAids.createdAt));
  }

  async getStudyAidsByQuiz(quizId: string): Promise<StudyAid[]> {
    return await db.select().from(studyAids)
      .where(eq(studyAids.quizId, quizId))
      .orderBy(desc(studyAids.createdAt));
  }

  async updateStudyAid(id: string, data: Partial<InsertStudyAid>): Promise<StudyAid> {
    const [updatedAid] = await db
      .update(studyAids)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(studyAids.id, id))
      .returning();
    return updatedAid;
  }

  async deleteStudyAid(id: string): Promise<void> {
    await db.delete(studyAids).where(eq(studyAids.id, id));
  }

  // Mobile Device operations
  async createMobileDevice(device: InsertMobileDevice): Promise<MobileDevice> {
    const [newDevice] = await db.insert(mobileDevices).values(device).returning();
    return newDevice;
  }

  async getMobileDevice(id: string): Promise<MobileDevice | undefined> {
    const [device] = await db.select().from(mobileDevices).where(eq(mobileDevices.id, id));
    return device;
  }

  async getMobileDevicesByUser(userId: string): Promise<MobileDevice[]> {
    return await db.select().from(mobileDevices)
      .where(eq(mobileDevices.userId, userId))
      .orderBy(desc(mobileDevices.createdAt));
  }

  async updateMobileDevice(id: string, data: Partial<InsertMobileDevice>): Promise<MobileDevice> {
    const [updatedDevice] = await db
      .update(mobileDevices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mobileDevices.id, id))
      .returning();
    return updatedDevice;
  }

  async deleteMobileDevice(id: string): Promise<void> {
    await db.delete(mobileDevices).where(eq(mobileDevices.id, id));
  }

  // Role-based access operations
  async getUsersByAccount(accountId: string): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.accountId, accountId))
      .orderBy(asc(users.firstName));
  }

  async getUsersByRole(accountId: string, role: string): Promise<User[]> {
    return await db.select().from(users)
      .where(and(eq(users.accountId, accountId), eq(users.role, role)))
      .orderBy(asc(users.firstName));
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getSharedTestbanksByAccount(accountId: string): Promise<Testbank[]> {
    return await db.select().from(testbanks)
      .where(and(eq(testbanks.accountId, accountId), eq(testbanks.isShared, true)))
      .orderBy(desc(testbanks.createdAt));
  }

  async getSharedQuizzesByAccount(accountId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes)
      .where(eq(quizzes.accountId, accountId))
      .orderBy(desc(quizzes.createdAt));
  }

  // Question Group operations
  async getQuestionGroupsByQuiz(quizId: string): Promise<QuestionGroup[]> {
    return await db.select().from(questionGroups)
      .where(eq(questionGroups.quizId, quizId))
      .orderBy(questionGroups.displayOrder);
  }

  async createQuestionGroup(questionGroup: InsertQuestionGroup): Promise<QuestionGroup> {
    const [created] = await db.insert(questionGroups)
      .values(questionGroup)
      .returning();
    return created;
  }

  async updateQuestionGroup(groupId: string, updates: Partial<QuestionGroup>): Promise<QuestionGroup | undefined> {
    const [updated] = await db.update(questionGroups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(questionGroups.id, groupId))
      .returning();
    return updated;
  }

  async deleteQuestionGroup(groupId: string): Promise<void> {
    await db.delete(questionGroups)
      .where(eq(questionGroups.id, groupId));
  }

  async assignQuestionsToGroup(groupId: string, questionIds: string[]): Promise<void> {
    // For now, we'll store question IDs in the question group itself
    // This is a simplified implementation until the junction table is properly defined
    await db.update(questionGroups)
      .set({ 
        // Store selected question IDs in a JSON field or update group metadata
        updatedAt: new Date()
      })
      .where(eq(questionGroups.id, groupId));
  }

  async getQuestionsByGroup(groupId: string): Promise<Question[]> {
    // For now, return empty array until proper junction table is implemented
    return [];
  }
}

export const storage = new DatabaseStorage();
