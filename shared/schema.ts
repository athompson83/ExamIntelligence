import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  numeric,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["teacher", "student", "admin"] }).notNull().default("student"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Testbank table
export const testbanks = pgTable("testbanks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  learningObjectives: jsonb("learning_objectives").$type<string[]>().default([]),
  lastRevalidatedAt: timestamp("last_revalidated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Question table
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  testbankId: uuid("testbank_id").references(() => testbanks.id),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { 
    enum: ["multiple_choice", "multiple_response", "constructed_response", "hot_spot", "categorization", "formula", "true_false", "fill_blank", "essay"] 
  }).notNull(),
  difficultyScore: numeric("difficulty_score", { precision: 3, scale: 1 }).default("5.0"),
  tags: jsonb("tags").$type<string[]>().default([]),
  bloomsLevel: varchar("blooms_level", { 
    enum: ["remember", "understand", "apply", "analyze", "evaluate", "create"] 
  }),
  additionalData: jsonb("additional_data"),
  lastValidatedAt: timestamp("last_validated_at"),
  aiFeedback: text("ai_feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Answer options table
export const answerOptions = pgTable("answer_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id").references(() => questions.id).notNull(),
  answerText: text("answer_text").notNull(),
  isCorrect: boolean("is_correct").default(false),
  mediaUrl: varchar("media_url"),
  displayOrder: integer("display_order").default(0),
});

// Quiz table
export const quizzes = pgTable("quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  timeLimit: integer("time_limit"), // in minutes
  shuffleAnswers: boolean("shuffle_answers").default(false),
  shuffleQuestions: boolean("shuffle_questions").default(false),
  allowMultipleAttempts: boolean("allow_multiple_attempts").default(false),
  passwordProtected: boolean("password_protected").default(false),
  password: varchar("password"),
  ipLocking: boolean("ip_locking").default(false),
  adaptiveTesting: boolean("adaptive_testing").default(false),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  maxAttempts: integer("max_attempts").default(1),
  proctoring: boolean("proctoring").default(false),
  proctoringSettings: jsonb("proctoring_settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz questions (many-to-many relationship)
export const quizQuestions = pgTable("quiz_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").references(() => quizzes.id).notNull(),
  questionId: uuid("question_id").references(() => questions.id).notNull(),
  displayOrder: integer("display_order").default(0),
  points: numeric("points", { precision: 5, scale: 2 }).default("1.00"),
});

// Quiz attempts/results
export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").references(() => quizzes.id).notNull(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  score: numeric("score", { precision: 5, scale: 2 }),
  totalPoints: numeric("total_points", { precision: 5, scale: 2 }),
  timeSpent: integer("time_spent"), // in seconds
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  status: varchar("status", { enum: ["in_progress", "submitted", "graded", "incomplete"] }).default("in_progress"),
  metadata: jsonb("metadata"),
});

// Quiz responses (individual question answers)
export const quizResponses = pgTable("quiz_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").references(() => quizAttempts.id).notNull(),
  questionId: uuid("question_id").references(() => questions.id).notNull(),
  response: jsonb("response"), // stores the actual answer(s)
  isCorrect: boolean("is_correct"),
  points: numeric("points", { precision: 5, scale: 2 }),
  timeSpent: integer("time_spent"), // in seconds
  flagged: boolean("flagged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Proctoring logs
export const proctoringLogs = pgTable("proctoring_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").references(() => quizAttempts.id).notNull(),
  eventType: varchar("event_type", { 
    enum: ["tab_switch", "window_blur", "fullscreen_exit", "suspicious_activity", "camera_off", "microphone_off", "multiple_faces", "no_face"] 
  }).notNull(),
  eventData: jsonb("event_data"),
  severity: varchar("severity", { enum: ["low", "medium", "high", "critical"] }).default("medium"),
  screenshot: varchar("screenshot_url"),
  timestamp: timestamp("timestamp").defaultNow(),
  resolved: boolean("resolved").default(false),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"),
});

