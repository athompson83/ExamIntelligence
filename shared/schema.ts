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

// Account/Organization table
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  subscriptionTier: varchar("subscription_tier", { enum: ["starter", "basic", "professional", "institutional", "enterprise"] }).notNull().default("starter"),
  billingCycle: varchar("billing_cycle", { enum: ["monthly", "annual"] }).default("monthly"),
  maxUsers: integer("max_users").default(10),
  
  // Stripe integration
  stripeCustomerId: varchar("stripe_customer_id").unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id").unique(),
  stripeCurrentPeriodStart: timestamp("stripe_current_period_start"),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"),
  stripeStatus: varchar("stripe_status", { enum: ["active", "canceled", "incomplete", "incomplete_expired", "past_due", "trialing", "unpaid"] }),
  stripePriceId: varchar("stripe_price_id"),
  
  // Usage tracking for quotas
  monthlyQuizzes: integer("monthly_quizzes").default(0),
  monthlyAiGenerated: integer("monthly_ai_generated").default(0),
  monthlyAiValidations: integer("monthly_ai_validations").default(0),
  monthlyProctoringHours: integer("monthly_proctoring_hours").default(0),
  currentSeatCount: integer("current_seat_count").default(1),
  
  // Billing
  billingEmail: varchar("billing_email"),
  billingAddress: jsonb("billing_address"),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription Management
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id").unique().notNull(),
  stripePriceId: varchar("stripe_price_id").notNull(),
  stripeCustomerId: varchar("stripe_customer_id").notNull(),
  status: varchar("status", { 
    enum: ["active", "canceled", "incomplete", "incomplete_expired", "past_due", "trialing", "unpaid", "paused"] 
  }).notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at"),
  tier: varchar("tier", { enum: ["starter", "basic", "professional", "institutional", "enterprise"] }).notNull(),
  billingCycle: varchar("billing_cycle", { enum: ["monthly", "annual"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice History
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  stripeInvoiceId: varchar("stripe_invoice_id").unique().notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency").default("usd"),
  status: varchar("status", { 
    enum: ["draft", "open", "paid", "uncollectible", "void"] 
  }).notNull(),
  invoiceNumber: varchar("invoice_number"),
  invoiceUrl: varchar("invoice_url"),
  hostedInvoiceUrl: varchar("hosted_invoice_url"),
  invoicePdf: varchar("invoice_pdf"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Settings (for Stripe keys and configuration)
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key").unique().notNull(),
  value: text("value"),
  isSecret: boolean("is_secret").default(false),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["super_admin", "admin", "teacher", "student"] }).notNull().default("student"),
  accountId: uuid("account_id").references(() => accounts.id),
  accessibilitySettings: jsonb("accessibility_settings").default({
    highContrast: false,
    textToSpeech: false,
    fontSize: "medium",
    reducedMotion: false,
    keyboardNavigation: false,
    screenReader: false,
    voiceSpeed: 1.0,
    voicePitch: 1.0,
    autoReadContent: false
  }),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Testbank table
export const testbanks = pgTable("testbanks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  isShared: boolean("is_shared").notNull().default(true), // Shared within account
  tags: jsonb("tags").$type<string[]>().default([]),
  learningObjectives: jsonb("learning_objectives").$type<string[]>().default([]),
  lastRevalidatedAt: timestamp("last_revalidated_at"),
  
  // Safety deletion protocol - Archive instead of delete
  isArchived: boolean("is_archived").default(false),
  archivedAt: timestamp("archived_at"),
  archivedBy: varchar("archived_by").references(() => users.id),
  archiveReason: text("archive_reason"),
  canRestore: boolean("can_restore").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Question table - Enhanced with full Canvas LMS support
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  testbankId: uuid("testbank_id").references(() => testbanks.id),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { 
    enum: [
      "multiple_choice", "multiple_response", "true_false", "fill_blank", 
      "multiple_fill_blank", "matching", "ordering", "categorization", 
      "hot_spot", "essay", "file_upload", "numerical", "formula", 
      "stimulus", "constructed_response", "text_no_question"
    ] 
  }).notNull(),
  
  // Enhanced question properties
  points: numeric("points", { precision: 5, scale: 2 }).default("1.00"),
  difficultyScore: numeric("difficulty_score", { precision: 3, scale: 1 }).default("5.0"),
  estimatedTime: integer("estimated_time").default(60), // seconds
  
  // Canvas-style categorization
  tags: jsonb("tags").$type<string[]>().default([]),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  learningObjectives: jsonb("learning_objectives").$type<string[]>().default([]),
  bloomsLevel: varchar("blooms_level", { 
    enum: ["remember", "understand", "apply", "analyze", "evaluate", "create"] 
  }),
  
  // Media and content
  imageUrl: text("image_url"),
  audioUrl: text("audio_url"),
  videoUrl: text("video_url"),
  attachmentUrls: jsonb("attachment_urls").$type<string[]>().default([]),
  stimulusContent: text("stimulus_content"), // For complex question scenarios
  
  // Question configuration (Canvas-style)
  questionConfig: jsonb("question_config"), // Type-specific settings
  
  // Feedback system (Canvas style)
  correctFeedback: text("correct_feedback"),
  incorrectFeedback: text("incorrect_feedback"),
  generalFeedback: text("general_feedback"),
  neutralFeedback: text("neutral_feedback"),
  
  // Advanced grading features
  partialCredit: boolean("partial_credit").default(false),
  caseSensitive: boolean("case_sensitive").default(false),
  exactMatch: boolean("exact_match").default(true),
  showAnswers: boolean("show_answers").default(true),
  
  // AI validation and analysis
  aiFeedback: text("ai_feedback"),
  aiValidationStatus: varchar("ai_validation_status", {
    enum: ["pending", "approved", "rejected", "needs_review"]
  }).default("pending"),
  aiConfidenceScore: numeric("ai_confidence_score", { precision: 3, scale: 2 }),
  
  // AI-generated educational content
  questionReasoning: text("question_reasoning"), // Why this question is educationally valuable
  correctAnswerReasoning: text("correct_answer_reasoning"), // High-yield explanation of correct answer
  
  // Accessibility features
  altText: text("alt_text"),
  screenReaderText: text("screen_reader_text"),
  mathmlContent: text("mathml_content"),
  
  // Usage analytics
  lastValidatedAt: timestamp("last_validated_at"),
  lastUsed: timestamp("last_used"),
  usageCount: integer("usage_count").default(0),
  
  // CAT/IRT Parameters for Computer Adaptive Testing
  irtDifficulty: numeric("irt_difficulty", { precision: 5, scale: 3 }).default("0.000"), // b parameter in IRT
  irtDiscrimination: numeric("irt_discrimination", { precision: 5, scale: 3 }).default("1.000"), // a parameter in IRT
  irtGuessing: numeric("irt_guessing", { precision: 5, scale: 3 }).default("0.000"), // c parameter in IRT (3PL model)
  irtSlipping: numeric("irt_slipping", { precision: 5, scale: 3 }).default("1.000"), // upper asymptote for 4PL model
  irtCalibrated: boolean("irt_calibrated").default(false), // Whether IRT parameters have been calibrated
  irtSampleSize: integer("irt_sample_size").default(0), // Number of responses used for calibration
  
  // Dynamic difficulty tracking
  originalDifficultyScore: numeric("original_difficulty_score", { precision: 3, scale: 1 }),
  currentDifficultyScore: numeric("current_difficulty_score", { precision: 3, scale: 1 }),
  correctResponsesCount: integer("correct_responses_count").default(0),
  totalResponsesCount: integer("total_responses_count").default(0),
  accuracyPercentage: numeric("accuracy_percentage", { precision: 5, scale: 2 }).default("0.00"),
  lastDifficultyUpdate: timestamp("last_difficulty_update"),
  
  // Pilot question validation
  isPilotQuestion: boolean("is_pilot_question").default(false),
  pilotResponsesNeeded: integer("pilot_responses_needed").default(30),
  pilotResponsesCount: integer("pilot_responses_count").default(0),
  pilotValidated: boolean("pilot_validated").default(false),
  pilotValidationDate: timestamp("pilot_validation_date"),
  
  // Additional Canvas features
  additionalData: jsonb("additional_data"),
  
  // Safety deletion protocol - Archive instead of delete
  isArchived: boolean("is_archived").default(false),
  archivedAt: timestamp("archived_at"),
  archivedBy: varchar("archived_by").references(() => users.id),
  archiveReason: text("archive_reason"),
  canRestore: boolean("can_restore").default(true),
  
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
  reasoning: text("reasoning"), // AI-generated explanation for why this answer is correct/incorrect
  feedback: text("feedback"), // Feedback shown to students when this option is selected
});

