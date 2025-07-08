import {
  users,
  testbanks,
  questions,
  answerOptions,
  quizzes,
  quizAttempts,
  quizResponses,
  accounts,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

// Storage interface for basic functionality
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Testbank operations
  createTestbank(testbank: InsertTestbank): Promise<Testbank>;
  getTestbank(id: string): Promise<Testbank | undefined>;
  getTestbanksByAccount(accountId: string): Promise<Testbank[]>;
  getTestbanksByUser(userId: string): Promise<Testbank[]>;
  updateTestbank(id: string, testbank: Partial<InsertTestbank>): Promise<Testbank | undefined>;
  deleteTestbank(id: string): Promise<boolean>;
  
  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestionsByTestbank(testbankId: string): Promise<Question[]>;
  updateQuestion(id: string, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<boolean>;
  
  // Answer option operations
  createAnswerOption(option: InsertAnswerOption): Promise<AnswerOption>;
  getAnswerOptionsByQuestion(questionId: string): Promise<AnswerOption[]>;
  
  // Quiz operations
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizzesByAccount(accountId: string): Promise<Quiz[]>;
  updateQuiz(id: string, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: string): Promise<boolean>;
  
  // Quiz attempt operations
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempt(id: string): Promise<QuizAttempt | undefined>;
  getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]>;
  
  // Quiz response operations
  createQuizResponse(response: InsertQuizResponse): Promise<QuizResponse>;
  getQuizResponsesByAttempt(attemptId: string): Promise<QuizResponse[]>;
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Testbank operations
  async createTestbank(testbankData: InsertTestbank): Promise<Testbank> {
    const [testbank] = await db
      .insert(testbanks)
      .values(testbankData)
      .returning();
    return testbank;
  }

  async getTestbank(id: string): Promise<Testbank | undefined> {
    const [testbank] = await db.select().from(testbanks).where(eq(testbanks.id, id));
    return testbank;
  }

  async getTestbanksByAccount(accountId: string): Promise<Testbank[]> {
    return await db
      .select()
      .from(testbanks)
      .where(eq(testbanks.accountId, accountId))
      .orderBy(desc(testbanks.createdAt));
  }

  async getTestbanksByUser(userId: string): Promise<Testbank[]> {
    return await db
      .select()
      .from(testbanks)
      .where(eq(testbanks.creatorId, userId))
      .orderBy(desc(testbanks.createdAt));
  }

  async updateTestbank(id: string, testbankData: Partial<InsertTestbank>): Promise<Testbank | undefined> {
    const [testbank] = await db
      .update(testbanks)
      .set({ ...testbankData, updatedAt: new Date() })
      .where(eq(testbanks.id, id))
      .returning();
    return testbank;
  }

  async deleteTestbank(id: string): Promise<boolean> {
    const result = await db.delete(testbanks).where(eq(testbanks.id, id));
    return result.rowCount > 0;
  }

  // Question operations
  async createQuestion(questionData: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(questionData)
      .returning();
    return question;
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async getQuestionsByTestbank(testbankId: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.testbankId, testbankId))
      .orderBy(desc(questions.createdAt));
  }

  async updateQuestion(id: string, questionData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [question] = await db
      .update(questions)
      .set({ ...questionData, updatedAt: new Date() })
      .where(eq(questions.id, id))
      .returning();
    return question;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const result = await db.delete(questions).where(eq(questions.id, id));
    return result.rowCount > 0;
  }

  // Answer option operations
  async createAnswerOption(optionData: InsertAnswerOption): Promise<AnswerOption> {
    const [option] = await db
      .insert(answerOptions)
      .values(optionData)
      .returning();
    return option;
  }

  async getAnswerOptionsByQuestion(questionId: string): Promise<AnswerOption[]> {
    return await db
      .select()
      .from(answerOptions)
      .where(eq(answerOptions.questionId, questionId))
      .orderBy(answerOptions.displayOrder);
  }

  // Quiz operations
  async createQuiz(quizData: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db
      .insert(quizzes)
      .values(quizData)
      .returning();
    return quiz;
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getQuizzesByAccount(accountId: string): Promise<Quiz[]> {
    return await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.accountId, accountId))
      .orderBy(desc(quizzes.createdAt));
  }

  async updateQuiz(id: string, quizData: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const [quiz] = await db
      .update(quizzes)
      .set({ ...quizData, updatedAt: new Date() })
      .where(eq(quizzes.id, id))
      .returning();
    return quiz;
  }

  async deleteQuiz(id: string): Promise<boolean> {
    const result = await db.delete(quizzes).where(eq(quizzes.id, id));
    return result.rowCount > 0;
  }

  // Quiz attempt operations
  async createQuizAttempt(attemptData: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db
      .insert(quizAttempts)
      .values(attemptData)
      .returning();
    return attempt;
  }

  async getQuizAttempt(id: string): Promise<QuizAttempt | undefined> {
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id));
    return attempt;
  }

  async getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.startedAt));
  }

  // Quiz response operations
  async createQuizResponse(responseData: InsertQuizResponse): Promise<QuizResponse> {
    const [response] = await db
      .insert(quizResponses)
      .values(responseData)
      .returning();
    return response;
  }

  async getQuizResponsesByAttempt(attemptId: string): Promise<QuizResponse[]> {
    return await db
      .select()
      .from(quizResponses)
      .where(eq(quizResponses.attemptId, attemptId));
  }
}

export const storage = new DatabaseStorage();