// Validation logs
export const validationLogs = pgTable("validation_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id").references(() => questions.id).notNull(),
  validatedBy: varchar("validated_by", { enum: ["ai", "human"] }).notNull(),
  validatedAt: timestamp("validated_at").defaultNow(),
  issues: jsonb("issues").$type<string[]>().default([]),
  suggestions: jsonb("suggestions").$type<string[]>().default([]),
  confidenceScore: numeric("confidence_score", { precision: 3, scale: 2 }),
  status: varchar("status", { enum: ["pending", "approved", "rejected", "needs_review"] }).default("pending"),
  comments: text("comments"),
});

// AI-generated resources
export const aiResources = pgTable("ai_resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { enum: ["study_guide", "lecture_notes", "improvement_plan", "practice_questions"] }).notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  sourceType: varchar("source_type", { enum: ["testbank", "quiz", "question"] }).notNull(),
  sourceId: uuid("source_id").notNull(),
  createdFor: varchar("created_for").references(() => users.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type", { enum: ["validation", "proctoring", "system", "reminder", "grade"] }).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  actionUrl: varchar("action_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  testbanks: many(testbanks),
  quizzes: many(quizzes),
  attempts: many(quizAttempts),
  notifications: many(notifications),
  aiResources: many(aiResources),
}));

export const testbanksRelations = relations(testbanks, ({ one, many }) => ({
  creator: one(users, { fields: [testbanks.creatorId], references: [users.id] }),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  testbank: one(testbanks, { fields: [questions.testbankId], references: [testbanks.id] }),
  answerOptions: many(answerOptions),
  quizQuestions: many(quizQuestions),
  validationLogs: many(validationLogs),
}));

export const answerOptionsRelations = relations(answerOptions, ({ one }) => ({
  question: one(questions, { fields: [answerOptions.questionId], references: [questions.id] }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  creator: one(users, { fields: [quizzes.creatorId], references: [users.id] }),
  quizQuestions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizQuestions.quizId], references: [quizzes.id] }),
  question: one(questions, { fields: [quizQuestions.questionId], references: [questions.id] }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
  quiz: one(quizzes, { fields: [quizAttempts.quizId], references: [quizzes.id] }),
  student: one(users, { fields: [quizAttempts.studentId], references: [users.id] }),
  responses: many(quizResponses),
  proctoringLogs: many(proctoringLogs),
}));

export const quizResponsesRelations = relations(quizResponses, ({ one }) => ({
  attempt: one(quizAttempts, { fields: [quizResponses.attemptId], references: [quizAttempts.id] }),
  question: one(questions, { fields: [quizResponses.questionId], references: [questions.id] }),
}));

export const proctoringLogsRelations = relations(proctoringLogs, ({ one }) => ({
  attempt: one(quizAttempts, { fields: [proctoringLogs.attemptId], references: [quizAttempts.id] }),
  resolver: one(users, { fields: [proctoringLogs.resolvedBy], references: [users.id] }),
}));

export const validationLogsRelations = relations(validationLogs, ({ one }) => ({
  question: one(questions, { fields: [validationLogs.questionId], references: [questions.id] }),
}));

export const aiResourcesRelations = relations(aiResources, ({ one }) => ({
  user: one(users, { fields: [aiResources.createdFor], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTestbankSchema = createInsertSchema(testbanks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnswerOptionSchema = createInsertSchema(answerOptions).omit({ id: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({ id: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true });
export const insertQuizResponseSchema = createInsertSchema(quizResponses).omit({ id: true, createdAt: true });
export const insertProctoringLogSchema = createInsertSchema(proctoringLogs).omit({ id: true, resolvedAt: true });
export const insertValidationLogSchema = createInsertSchema(validationLogs).omit({ id: true, validatedAt: true });
export const insertAiResourceSchema = createInsertSchema(aiResources).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertTestbank = z.infer<typeof insertTestbankSchema>;
export type Testbank = typeof testbanks.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertAnswerOption = z.infer<typeof insertAnswerOptionSchema>;
export type AnswerOption = typeof answerOptions.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizResponse = z.infer<typeof insertQuizResponseSchema>;
export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertProctoringLog = z.infer<typeof insertProctoringLogSchema>;
export type ProctoringLog = typeof proctoringLogs.$inferSelect;
export type InsertValidationLog = z.infer<typeof insertValidationLogSchema>;
export type ValidationLog = typeof validationLogs.$inferSelect;
export type InsertAiResource = z.infer<typeof insertAiResourceSchema>;
export type AiResource = typeof aiResources.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