// Quiz table - Simplified to match actual database schema
export const quizzes = pgTable("quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  
  // Timing and availability
  timeLimit: integer("time_limit"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  
  // Question behavior
  shuffleAnswers: boolean("shuffle_answers").default(false),
  shuffleQuestions: boolean("shuffle_questions").default(false),
  
  // Attempt settings
  allowMultipleAttempts: boolean("allow_multiple_attempts").default(false),
  maxAttempts: integer("max_attempts").default(1),
  
  // Multiple attempt behavior
  scoreKeepingMethod: varchar("score_keeping_method", { enum: ["highest", "latest", "average"] }).default("highest"),
  attemptRestrictionsEnabled: boolean("attempt_restrictions_enabled").default(false),
  timeBetweenAttempts: integer("time_between_attempts").default(0), // in minutes for backward compatibility
  timeBetweenAttemptsUnit: varchar("time_between_attempts_unit", { enum: ["minutes", "hours", "days"] }).default("minutes"),
  
  // Security features
  passwordProtected: boolean("password_protected").default(false),
  password: varchar("password"),
  ipLocking: boolean("ip_locking").default(false),
  
  // Proctoring and monitoring
  proctoring: boolean("proctoring").default(false),
  proctoringSettings: jsonb("proctoring_settings"),
  
  // Advanced features
  adaptiveTesting: boolean("adaptive_testing").default(false),
  catModel: varchar("cat_model", { enum: ["rasch", "2pl", "3pl", "grm"] }).default("2pl"), // Default to 2PL as most common and effective
  catSettings: jsonb("cat_settings").$type<{
    initialDifficulty: number;
    difficultyAdjustment: number;
    minQuestions: number;
    maxQuestions: number;
    terminationCriteria: {
      confidenceLevel: number;
      standardError: number;
      timeLimit: number;
    };
    itemSelectionMethod: string;
    scoringMethod: string;
  }>().default({
    initialDifficulty: 0, // Theta = 0 (moderate ability)
    difficultyAdjustment: 0.5,
    minQuestions: 10,
    maxQuestions: 50,
    terminationCriteria: {
      confidenceLevel: 0.95,
      standardError: 0.3,
      timeLimit: 120
    },
    itemSelectionMethod: "maximum_information",
    scoringMethod: "eap" // Expected A Posteriori
  }),
  
  // AI-powered feedback and learning features
  enableQuestionFeedback: boolean("enable_question_feedback").default(false),
  enableLearningPrescription: boolean("enable_learning_prescription").default(false),
  showAnswerReasoning: boolean("show_answer_reasoning").default(false),
  
  // Result display options
  showCorrectAnswers: boolean("show_correct_answers").default(false),
  showCorrectAnswersAt: varchar("show_correct_answers_at", { enum: ["immediately", "after_submission", "after_due_date"] }).default("after_submission"),
  showQuestionsAfterAttempt: boolean("show_questions_after_attempt").default(false),
  
  // Grading options
  passingGrade: integer("passing_grade").default(70),
  gradeToShow: varchar("grade_to_show", { enum: ["percentage", "points", "letter", "gpa"] }).default("percentage"),
  
  // Availability settings (replaces startTime/endTime)
  availabilityStart: timestamp("availability_start"),
  availabilityEnd: timestamp("availability_end"),
  alwaysAvailable: boolean("always_available").default(true),
  
  // Safety deletion protocol - Archive instead of delete
  isArchived: boolean("is_archived").default(false),
  archivedAt: timestamp("archived_at"),
  archivedBy: varchar("archived_by").references(() => users.id),
  archiveReason: text("archive_reason"),
  canRestore: boolean("can_restore").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Question groups for quiz organization (Canvas-style)
export const questionGroups = pgTable("question_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").references(() => quizzes.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  pickCount: integer("pick_count").default(1), // Number of questions to randomly select
  totalQuestions: integer("total_questions").default(0), // Total questions in this group
  pointsPerQuestion: numeric("points_per_question", { precision: 5, scale: 2 }).default("1.00"),
  displayOrder: integer("display_order").default(0),
  
  // CAT/Difficulty-based selection
  useCAT: boolean("use_cat").default(false), // Computer Adaptive Testing
  difficultyWeight: numeric("difficulty_weight", { precision: 3, scale: 2 }).default("1.00"),
  bloomsWeight: numeric("blooms_weight", { precision: 3, scale: 2 }).default("1.00"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz questions (many-to-many relationship) - Enhanced for groups
export const quizQuestions = pgTable("quiz_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").references(() => quizzes.id).notNull(),
  questionId: uuid("question_id").references(() => questions.id).notNull(),
  questionGroupId: uuid("question_group_id").references(() => questionGroups.id), // Optional group assignment
  displayOrder: integer("display_order").default(0),
  points: numeric("points", { precision: 5, scale: 2 }).default("1.00"),
  
  // Canvas-style question settings
  isRequired: boolean("is_required").default(true),
  showFeedback: boolean("show_feedback").default(false),
  partialCredit: boolean("partial_credit").default(false),
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

// Quiz Progress table - tracks user progress within a quiz session for persistence
export const quizProgress = pgTable("quiz_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").references(() => quizAttempts.id).notNull(),
  currentQuestionIndex: integer("current_question_index").default(0),
  answeredQuestions: jsonb("answered_questions").$type<string[]>().default([]),
  savedResponses: jsonb("saved_responses").$type<Record<string, any>>().default({}),
  timeSpentPerQuestion: jsonb("time_spent_per_question").$type<Record<string, number>>().default({}),
  lastSavedAt: timestamp("last_saved_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CAT Exam Configurations - Computer Adaptive Testing
export const catExams = pgTable("cat_exams", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  creatorId: varchar("creator_id").notNull(),
  accountId: varchar("account_id").notNull(),
  
  // All settings stored as JSONB to match actual database structure
  adaptiveSettings: jsonb("adaptive_settings").$type<{
    startingDifficulty?: number;
    difficultyAdjustment?: number;
    minQuestions?: number;
    maxQuestions?: number;
    terminationCriteria?: {
      confidenceLevel?: number;
      standardError?: number;
      timeLimit?: number;
    };
  }>(),
  
  scoringSettings: jsonb("scoring_settings").$type<{
    passingScore?: number;
    scalingMethod?: string;
    reportingScale?: {
      min?: number;
      max?: number;
    };
  }>(),
  
  securitySettings: jsonb("security_settings").$type<{
    allowCalculator?: boolean;
    calculatorType?: string;
    enableProctoring?: boolean;
    preventCopyPaste?: boolean;
    preventTabSwitching?: boolean;
    requireWebcam?: boolean;
  }>(),
  
  accessSettings: jsonb("access_settings").$type<{
    availableFrom?: string;
    availableTo?: string;
    timeLimit?: number;
    allowedAttempts?: number;
    assignedStudents?: string[];
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CAT Exam Categories - Links testbanks to CAT exams with percentage distribution
export const catExamCategories = pgTable("cat_exam_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  catExamId: uuid("cat_exam_id").references(() => catExams.id).notNull(),
  testbankId: uuid("testbank_id").references(() => testbanks.id).notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(), // 0-100%
  minQuestions: integer("min_questions").default(1),
  maxQuestions: integer("max_questions").default(20),
  difficultyRange: jsonb("difficulty_range").$type<{min: number; max: number}>().default({min: 1, max: 10}),
  
  // CAT-specific category settings
  proficiencyThreshold: numeric("proficiency_threshold", { precision: 5, scale: 2 }).default("80.0"),
  terminateOnProficiency: boolean("terminate_on_proficiency").default(false),
  adaptiveWeight: numeric("adaptive_weight", { precision: 3, scale: 2 }).default("1.0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CAT Exam Assignments - Links students to CAT exams
export const catExamAssignments = pgTable("cat_exam_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  catExamId: uuid("cat_exam_id").references(() => catExams.id).notNull(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: varchar("assigned_by").references(() => users.id).notNull(),
  dueDate: timestamp("due_date"),
  status: varchar("status", { enum: ["assigned", "in_progress", "completed", "overdue"] }).default("assigned"),
  
  // Attempt tracking
  attemptsUsed: integer("attempts_used").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CAT Exam Sessions - Individual student sessions
export const catExamSessions = pgTable("cat_exam_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  catExamId: uuid("cat_exam_id").references(() => catExams.id).notNull(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  assignmentId: uuid("assignment_id").references(() => catExamAssignments.id),
  
  // Session tracking
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  status: varchar("status", { enum: ["waiting_for_proctor", "active", "completed", "terminated", "expired"] }).default("active"),
  
  // Proctoring session tracking
  proctoringSessionId: uuid("proctoring_session_id").references(() => proctoringLobbies.id),
  proctorApprovedAt: timestamp("proctor_approved_at"),
  
  // CAT state tracking
  currentAbilityEstimate: numeric("current_ability_estimate", { precision: 5, scale: 2 }).default("0.0"),
  currentStandardError: numeric("current_standard_error", { precision: 5, scale: 2 }).default("1.0"),
  questionsAsked: integer("questions_asked").default(0),
  questionResponses: jsonb("question_responses").$type<Array<{questionId: string; response: any; isCorrect: boolean; difficulty: number; timestamp: string}>>().default([]),
  
  // Category-specific tracking
  categoryProgress: jsonb("category_progress").$type<Record<string, {questionsAsked: number; correctAnswers: number; currentDifficulty: number; proficiencyReached: boolean}>>().default({}),
  
  // Final results
  finalScore: numeric("final_score", { precision: 5, scale: 2 }),
  scaledScore: numeric("scaled_score", { precision: 5, scale: 2 }),
  percentileRank: numeric("percentile_rank", { precision: 5, scale: 2 }),
  proficiencyLevel: varchar("proficiency_level", { enum: ["below_basic", "basic", "proficient", "advanced"] }),
  
  // Metadata
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  proctoringData: jsonb("proctoring_data"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Proctoring Lobbies - Where proctors host live exam sessions
export const proctoringLobbies = pgTable("proctoring_lobbies", {
  id: uuid("id").primaryKey().defaultRandom(),
  catExamId: uuid("cat_exam_id").references(() => catExams.id).notNull(),
  proctorId: varchar("proctor_id").references(() => users.id).notNull(),
  
  // Lobby details
  lobbyName: varchar("lobby_name").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  
  // Scheduling
  scheduledStartTime: timestamp("scheduled_start_time"),
  scheduledEndTime: timestamp("scheduled_end_time"),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  
  // Status and capacity
  status: varchar("status", { enum: ["scheduled", "waiting_for_students", "active", "completed", "cancelled"] }).default("scheduled"),
  maxStudents: integer("max_students").default(50),
  currentStudentCount: integer("current_student_count").default(0),
  
  // Settings
  allowLateJoin: boolean("allow_late_join").default(false),
  lateJoinCutoffMinutes: integer("late_join_cutoff_minutes").default(10),
  requireStudentVerification: boolean("require_student_verification").default(true),
  
  // Proctoring configuration
  proctoringSettings: jsonb("proctoring_settings").$type<{
    requireWebcam: boolean;
    requireMicrophone: boolean;
    enableScreenSharing: boolean;
    allowCalculator: boolean;
    calculatorType: string;
    preventTabSwitching: boolean;
    preventCopyPaste: boolean;
    autoFlagViolations: boolean;
    violationThreshold: number;
  }>().default({
    requireWebcam: true,
    requireMicrophone: false,
    enableScreenSharing: true,
    allowCalculator: false,
    calculatorType: "basic",
    preventTabSwitching: true,
    preventCopyPaste: true,
    autoFlagViolations: true,
    violationThreshold: 3
  }),
  
  // Access control
  accessCode: varchar("access_code"), // Optional access code for students
  isPublic: boolean("is_public").default(false),
  
  // Results and reporting
  autoGradeOnCompletion: boolean("auto_grade_on_completion").default(true),
  generateReport: boolean("generate_report").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Proctoring Session Participants - Students in a proctoring lobby
export const proctoringParticipants = pgTable("proctoring_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  proctoringSessionId: uuid("proctoring_session_id").references(() => proctoringLobbies.id).notNull(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  catSessionId: uuid("cat_session_id").references(() => catExamSessions.id),
  
  // Participation tracking
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  status: varchar("status", { enum: ["waiting", "verified", "exam_started", "exam_completed", "disconnected", "removed"] }).default("waiting"),
  
  // Verification details
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by").references(() => users.id),
  identityConfirmed: boolean("identity_confirmed").default(false),
  
  // Technical status
  webcamStatus: varchar("webcam_status", { enum: ["not_required", "pending", "active", "disabled", "failed"] }).default("pending"),
  microphoneStatus: varchar("microphone_status", { enum: ["not_required", "pending", "active", "disabled", "failed"] }).default("not_required"),
  screenShareStatus: varchar("screen_share_status", { enum: ["not_required", "pending", "active", "disabled", "failed"] }).default("not_required"),
  
  // Violation tracking
  totalViolations: integer("total_violations").default(0),
  flaggedForReview: boolean("flagged_for_review").default(false),
  proctorNotes: text("proctor_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Reference Bank tables
export const referenceBanks = pgTable("reference_banks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Archive History table - tracks all archival actions
export const archiveHistory = pgTable("archive_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemType: varchar("item_type", { enum: ["question", "quiz", "testbank"] }).notNull(),
  itemId: uuid("item_id").notNull(),
  itemTitle: varchar("item_title").notNull(),
  action: varchar("action", { enum: ["archived", "restored", "permanently_deleted"] }).notNull(),
  performedBy: varchar("performed_by").references(() => users.id).notNull(),
  reason: text("reason"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
  
  // Reference to original item for cross-checking
  originalData: jsonb("original_data"), // Store snapshot of item at time of archival
});

// Subscription Plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  priceMonthly: integer("price_monthly").notNull(), // in cents
  priceYearly: integer("price_yearly").notNull(), // in cents
  stripePriceIdMonthly: varchar("stripe_price_id_monthly"),
  stripePriceIdYearly: varchar("stripe_price_id_yearly"),
  
  // Feature limits
  maxUsers: integer("max_users").notNull(),
  maxQuizzes: integer("max_quizzes").notNull(),
  maxQuestions: integer("max_questions").notNull(),
  maxStorage: integer("max_storage").notNull(), // in MB
  
  // Feature flags
  features: jsonb("features").$type<{
    aiQuestionGeneration: boolean;
    liveProctoring: boolean;
    advancedAnalytics: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    ssoIntegration: boolean;
    prioritySupport: boolean;
    mobileApp: boolean;
    bulkImport: boolean;
    whiteLabel: boolean;
  }>().notNull(),
  
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Billing History table
export const billingHistory = pgTable("billing_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  stripeInvoiceId: varchar("stripe_invoice_id"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  
  // Invoice details
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency").notNull().default("usd"),
  status: varchar("status", { enum: ["pending", "paid", "failed", "canceled", "refunded"] }).notNull(),
  
  // Billing period
  billingPeriodStart: timestamp("billing_period_start"),
  billingPeriodEnd: timestamp("billing_period_end"),
  
  // Plan details at time of billing
  planName: varchar("plan_name"),
  planType: varchar("plan_type", { enum: ["monthly", "yearly"] }),
  
  // Payment details
  paymentMethod: varchar("payment_method"), // card, bank_transfer, etc.
  paidAt: timestamp("paid_at"),
  
  // Metadata
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage Tracking table
export const usageTracking = pgTable("usage_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  
  // Usage metrics
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  
  // Tracked usage
  quizzesCreated: integer("quizzes_created").default(0),
  questionsCreated: integer("questions_created").default(0),
  activeUsers: integer("active_users").default(0),
  storageUsed: integer("storage_used").default(0), // in MB
  
  // Feature usage
  aiQuestionsGenerated: integer("ai_questions_generated").default(0),
  proctoringSessions: integer("proctoring_sessions").default(0),
  analyticsViews: integer("analytics_views").default(0),
  
  // Overage tracking
  overageCharges: integer("overage_charges").default(0), // in cents
  overageDetails: jsonb("overage_details"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("usage_tracking_account_period").on(table.accountId, table.year, table.month),
]);

export const references = pgTable("references", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankId: uuid("bank_id").references(() => referenceBanks.id).notNull(),
  type: varchar("type", { enum: ["file", "url"] }).notNull(),
  url: text("url"), // For URLs and file download URLs
  filePath: text("file_path"), // For file storage path
  fileName: varchar("file_name"), // Original filename
  fileSize: integer("file_size"), // File size in bytes
  mimeType: varchar("mime_type"), // MIME type
  title: varchar("title"), // Display title
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scheduled Assignments table - for teacher assignments to students
export const scheduledAssignments = pgTable("scheduled_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").references(() => quizzes.id).notNull(),
  assignerId: varchar("assigner_id").references(() => users.id).notNull(), // Teacher who assigned
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  
  // Assignment details
  title: varchar("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  
  // Scheduling
  assignedAt: timestamp("assigned_at").defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  availableFrom: timestamp("available_from").notNull(),
  availableUntil: timestamp("available_until").notNull(),
  
  // Assignment settings
  allowLateSubmissions: boolean("allow_late_submissions").default(false),
  showResultsImmediately: boolean("show_results_immediately").default(false),
  requireProctoring: boolean("require_proctoring").default(false),
  maxAttempts: integer("max_attempts").default(1),
  
  // Student targeting
  targetStudents: jsonb("target_students").$type<string[]>().default([]), // specific student IDs
  targetAll: boolean("target_all").default(false), // all students in account
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assignment Submissions table - tracks student submissions
export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignmentId: uuid("assignment_id").references(() => scheduledAssignments.id).notNull(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  attemptId: uuid("attempt_id").references(() => quizAttempts.id).notNull(),
  
  // Submission details
  submittedAt: timestamp("submitted_at").defaultNow(),
  isLate: boolean("is_late").default(false),
  status: varchar("status", { enum: ["submitted", "graded", "returned"] }).default("submitted"),
  
  // Grading
  gradedAt: timestamp("graded_at"),
  gradedBy: varchar("graded_by").references(() => users.id),
  teacherComments: text("teacher_comments"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exam References table for universal CAT generation
export const examReferences = pgTable("exam_references", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // e.g., "Medical", "Engineering", "Legal", "NREMT", etc.
  subject: varchar("subject"), // specific subject within category
  topics: text("topics").array(), // array of topic keywords for matching
  
  // Reference content
  contentType: varchar("content_type", { enum: ["blueprint", "guidelines", "standards", "curriculum"] }).notNull(),
  content: text("content").notNull(), // The actual reference content/guidelines
  
  // Coverage and structure
  examStructure: jsonb("exam_structure").$type<{
    totalQuestions: number;
    timeLimit: number;
    passingScore: number;
    sections: Array<{
      name: string;
      description: string;
      questionCount: number;
      percentage: number;
      difficultyRange: { min: number; max: number };
    }>;
  }>(),
  
  // Question generation parameters
  questionGuidelines: jsonb("question_guidelines").$type<{
    questionTypes: string[];
    difficultyDistribution: { easy: number; medium: number; hard: number };
    scenarioBasedPercentage: number;
    bloomsTaxonomyLevels: string[];
    keyCompetencies: string[];
  }>(),
  
  // Metadata
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(false),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Study Aids table - AI-generated study materials for students
export const studyAids = pgTable("study_aids", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  quizId: uuid("quiz_id").references(() => quizzes.id).notNull(),
  
  // Study aid details
  title: varchar("title").notNull(),
  content: text("content").notNull(), // AI-generated content
  studyType: varchar("study_type", { 
    enum: ["summary", "flashcards", "practice_questions", "concept_map", "study_guide"] 
  }).notNull(),
  
  // Generation parameters
  generationPrompt: text("generation_prompt"),
  aiModel: varchar("ai_model").default("gpt-4o"),
  
  // Usage tracking
  accessCount: integer("access_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mobile Device Management table - for native app access
export const mobileDevices = pgTable("mobile_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Device information
  deviceName: varchar("device_name").notNull(),
  deviceType: varchar("device_type", { enum: ["ios", "android", "tablet"] }).notNull(),
  deviceId: varchar("device_id").notNull(), // unique device identifier
  osVersion: varchar("os_version"),
  appVersion: varchar("app_version"),
  
  // Registration and security
  registeredAt: timestamp("registered_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at"),
  isActive: boolean("is_active").default(true),
  pushToken: varchar("push_token"), // for notifications
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom prompt templates for AI services
export const promptTemplates = pgTable("prompt_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category", { 
    enum: ["question_generation", "validation", "study_guide", "improvement_plan", "custom"] 
  }).notNull(),
  template: text("template").notNull(),
  variables: jsonb("variables").$type<string[]>().default([]),
  isSystemDefault: boolean("is_system_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LLM provider configurations
export const llmProviders = pgTable("llm_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  provider: varchar("provider", { 
    enum: ["openai", "anthropic", "google", "meta", "xai", "deepseek", "custom"] 
  }).notNull(),
  apiKey: varchar("api_key"),
  apiEndpoint: varchar("api_endpoint"),
  defaultModel: varchar("default_model").notNull(),
  availableModels: jsonb("available_models").$type<string[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").default(1),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User saved custom instructions for AI generation
export const customInstructions = pgTable("custom_instructions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  instructions: text("instructions").notNull(),
  category: varchar("category", { 
    enum: ["question_generation", "validation", "general", "custom"] 
  }).notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  usageCount: integer("usage_count").default(0),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mood and Learning Difficulty Tracking
export const moodEntries = pgTable("mood_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Mood selection with emoji representation
  mood: varchar("mood", { 
    enum: ["😊", "😐", "😟", "😤", "😴", "🤔", "😎", "🤗"] 
  }).notNull(),
  moodLabel: varchar("mood_label", { 
    enum: ["happy", "neutral", "confused", "frustrated", "tired", "thinking", "confident", "excited"] 
  }).notNull(),
  
  // Context information
  context: varchar("context", { 
    enum: ["before_study", "during_study", "after_study", "before_quiz", "after_quiz", "general"] 
  }).notNull(),
  notes: text("notes"), // Optional user notes
  
  // Session information
  sessionType: varchar("session_type", { 
    enum: ["study", "quiz", "review", "general"] 
  }),
  relatedQuizId: uuid("related_quiz_id").references(() => quizzes.id),
  relatedTestbankId: uuid("related_testbank_id").references(() => testbanks.id),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const difficultyEntries = pgTable("difficulty_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Difficulty perception with emoji representation
  difficulty: varchar("difficulty", { 
    enum: ["😴", "😊", "🤔", "😅", "😰"] 
  }).notNull(),
  difficultyLabel: varchar("difficulty_label", { 
    enum: ["very_easy", "easy", "moderate", "hard", "very_hard"] 
  }).notNull(),
  difficultyScore: integer("difficulty_score").notNull(), // 1-5 scale
  
  // Content information
  contentType: varchar("content_type", { 
    enum: ["question", "topic", "quiz", "study_material", "concept"] 
  }).notNull(),
  contentTitle: varchar("content_title").notNull(),
  
  // Specific content references
  relatedQuestionId: uuid("related_question_id").references(() => questions.id),
  relatedQuizId: uuid("related_quiz_id").references(() => quizzes.id),
  relatedTestbankId: uuid("related_testbank_id").references(() => testbanks.id),
  
  // User feedback
  feedback: text("feedback"), // What made it difficult/easy
  timeSpent: integer("time_spent"), // Time in seconds
  needsHelp: boolean("needs_help").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Sections for organizing students
export const sections = pgTable("sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").references(() => users.id),
  accountId: uuid("account_id").references(() => accounts.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student Section Memberships
export const sectionMemberships = pgTable("section_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionId: uuid("section_id").references(() => sections.id),
  studentId: varchar("student_id").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  primaryKey: primaryKey({ columns: [table.sectionId, table.studentId] }),
}));

// Quiz Assignments (to users or sections)
export const quizAssignments = pgTable("quiz_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").references(() => quizzes.id),
  
  // Assignment can be to individual user or section
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id),
  assignedToSectionId: uuid("assigned_to_section_id").references(() => sections.id),
  
  // Assignment metadata
  assignedById: varchar("assigned_by_id").references(() => users.id),
  accountId: uuid("account_id").references(() => accounts.id),
  title: varchar("title"),
  description: text("description"),
  
  // Availability settings
  availableFrom: timestamp("available_from"),
  availableTo: timestamp("available_to"),
  dueDate: timestamp("due_date"),
  
  // Assignment settings
  maxAttempts: integer("max_attempts").default(1),
  timeLimit: integer("time_limit"), // in minutes
  allowLateSubmission: boolean("allow_late_submission").default(false),
  lateGradingOptions: jsonb("late_grading_options"), // { percentLostPerDay: number, maxLateDays: number }
  
  // Assignment-specific options (moved from quiz builder)
  showCorrectAnswers: boolean("show_correct_answers").default(false),
  enableQuestionFeedback: boolean("enable_question_feedback").default(false),
  requireProctoring: boolean("require_proctoring").default(false),
  allowCalculator: boolean("allow_calculator").default(false),
  
  // CAT (Computer Adaptive Testing) settings
  catEnabled: boolean("cat_enabled").default(false),
  catOptions: jsonb("cat_options"), // { minQuestions: number, maxQuestions: number, difficultyTarget: number }
  
  // Status
  status: varchar("status", { enum: ["draft", "published", "archived"] }).default("draft"),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const accountsRelations = relations(accounts, ({ many }) => ({
  users: many(users),
  testbanks: many(testbanks),
  quizzes: many(quizzes),
  scheduledAssignments: many(scheduledAssignments),
  examReferences: many(examReferences),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  account: one(accounts, { fields: [users.accountId], references: [accounts.id] }),
  testbanks: many(testbanks),
  quizzes: many(quizzes),
  attempts: many(quizAttempts),
  notifications: many(notifications),
  aiResources: many(aiResources),
  referenceBanks: many(referenceBanks),
  scheduledAssignments: many(scheduledAssignments),
  assignmentSubmissions: many(assignmentSubmissions),
  studyAids: many(studyAids),
  examReferences: many(examReferences),
  mobileDevices: many(mobileDevices),
  moodEntries: many(moodEntries),
  difficultyEntries: many(difficultyEntries),
  badges: many(badges),
  userBadges: many(userBadges),
  learningMilestones: many(learningMilestones),
  socialShares: many(socialShares),
  createdSections: many(sections),
  sectionMemberships: many(sectionMemberships),
  quizAssignments: many(quizAssignments),
  assignedQuizzes: many(quizAssignments),
}));

export const testbanksRelations = relations(testbanks, ({ one, many }) => ({
  creator: one(users, { fields: [testbanks.creatorId], references: [users.id] }),
  account: one(accounts, { fields: [testbanks.accountId], references: [accounts.id] }),
  questions: many(questions),
  catExamCategories: many(catExamCategories),
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
  account: one(accounts, { fields: [quizzes.accountId], references: [accounts.id] }),
  quizQuestions: many(quizQuestions),
  questionGroups: many(questionGroups),
  attempts: many(quizAttempts),
  scheduledAssignments: many(scheduledAssignments),
  studyAids: many(studyAids),
}));

export const questionGroupsRelations = relations(questionGroups, ({ one, many }) => ({
  quiz: one(quizzes, { fields: [questionGroups.quizId], references: [quizzes.id] }),
  questions: many(quizQuestions),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizQuestions.quizId], references: [quizzes.id] }),
  question: one(questions, { fields: [quizQuestions.questionId], references: [questions.id] }),
  questionGroup: one(questionGroups, { fields: [quizQuestions.questionGroupId], references: [questionGroups.id] }),
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

export const quizProgressRelations = relations(quizProgress, ({ one }) => ({
  attempt: one(quizAttempts, { fields: [quizProgress.attemptId], references: [quizAttempts.id] }),
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

export const referenceBanksRelations = relations(referenceBanks, ({ one, many }) => ({
  creator: one(users, { fields: [referenceBanks.creatorId], references: [users.id] }),
  references: many(references),
}));

export const referencesRelations = relations(references, ({ one }) => ({
  bank: one(referenceBanks, { fields: [references.bankId], references: [referenceBanks.id] }),
}));

export const scheduledAssignmentsRelations = relations(scheduledAssignments, ({ one, many }) => ({
  quiz: one(quizzes, { fields: [scheduledAssignments.quizId], references: [quizzes.id] }),
  assigner: one(users, { fields: [scheduledAssignments.assignerId], references: [users.id] }),
  account: one(accounts, { fields: [scheduledAssignments.accountId], references: [accounts.id] }),
  submissions: many(assignmentSubmissions),
}));

export const assignmentSubmissionsRelations = relations(assignmentSubmissions, ({ one }) => ({
  assignment: one(scheduledAssignments, { fields: [assignmentSubmissions.assignmentId], references: [scheduledAssignments.id] }),
  student: one(users, { fields: [assignmentSubmissions.studentId], references: [users.id] }),
  attempt: one(quizAttempts, { fields: [assignmentSubmissions.attemptId], references: [quizAttempts.id] }),
  grader: one(users, { fields: [assignmentSubmissions.gradedBy], references: [users.id] }),
}));

export const studyAidsRelations = relations(studyAids, ({ one }) => ({
  student: one(users, { fields: [studyAids.studentId], references: [users.id] }),
  quiz: one(quizzes, { fields: [studyAids.quizId], references: [quizzes.id] }),
}));

export const examReferencesRelations = relations(examReferences, ({ one }) => ({
  creator: one(users, { fields: [examReferences.createdBy], references: [users.id] }),
  account: one(accounts, { fields: [examReferences.accountId], references: [accounts.id] }),
}));

// CAT Exam Relations
export const catExamsRelations = relations(catExams, ({ one, many }) => ({
  creator: one(users, { fields: [catExams.creatorId], references: [users.id] }),
  account: one(accounts, { fields: [catExams.accountId], references: [accounts.id] }),
  categories: many(catExamCategories),
  assignments: many(catExamAssignments),
  sessions: many(catExamSessions),
  proctoringLobbies: many(proctoringLobbies),
}));

export const catExamCategoriesRelations = relations(catExamCategories, ({ one }) => ({
  catExam: one(catExams, { fields: [catExamCategories.catExamId], references: [catExams.id] }),
  testbank: one(testbanks, { fields: [catExamCategories.testbankId], references: [testbanks.id] }),
}));

export const catExamAssignmentsRelations = relations(catExamAssignments, ({ one, many }) => ({
  catExam: one(catExams, { fields: [catExamAssignments.catExamId], references: [catExams.id] }),
  student: one(users, { fields: [catExamAssignments.studentId], references: [users.id] }),
  assignedBy: one(users, { fields: [catExamAssignments.assignedBy], references: [users.id] }),
  sessions: many(catExamSessions),
}));

export const catExamSessionsRelations = relations(catExamSessions, ({ one }) => ({
  catExam: one(catExams, { fields: [catExamSessions.catExamId], references: [catExams.id] }),
  student: one(users, { fields: [catExamSessions.studentId], references: [users.id] }),
  assignment: one(catExamAssignments, { fields: [catExamSessions.assignmentId], references: [catExamAssignments.id] }),
  proctoringSession: one(proctoringLobbies, { fields: [catExamSessions.proctoringSessionId], references: [proctoringLobbies.id] }),
}));

export const proctoringLobbiesRelations = relations(proctoringLobbies, ({ one, many }) => ({
  catExam: one(catExams, { fields: [proctoringLobbies.catExamId], references: [catExams.id] }),
  proctor: one(users, { fields: [proctoringLobbies.proctorId], references: [users.id] }),
  participants: many(proctoringParticipants),
  sessions: many(catExamSessions),
}));

export const proctoringParticipantsRelations = relations(proctoringParticipants, ({ one }) => ({
  proctoringSession: one(proctoringLobbies, { fields: [proctoringParticipants.proctoringSessionId], references: [proctoringLobbies.id] }),
  student: one(users, { fields: [proctoringParticipants.studentId], references: [users.id] }),
  catSession: one(catExamSessions, { fields: [proctoringParticipants.catSessionId], references: [catExamSessions.id] }),
  verifiedBy: one(users, { fields: [proctoringParticipants.verifiedBy], references: [users.id] }),
}));

export const mobileDevicesRelations = relations(mobileDevices, ({ one }) => ({
  user: one(users, { fields: [mobileDevices.userId], references: [users.id] }),
}));

export const promptTemplatesRelations = relations(promptTemplates, ({ one }) => ({
  creator: one(users, { fields: [promptTemplates.createdBy], references: [users.id] }),
  account: one(accounts, { fields: [promptTemplates.accountId], references: [accounts.id] }),
}));

export const llmProvidersRelations = relations(llmProviders, ({ one }) => ({
  creator: one(users, { fields: [llmProviders.createdBy], references: [users.id] }),
  account: one(accounts, { fields: [llmProviders.accountId], references: [accounts.id] }),
}));

export const customInstructionsRelations = relations(customInstructions, ({ one }) => ({
  creator: one(users, { fields: [customInstructions.createdBy], references: [users.id] }),
  account: one(accounts, { fields: [customInstructions.accountId], references: [accounts.id] }),
}));

export const moodEntriesRelations = relations(moodEntries, ({ one }) => ({
  user: one(users, { fields: [moodEntries.userId], references: [users.id] }),
  relatedQuiz: one(quizzes, { fields: [moodEntries.relatedQuizId], references: [quizzes.id] }),
  relatedTestbank: one(testbanks, { fields: [moodEntries.relatedTestbankId], references: [testbanks.id] }),
}));

export const difficultyEntriesRelations = relations(difficultyEntries, ({ one }) => ({
  user: one(users, { fields: [difficultyEntries.userId], references: [users.id] }),
  relatedQuestion: one(questions, { fields: [difficultyEntries.relatedQuestionId], references: [questions.id] }),
  relatedQuiz: one(quizzes, { fields: [difficultyEntries.relatedQuizId], references: [quizzes.id] }),
  relatedTestbank: one(testbanks, { fields: [difficultyEntries.relatedTestbankId], references: [testbanks.id] }),
}));

// Badges table - for achievement and recognition badges
export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  
  // Badge design and metadata
  name: varchar("name").notNull(),
  description: text("description"),
  iconType: varchar("icon_type", { enum: ["emoji", "lucide", "custom"] }).notNull().default("emoji"),
  iconValue: varchar("icon_value").notNull(), // emoji character, lucide icon name, or custom icon URL
  color: varchar("color").notNull().default("#3B82F6"), // hex color code
  backgroundColor: varchar("background_color").notNull().default("#EFF6FF"),
  
  // Badge criteria and rules
  badgeType: varchar("badge_type", { 
    enum: ["achievement", "skill", "completion", "performance", "participation", "custom"] 
  }).notNull(),
  
  // Criteria for earning the badge (JSON object)
  criteria: jsonb("criteria").$type<{
    minScore?: number;
    minAccuracy?: number;
    completedQuizzes?: number;
    perfectScores?: number;
    streakDays?: number;
    timeConstraint?: number; // seconds
    specificQuizIds?: string[];
    customRules?: string;
  }>(),
  
  // Badge settings
  isActive: boolean("is_active").notNull().default(true),
  isAutoAwarded: boolean("is_auto_awarded").notNull().default(true),
  maxRecipients: integer("max_recipients"), // null for unlimited
  rarity: varchar("rarity", { enum: ["common", "uncommon", "rare", "epic", "legendary"] }).notNull().default("common"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Badges table - tracks which users have earned which badges
export const userBadges = pgTable("user_badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  badgeId: uuid("badge_id").references(() => badges.id).notNull(),
  
  // Award details
  awardedAt: timestamp("awarded_at").defaultNow(),
  awardedBy: varchar("awarded_by").references(() => users.id), // null for auto-awarded
  reason: text("reason"),
  
  // Context of earning the badge
  contextType: varchar("context_type", { 
    enum: ["quiz_completion", "perfect_score", "streak", "performance", "manual", "milestone"] 
  }),
  relatedQuizId: uuid("related_quiz_id").references(() => quizzes.id),
  relatedAttemptId: uuid("related_attempt_id").references(() => quizAttempts.id),
  
  // Social sharing settings
  isPublic: boolean("is_public").notNull().default(true),
  shareableUrl: text("shareable_url"),
  socialMediaShared: boolean("social_media_shared").notNull().default(false),
  
  // Display settings
  isPinned: boolean("is_pinned").notNull().default(false),
  displayOrder: integer("display_order"),
});

// Learning Milestones table - tracks significant learning achievements
export const learningMilestones = pgTable("learning_milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  
  // Milestone details
  title: varchar("title").notNull(),
  description: text("description"),
  milestoneType: varchar("milestone_type", {
    enum: ["first_quiz", "perfect_score", "completion_streak", "skill_mastery", "improvement", "custom"]
  }).notNull(),
  
  // Associated data
  subject: varchar("subject"),
  difficultyLevel: integer("difficulty_level"), // 1-10 scale
  relatedQuizId: uuid("related_quiz_id").references(() => quizzes.id),
  relatedTestbankId: uuid("related_testbank_id").references(() => testbanks.id),
  
  // Achievement metrics
  scoreAchieved: numeric("score_achieved", { precision: 5, scale: 2 }),
  improvementPercentage: numeric("improvement_percentage", { precision: 5, scale: 2 }),
  streakCount: integer("streak_count"),
  timeSpent: integer("time_spent"), // in seconds
  
  // Celebration and sharing
  iconEmoji: varchar("icon_emoji").notNull().default("🎉"),
  celebrationMessage: text("celebration_message"),
  isShared: boolean("is_shared").notNull().default(false),
  shareableUrl: text("shareable_url"),
  socialPlatforms: jsonb("social_platforms").$type<string[]>(), // platforms where shared
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Social Shares table - tracks sharing activity
export const socialShares = pgTable("social_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // What's being shared
  shareType: varchar("share_type", { 
    enum: ["badge", "milestone", "score", "completion", "certificate"] 
  }).notNull(),
  
  // Reference to shared content
  badgeId: uuid("badge_id").references(() => badges.id),
  milestoneId: uuid("milestone_id").references(() => learningMilestones.id),
  quizId: uuid("quiz_id").references(() => quizzes.id),
  attemptId: uuid("attempt_id").references(() => quizAttempts.id),
  
  // Sharing details
  platform: varchar("platform", {
    enum: ["facebook", "twitter", "linkedin", "instagram", "whatsapp", "email", "custom_link"]
  }).notNull(),
  
  shareUrl: text("share_url").notNull(),
  customMessage: text("custom_message"),
  
  // Privacy and visibility
  isPublic: boolean("is_public").notNull().default(true),
  visibility: varchar("visibility", { enum: ["public", "friends", "private"] }).notNull().default("public"),
  
  // Engagement tracking
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  
  // Metadata
  sharedAt: timestamp("shared_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // for temporary shares
});

// Badge Templates table - pre-defined badge templates for easy creation
export const badgeTemplates = pgTable("badge_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Template metadata
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category", {
    enum: ["academic", "skill", "participation", "achievement", "fun", "seasonal"]
  }).notNull(),
  
  // Default design
  iconType: varchar("icon_type", { enum: ["emoji", "lucide", "custom"] }).notNull().default("emoji"),
  iconValue: varchar("icon_value").notNull(),
  color: varchar("color").notNull().default("#3B82F6"),
  backgroundColor: varchar("background_color").notNull().default("#EFF6FF"),
  
  // Default criteria template
  defaultCriteria: jsonb("default_criteria").$type<{
    minScore?: number;
    minAccuracy?: number;
    completedQuizzes?: number;
    perfectScores?: number;
    streakDays?: number;
    timeConstraint?: number;
    customRules?: string;
  }>(),
  
  // Template settings
  isActive: boolean("is_active").notNull().default(true),
  usageCount: integer("usage_count").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Certificate Templates table - removed duplicate, using version in NEW FEATURES section

// Badge and milestone relations
export const badgesRelations = relations(badges, ({ one, many }) => ({
  creator: one(users, { fields: [badges.createdBy], references: [users.id] }),
  account: one(accounts, { fields: [badges.accountId], references: [accounts.id] }),
  userBadges: many(userBadges),
  socialShares: many(socialShares),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
  badge: one(badges, { fields: [userBadges.badgeId], references: [badges.id] }),
  awardedBy: one(users, { fields: [userBadges.awardedBy], references: [users.id] }),
  relatedQuiz: one(quizzes, { fields: [userBadges.relatedQuizId], references: [quizzes.id] }),
  relatedAttempt: one(quizAttempts, { fields: [userBadges.relatedAttemptId], references: [quizAttempts.id] }),
}));

export const learningMilestonesRelations = relations(learningMilestones, ({ one, many }) => ({
  user: one(users, { fields: [learningMilestones.userId], references: [users.id] }),
  account: one(accounts, { fields: [learningMilestones.accountId], references: [accounts.id] }),
  relatedQuiz: one(quizzes, { fields: [learningMilestones.relatedQuizId], references: [quizzes.id] }),
  relatedTestbank: one(testbanks, { fields: [learningMilestones.relatedTestbankId], references: [testbanks.id] }),
  socialShares: many(socialShares),
}));

export const socialSharesRelations = relations(socialShares, ({ one }) => ({
  user: one(users, { fields: [socialShares.userId], references: [users.id] }),
  badge: one(badges, { fields: [socialShares.badgeId], references: [badges.id] }),
  milestone: one(learningMilestones, { fields: [socialShares.milestoneId], references: [learningMilestones.id] }),
  quiz: one(quizzes, { fields: [socialShares.quizId], references: [quizzes.id] }),
  attempt: one(quizAttempts, { fields: [socialShares.attemptId], references: [quizAttempts.id] }),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  creator: one(users, { fields: [sections.creatorId], references: [users.id] }),
  account: one(accounts, { fields: [sections.accountId], references: [accounts.id] }),
  memberships: many(sectionMemberships),
  assignments: many(quizAssignments),
}));

export const sectionMembershipsRelations = relations(sectionMemberships, ({ one }) => ({
  section: one(sections, { fields: [sectionMemberships.sectionId], references: [sections.id] }),
  student: one(users, { fields: [sectionMemberships.studentId], references: [users.id] }),
}));

export const quizAssignmentsRelations = relations(quizAssignments, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizAssignments.quizId], references: [quizzes.id] }),
  assignedToUser: one(users, { fields: [quizAssignments.assignedToUserId], references: [users.id] }),
  assignedToSection: one(sections, { fields: [quizAssignments.assignedToSectionId], references: [sections.id] }),
  assignedBy: one(users, { fields: [quizAssignments.assignedById], references: [users.id] }),
  account: one(accounts, { fields: [quizAssignments.accountId], references: [accounts.id] }),
}));



// certificateTemplatesRelations moved to NEW FEATURES section

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTestbankSchema = createInsertSchema(testbanks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnswerOptionSchema = createInsertSchema(answerOptions).omit({ id: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuestionGroupSchema = createInsertSchema(questionGroups).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({ id: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true });
export const insertQuizResponseSchema = createInsertSchema(quizResponses).omit({ id: true, createdAt: true });
export const insertQuizProgressSchema = createInsertSchema(quizProgress).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true, updatedAt: true });

// CAT Exam Insert Schemas
export const insertCatExamSchema = createInsertSchema(catExams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCatExamCategorySchema = createInsertSchema(catExamCategories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCatExamAssignmentSchema = createInsertSchema(catExamAssignments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCatExamSessionSchema = createInsertSchema(catExamSessions).omit({ id: true, createdAt: true, updatedAt: true });

// Additional Insert Schemas
export const insertProctoringLogSchema = createInsertSchema(proctoringLogs).omit({ id: true, createdAt: true });
export const insertReferenceBankSchema = createInsertSchema(referenceBanks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReferenceSchema = createInsertSchema(references).omit({ id: true, createdAt: true, updatedAt: true });
export const insertScheduledAssignmentSchema = createInsertSchema(scheduledAssignments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStudyAidSchema = createInsertSchema(studyAids).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssignmentSubmissionSchema = createInsertSchema(assignmentSubmissions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMobileDeviceSchema = createInsertSchema(mobileDevices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPromptTemplateSchema = createInsertSchema(promptTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLlmProviderSchema = createInsertSchema(llmProviders).omit({ id: true, createdAt: true, updatedAt: true });



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
export type InsertQuestionGroup = z.infer<typeof insertQuestionGroupSchema>;
export type QuestionGroup = typeof questionGroups.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizResponse = z.infer<typeof insertQuizResponseSchema>;
export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertQuizProgress = z.infer<typeof insertQuizProgressSchema>;
export type QuizProgress = typeof quizProgress.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

// CAT Exam Types
export type InsertCatExam = z.infer<typeof insertCatExamSchema>;
export type CatExam = typeof catExams.$inferSelect;
export type InsertCatExamCategory = z.infer<typeof insertCatExamCategorySchema>;
export type CatExamCategory = typeof catExamCategories.$inferSelect;
export type InsertCatExamAssignment = z.infer<typeof insertCatExamAssignmentSchema>;
export type CatExamAssignment = typeof catExamAssignments.$inferSelect;
export type InsertCatExamSession = z.infer<typeof insertCatExamSessionSchema>;
export type CatExamSession = typeof catExamSessions.$inferSelect;
// Additional types can be added here as needed

// Additional tables for badge and certificate system
export const awardedBadges = pgTable("awarded_badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  badgeId: uuid("badge_id").references(() => badges.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(),
  awardedBy: varchar("awarded_by").references(() => users.id), // null if auto-awarded
  
  // Award context
  quizAttemptId: uuid("quiz_attempt_id").references(() => quizAttempts.id),
  reason: text("reason"),
  score: numeric("score"),
  metadata: jsonb("metadata"),
  
  // Award details
  awardedAt: timestamp("awarded_at").defaultNow(),
  isVisible: boolean("is_visible").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const issuedCertificates = pgTable("issued_certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => certificateTemplates.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(),
  issuedBy: varchar("issued_by").references(() => users.id),
  
  // Certificate data
  certificateNumber: varchar("certificate_number").notNull().unique(),
  recipientName: varchar("recipient_name").notNull(),
  achievementDetails: text("achievement_details"),
  completionDate: timestamp("completion_date").notNull(),
  
  // Related quiz data
  quizAttemptId: uuid("quiz_attempt_id").references(() => quizAttempts.id),
  finalScore: numeric("final_score"),
  accuracy: numeric("accuracy"),
  timeSpent: integer("time_spent"),
  
  // Verification
  certificateUrl: text("certificate_url"),
  verificationCode: varchar("verification_code").notNull().unique(),
  qrCodeData: text("qr_code_data"),
  
  // Status
  status: varchar("status", { enum: ["issued", "revoked", "expired"] }).notNull().default("issued"),
  expirationDate: timestamp("expiration_date"),
  revokedAt: timestamp("revoked_at"),
  revokedBy: varchar("revoked_by").references(() => users.id),
  revocationReason: text("revocation_reason"),
  
  // Metadata
  issuedAt: timestamp("issued_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull(),
  action: varchar("action").notNull(),
  resourceType: varchar("resource_type").notNull(),
  resourceId: varchar("resource_id").notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  severity: varchar("severity", { enum: ["low", "medium", "high", "critical"] }).notNull().default("low"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs);
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Security Events for proctoring system
export const securityEvents = pgTable("security_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  examId: uuid("exam_id").references(() => quizzes.id).notNull(),
  sessionId: varchar("session_id").notNull(),
  
  // Event details
  eventType: varchar("event_type", {
    enum: ["tab_switch", "window_blur", "copy_paste", "screenshot_attempt", 
           "network_disconnect", "multiple_tabs", "unauthorized_software", 
           "suspicious_timing", "biometric_fail", "fullscreen_exit"]
  }).notNull(),
  severity: varchar("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  
  // Context
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  browserFingerprint: text("browser_fingerprint"),
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Proctor Alerts for monitoring
export const proctorAlerts = pgTable("proctor_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  examId: uuid("exam_id").references(() => quizzes.id).notNull(),
  
  // Alert details
  alertType: varchar("alert_type").notNull(),
  severity: varchar("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  
  // Resolution
  resolved: boolean("resolved").notNull().default(false),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  
  // Tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============= OFFLINE SYNC CAPABILITIES =============

// Offline sync queue - stores actions that need to be synced when online
export const offlineSyncQueue = pgTable("offline_sync_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  deviceId: varchar("device_id").notNull(),
  actionType: varchar("action_type", { 
    enum: ["quiz_attempt", "quiz_response", "progress_update", "proctoring_event", 
           "security_event", "quiz_completion", "file_upload", "note_creation"] 
  }).notNull(),
  
  // Sync data
  payload: jsonb("payload").notNull(),
  clientTimestamp: timestamp("client_timestamp").notNull(),
  priority: varchar("priority", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  
  // Sync status
  status: varchar("status", { enum: ["pending", "syncing", "completed", "failed", "conflict"] }).notNull().default("pending"),
  syncedAt: timestamp("synced_at"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Connection logs - tracks connectivity status during exam sessions
export const connectionLogs = pgTable("connection_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  quizAttemptId: uuid("quiz_attempt_id").references(() => quizAttempts.id),
  deviceId: varchar("device_id").notNull(),
  sessionId: varchar("session_id").notNull(),
  
  // Connection event
  eventType: varchar("event_type", { 
    enum: ["connected", "disconnected", "reconnected", "poor_connection", "network_error"] 
  }).notNull(),
  connectionQuality: varchar("connection_quality", { enum: ["excellent", "good", "fair", "poor"] }),
  
  // Network details
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  networkType: varchar("network_type"), // wifi, cellular, ethernet
  bandwidth: integer("bandwidth"), // in kbps
  latency: integer("latency"), // in ms
  
  // Context
  currentQuestionIndex: integer("current_question_index"),
  questionsAnswered: integer("questions_answered"),
  timeRemaining: integer("time_remaining"), // in seconds
  
  // Offline mode details
  offlineModeEnabled: boolean("offline_mode_enabled").default(false),
  offlineDuration: integer("offline_duration"), // in seconds
  actionsQueuedOffline: integer("actions_queued_offline").default(0),
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Teacher notifications for offline students
export const teacherNotifications = pgTable("teacher_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  quizId: uuid("quiz_id").references(() => quizzes.id).notNull(),
  
  // Notification details
  notificationType: varchar("notification_type", { 
    enum: ["student_disconnected", "student_reconnected", "offline_mode_enabled", 
           "sync_completed", "sync_failed", "suspicious_offline_activity"] 
  }).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  severity: varchar("severity", { enum: ["info", "warning", "error", "critical"] }).notNull().default("info"),
  
  // Context data
  connectionDuration: integer("connection_duration"), // seconds offline
  questionsAnsweredOffline: integer("questions_answered_offline").default(0),
  metadata: jsonb("metadata"),
  
  // Notification status
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
  dismissed: boolean("dismissed").default(false),
  dismissedAt: timestamp("dismissed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Device sync status - tracks sync capabilities per device
export const deviceSyncStatus = pgTable("device_sync_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  deviceId: varchar("device_id").notNull(),
  
  // Device capabilities
  offlineModeSupported: boolean("offline_mode_supported").default(false),
  storageCapacity: integer("storage_capacity"), // in MB
  storageUsed: integer("storage_used").default(0),
  
  // Sync status
  lastSyncAt: timestamp("last_sync_at"),
  pendingActions: integer("pending_actions").default(0),
  syncErrors: integer("sync_errors").default(0),
  
  // Device info
  deviceType: varchar("device_type", { enum: ["mobile", "tablet", "desktop", "web"] }),
  platform: varchar("platform"), // iOS, Android, Web
  appVersion: varchar("app_version"),
  
  // Status
  isActive: boolean("is_active").default(true),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Offline sync relations
export const offlineSyncQueueRelations = relations(offlineSyncQueue, ({ one }) => ({
  user: one(users, { fields: [offlineSyncQueue.userId], references: [users.id] }),
}));

export const connectionLogsRelations = relations(connectionLogs, ({ one }) => ({
  user: one(users, { fields: [connectionLogs.userId], references: [users.id] }),
  quizAttempt: one(quizAttempts, { fields: [connectionLogs.quizAttemptId], references: [quizAttempts.id] }),
}));

export const teacherNotificationsRelations = relations(teacherNotifications, ({ one }) => ({
  teacher: one(users, { fields: [teacherNotifications.teacherId], references: [users.id] }),
  student: one(users, { fields: [teacherNotifications.studentId], references: [users.id] }),
  quiz: one(quizzes, { fields: [teacherNotifications.quizId], references: [quizzes.id] }),
}));

export const deviceSyncStatusRelations = relations(deviceSyncStatus, ({ one }) => ({
  user: one(users, { fields: [deviceSyncStatus.userId], references: [users.id] }),
}));

// Offline sync schemas
export const insertOfflineSyncQueueSchema = createInsertSchema(offlineSyncQueue).omit({ id: true, createdAt: true, updatedAt: true });
export const insertConnectionLogSchema = createInsertSchema(connectionLogs).omit({ id: true, timestamp: true });
export const insertTeacherNotificationSchema = createInsertSchema(teacherNotifications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDeviceSyncStatusSchema = createInsertSchema(deviceSyncStatus).omit({ id: true, createdAt: true, updatedAt: true });

// ============= NEW FEATURES: QUESTION FEEDBACK & EXPLANATIONS =============

// Question feedback table - stores explanations for correct/incorrect answers
export const questionFeedback = pgTable("question_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id").references(() => questions.id).notNull(),
  feedbackType: varchar("feedback_type", { enum: ["correct", "incorrect", "general", "hint"] }).notNull(),
  feedbackText: text("feedback_text").notNull(),
  showTiming: varchar("show_timing", { enum: ["immediate", "after_answer", "after_quiz", "never"] }).default("after_answer"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Answer option explanations - specific feedback for each answer choice
export const answerOptionFeedback = pgTable("answer_option_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  answerOptionId: uuid("answer_option_id").references(() => answerOptions.id).notNull(),
  explanationText: text("explanation_text").notNull(),
  showWhenSelected: boolean("show_when_selected").default(true),
  showInReview: boolean("show_in_review").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============= LEARNING PRESCRIPTIONS & STUDY GUIDES =============

// Learning prescriptions - personalized study plans
export const learningPrescriptions = pgTable("learning_prescriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  quizAttemptId: uuid("quiz_attempt_id").references(() => quizAttempts.id),
  title: varchar("title").notNull(),
  description: text("description"),
  weaknessAreas: jsonb("weakness_areas").$type<string[]>().default([]),
  strengthAreas: jsonb("strength_areas").$type<string[]>().default([]),
  recommendedStudyTime: integer("recommended_study_time"), // minutes
  difficultyFocus: varchar("difficulty_focus", { enum: ["basic", "intermediate", "advanced", "mixed"] }).default("mixed"),
  status: varchar("status", { enum: ["active", "completed", "paused", "archived"] }).default("active"),
  completionPercentage: integer("completion_percentage").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Study plan items - individual tasks within learning prescriptions
export const studyPlanItems = pgTable("study_plan_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  prescriptionId: uuid("prescription_id").references(() => learningPrescriptions.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  itemType: varchar("item_type", { enum: ["reading", "practice", "video", "exercise", "assessment"] }).notNull(),
  resourceUrl: text("resource_url"),
  estimatedTime: integer("estimated_time"), // minutes
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============= ANONYMOUS QUIZ ACCESS =============

// Anonymous quiz links - allow quiz access without accounts
export const anonymousQuizLinks = pgTable("anonymous_quiz_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").references(() => quizzes.id).notNull(),
  accessToken: varchar("access_token").unique().notNull(),
  linkName: varchar("link_name"),
  maxAttempts: integer("max_attempts").default(1),
  currentAttempts: integer("current_attempts").default(0),
  browserLockdown: boolean("browser_lockdown").default(false),
  allowPrint: boolean("allow_print").default(false),
  allowCopyPaste: boolean("allow_copy_paste").default(false),
  allowNavigation: boolean("allow_navigation").default(false),
  ipRestrictions: jsonb("ip_restrictions").$type<string[]>().default([]),
  timeLimit: integer("time_limit"), // minutes
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Anonymous quiz attempts - track guest attempts
export const anonymousQuizAttempts = pgTable("anonymous_quiz_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  linkId: uuid("link_id").references(() => anonymousQuizLinks.id).notNull(),
  quizId: uuid("quiz_id").references(() => quizzes.id).notNull(),
  sessionId: varchar("session_id").notNull(),
  guestName: varchar("guest_name"),
  guestEmail: varchar("guest_email"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  score: numeric("score", { precision: 5, scale: 2 }),
  maxScore: numeric("max_score", { precision: 5, scale: 2 }),
  percentage: numeric("percentage", { precision: 5, scale: 2 }),
  timeSpent: integer("time_spent"), // seconds
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  browserFingerprint: text("browser_fingerprint"),
  violationCount: integer("violation_count").default(0),
  status: varchar("status", { enum: ["in_progress", "completed", "abandoned", "flagged"] }).default("in_progress"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============= CUSTOM CERTIFICATES =============

// Certificate templates - admin-created certificate designs
export const certificateTemplates = pgTable("certificate_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  templateType: varchar("template_type", { enum: ["completion", "achievement", "score_based", "custom"] }).notNull(),
  backgroundImage: text("background_image"),
  logoImage: text("logo_image"),
  titleText: varchar("title_text").default("Certificate of Achievement"),
  bodyText: text("body_text"),
  signatureImages: jsonb("signature_images").$type<string[]>().default([]),
  fontFamily: varchar("font_family").default("Arial"),
  primaryColor: varchar("primary_color").default("#000000"),
  secondaryColor: varchar("secondary_color").default("#666666"),
  layout: varchar("layout", { enum: ["portrait", "landscape"] }).default("landscape"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Certificate awards - individual certificates issued
export const certificateAwards = pgTable("certificate_awards", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => certificateTemplates.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  quizId: uuid("quiz_id").references(() => quizzes.id),
  recipientName: varchar("recipient_name").notNull(),
  achievementText: text("achievement_text"),
  scoreAchieved: numeric("score_achieved", { precision: 5, scale: 2 }),
  awardDate: timestamp("award_date").defaultNow(),
  certificateNumber: varchar("certificate_number").unique(),
  issuedBy: varchar("issued_by").references(() => users.id).notNull(),
  pdfPath: text("pdf_path"),
  isRevoked: boolean("is_revoked").default(false),
  revokedAt: timestamp("revoked_at"),
  revokedBy: varchar("revoked_by").references(() => users.id),
  revokeReason: text("revoke_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============= MERCHANT ACCOUNT & PAYMENTS =============

// Payment plans - for paid quiz access
export const paymentPlans = pgTable("payment_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  billingInterval: varchar("billing_interval", { enum: ["one_time", "monthly", "yearly"] }).default("one_time"),
  features: jsonb("features").$type<string[]>().default([]),
  maxQuizzes: integer("max_quizzes"),
  maxAttempts: integer("max_attempts"),
  accessDuration: integer("access_duration"), // days
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer purchases - track paid access
export const customerPurchases = pgTable("customer_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  planId: uuid("plan_id").references(() => paymentPlans.id).notNull(),
  customerEmail: varchar("customer_email").notNull(),
  customerName: varchar("customer_name"),
  paymentIntentId: varchar("payment_intent_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  status: varchar("status", { enum: ["pending", "completed", "failed", "refunded"] }).default("pending"),
  accessToken: varchar("access_token").unique(),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  quizAccess: jsonb("quiz_access").$type<string[]>().default([]), // quiz IDs
  usedAttempts: integer("used_attempts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============= ERROR LOGGING FOR CRM =============

// Error logs table - comprehensive error tracking
export const errorLogs = pgTable("error_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  accountId: uuid("account_id").references(() => accounts.id),
  errorType: varchar("error_type", { enum: ["api", "export", "ui", "validation", "security", "payment", "general"] }).notNull(),
  severity: varchar("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  source: varchar("source").notNull(),
  message: text("message").notNull(),
  stackTrace: text("stack_trace"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  metadata: jsonb("metadata"),
  resolved: boolean("resolved").default(false),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Click logs table - user interaction tracking
export const clickLogs = pgTable("click_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  accountId: uuid("account_id").references(() => accounts.id),
  elementId: varchar("element_id"),
  elementType: varchar("element_type").notNull(),
  action: varchar("action", { enum: ["click", "hover", "focus", "scroll", "submit", "download", "export"] }).notNull(),
  page: varchar("page").notNull(),
  url: text("url").notNull(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Create insert schemas for new tables
export const insertSecurityEventSchema = createInsertSchema(securityEvents);
export const insertProctorAlertSchema = createInsertSchema(proctorAlerts);
export const insertQuestionFeedbackSchema = createInsertSchema(questionFeedback);
export const insertAnswerOptionFeedbackSchema = createInsertSchema(answerOptionFeedback);
export const insertLearningPrescriptionSchema = createInsertSchema(learningPrescriptions);
export const insertStudyPlanItemSchema = createInsertSchema(studyPlanItems);
export const insertAnonymousQuizLinkSchema = createInsertSchema(anonymousQuizLinks);
export const insertAnonymousQuizAttemptSchema = createInsertSchema(anonymousQuizAttempts);
export const insertCertificateTemplateSchema = createInsertSchema(certificateTemplates);
export const insertCertificateAwardSchema = createInsertSchema(certificateAwards);
export const insertPaymentPlanSchema = createInsertSchema(paymentPlans);
export const insertCustomerPurchaseSchema = createInsertSchema(customerPurchases);
export const insertErrorLogSchema = createInsertSchema(errorLogs);
export const insertClickLogSchema = createInsertSchema(clickLogs);

// Export types
export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertProctorAlert = z.infer<typeof insertProctorAlertSchema>;
export type ProctorAlert = typeof proctorAlerts.$inferSelect;
export type InsertQuestionFeedback = z.infer<typeof insertQuestionFeedbackSchema>;
export type QuestionFeedback = typeof questionFeedback.$inferSelect;
export type InsertAnswerOptionFeedback = z.infer<typeof insertAnswerOptionFeedbackSchema>;
export type AnswerOptionFeedback = typeof answerOptionFeedback.$inferSelect;
export type InsertLearningPrescription = z.infer<typeof insertLearningPrescriptionSchema>;
export type LearningPrescription = typeof learningPrescriptions.$inferSelect;
export type InsertStudyPlanItem = z.infer<typeof insertStudyPlanItemSchema>;
export type StudyPlanItem = typeof studyPlanItems.$inferSelect;
export type InsertAnonymousQuizLink = z.infer<typeof insertAnonymousQuizLinkSchema>;
export type AnonymousQuizLink = typeof anonymousQuizLinks.$inferSelect;
export type InsertAnonymousQuizAttempt = z.infer<typeof insertAnonymousQuizAttemptSchema>;
export type AnonymousQuizAttempt = typeof anonymousQuizAttempts.$inferSelect;
export type InsertCertificateTemplate = z.infer<typeof insertCertificateTemplateSchema>;
export type CertificateTemplate = typeof certificateTemplates.$inferSelect;
export type InsertCertificateAward = z.infer<typeof insertCertificateAwardSchema>;
export type CertificateAward = typeof certificateAwards.$inferSelect;
export type InsertPaymentPlan = z.infer<typeof insertPaymentPlanSchema>;
export type PaymentPlan = typeof paymentPlans.$inferSelect;
export type InsertCustomerPurchase = z.infer<typeof insertCustomerPurchaseSchema>;
export type CustomerPurchase = typeof customerPurchases.$inferSelect;
export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;
export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertClickLog = z.infer<typeof insertClickLogSchema>;
export type ClickLog = typeof clickLogs.$inferSelect;

// ============= COMPREHENSIVE LOGGING & SECURITY SYSTEM =============

// Comprehensive Activity Logging System
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  
  // Activity tracking
  action: varchar("action").notNull(), // create, update, delete, view, login, logout, click
  resource: varchar("resource").notNull(), // quiz, question, testbank, user, assignment
  resourceId: uuid("resource_id"),
  
  // Page and interaction tracking
  pageUrl: varchar("page_url"),
  pageTitle: varchar("page_title"),
  clickTarget: varchar("click_target"), // button ID, link text, etc.
  elementType: varchar("element_type"), // button, link, input, etc.
  
  // Request details
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id"),
  
  // Data changes
  beforeData: jsonb("before_data"), // State before change
  afterData: jsonb("after_data"), // State after change
  changesSummary: text("changes_summary"), // Human-readable change description
  
  // Security and performance
  responseTime: integer("response_time"), // API response time in ms
  statusCode: integer("status_code"), // HTTP status code
  errorMessage: text("error_message"),
  securityLevel: varchar("security_level", { enum: ["low", "medium", "high", "critical"] }).default("low"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Rollback System for Critical Operations
export const rollbackHistory = pgTable("rollback_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  
  // Rollback metadata
  operationType: varchar("operation_type", { 
    enum: ["quiz_edit", "question_edit", "testbank_edit", "user_edit", "assignment_edit", "delete", "bulk_update"] 
  }).notNull(),
  resourceType: varchar("resource_type", { enum: ["quiz", "question", "testbank", "user", "assignment"] }).notNull(),
  resourceId: uuid("resource_id").notNull(),
  
  // Rollback data
  previousState: jsonb("previous_state").notNull(), // Complete previous state
  currentState: jsonb("current_state").notNull(), // Current state
  rollbackDescription: text("rollback_description").notNull(),
  
  // Rollback status
  isRolledBack: boolean("is_rolled_back").default(false),
  rolledBackAt: timestamp("rolled_back_at"),
  rolledBackBy: varchar("rolled_back_by").references(() => users.id),
  
  // Auto-expire rollbacks after 30 days
  expiresAt: timestamp("expires_at").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced Security Events and Access Control Violations
export const enhancedSecurityEvents = pgTable("enhanced_security_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  accountId: uuid("account_id").references(() => accounts.id),
  
  // Security event details
  eventType: varchar("event_type", { 
    enum: ["unauthorized_access", "privilege_escalation", "data_breach_attempt", "suspicious_activity", "brute_force", "session_hijack"] 
  }).notNull(),
  severity: varchar("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  description: text("description").notNull(),
  
  // Request context
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  requestUrl: varchar("request_url"),
  requestMethod: varchar("request_method"),
  
  // Response and mitigation
  blocked: boolean("blocked").default(false),
  mitigationAction: varchar("mitigation_action"), // account_locked, ip_banned, session_terminated
  
  // Investigation
  investigated: boolean("investigated").default(false),
  investigatedBy: varchar("investigated_by").references(() => users.id),
  investigationNotes: text("investigation_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Role-Based Permission Tracking
export const permissionAudits = pgTable("permission_audits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  
  // Permission details
  requestedPermission: varchar("requested_permission").notNull(), // view_item_banks, edit_quiz, etc.
  resource: varchar("resource").notNull(),
  resourceId: uuid("resource_id"),
  
  // Access result
  granted: boolean("granted").notNull(),
  denialReason: varchar("denial_reason"), // insufficient_role, account_mismatch, etc.
  userRole: varchar("user_role").notNull(),
  requiredRole: varchar("required_role"),
  
  // Context
  requestContext: jsonb("request_context"), // Additional request details
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Comprehensive User Action Tracking
export const userActionTracker = pgTable("user_action_tracker", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id").notNull(),
  
  // Action details
  actionType: varchar("action_type", { 
    enum: ["page_view", "button_click", "form_submit", "download", "upload", "search", "filter", "sort"] 
  }).notNull(),
  targetElement: varchar("target_element"), // button id, form name, etc.
  
  // Page context
  currentPage: varchar("current_page").notNull(),
  referrerPage: varchar("referrer_page"),
  
  // Interaction details
  coordinates: jsonb("coordinates"), // { x: number, y: number }
  deviceType: varchar("device_type", { enum: ["desktop", "tablet", "mobile"] }),
  browserInfo: jsonb("browser_info"),
  
  // Performance metrics
  loadTime: integer("load_time"), // milliseconds
  interactionTime: integer("interaction_time"), // time since page load
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema relations for new tables
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
  account: one(accounts, { fields: [activityLogs.accountId], references: [accounts.id] }),
}));

export const rollbackHistoryRelations = relations(rollbackHistory, ({ one }) => ({
  user: one(users, { fields: [rollbackHistory.userId], references: [users.id] }),
  rolledBackBy: one(users, { fields: [rollbackHistory.rolledBackBy], references: [users.id] }),
  account: one(accounts, { fields: [rollbackHistory.accountId], references: [accounts.id] }),
}));

export const enhancedSecurityEventsRelations = relations(enhancedSecurityEvents, ({ one }) => ({
  user: one(users, { fields: [enhancedSecurityEvents.userId], references: [users.id] }),
  investigatedBy: one(users, { fields: [enhancedSecurityEvents.investigatedBy], references: [users.id] }),
  account: one(accounts, { fields: [enhancedSecurityEvents.accountId], references: [accounts.id] }),
}));

export const permissionAuditsRelations = relations(permissionAudits, ({ one }) => ({
  user: one(users, { fields: [permissionAudits.userId], references: [users.id] }),
  account: one(accounts, { fields: [permissionAudits.accountId], references: [accounts.id] }),
}));

export const userActionTrackerRelations = relations(userActionTracker, ({ one }) => ({
  user: one(users, { fields: [userActionTracker.userId], references: [users.id] }),
}));

// Insert schemas for new tables
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export const insertRollbackHistorySchema = createInsertSchema(rollbackHistory).omit({ id: true, createdAt: true });
export const insertEnhancedSecurityEventSchema = createInsertSchema(enhancedSecurityEvents).omit({ id: true, createdAt: true });
export const insertPermissionAuditSchema = createInsertSchema(permissionAudits).omit({ id: true, createdAt: true });
export const insertUserActionTrackerSchema = createInsertSchema(userActionTracker).omit({ id: true, createdAt: true });

// Types for new tables
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertRollbackHistory = z.infer<typeof insertRollbackHistorySchema>;
export type RollbackHistory = typeof rollbackHistory.$inferSelect;
export type InsertEnhancedSecurityEvent = z.infer<typeof insertEnhancedSecurityEventSchema>;
export type EnhancedSecurityEvent = typeof enhancedSecurityEvents.$inferSelect;
export type InsertPermissionAudit = z.infer<typeof insertPermissionAuditSchema>;
export type PermissionAudit = typeof permissionAudits.$inferSelect;
export type InsertUserActionTracker = z.infer<typeof insertUserActionTrackerSchema>;
export type UserActionTracker = typeof userActionTracker.$inferSelect;
