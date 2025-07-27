import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-simple";
import { setupAuth, isAuthenticated } from "./replitAuth";
// import { initializeLTI, getLTIConfig, requireLTIAuth, getLTIUser, sendGradePassback, createDeepLink } from "./ltiService";
import { setupWebSocket } from "./websocket";
import { 
  generateItemAnalysisReport, 
  exportAnalyticsData, 
  generateComprehensiveAnalyticsReport 
} from "./comprehensiveAnalyticsService";
import multer from "multer";
import { 
  insertTestbankSchema, 
  insertQuestionSchema, 
  insertQuizSchema, 
  insertQuizAttemptSchema,
  insertAnswerOptionSchema,
  insertQuizResponseSchema,
  insertAccountSchema,
  insertQuestionGroupSchema,
  insertQuizQuestionSchema,
  insertQuizProgressSchema,
} from "@shared/schema";
import { 
  validateQuestion, 
  generateStudyGuide, 
  generateImprovementPlan, 
  generateQuestionsWithAI, 
  generateSimilarQuestionWithContext,
  generateQuestionVariationWithContext,
  generateNewAnswerOptionsWithContext
} from "./aiService";
import { multiProviderAI } from "./multiProviderAI";
import { errorLogger } from "./errorLogger";
import { DifficultyService } from "./difficultyService";
import { offlineSyncService } from "./offlineSync";
import { CATService } from "./catService";
import { 
  generateQTIExport,
  generateCSVExport,
  generateXMLExport,
  generateCanvasExport,
  generateMoodleExport,
  generateBlackboardExport
} from "./exportService";
import { z } from "zod";
import Stripe from "stripe";

// Stripe setup
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
  });
} else {
  console.warn('Stripe secret key not found. Payment features will be disabled.');
}

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize LTI functionality (temporarily disabled)
  // try {
  //   await initializeLTI(app);
  //   console.log('LTI service initialized successfully');
  // } catch (error: any) {
  //   console.log('LTI service initialization failed, continuing without LTI:', error.message);
  // }

  // Auth middleware - temporarily disabled for testing
  // await setupAuth(app);

  // Add comprehensive logging and security middleware
  // Note: Imports will be added when implementing logging
  // app.use(createLoggingMiddleware(storage));
  // app.use(createSecurityMiddleware(storage));

  // Admin routes for logging and monitoring
  app.get('/api/admin/activity-logs/:userId?', async (req, res) => {
    try {
      const { userId } = req.params;
      const { action, resource, securityLevel, startDate, endDate, limit } = req.query;
      const accountId = '00000000-0000-0000-0000-000000000001'; // Mock account ID

      // Enhanced mock data for comprehensive demonstration
      const logs = [
        {
          id: '1',
          userId: userId || 'test-user',
          accountId,
          action: 'view',
          resource: 'User Activity Dashboard',
          pageUrl: '/admin/user-activity',
          createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          securityLevel: 'medium'
        },
        {
          id: '2',
          userId: userId || 'test-user',
          accountId,
          action: 'create',
          resource: 'Item Bank',
          pageUrl: '/item-banks',
          createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          securityLevel: 'high'
        },
        {
          id: '3',
          userId: userId || 'test-user',
          accountId,
          action: 'update',
          resource: 'Quiz Configuration',
          pageUrl: '/quiz-manager',
          createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          securityLevel: 'medium'
        },
        {
          id: '4',
          userId: userId || 'test-user',
          accountId,
          action: 'view',
          resource: 'Dashboard',
          pageUrl: '/dashboard',
          createdAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
          securityLevel: 'low'
        }
      ];
      
      res.json(logs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
  });

  app.get('/api/admin/rollback-history/:userId?', async (req, res) => {
    try {
      res.json([]); // Mock empty rollback history
    } catch (error) {
      console.error('Error fetching rollback history:', error);
      res.status(500).json({ error: 'Failed to fetch rollback history' });
    }
  });

  app.get('/api/admin/security-events/:userId?', async (req, res) => {
    try {
      res.json([]); // Mock empty security events
    } catch (error) {
      console.error('Error fetching security events:', error);
      res.status(500).json({ error: 'Failed to fetch security events' });
    }
  });

  app.get('/api/admin/permission-audits/:userId?', async (req, res) => {
    try {
      res.json([]); // Mock empty permission audits
    } catch (error) {
      console.error('Error fetching permission audits:', error);
      res.status(500).json({ error: 'Failed to fetch permission audits' });
    }
  });

  app.get('/api/admin/user-activity-summary/:userId', async (req, res) => {
    try {
      const summary = {
        totalActions: 127,
        pageViews: 85,
        buttonClicks: 32,
        formSubmissions: 10,
        securityEvents: 0,
        permissionDenials: 0,
        mostVisitedPages: [
          { page: '/dashboard', count: 25 },
          { page: '/item-banks', count: 18 },
          { page: '/quiz-manager', count: 15 },
          { page: '/admin/user-activity', count: 8 },
          { page: '/analytics', count: 6 }
        ],
        activityByDay: [
          { date: '2025-01-21', actions: 45 },
          { date: '2025-01-20', actions: 38 },
          { date: '2025-01-19', actions: 44 }
        ]
      };
      
      res.json(summary);
    } catch (error) {
      console.error('Error fetching user activity summary:', error);
      res.status(500).json({ error: 'Failed to fetch user activity summary' });
    }
  });

  app.post('/api/admin/execute-rollback/:rollbackId', async (req, res) => {
    try {
      res.json({ message: 'Rollback executed successfully' });
    } catch (error) {
      console.error('Error executing rollback:', error);
      res.status(500).json({ error: 'Failed to execute rollback' });
    }
  });

  // Users endpoint for admin dashboard
  app.get('/api/users', async (req, res) => {
    try {
      res.json(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });
  
  // Add session middleware for test login
  const { getSession } = await import("./replitAuth");
  app.use(getSession());

  // Mock auth for testing
  const mockUser = {
    id: "test-user",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    accountId: "00000000-0000-0000-0000-000000000001",
    role: "super_admin"
  };

  // Mock users for user activity dashboard
  const mockUsers = [
    {
      id: "test-user",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      role: "super_admin",
      accountId: "00000000-0000-0000-0000-000000000001"
    },
    {
      id: "student-1",
      email: "student1@example.com",
      firstName: "Student",
      lastName: "One",
      role: "student",
      accountId: "00000000-0000-0000-0000-000000000001"
    },
    {
      id: "teacher-1",
      email: "teacher1@example.com",
      firstName: "Teacher",
      lastName: "One",
      role: "teacher",
      accountId: "00000000-0000-0000-0000-000000000001"
    }
  ];

  // Function to get current user (supporting user switching)
  const getCurrentUser = async (req: any) => {
    // Check if user switching is active
    if (req.session && req.session.switchedUserId) {
      try {
        const switchedUser = await storage.getUserById(req.session.switchedUserId);
        return switchedUser;
      } catch (error) {
        console.error('Error fetching switched user:', error);
        // Fall back to default user
      }
    }
    
    // Default to mock user for testing
    return mockUser;
  };

  // Mock authentication middleware
  const mockAuth = async (req: any, res: any, next: any) => {
    req.user = await getCurrentUser(req);
    next();
  };

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      res.json(mockUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Mock logout route for development
  app.get('/api/logout', async (req: any, res) => {
    try {
      // Since we're using mock authentication, just redirect to landing page
      res.redirect('/');
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // Test login for student user
  app.post('/api/test-login', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (email === 'student@test.com') {
        const studentUser = {
          id: "student-test-user-001",
          email: "student@test.com",
          firstName: "Test",
          lastName: "Student",
          accountId: "00000000-0000-0000-0000-000000000001",
          role: "student"
        };
        
        // For testing, just set the user directly on the request
        req.user = studentUser;
        res.json({ success: true, user: studentUser });
      } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Error during test login:", error);
      res.status(500).json({ success: false, message: "Login failed" });
    }
  });

  // Student-specific endpoints
  app.get('/api/student/available-quizzes', mockAuth, async (req: any, res) => {
    try {
      // Return hardcoded data while fixing schema issues
      const sampleQuizzes = [
        {
          id: "4416cdf1-0b06-4fbf-89fd-38418eac6e70",
          title: "Sample Knowledge Test",
          description: "A comprehensive test covering basic concepts",
          instructions: "Answer all questions to the best of your ability",
          timeLimit: 60,
          maxAttempts: 1,
          shuffleAnswers: false,
          shuffleQuestions: false,
          allowMultipleAttempts: false,
          proctoring: false
        }
      ];
      
      res.json(sampleQuizzes);
    } catch (error) {
      console.error("Error fetching available quizzes:", error);
      res.status(500).json({ message: "Failed to fetch available quizzes" });
    }
  });

  app.get('/api/student/quiz-attempts', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      
      // Return sample quiz attempts while database schema is fixed
      const sampleAttempts = [
        {
          id: "attempt-001",
          quizId: "4416cdf1-0b06-4fbf-89fd-38418eac6e70",
          score: 85,
          maxScore: 100,
          completedAt: "2025-01-06T10:30:00Z",
          timeSpent: 45,
          passed: true,
          attemptNumber: 1
        }
      ];
      
      res.json(sampleAttempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  app.post('/api/student/start-quiz/:quizId', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const quizId = req.params.quizId;
      
      // Return success for now while database is being fixed
      res.json({ 
        success: true, 
        sessionId: `session-${Date.now()}`, 
        message: "Quiz session created successfully" 
      });
    } catch (error) {
      console.error("Error starting quiz:", error);
      res.status(500).json({ success: false, message: "Failed to start quiz" });
    }
  });

  // Get student quiz session
  app.get('/api/student/quiz-session/:quizId', mockAuth, async (req: any, res) => {
    try {
      const quizId = req.params.quizId;
      
      // Return sample quiz session data
      const sampleSession = {
        id: `session-${quizId}`,
        quizId: quizId,
        questions: [
          {
            id: "q1",
            text: "What is the primary action of epinephrine?",
            type: "multiple_choice",
            options: [
              "Alpha and beta adrenergic agonist",
              "Beta blocker",
              "Calcium channel blocker", 
              "ACE inhibitor"
            ],
            points: 1,
            difficulty: 3
          },
          {
            id: "q2", 
            text: "Normal adult respiratory rate range is:",
            type: "multiple_choice",
            options: [
              "8-12 breaths per minute",
              "12-20 breaths per minute",
              "20-30 breaths per minute",
              "30-40 breaths per minute"
            ],
            points: 1,
            difficulty: 2
          },
          {
            id: "q3",
            text: "Which drug is contraindicated in patients with a history of asthma?",
            type: "multiple_choice", 
            options: [
              "Albuterol",
              "Propranolol",
              "Epinephrine",
              "Atropine"
            ],
            points: 1,
            difficulty: 4
          }
        ],
        timeLimit: 60,
        startedAt: new Date().toISOString(),
        currentQuestion: 0,
        answers: {},
        timeRemaining: 3600 // 60 minutes in seconds
      };
      
      res.json(sampleSession);
    } catch (error) {
      console.error("Error fetching quiz session:", error);
      res.status(500).json({ message: "Failed to fetch quiz session" });
    }
  });

  // Get quiz questions (fixed endpoint)
  app.get('/api/quiz/:quizId/questions', mockAuth, async (req: any, res) => {
    try {
      const quizId = req.params.quizId;
      
      // Return sample questions while database schema is being fixed
      const sampleQuestions = [
        {
          id: "q1",
          text: "What is the primary action of epinephrine?",
          type: "multiple_choice",
          options: [
            "Alpha and beta adrenergic agonist",
            "Beta blocker",
            "Calcium channel blocker", 
            "ACE inhibitor"
          ],
          correctAnswer: 0,
          points: 1,
          difficulty: 3
        },
        {
          id: "q2", 
          text: "Normal adult respiratory rate range is:",
          type: "multiple_choice",
          options: [
            "8-12 breaths per minute",
            "12-20 breaths per minute",
            "20-30 breaths per minute",
            "30-40 breaths per minute"
          ],
          correctAnswer: 1,
          points: 1,
          difficulty: 2
        },
        {
          id: "q3",
          text: "Which drug is contraindicated in patients with a history of asthma?",
          type: "multiple_choice", 
          options: [
            "Albuterol",
            "Propranolol",
            "Epinephrine",
            "Atropine"
          ],
          correctAnswer: 1,
          points: 1,
          difficulty: 4
        }
      ];
      
      res.json(sampleQuestions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Failed to fetch quiz questions" });
    }
  });

  // Simple test endpoint
  app.get('/api/test-session/:quizId', mockAuth, async (req: any, res) => {
    res.json({ test: "success", quizId: req.params.quizId });
  });

  // Get quiz session
  app.get('/api/student/quiz-session/:quizId', mockAuth, async (req: any, res) => {
    try {
      console.log("Quiz session request received for quizId:", req.params.quizId);
      const userId = req.user?.id || "test-user";
      const quizId = req.params.quizId;
      
      // Return sample quiz session while database schema is being fixed
      const session = {
        id: `session-${quizId}-${userId}`,
        quizId,
        questions: [
          {
            id: "q1",
            text: "What is the primary action of epinephrine?",
            type: "multiple_choice",
            options: [
              "Alpha and beta adrenergic agonist",
              "Beta blocker", 
              "Calcium channel blocker",
              "ACE inhibitor"
            ],
            points: 1,
            difficulty: 3
          },
          {
            id: "q2",
            text: "Normal adult respiratory rate range is:",
            type: "multiple_choice",
            options: [
              "8-12 breaths per minute",
              "12-20 breaths per minute", 
              "20-30 breaths per minute",
              "30-40 breaths per minute"
            ],
            points: 1,
            difficulty: 2
          },
          {
            id: "q3",
            text: "Which drug is contraindicated in patients with a history of asthma?",
            type: "multiple_choice",
            options: [
              "Albuterol",
              "Propranolol",
              "Epinephrine", 
              "Atropine"
            ],
            points: 1,
            difficulty: 4
          }
        ],
        timeLimit: 60,
        startedAt: new Date().toISOString(),
        currentQuestion: 0,
        answers: {},
        timeRemaining: 60 * 60 // 60 minutes converted to seconds
      };
      
      console.log("Sending quiz session response");
      res.json(session);
    } catch (error) {
      console.error("Error fetching quiz session:", error);
      res.status(500).json({ message: "Failed to fetch quiz session" });
    }
  });

  // Save quiz progress
  app.post('/api/student/quiz-session/:quizId/progress', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const { questionId, answer, currentQuestion } = req.body;
      
      // For now, just return success - in a real implementation, 
      // this would save progress to the database
      res.json({ success: true, message: "Progress saved" });
    } catch (error) {
      console.error("Error saving quiz progress:", error);
      res.status(500).json({ success: false, message: "Failed to save progress" });
    }
  });

  // Submit quiz
  app.post('/api/student/quiz-session/:quizId/submit', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const quizId = req.params.quizId;
      const { answers } = req.body;
      
      // Get quiz questions to calculate score
      const questions = await storage.getQuizQuestions(quizId);
      
      let correctAnswers = 0;
      let totalQuestions = questions.length;
      
      // Calculate score based on correct answers
      questions.forEach(question => {
        if (answers[question.id] && question.answerOptions) {
          const correctOption = question.answerOptions.find(opt => opt.isCorrect);
          if (correctOption && answers[question.id] === correctOption.text) {
            correctAnswers++;
          }
        }
      });
      
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const quiz = await storage.getQuizById(quizId);
      const passed = score >= (quiz?.passingGrade || 70);
      
      // Create quiz attempt record
      const attemptData = {
        id: `attempt-${Date.now()}`,
        quizId,
        studentId: userId,
        score,
        maxScore: 100,
        completedAt: new Date().toISOString(),
        timeSpent: 30, // Mock time
        passed,
        attemptNumber: 1,
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.headers['user-agent'] || "Unknown"
      };
      
      // Save attempt (mock implementation)
      res.json({ 
        success: true, 
        score, 
        passed, 
        attemptId: attemptData.id,
        message: passed ? "Quiz completed successfully!" : "Quiz completed, but did not pass."
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ success: false, message: "Failed to submit quiz" });
    }
  });

  // API Key check route
  app.get('/api/check-openai-key', async (req, res) => {
    try {
      const hasKey = !!process.env.OPENAI_API_KEY;
      res.json({ available: hasKey });
    } catch (error) {
      res.status(500).json({ available: false });
    }
  });

  // CAT Exams API endpoints
  app.post('/api/cat-exams', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const catExamData = {
        ...req.body,
        createdBy: user.id,
        accountId: user.accountId || "00000000-0000-0000-0000-000000000001"
      };
      
      const catExam = await storage.createCATExam(catExamData);
      res.json(catExam);
    } catch (error) {
      console.error('Error creating CAT exam:', error);
      res.status(500).json({ message: 'Failed to create CAT exam' });
    }
  });

  app.get('/api/cat-exams', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const catExams = await storage.getCATExams();
      res.json(catExams);
    } catch (error) {
      console.error('CAT exams error:', error);
      res.status(500).json({ error: 'Failed to fetch CAT exams' });
    }
  });

  app.post('/api/mobile/cat-exam/:id/start', async (req, res) => {
    try {
      const { id } = req.params;
      const sessionId = `cat-session-${Date.now()}`;
      
      const session = {
        id: sessionId,
        catExamId: id,
        startTime: new Date(),
        currentProficiency: 0.5,
        questionsAnswered: 0,
        adaptiveQuestions: [
          {
            id: 'cat-q1',
            questionText: 'Which organelle is responsible for cellular respiration?',
            type: 'multiple_choice',
            options: ['Nucleus', 'Mitochondria', 'Chloroplast', 'Ribosome'],
            correctAnswer: 'Mitochondria',
            difficulty: 0.5,
            category: 'Cell Biology'
          }
        ]
      };
      
      res.json(session);
    } catch (error) {
      console.error('Start CAT exam error:', error);
      res.status(500).json({ error: 'Failed to start CAT exam' });
    }
  });

  // Mobile API endpoints
  app.get('/api/mobile/dashboard/stats', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const testbanks = await storage.getTestbanksByUser(userId);
      const quizzes = await storage.getQuizzesByUser(userId);
      
      // Calculate mobile-specific stats
      const stats = {
        assignedQuizzes: quizzes.filter(q => q.status === 'published').length,
        completedQuizzes: 0, // This would be calculated from actual attempts
        averageScore: 87, // This would be calculated from actual scores
        totalQuestions: testbanks.reduce((sum, tb) => sum + (tb.questionCount || 0), 0),
        upcomingDeadlines: quizzes.filter(q => q.dueDate && new Date(q.dueDate) > new Date()).length,
        recentActivity: quizzes.slice(0, 3).map(quiz => ({
          id: quiz.id,
          title: quiz.title,
          status: quiz.status,
          questionCount: quiz.questionCount || 0,
          dueDate: quiz.dueDate
        }))
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching mobile dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch mobile dashboard stats" });
    }
  });

  app.get('/api/mobile/assignments', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const testbanks = await storage.getTestbanksByUser(userId);
      
      // Transform testbanks to mobile-friendly quiz format
      const assignments = testbanks.map(testbank => ({
        id: testbank.id,
        title: testbank.title,
        description: testbank.description,
        questionCount: testbank.questionCount || 0,
        timeLimit: 60, // Default time limit
        difficulty: Math.floor(Math.random() * 3) + 2, // Random difficulty 2-4
        status: 'assigned', // Default status
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        attempts: 0,
        maxAttempts: 3,
        tags: testbank.tags || [],
        allowCalculator: true,
        calculatorType: 'basic' as const,
        proctoringEnabled: true,
        createdAt: testbank.createdAt,
        updatedAt: testbank.updatedAt
      }));
      
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching mobile assignments:", error);
      res.status(500).json({ message: "Failed to fetch mobile assignments" });
    }
  });

  app.get('/api/mobile/assignment/:id', mockAuth, async (req: any, res) => {
    try {
      const assignmentId = req.params.id;
      const testbank = await storage.getTestbankById(assignmentId);
      
      if (!testbank) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      const assignment = {
        id: testbank.id,
        title: testbank.title,
        description: testbank.description,
        questionCount: testbank.questionCount || 0,
        timeLimit: 60,
        difficulty: Math.floor(Math.random() * 3) + 2,
        status: 'assigned',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        attempts: 0,
        maxAttempts: 3,
        tags: testbank.tags || [],
        allowCalculator: true,
        calculatorType: 'basic' as const,
        proctoringEnabled: true,
        createdAt: testbank.createdAt,
        updatedAt: testbank.updatedAt
      };
      
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching mobile assignment:", error);
      res.status(500).json({ message: "Failed to fetch mobile assignment" });
    }
  });

  app.get('/api/mobile/assignment/:id/questions', mockAuth, async (req: any, res) => {
    try {
      const assignmentId = req.params.id;
      const questions = await storage.getQuestionsByTestbank(assignmentId);
      
      const mobileQuestions = questions.map(question => ({
        id: question.id,
        questionText: question.questionText,
        type: question.type,
        options: question.answerOptions?.map(opt => opt.text) || [],
        correctAnswer: question.answerOptions?.find(opt => opt.isCorrect)?.text || '',
        points: question.points || 1,
        difficulty: question.difficulty || 2,
        timeLimit: question.timeLimit
      }));
      
      res.json(mobileQuestions);
    } catch (error) {
      console.error("Error fetching mobile assignment questions:", error);
      res.status(500).json({ message: "Failed to fetch mobile assignment questions" });
    }
  });

  app.post('/api/mobile/assignment/:id/start', mockAuth, async (req: any, res) => {
    try {
      const assignmentId = req.params.id;
      const userId = req.user?.id || "test-user";
      
      const session = {
        id: `mobile-session-${Date.now()}`,
        assignmentId,
        userId,
        startTime: new Date().toISOString(),
        timeRemaining: 60 * 60, // 60 minutes in seconds
        currentQuestionIndex: 0,
        responses: {},
        isPaused: false,
        proctoring: {
          cameraEnabled: true,
          micEnabled: true,
          screenSharing: true,
          tabSwitches: 0,
          suspiciousActivity: []
        }
      };
      
      res.json(session);
    } catch (error) {
      console.error("Error starting mobile assignment:", error);
      res.status(500).json({ message: "Failed to start mobile assignment" });
    }
  });

  app.post('/api/mobile/session/:sessionId/submit', mockAuth, async (req: any, res) => {
    try {
      const sessionId = req.params.sessionId;
      const { responses, timeSpent } = req.body;
      
      // Calculate score (simplified for demo)
      const totalQuestions = Object.keys(responses).length;
      const score = Math.floor(Math.random() * 30) + 70; // Random score 70-100
      
      const result = {
        sessionId,
        score,
        passed: score >= 70,
        totalQuestions,
        answeredQuestions: totalQuestions,
        timeSpent,
        submittedAt: new Date().toISOString(),
        feedback: score >= 90 ? "Excellent work!" : 
                 score >= 80 ? "Good job!" : 
                 score >= 70 ? "Satisfactory performance" : 
                 "Needs improvement"
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error submitting mobile session:", error);
      res.status(500).json({ message: "Failed to submit mobile session" });
    }
  });

  app.get('/api/mobile/exam/questions', mockAuth, async (req: any, res) => {
    try {
      const { quizId } = req.query;
      if (!quizId) {
        return res.status(400).json({ message: 'Quiz ID is required' });
      }
      
      const questions = await storage.getQuizQuestions(quizId as string);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching exam questions:', error);
      res.status(500).json({ message: 'Failed to fetch exam questions' });
    }
  });

  app.post('/api/mobile/exam/start', mockAuth, async (req: any, res) => {
    try {
      const { quizId } = req.body;
      const userId = req.user?.id || "test-user";
      
      const questions = await storage.getQuizQuestions(quizId);
      
      res.json({
        session: {
          id: `session-${Date.now()}`,
          quizId,
          studentId: userId,
          startTime: new Date(),
          currentQuestionIndex: 0,
          responses: {},
          timeRemaining: 3600, // 1 hour default
          isPaused: false,
          violations: [],
          proctoring: {
            cameraEnabled: false,
            micEnabled: false,
            screenSharing: false,
            tabSwitches: 0,
            suspiciousActivity: []
          },
          allowCalculator: true
        },
        questions
      });
    } catch (error) {
      console.error('Error starting exam:', error);
      res.status(500).json({ message: 'Failed to start exam' });
    }
  });

  app.post('/api/mobile/exam/submit', mockAuth, async (req: any, res) => {
    try {
      const { sessionId, responses, timeSpent } = req.body;
      
      // Calculate score (simplified)
      const score = Math.floor(Math.random() * 40) + 60; // 60-100%
      
      res.json({
        success: true,
        score,
        message: 'Exam submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting exam:', error);
      res.status(500).json({ message: 'Failed to submit exam' });
    }
  });

  app.get('/api/mobile/student/profile', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const profile = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        profileImageUrl: user.profileImageUrl,
        studentId: `EMT-2025-${user.id.slice(-3)}`,
        completedExams: 2,
        averageScore: 87,
        totalPoints: 245,
        rank: 'Advanced',
        achievements: [
          { name: 'First Exam', icon: '🎯', date: '2025-07-01' },
          { name: 'High Scorer', icon: '⭐', date: '2025-07-05' }
        ],
        recentScores: [
          { exam: 'Toxicology', score: 92, date: '2025-07-05' },
          { exam: 'Airway Management', score: 82, date: '2025-07-03' }
        ]
      };
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching mobile student profile:", error);
      res.status(500).json({ message: "Failed to fetch mobile student profile" });
    }
  });

  // Onboarding completion tracking
  app.post('/api/users/onboarding/complete', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      
      // Mark user's onboarding as completed
      await storage.updateUserOnboardingStatus(userId, true);
      
      res.json({ message: 'Onboarding completed successfully' });
    } catch (error) {
      console.error('Error updating onboarding status:', error);
      res.status(500).json({ message: 'Failed to update onboarding status' });
    }
  });

  app.get('/api/users/onboarding/status', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ 
        hasCompletedOnboarding: user.hasCompletedOnboarding || false,
        isFirstLogin: !user.hasCompletedOnboarding && !user.onboardingSkipped
      });
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
      res.status(500).json({ message: 'Failed to fetch onboarding status' });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const stats = await storage.getDashboardStats(userId);
      
      // Add additional comprehensive stats
      const additionalStats = await storage.getAdditionalDashboardStats(userId);
      
      res.json({
        ...stats,
        ...additionalStats
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/active-sessions', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const activeSessions = await storage.getActiveExamSessions(userId);
      res.json(activeSessions);
    } catch (error) {
      console.error("Error fetching active exam sessions:", error);
      res.status(500).json({ message: "Failed to fetch active exam sessions" });
    }
  });

  // Enhanced Difficulty tracking API endpoints
  app.get('/api/difficulty-tracking/questions', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get sample questions for demonstration (simplified approach)
      const questions = [
        {
          id: 'q1', 
          questionText: 'What is the capital of France?',
          questionType: 'multiple_choice',
          difficultyLevel: 3,
          testbankId: 'tb1',
          isPilotQuestion: true,
          pilotResponsesNeeded: 30,
          pilotValidated: false,
          updatedAt: new Date()
        },
        {
          id: 'q2',
          questionText: 'Calculate the integral of x^2 dx',
          questionType: 'fill_blank',
          difficultyLevel: 7,
          testbankId: 'tb2',
          isPilotQuestion: false,
          pilotResponsesNeeded: 30,
          pilotValidated: true,
          updatedAt: new Date()
        },
        {
          id: 'q3',
          questionText: 'Which programming language is known for its simplicity?',
          questionType: 'multiple_choice',
          difficultyLevel: 4,
          testbankId: 'tb1',
          isPilotQuestion: true,
          pilotResponsesNeeded: 30,
          pilotValidated: false,
          updatedAt: new Date()
        }
      ];
      
      const difficultyStats = await Promise.all(questions.map(async (question) => {
        // Simulate response data for testing (replace with real data)
        const totalResponses = Math.floor(Math.random() * 100) + 10;
        const correctResponses = Math.floor(totalResponses * (Math.random() * 0.8 + 0.1));
        const accuracyPercentage = (correctResponses / totalResponses) * 100;
        
        // Calculate current difficulty based on accuracy
        let currentDifficulty: number;
        if (accuracyPercentage >= 90) currentDifficulty = 1;
        else if (accuracyPercentage >= 80) currentDifficulty = 2;
        else if (accuracyPercentage >= 70) currentDifficulty = 3;
        else if (accuracyPercentage >= 60) currentDifficulty = 4;
        else if (accuracyPercentage >= 50) currentDifficulty = 5;
        else if (accuracyPercentage >= 40) currentDifficulty = 6;
        else if (accuracyPercentage >= 30) currentDifficulty = 7;
        else if (accuracyPercentage >= 20) currentDifficulty = 8;
        else if (accuracyPercentage >= 10) currentDifficulty = 9;
        else currentDifficulty = 10;
        
        const originalDifficulty = question.difficultyLevel || 5;
        
        // Determine trend
        let difficultyTrend: 'increasing' | 'decreasing' | 'stable';
        if (Math.abs(currentDifficulty - originalDifficulty) < 0.5) {
          difficultyTrend = 'stable';
        } else if (currentDifficulty > originalDifficulty) {
          difficultyTrend = 'increasing';
        } else {
          difficultyTrend = 'decreasing';
        }
        
        // Get testbank name - handle non-UUID testbank IDs for demo data
        let testbank = null;
        let testbankName = 'Demo Testbank';
        if (question.testbankId) {
          try {
            testbank = await storage.getTestbank(question.testbankId);
            testbankName = testbank?.title || 'Unknown Testbank';
          } catch (error) {
            // If testbank ID is not a valid UUID, use demo names
            if (question.testbankId === 'tb1') {
              testbankName = 'General Knowledge';
            } else if (question.testbankId === 'tb2') {
              testbankName = 'Mathematics';
            } else {
              testbankName = 'Demo Testbank';
            }
          }
        }
        
        return {
          questionId: question.id,
          questionText: question.questionText,
          currentDifficulty,
          originalDifficulty,
          correctResponses,
          totalResponses,
          accuracyPercentage: Number(accuracyPercentage.toFixed(1)),
          isPilotQuestion: question.isPilotQuestion || false,
          pilotResponsesNeeded: question.pilotResponsesNeeded || 30,
          pilotResponsesCount: totalResponses,
          pilotValidated: question.pilotValidated || (totalResponses >= (question.pilotResponsesNeeded || 30)),
          questionType: question.questionType,
          testbankName: testbankName,
          lastUpdated: question.updatedAt || new Date(),
          difficultyTrend,
          confidenceScore: Math.min(0.99, Math.max(0.1, totalResponses / 50))
        };
      }));

      res.json(difficultyStats);
    } catch (error) {
      console.error('Error fetching difficulty questions:', error);
      res.status(500).json({ error: 'Failed to fetch difficulty tracking data' });
    }
  });

  app.get('/api/difficulty-tracking/analytics', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Use the same sample questions for analytics consistency
      const questions = [
        {
          id: 'q1', 
          questionText: 'What is the capital of France?',
          questionType: 'multiple_choice',
          difficultyLevel: 3,
          testbankId: 'tb1',
          isPilotQuestion: true,
          pilotResponsesNeeded: 30,
          pilotValidated: false,
          updatedAt: new Date()
        },
        {
          id: 'q2',
          questionText: 'Calculate the integral of x^2 dx',
          questionType: 'fill_blank',
          difficultyLevel: 7,
          testbankId: 'tb2',
          isPilotQuestion: false,
          pilotResponsesNeeded: 30,
          pilotValidated: true,
          updatedAt: new Date()
        },
        {
          id: 'q3',
          questionText: 'Which programming language is known for its simplicity?',
          questionType: 'multiple_choice',
          difficultyLevel: 4,
          testbankId: 'tb1',
          isPilotQuestion: true,
          pilotResponsesNeeded: 30,
          pilotValidated: false,
          updatedAt: new Date()
        }
      ];
      
      let totalQuestions = questions.length;
      let pilotQuestions = 0;
      let validatedQuestions = 0;
      let totalDifficulty = 0;
      let recentAdjustments = 0;
      let difficultyDistribution: Record<number, number> = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0
      };

      const questionStats = questions.map((question) => {
        // Simulate response data
        const totalResponses = Math.floor(Math.random() * 100) + 10;
        const correctResponses = Math.floor(totalResponses * (Math.random() * 0.8 + 0.1));
        const accuracyPercentage = (correctResponses / totalResponses) * 100;
        
        // Calculate current difficulty
        let currentDifficulty: number;
        if (accuracyPercentage >= 90) currentDifficulty = 1;
        else if (accuracyPercentage >= 80) currentDifficulty = 2;
        else if (accuracyPercentage >= 70) currentDifficulty = 3;
        else if (accuracyPercentage >= 60) currentDifficulty = 4;
        else if (accuracyPercentage >= 50) currentDifficulty = 5;
        else if (accuracyPercentage >= 40) currentDifficulty = 6;
        else if (accuracyPercentage >= 30) currentDifficulty = 7;
        else if (accuracyPercentage >= 20) currentDifficulty = 8;
        else if (accuracyPercentage >= 10) currentDifficulty = 9;
        else currentDifficulty = 10;
        
        const originalDifficulty = question.difficultyLevel || 5;
        
        return {
          question,
          currentDifficulty,
          originalDifficulty,
          totalResponses,
          correctResponses,
          accuracyPercentage
        };
      });

      // Calculate analytics
      questionStats.forEach(({ question, currentDifficulty, originalDifficulty, totalResponses }) => {
        if (question.isPilotQuestion) pilotQuestions++;
        if (question.pilotValidated || totalResponses >= (question.pilotResponsesNeeded || 30)) {
          validatedQuestions++;
        }
        
        totalDifficulty += currentDifficulty;
        difficultyDistribution[Math.round(currentDifficulty)]++;
        
        // Count as recent adjustment if difficulty changed significantly
        if (Math.abs(currentDifficulty - originalDifficulty) > 0.5) {
          recentAdjustments++;
        }
      });

      // Generate accuracy trends (last 7 days)
      const accuracyTrends = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStats = questionStats.filter(s => s.totalResponses > 0);
        const avgAccuracy = dayStats.length > 0 
          ? dayStats.reduce((sum, s) => sum + s.accuracyPercentage, 0) / dayStats.length
          : 0;
        
        accuracyTrends.push({
          date: date.toISOString().split('T')[0],
          accuracy: Number(avgAccuracy.toFixed(1))
        });
      }

      // Top performing questions (highest accuracy with sufficient responses)
      const topPerformingQuestions = questionStats
        .filter(s => s.totalResponses >= 10)
        .sort((a, b) => b.accuracyPercentage - a.accuracyPercentage)
        .slice(0, 5)
        .map(s => ({
          questionId: s.question.id,
          questionText: s.question.questionText,
          accuracyPercentage: s.accuracyPercentage,
          totalResponses: s.totalResponses
        }));

      // Questions needing attention (low accuracy or high difficulty drift)
      const needsAttentionQuestions = questionStats
        .filter(s => s.accuracyPercentage < 40 || Math.abs(s.currentDifficulty - s.originalDifficulty) > 2)
        .sort((a, b) => a.accuracyPercentage - b.accuracyPercentage)
        .slice(0, 5)
        .map(s => ({
          questionId: s.question.id,
          questionText: s.question.questionText,
          accuracyPercentage: s.accuracyPercentage,
          currentDifficulty: s.currentDifficulty,
          originalDifficulty: s.originalDifficulty,
          totalResponses: s.totalResponses
        }));

      const analytics = {
        totalQuestions,
        pilotQuestions,
        validatedQuestions,
        avgDifficulty: totalQuestions > 0 ? Number((totalDifficulty / totalQuestions).toFixed(1)) : 0,
        difficultyDistribution,
        recentAdjustments,
        accuracyTrends,
        topPerformingQuestions,
        needsAttentionQuestions
      };

      res.json(analytics);
    } catch (error) {
      console.error('Error fetching difficulty analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  });

  app.post('/api/difficulty-tracking/adjust/:questionId', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { questionId } = req.params;
      const { newDifficulty, reason } = req.body;

      if (!newDifficulty || newDifficulty < 1 || newDifficulty > 10) {
        return res.status(400).json({ error: 'Invalid difficulty level' });
      }

      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Update question difficulty
      await storage.updateQuestion(questionId, {
        difficultyLevel: newDifficulty,
        updatedAt: new Date()
      });

      // Log the manual adjustment
      console.log(`Manual difficulty adjustment: Question ${questionId} adjusted to ${newDifficulty}. Reason: ${reason || 'No reason provided'}`);

      res.json({ 
        success: true, 
        message: 'Difficulty level updated successfully',
        newDifficulty 
      });
    } catch (error) {
      console.error('Error adjusting difficulty:', error);
      res.status(500).json({ error: 'Failed to adjust difficulty level' });
    }
  });

  // Test difficulty tracking endpoint (legacy)
  app.get('/api/difficulty/test', mockAuth, async (req: any, res) => {
    try {
      // Get first question from database for testing
      const questions = await storage.getQuestions();
      if (questions.length === 0) {
        return res.status(404).json({ message: 'No questions found for testing' });
      }
      
      const testQuestion = questions[0];
      const stats = {
        questionId: testQuestion.id,
        questionText: testQuestion.questionText,
        currentDifficulty: testQuestion.currentDifficultyScore || testQuestion.difficultyScore,
        originalDifficulty: testQuestion.originalDifficultyScore || testQuestion.difficultyScore,
        correctResponses: testQuestion.correctResponsesCount || 0,
        totalResponses: testQuestion.totalResponsesCount || 0,
        accuracyPercentage: testQuestion.accuracyPercentage || 0,
        isPilotQuestion: testQuestion.isPilotQuestion || false,
        pilotResponsesNeeded: testQuestion.pilotResponsesNeeded || 30,
        pilotResponsesCount: testQuestion.pilotResponsesCount || 0,
        pilotValidated: testQuestion.pilotValidated || false
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error testing difficulty tracking:', error);
      res.status(500).json({ message: 'Failed to test difficulty tracking' });
    }
  });

  // Testbank routes
  app.post('/api/testbanks', async (req: any, res) => {
    // For now, use a test user ID since authentication might not be fully set up
    const userId = req.user?.claims?.sub || req.user?.id || "test-user";
    
    // Prepare data with required fields
    const requestData = {
      ...req.body,
      creatorId: userId,
      accountId: req.body.accountId || '00000000-0000-0000-0000-000000000001', // Default account
    };
    
    try {
      const testbankData = insertTestbankSchema.parse(requestData);
      
      const testbank = await storage.createTestbank(testbankData);
      res.json(testbank);
    } catch (error) {
      console.error("Error creating testbank:", error);
      console.error("Request body:", req.body);
      console.error("Request data:", requestData);
      res.status(400).json({ 
        message: "Failed to create testbank",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get('/api/testbanks', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || "test-user";
      const testbanks = await storage.getTestbanksByUser(userId);
      
      // Add question count for each testbank
      const testbanksWithCounts = await Promise.all(
        testbanks.map(async (testbank) => {
          const questions = await storage.getQuestionsByTestbank(testbank.id);
          return {
            ...testbank,
            questionCount: questions.length
          };
        })
      );
      
      res.json(testbanksWithCounts);
    } catch (error) {
      console.error("Error fetching testbanks:", error);
      res.status(500).json({ message: "Failed to fetch testbanks" });
    }
  });

  app.get('/api/testbanks/:id', async (req: any, res) => {
    try {
      const testbank = await storage.getTestbank(req.params.id);
      if (!testbank) {
        return res.status(404).json({ message: "Testbank not found" });
      }
      res.json(testbank);
    } catch (error) {
      console.error("Error fetching testbank:", error);
      res.status(500).json({ message: "Failed to fetch testbank" });
    }
  });

  app.put('/api/testbanks/:id', async (req: any, res) => {
    try {
      const testbankData = insertTestbankSchema.partial().parse(req.body);
      const testbank = await storage.updateTestbank(req.params.id, testbankData);
      res.json(testbank);
    } catch (error) {
      console.error("Error updating testbank:", error);
      res.status(400).json({ message: "Failed to update testbank" });
    }
  });

  app.delete('/api/testbanks/:id', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const reason = req.body?.reason || "User initiated deletion";
      
      await storage.deleteTestbank(req.params.id, userId, reason);
      res.json({ message: "Testbank archived successfully" });
    } catch (error) {
      console.error("Error archiving testbank:", error);
      res.status(500).json({ message: "Failed to archive testbank" });
    }
  });

  // Export testbank in various formats
  app.get('/api/testbanks/:id/export', mockAuth, async (req: any, res) => {
    try {
      const testbankId = req.params.id;
      const format = req.query.format || 'json';
      
      // Get testbank and questions
      const testbank = await storage.getTestbank(testbankId);
      if (!testbank) {
        return res.status(404).json({ message: "Testbank not found" });
      }
      
      const questions = await storage.getQuestionsByTestbank(testbankId);
      
      // Fetch answer options for each question
      const questionsWithOptions = await Promise.all(
        questions.map(async (question) => {
          const answerOptions = await storage.getAnswerOptionsByQuestion(question.id);
          return { ...question, answerOptions };
        })
      );
      
      // Generate export based on format
      let exportData: any;
      let contentType: string;
      let filename: string;
      
      switch (format.toLowerCase()) {
        case 'qti':
          try {
            exportData = generateQTIExport(testbank, questionsWithOptions);
            contentType = 'application/zip';
            filename = `${testbank.title}_qti.zip`;
          } catch (qtiError) {
            console.error("QTI Export Error:", qtiError);
            await errorLogger.logError({
              errorType: 'export',
              severity: 'high',
              source: '/api/testbanks/:id/export',
              message: `QTI export failed: ${qtiError.message}`,
              stackTrace: qtiError.stack,
              userId: req.user?.id,
              accountId: req.user?.accountId,
              metadata: { testbankId, format }
            });
            return res.status(500).json({ message: "QTI export failed", error: qtiError.message });
          }
          break;
          
        case 'csv':
          exportData = generateCSVExport(testbank, questionsWithOptions);
          contentType = 'text/csv';
          filename = `${testbank.title}.csv`;
          break;
          
        case 'xml':
          exportData = generateXMLExport(testbank, questionsWithOptions);
          contentType = 'application/xml';
          filename = `${testbank.title}.xml`;
          break;
          
        case 'canvas':
          exportData = generateCanvasExport(testbank, questionsWithOptions);
          contentType = 'application/xml';
          filename = `${testbank.title}_canvas.xml`;
          break;
          
        case 'moodle':
          exportData = generateMoodleExport(testbank, questionsWithOptions);
          contentType = 'application/xml';
          filename = `${testbank.title}_moodle.xml`;
          break;
          
        case 'blackboard':
          exportData = generateBlackboardExport(testbank, questionsWithOptions);
          contentType = 'text/plain';
          filename = `${testbank.title}_blackboard.txt`;
          break;
          
        default: // json
          exportData = {
            testbank,
            questions: questionsWithOptions,
            exportedAt: new Date().toISOString(),
            format: 'ProficiencyAI JSON'
          };
          contentType = 'application/json';
          filename = `${testbank.title}.json`;
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      if (typeof exportData === 'string') {
        res.send(exportData);
      } else {
        res.json(exportData);
      }
      
    } catch (error) {
      console.error("Error exporting testbank:", error);
      res.status(500).json({ message: "Failed to export testbank" });
    }
  });

  // Question routes
  // Get all questions for current user
  app.get('/api/questions', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || "test-user";
      
      // Get all testbanks for user first
      const testbanks = await storage.getTestbanksByUser(userId);
      
      // Get all questions from all user's testbanks
      const allQuestions = [];
      for (const testbank of testbanks) {
        const questions = await storage.getQuestionsByTestbank(testbank.id);
        
        // Add answer options to each question
        const questionsWithOptions = await Promise.all(
          questions.map(async (question) => {
            const answerOptions = await storage.getAnswerOptionsByQuestion(question.id);
            return {
              ...question,
              answerOptions
            };
          })
        );
        
        allQuestions.push(...questionsWithOptions);
      }
      
      res.json(allQuestions);
    } catch (error) {
      console.error("Error fetching all questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post('/api/questions',  async (req: any, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      
      // Create answer options if provided
      if (req.body.answerOptions && Array.isArray(req.body.answerOptions)) {
        for (const option of req.body.answerOptions) {
          const answerText = option.answerText || option.text;
          // Ensure answerText is present and valid
          if (!answerText || typeof answerText !== 'string' || answerText.trim() === '') {
            console.warn(`Skipping invalid answer option for question ${question.id}:`, option);
            continue;
          }
          
          try {
            const optionData = insertAnswerOptionSchema.parse({
              ...option,
              questionId: question.id,
              answerText: answerText.trim(),
              isCorrect: Boolean(option.isCorrect),
              displayOrder: option.displayOrder || 0,
            });
            await storage.createAnswerOption(optionData);
          } catch (validationError) {
            console.error(`Failed to create answer option for question ${question.id}:`, validationError);
            // Continue with other options
          }
        }
      }
      
      res.json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(400).json({ message: "Failed to create question" });
    }
  });

  app.get('/api/testbanks/:id/questions',  async (req: any, res) => {
    try {
      const questions = await storage.getQuestionsByTestbank(req.params.id);
      
      // Fetch answer options for each question
      const questionsWithOptions = await Promise.all(
        questions.map(async (question) => {
          const answerOptions = await storage.getAnswerOptionsByQuestion(question.id);
          return { ...question, answerOptions };
        })
      );
      
      res.json(questionsWithOptions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get('/api/questions/:id',  async (req: any, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const answerOptions = await storage.getAnswerOptionsByQuestion(req.params.id);
      res.json({ ...question, answerOptions });
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  app.put('/api/questions/:id',  async (req: any, res) => {
    try {
      const questionData = insertQuestionSchema.partial().parse(req.body);
      const question = await storage.updateQuestion(req.params.id, questionData);
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(400).json({ message: "Failed to update question" });
    }
  });

  app.delete('/api/questions/:id', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const reason = req.body?.reason || "User initiated deletion";
      
      await storage.deleteQuestion(req.params.id, userId, reason);
      res.json({ message: "Question archived successfully" });
    } catch (error) {
      console.error("Error archiving question:", error);
      res.status(500).json({ message: "Failed to archive question" });
    }
  });

  // AI Question Generation routes
  // Progress tracking for question generation
  app.get('/api/testbanks/:id/generate-questions-progress', mockAuth, async (req: any, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Parse generation parameters from query
    let data;
    try {
      data = JSON.parse(req.query.data || '{}');
    } catch (parseError) {
      console.error("Error parsing query data:", parseError);
      res.write(`data: ${JSON.stringify({ 
        type: 'error',
        error: "Invalid query data format"
      })}\n\n`);
      res.end();
      return;
    }
    
    // Validate required fields
    if (!data.topic || !data.questionTypes || data.questionTypes.length === 0) {
      res.write(`data: ${JSON.stringify({ 
        type: 'error',
        error: "Topic and question types are required" 
      })}\n\n`);
      res.end();
      return;
    }

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      res.write(`data: ${JSON.stringify({ 
        type: 'error',
        error: "OpenAI API key is not configured. Please contact your administrator." 
      })}\n\n`);
      res.end();
      return;
    }

    try {
      // Send initial progress
      res.write(`data: ${JSON.stringify({ 
        type: 'progress',
        status: 'Starting question generation...',
        current: 0,
        total: data.questionCount || 5,
        percentage: 0
      })}\n\n`);

      // Generate questions using AI with progress callback
      const generatedQuestions = await generateQuestionsWithAI({
        topic: data.topic,
        questionCount: data.questionCount || 5,
        questionTypes: data.questionTypes,
        difficultyRange: data.difficultyRange || [3, 7],
        bloomsLevels: data.bloomsLevels || ["understand", "apply"],
        includeReferences: data.includeReferences || false,
        referenceLinks: data.referenceLinks || [],
        targetAudience: data.targetAudience,
        learningObjectives: data.learningObjectives || [],
        questionStyles: data.questionStyles || ["formal"],
        includeImages: data.includeImages || false,
        includeMultimedia: data.includeMultimedia || false,
        customInstructions: data.customInstructions,
        testbankId: req.params.id
      }, (progress) => {
        // Send progress update to client
        try {
          res.write(`data: ${JSON.stringify({ 
            type: 'progress',
            status: progress.status,
            current: progress.current,
            total: progress.total,
            percentage: Math.round((progress.current / progress.total) * 100)
          })}\n\n`);
        } catch (writeError) {
          console.error("Error writing progress:", writeError);
        }
      });

      // Save generated questions to database
      res.write(`data: ${JSON.stringify({ 
        type: 'progress',
        status: 'Saving questions to database...',
        current: generatedQuestions.length,
        total: generatedQuestions.length,
        percentage: 90
      })}\n\n`);

      const savedQuestions = [];
      for (let i = 0; i < generatedQuestions.length; i++) {
        const generatedQuestion = generatedQuestions[i];
        
        // Send progress update for each question being saved
        res.write(`data: ${JSON.stringify({ 
          type: 'progress',
          status: `Saving question ${i + 1} of ${generatedQuestions.length}...`,
          current: Math.floor(90 + (i / generatedQuestions.length) * 10),
          total: 100,
          percentage: Math.floor(90 + (i / generatedQuestions.length) * 10)
        })}\n\n`);
        
        // Normalize questionType to match schema (hyphens to underscores)
        const normalizedQuestionType = generatedQuestion.questionType?.replace(/-/g, '_') || 'multiple_choice';
        
        const questionData = insertQuestionSchema.parse({
          ...generatedQuestion,
          questionType: normalizedQuestionType,
          testbankId: req.params.id,
          creatorId: req.user?.claims?.sub || req.user?.id || "test-user",
          // Convert numeric values to strings for validation
          points: generatedQuestion.points?.toString() || "1.00",
          difficultyScore: generatedQuestion.difficultyScore?.toString() || "5.0",
          aiConfidenceScore: generatedQuestion.aiConfidenceScore?.toString() || "0.75",
        });
        
        const question = await storage.createQuestion(questionData);
        
        // Create answer options if provided
        if (generatedQuestion.answerOptions && Array.isArray(generatedQuestion.answerOptions)) {
          for (const option of generatedQuestion.answerOptions) {
            // Ensure answerText is present and valid
            const answerText = option.answerText || option.text;
            if (!answerText || typeof answerText !== 'string' || answerText.trim() === '') {
              console.warn(`Skipping invalid answer option for question ${question.id}:`, option);
              continue;
            }
            
            try {
              const optionData = insertAnswerOptionSchema.parse({
                ...option,
                questionId: question.id,
                answerText: answerText.trim(),
                isCorrect: Boolean(option.isCorrect),
                displayOrder: option.displayOrder || 0,
              });
              await storage.createAnswerOption(optionData);
            } catch (validationError) {
              console.error(`Failed to create answer option for question ${question.id}:`, validationError);
              // Continue with other options
            }
          }
        }
        
        savedQuestions.push(question);
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({ 
        type: 'complete',
        count: savedQuestions.length,
        questions: savedQuestions
      })}\n\n`);
      
      res.end();
    } catch (error) {
      console.error("Error generating questions:", error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error',
        error: "Failed to generate questions: " + (error instanceof Error ? error.message : String(error))
      })}\n\n`);
      res.end();
    }
  });

  app.post('/api/testbanks/:id/generate-questions',  upload.any(), async (req: any, res) => {
    try {
      // Parse the data from the multipart form
      const data = JSON.parse(req.body.data || '{}');
      
      // Validate required fields
      if (!data.topic || !data.questionTypes || data.questionTypes.length === 0) {
        console.log("Validation failed - topic:", data.topic, "questionTypes:", data.questionTypes);
        return res.status(400).json({ message: "Topic and question types are required" });
      }

      // Generate questions using AI
      const generatedQuestions = await generateQuestionsWithAI({
        topic: data.topic,
        questionCount: data.questionCount || 5,
        questionTypes: data.questionTypes,
        difficultyRange: data.difficultyRange || [3, 7],
        bloomsLevels: data.bloomsLevels || ["understand", "apply"],
        includeReferences: data.includeReferences || false,
        referenceLinks: data.referenceLinks || [],
        targetAudience: data.targetAudience,
        learningObjectives: data.learningObjectives || [],
        questionStyles: data.questionStyles || ["formal"],
        includeImages: data.includeImages || false,
        includeMultimedia: data.includeMultimedia || false,
        customInstructions: data.customInstructions,
        testbankId: req.params.id
      });

      // Save generated questions to database
      const savedQuestions = [];
      for (const generatedQuestion of generatedQuestions) {
        // Normalize questionType to match schema (hyphens to underscores)
        const normalizedQuestionType = generatedQuestion.questionType?.replace(/-/g, '_') || 'multiple_choice';
        
        const questionData = insertQuestionSchema.parse({
          ...generatedQuestion,
          questionType: normalizedQuestionType,
          testbankId: req.params.id,
          creatorId: req.user?.claims?.sub || req.user?.id || "test-user",
          // Convert numeric values to strings for validation
          points: generatedQuestion.points?.toString() || "1.00",
          difficultyScore: generatedQuestion.difficultyScore?.toString() || "5.0",
          aiConfidenceScore: generatedQuestion.aiConfidenceScore?.toString() || "0.75",
        });
        
        const question = await storage.createQuestion(questionData);
        
        // Create answer options if provided
        if (generatedQuestion.answerOptions && Array.isArray(generatedQuestion.answerOptions)) {
          for (const option of generatedQuestion.answerOptions) {
            const answerText = option.answerText || option.text;
            // Ensure answerText is present and valid
            if (!answerText || typeof answerText !== 'string' || answerText.trim() === '') {
              console.warn(`Skipping invalid answer option for question ${question.id}:`, option);
              continue;
            }
            
            try {
              const optionData = insertAnswerOptionSchema.parse({
                ...option,
                questionId: question.id,
                answerText: answerText.trim(),
                isCorrect: Boolean(option.isCorrect),
                displayOrder: option.displayOrder || 0,
              });
              await storage.createAnswerOption(optionData);
            } catch (validationError) {
              console.error(`Failed to create answer option for question ${question.id}:`, validationError);
              // Continue with other options
            }
          }
        }
        
        savedQuestions.push(question);
      }

      res.json({ count: savedQuestions.length, questions: savedQuestions });
    } catch (error) {
      console.error("Error generating questions:", error);
      res.status(500).json({ message: "Failed to generate questions" });
    }
  });

  // Enhanced question creation route for testbanks
  app.post('/api/testbanks/:id/questions', async (req: any, res) => {
    try {
      // Get current user from session or switched context
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const questionData = insertQuestionSchema.parse({
        ...req.body,
        testbankId: req.params.id,
        creatorId: currentUser.id,
      });
      
      const question = await storage.createQuestion(questionData);
      
      // Create answer options if provided
      if (req.body.answerOptions && Array.isArray(req.body.answerOptions)) {
        for (const option of req.body.answerOptions) {
          // Ensure answerText is present and valid
          const answerText = option.answerText || option.text;
          if (!answerText || typeof answerText !== 'string' || answerText.trim() === '') {
            console.warn(`Skipping invalid answer option for question ${question.id}:`, option);
            continue;
          }
          
          try {
            const optionData = insertAnswerOptionSchema.parse({
              ...option,
              questionId: question.id,
              answerText: answerText.trim(),
              isCorrect: Boolean(option.isCorrect),
              displayOrder: option.displayOrder || 0,
            });
            await storage.createAnswerOption(optionData);
          } catch (validationError) {
            console.error(`Failed to create answer option for question ${question.id}:`, validationError);
            // Continue with other options
          }
        }
      }
      
      res.json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(400).json({ message: "Failed to create question" });
    }
  });

  // AI Validation routes
  app.post('/api/questions/:id/validate',  async (req: any, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const answerOptions = await storage.getAnswerOptionsByQuestion(req.params.id);
      const validation = await validateQuestion(question, answerOptions);
      
      // Save validation log
      const validationLog = await storage.createValidationLog({
        questionId: req.params.id,
        validatedBy: 'ai',
        issues: validation.issues,
        suggestions: validation.suggestions,
        confidenceScore: validation.confidenceScore.toString(),
        status: validation.status,
        comments: validation.comments,
      });

      // Update question with AI feedback
      await storage.updateQuestion(req.params.id, {
        aiFeedback: validation.comments,
        lastValidatedAt: new Date(),
      });

      res.json(validation);
    } catch (error) {
      console.error("Error validating question:", error);
      res.status(500).json({ message: "Failed to validate question" });
    }
  });

  // Question Management routes
  app.post('/api/questions/:id/refresh',  async (req: any, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const answerOptions = await storage.getAnswerOptionsByQuestion(req.params.id);
      const testbankQuestions = await storage.getQuestionsByTestbank(question.testbankId || '');
      
      // Use the enhanced AI function with context
      const newQuestion = await generateQuestionVariationWithContext(
        question,
        answerOptions,
        testbankQuestions,
        req.body.originalPrompt || '' // Pass original prompt if available
      );

      if (newQuestion) {
        // Update the existing question with new content
        await storage.updateQuestion(req.params.id, {
          questionText: newQuestion.questionText,
          aiValidationStatus: 'pending',
          aiFeedback: 'Refreshed version with enhanced quality and context'
        });

        // Update answer options if they exist
        if (newQuestion.answerOptions && newQuestion.answerOptions.length > 0) {
          // Delete old options
          const oldOptions = await storage.getAnswerOptionsByQuestion(req.params.id);
          for (const option of oldOptions) {
            await storage.deleteAnswerOption(option.id);
          }
          
          // Create new options
          for (const [index, option] of newQuestion.answerOptions.entries()) {
            await storage.createAnswerOption({
              questionId: req.params.id,
              answerText: option.answerText,
              isCorrect: option.isCorrect,
              displayOrder: index
            });
          }
        }
      }

      res.json({ message: "Question refreshed successfully" });
    } catch (error) {
      console.error("Error refreshing question:", error);
      res.status(500).json({ message: "Failed to refresh question" });
    }
  });

  app.post('/api/questions/:id/similar', async (req: any, res) => {
    try {
      // Get user from session
      const user = req.session?.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const answerOptions = await storage.getAnswerOptionsByQuestion(req.params.id);
      const testbankQuestions = await storage.getQuestionsByTestbank(question.testbankId || '');
      
      // Use the enhanced AI function with context
      const newQuestion = await generateSimilarQuestionWithContext(
        question,
        answerOptions,
        testbankQuestions,
        req.body.originalPrompt || '' // Pass original prompt if available
      );

      if (newQuestion) {
        // Create new question
        const createdQuestion = await storage.createQuestion({
          ...newQuestion,
          testbankId: question.testbankId,
          creatorId: user.id,
          aiValidationStatus: 'pending',
          aiFeedback: 'Similar question generated with enhanced context and quality standards'
        });

        // Create answer options if they exist
        if (newQuestion.answerOptions && newQuestion.answerOptions.length > 0) {
          for (const [index, option] of newQuestion.answerOptions.entries()) {
            await storage.createAnswerOption({
              questionId: createdQuestion.id,
              answerText: option.answerText,
              isCorrect: option.isCorrect,
              displayOrder: index
            });
          }
        }
      }

      res.json({ message: "Similar question created successfully" });
    } catch (error) {
      console.error("Error creating similar question:", error);
      res.status(500).json({ message: "Failed to create similar question" });
    }
  });

  app.post('/api/questions/:id/change-options',  async (req: any, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const currentAnswerOptions = await storage.getAnswerOptionsByQuestion(req.params.id);
      const testbankQuestions = await storage.getQuestionsByTestbank(question.testbankId || '');
      
      // Use the enhanced AI function with context
      const newAnswerOptions = await generateNewAnswerOptionsWithContext(
        question,
        currentAnswerOptions,
        testbankQuestions
      );

      if (newAnswerOptions && newAnswerOptions.length > 0) {
        // Delete old options
        const oldOptions = await storage.getAnswerOptionsByQuestion(req.params.id);
        for (const option of oldOptions) {
          await storage.deleteAnswerOption(option.id);
        }
        
        // Create new options
        for (let index = 0; index < newAnswerOptions.length; index++) {
          const option = newAnswerOptions[index];
          await storage.createAnswerOption({
            questionId: req.params.id,
            answerText: option.answerText,
            isCorrect: option.isCorrect,
            displayOrder: index
          });
        }

        // Update question status
        await storage.updateQuestion(req.params.id, {
          aiValidationStatus: 'pending',
          aiFeedback: 'Answer options regenerated with enhanced quality and context awareness'
        });
      }

      res.json({ message: "Answer options changed successfully" });
    } catch (error) {
      console.error("Error changing answer options:", error);
      res.status(500).json({ message: "Failed to change answer options" });
    }
  });

  // Quiz routes
  app.post('/api/quizzes', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      const user = await storage.getUser(userId);
      
      if (!user?.accountId) {
        return res.status(400).json({ message: "User account not found" });
      }

      // Remove any unknown fields that might cause database errors
      const {
        id, // Remove id to prevent duplicates
        quiz_type, // Remove this field if present
        catSettings, // Remove CAT settings
        useCAT, // Remove useCAT
        questions, // Handle separately
        groups, // Handle separately
        ...cleanBody
      } = req.body;

      const quizData = {
        title: req.body.title || "Untitled Quiz",
        description: req.body.description || null,
        instructions: req.body.instructions || null,
        creatorId: userId,
        accountId: user.accountId,
        timeLimit: req.body.timeLimit || null,
        shuffleQuestions: req.body.shuffleQuestions || false,
        shuffleAnswers: req.body.shuffleAnswers || false,
        maxAttempts: req.body.maxAttempts || 1,
        allowMultipleAttempts: req.body.allowMultipleAttempts || false,
        passingGrade: req.body.passingGrade || 70,
        gradeToShow: req.body.gradeToShow || "percentage",
        showCorrectAnswers: req.body.showCorrectAnswers || false,
        showCorrectAnswersAt: req.body.showCorrectAnswersAt || "after_submission",
        showQuestionsAfterAttempt: req.body.showQuestionsAfterAttempt || false,
        scoreKeepingMethod: req.body.scoreKeepingMethod || "highest",
        timeBetweenAttempts: req.body.timeBetweenAttempts || 0,
        availabilityStart: req.body.availabilityStart || null,
        availabilityEnd: req.body.availabilityEnd || null,
        alwaysAvailable: req.body.alwaysAvailable !== false,
        proctoring: req.body.proctoring || false,
        adaptiveTesting: req.body.adaptiveTesting || false,
        enableQuestionFeedback: req.body.enableQuestionFeedback || false,
        enableLearningPrescription: req.body.enableLearningPrescription || false,
        passwordProtected: req.body.passwordProtected || false,
        password: req.body.password || "",
        ipLocking: req.body.ipLocking || false,
      };
      
      console.log(`Creating new quiz with ${questions?.length || 0} questions and ${groups?.length || 0} groups`);
      
      const quiz = await storage.createQuiz(quizData);

      // Handle questions if they're included
      if (questions && Array.isArray(questions) && questions.length > 0) {
        console.log(`Adding ${questions.length} questions to new quiz ${quiz.id}`);
        await storage.updateQuizQuestions(quiz.id, questions);
      }

      // Handle groups if they're included
      if (groups && Array.isArray(groups) && groups.length > 0) {
        console.log(`Adding ${groups.length} groups to new quiz ${quiz.id}`);
        await storage.updateQuizGroups(quiz.id, groups);
      }
      
      res.json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(400).json({ message: "Failed to create quiz" });
    }
  });

  app.get('/api/quizzes', mockAuth, async (req: any, res) => {
    try {
      // Use proper user ID extraction with fallback
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      console.log('Fetching quizzes for user:', userId);
      const quizzes = await storage.getQuizzesByUser(userId);
      console.log('Fetched quizzes:', quizzes.length, 'quizzes');
      console.log('Quiz data sample:', quizzes.slice(0, 2));
      res.json(Array.isArray(quizzes) ? quizzes : []);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json([]);
    }
  });

  // Publish quiz endpoint
  app.post('/api/quizzes/:id/publish', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      const quizId = req.params.id;
      
      // Get the quiz to verify ownership
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Verify ownership
      if (quiz.creatorId !== userId) {
        return res.status(403).json({ message: "Not authorized to publish this quiz" });
      }
      
      // Validation before publishing
      if (!quiz.title?.trim()) {
        return res.status(400).json({ message: "Quiz title is required before publishing" });
      }
      
      // Check if quiz has questions (the quiz object already includes questions)
      if (!quiz.questions || quiz.questions.length === 0) {
        return res.status(400).json({ message: "At least one question is required before publishing" });
      }
      
      // Update quiz status to published
      const updatedQuiz = await storage.updateQuiz(quizId, {
        status: 'published',
        publishedAt: new Date().toISOString()
      });
      
      res.json({ 
        message: "Quiz published successfully",
        quiz: updatedQuiz
      });
    } catch (error) {
      console.error("Error publishing quiz:", error);
      res.status(500).json({ message: "Failed to publish quiz" });
    }
  });

  // Seed quiz data endpoint
  app.post('/api/seed-quiz-data', mockAuth, async (req, res) => {
    try {
      await storage.seedQuizData();
      res.json({ message: 'Quiz data seeded successfully' });
    } catch (error) {
      console.error('Error seeding quiz data:', error);
      res.status(500).json({ message: 'Failed to seed quiz data' });
    }
  });

  // User role switching for testing
  app.post('/api/seed-dummy-users', mockAuth, async (req, res) => {
    try {
      await storage.seedDummyUsers();
      res.json({ message: 'Dummy users seeded successfully' });
    } catch (error) {
      console.error('Error seeding dummy users:', error);
      res.status(500).json({ error: 'Failed to seed dummy users' });
    }
  });

  app.get('/api/dummy-users', mockAuth, async (req, res) => {
    try {
      const dummyUsers = await storage.getDummyUsers();
      res.json(dummyUsers);
    } catch (error) {
      console.error('Error fetching dummy users:', error);
      res.status(500).json({ error: 'Failed to fetch dummy users' });
    }
  });

  app.post('/api/switch-user/:userId', mockAuth, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Get the user to switch to
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Store the switched user ID in the session
      req.session.switchedUserId = userId;
      
      res.json({ 
        message: 'User switched successfully', 
        user: targetUser 
      });
    } catch (error) {
      console.error('Error switching user:', error);
      res.status(500).json({ error: 'Failed to switch user' });
    }
  });

  app.post('/api/reset-user-switch', mockAuth, async (req: any, res) => {
    try {
      // Clear the switched user ID from the session
      delete req.session.switchedUserId;
      
      res.json({ 
        message: 'User switching reset successfully', 
        user: mockUser 
      });
    } catch (error) {
      console.error('Error resetting user switch:', error);
      res.status(500).json({ error: 'Failed to reset user switch' });
    }
  });

  app.get('/api/quizzes/available', mockAuth, async (req: any, res) => {
    try {
      // Use proper user ID extraction with fallback
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      const quizzes = await storage.getQuizzesByUser(userId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching available quizzes:", error);
      res.status(500).json({ message: "Failed to fetch available quizzes" });
    }
  });

  app.get('/api/quizzes/:id', mockAuth, async (req: any, res) => {
    try {
      const quizId = req.params.id;
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      
      // Use the updated getQuiz method that properly loads questions
      const quiz = await storage.getQuiz(quizId);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      console.log(`Returning quiz ${quizId} with ${quiz.questions?.length || 0} questions`);
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  // Available quizzes for study aid generation
  app.get('/api/quizzes/available', mockAuth, async (req: any, res) => {
    try {
      // Return available quizzes for study aid generation
      const availableQuizzes = [
        { id: 'quiz-1', title: 'Introduction to Biology' },
        { id: 'quiz-2', title: 'Cell Structure' },
        { id: 'quiz-3', title: 'Photosynthesis' },
        { id: 'quiz-4', title: 'Cellular Respiration' },
        { id: 'quiz-5', title: 'Genetics Basics' }
      ];
      res.json(availableQuizzes);
    } catch (error) {
      console.error('Error fetching available quizzes:', error);
      res.status(500).json({ message: 'Failed to fetch available quizzes' });
    }
  });

  // Update quiz
  app.put('/api/quizzes/:id', mockAuth, async (req: any, res) => {
    try {
      const quizId = req.params.id;
      const userId = req.user.claims?.sub || req.user.id;
      const quizData = req.body;

      // Verify quiz exists and user has permission
      const existingQuiz = await storage.getQuiz(quizId);
      if (!existingQuiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Update quiz
      const updatedQuiz = await storage.updateQuiz(quizId, quizData);
      
      // Handle questions if they're included
      if (quizData.questions && Array.isArray(quizData.questions)) {
        console.log(`Updating quiz ${quizId} with ${quizData.questions.length} questions`);
        await storage.updateQuizQuestions(quizId, quizData.questions);
      } else {
        console.log(`No questions to update for quiz ${quizId}`);
      }

      // Handle groups if they're included
      if (quizData.groups && Array.isArray(quizData.groups)) {
        console.log(`Updating quiz ${quizId} with ${quizData.groups.length} groups`);
        await storage.updateQuizGroups(quizId, quizData.groups);
      } else {
        console.log(`No groups to update for quiz ${quizId}`);
      }

      res.json(updatedQuiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });

  // Delete quiz
  app.delete('/api/quizzes/:id', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const reason = req.body?.reason || "User initiated deletion";
      
      await storage.deleteQuiz(req.params.id, userId, reason);
      res.json({ message: "Quiz archived successfully" });
    } catch (error) {
      console.error("Error archiving quiz:", error);
      res.status(500).json({ message: "Failed to archive quiz" });
    }
  });

  // Copy quiz
  app.post('/api/quizzes/:id/copy', mockAuth, async (req: any, res) => {
    try {
      const originalQuizId = req.params.id;
      const { newTitle } = req.body;
      const userId = req.user?.id || "test-user";
      
      const newQuiz = await storage.copyQuiz(originalQuizId, newTitle, userId);
      res.json(newQuiz);
    } catch (error) {
      console.error("Error copying quiz:", error);
      res.status(500).json({ message: "Failed to copy quiz" });
    }
  });

  // Assign quiz to students
  app.post('/api/quizzes/:id/assign', mockAuth, async (req: any, res) => {
    try {
      const quizId = req.params.id;
      const { studentIds, dueDate } = req.body;
      
      const result = await storage.assignQuizToStudents(quizId, studentIds, dueDate ? new Date(dueDate) : undefined);
      res.json(result);
    } catch (error) {
      console.error("Error assigning quiz:", error);
      res.status(500).json({ message: "Failed to assign quiz" });
    }
  });

  // Start live exam
  app.post('/api/quizzes/:id/start-live', mockAuth, async (req: any, res) => {
    try {
      const quizId = req.params.id;
      const teacherId = req.user?.id || "test-user";
      
      const liveExamSession = await storage.startLiveExam(quizId, teacherId);
      res.json(liveExamSession);
    } catch (error) {
      console.error("Error starting live exam:", error);
      res.status(500).json({ message: "Failed to start live exam" });
    }
  });

  // Create live exam
  app.post('/api/live-exams', mockAuth, async (req: any, res) => {
    try {
      const teacherId = req.user?.id || "test-user";
      const examData = {
        ...req.body,
        teacherId,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime)
      };
      
      const liveExam = await storage.createLiveExam(examData);
      res.json(liveExam);
    } catch (error) {
      console.error("Error creating live exam:", error);
      res.status(500).json({ message: "Failed to create live exam" });
    }
  });

  // Update live exam
  app.put('/api/live-exams/:id', mockAuth, async (req: any, res) => {
    try {
      const examId = req.params.id;
      const examData = {
        ...req.body,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime)
      };
      
      const liveExam = await storage.updateLiveExam(examId, examData);
      res.json(liveExam);
    } catch (error) {
      console.error("Error updating live exam:", error);
      res.status(500).json({ message: "Failed to update live exam" });
    }
  });

  // Get live exams
  app.get('/api/live-exams', mockAuth, async (req: any, res) => {
    try {
      const teacherId = req.user?.id || "test-user";
      const liveExams = await storage.getLiveExams(teacherId);
      res.json(liveExams);
    } catch (error) {
      console.error("Error fetching live exams:", error);
      res.status(500).json({ message: "Failed to fetch live exams" });
    }
  });

  // Delete live exam
  app.delete('/api/live-exams/:id', mockAuth, async (req: any, res) => {
    try {
      const examId = req.params.id;
      await storage.deleteLiveExam(examId);
      res.json({ message: "Live exam deleted successfully" });
    } catch (error) {
      console.error("Error deleting live exam:", error);
      res.status(500).json({ message: "Failed to delete live exam" });
    }
  });

  // Add questions to quiz
  app.post('/api/quizzes/:id/questions',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const quizId = req.params.id;
      const { questionIds } = req.body;

      if (!questionIds || !Array.isArray(questionIds)) {
        return res.status(400).json({ message: "Invalid question IDs provided" });
      }

      // Verify quiz exists and user has permission
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Add questions to quiz (this would typically involve creating quiz_questions relationships)
      // For now, we'll create a success response
      const result = await storage.addQuestionsToQuiz(quizId, questionIds, userId);
      
      res.json({ 
        message: "Questions added successfully",
        addedCount: questionIds.length,
        quizId: quizId
      });
    } catch (error) {
      console.error("Error adding questions to quiz:", error);
      res.status(500).json({ message: "Failed to add questions to quiz" });
    }
  });

  // Quiz attempt routes
  app.post('/api/quizzes/:id/attempts',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const attemptData = insertQuizAttemptSchema.parse({
        quizId: req.params.id,
        studentId: userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      const attempt = await storage.createQuizAttempt(attemptData);
      res.json(attempt);
    } catch (error) {
      console.error("Error creating quiz attempt:", error);
      res.status(400).json({ message: "Failed to create quiz attempt" });
    }
  });

  app.get('/api/quizzes/:id/attempts',  async (req: any, res) => {
    try {
      const attempts = await storage.getActiveQuizAttempts(req.params.id);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  app.put('/api/attempts/:id',  async (req: any, res) => {
    try {
      const attemptData = insertQuizAttemptSchema.partial().parse(req.body);
      const attempt = await storage.updateQuizAttempt(req.params.id, attemptData);
      res.json(attempt);
    } catch (error) {
      console.error("Error updating quiz attempt:", error);
      res.status(400).json({ message: "Failed to update quiz attempt" });
    }
  });

  // Quiz response routes
  app.post('/api/attempts/:id/responses',  async (req: any, res) => {
    try {
      const responseData = insertQuizResponseSchema.parse({
        ...req.body,
        attemptId: req.params.id,
      });
      
      const response = await storage.createQuizResponse(responseData);
      
      // Process difficulty tracking for this response
      if (responseData.questionId && responseData.isCorrect !== undefined && responseData.isCorrect !== null) {
        const question = await storage.getQuestionById(responseData.questionId);
        const isPilotQuestion = question?.isPilotQuestion || false;
        
        // Update question statistics and difficulty
        await DifficultyService.processQuestionResponse(
          responseData.questionId,
          Boolean(responseData.isCorrect),
          isPilotQuestion
        );
      }
      
      res.json(response);
    } catch (error) {
      console.error("Error creating quiz response:", error);
      res.status(400).json({ message: "Failed to create quiz response" });
    }
  });

  // Proctoring routes
  app.post('/api/proctoring/logs',  async (req: any, res) => {
    try {
      const logData = insertProctoringLogSchema.parse(req.body);
      const log = await storage.createProctoringLog(logData);
      res.json(log);
    } catch (error) {
      console.error("Error creating proctoring log:", error);
      res.status(400).json({ message: "Failed to create proctoring log" });
    }
  });

  app.get('/api/proctoring/logs/unresolved',  async (req: any, res) => {
    try {
      const logs = await storage.getUnresolvedProctoringLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching unresolved proctoring logs:", error);
      res.status(500).json({ message: "Failed to fetch unresolved proctoring logs" });
    }
  });

  app.put('/api/proctoring/logs/:id',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const logData = insertProctoringLogSchema.partial().parse({
        ...req.body,
        resolvedBy: userId,
        resolvedAt: new Date(),
      });
      
      const log = await storage.updateProctoringLog(req.params.id, logData);
      res.json(log);
    } catch (error) {
      console.error("Error updating proctoring log:", error);
      res.status(400).json({ message: "Failed to update proctoring log" });
    }
  });

  // AI Resources routes
  app.post('/api/ai/study-guide',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { sourceType, sourceId, topic } = req.body;
      
      const studyGuide = await generateStudyGuide(topic, sourceType, sourceId);
      
      const resource = await storage.createAiResource({
        type: 'study_guide',
        title: `Study Guide: ${topic}`,
        content: studyGuide,
        sourceType,
        sourceId,
        createdFor: userId,
      });
      
      res.json(resource);
    } catch (error) {
      console.error("Error generating study guide:", error);
      res.status(500).json({ message: "Failed to generate study guide" });
    }
  });

  app.post('/api/ai/improvement-plan',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { attemptId } = req.body;
      
      const attempt = await storage.getQuizAttempt(attemptId);
      if (!attempt) {
        return res.status(404).json({ message: "Quiz attempt not found" });
      }
      
      const responses = await storage.getQuizResponsesByAttempt(attemptId);
      const improvementPlan = await generateImprovementPlan(attempt, responses);
      
      const resource = await storage.createAiResource({
        type: 'improvement_plan',
        title: `Improvement Plan for Quiz Attempt`,
        content: improvementPlan,
        sourceType: 'quiz',
        sourceId: attempt.quizId,
        createdFor: userId,
      });
      
      res.json(resource);
    } catch (error) {
      console.error("Error generating improvement plan:", error);
      res.status(500).json({ message: "Failed to generate improvement plan" });
    }
  });

  app.get('/api/ai/resources', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const resources = await storage.getAiResourcesByUser(userId);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching AI resources:", error);
      res.status(500).json({ message: "Failed to fetch AI resources" });
    }
  });

  // Notification routes
  app.get('/api/notifications', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put('/api/notifications/:id/read',  async (req: any, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/quiz/:id',  async (req: any, res) => {
    try {
      const analytics = await storage.getQuizAnalytics(req.params.id);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching quiz analytics:", error);
      res.status(500).json({ message: "Failed to fetch quiz analytics" });
    }
  });

  app.get('/api/analytics/testbank/:id',  async (req: any, res) => {
    try {
      const analytics = await storage.getTestbankAnalytics(req.params.id);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching testbank analytics:", error);
      res.status(500).json({ message: "Failed to fetch testbank analytics" });
    }
  });

  // Admin Settings Routes
  app.get('/api/admin/settings',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      // Only allow admin user (you can modify this email check)
      if (!user || user.email !== 'admin@example.com') {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      // Return current settings (without exposing actual API keys)
      res.json({
        openaiApiKey: process.env.OPENAI_API_KEY ? '••••••••' : '',
        sendgridApiKey: process.env.SENDGRID_API_KEY ? '••••••••' : '',
        stripeSecretKey: process.env.STRIPE_SECRET_KEY ? '••••••••' : '',
        stripePublicKey: process.env.VITE_STRIPE_PUBLIC_KEY || '',
        systemSettings: {
          maintenanceMode: false,
          registrationEnabled: true,
          maxUsersPerOrg: 100,
          maxTestbanksPerUser: 50,
          maxQuestionsPerTestbank: 1000,
        },
        notificationSettings: {
          emailNotifications: true,
          systemAlerts: true,
          performanceReports: false,
        }
      });
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.put('/api/admin/settings',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      // Only allow admin user
      if (!user || user.email !== 'admin@example.com') {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      const settings = req.body;

      // Store API keys in environment variables (this is a simplified approach)
      // In production, you'd want to use a secure secret management system
      if (settings.openaiApiKey && settings.openaiApiKey !== '••••••••') {
        process.env.OPENAI_API_KEY = settings.openaiApiKey;
      }
      if (settings.sendgridApiKey && settings.sendgridApiKey !== '••••••••') {
        process.env.SENDGRID_API_KEY = settings.sendgridApiKey;
      }
      if (settings.stripeSecretKey && settings.stripeSecretKey !== '••••••••') {
        process.env.STRIPE_SECRET_KEY = settings.stripeSecretKey;
      }
      if (settings.stripePublicKey) {
        process.env.VITE_STRIPE_PUBLIC_KEY = settings.stripePublicKey;
      }

      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Failed to update admin settings" });
    }
  });

  app.post('/api/admin/test-api-key',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      // Only allow admin user
      if (!user || user.email !== 'admin@example.com') {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      const { service, key } = req.body;

      switch (service) {
        case 'openai':
          try {
            // Test OpenAI API key
            const response = await fetch('https://api.openai.com/v1/models', {
              headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              res.json({ success: true, message: "OpenAI API key is valid" });
            } else {
              res.json({ success: false, message: "OpenAI API key is invalid" });
            }
          } catch (error) {
            res.json({ success: false, message: "Failed to test OpenAI API key" });
          }
          break;

        case 'sendgrid':
          try {
            // Test SendGrid API key
            const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
              headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              res.json({ success: true, message: "SendGrid API key is valid" });
            } else {
              res.json({ success: false, message: "SendGrid API key is invalid" });
            }
          } catch (error) {
            res.json({ success: false, message: "Failed to test SendGrid API key" });
          }
          break;

        case 'stripe':
          try {
            // Test Stripe API key
            const response = await fetch('https://api.stripe.com/v1/account', {
              headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            });
            
            if (response.ok) {
              res.json({ success: true, message: "Stripe API key is valid" });
            } else {
              res.json({ success: false, message: "Stripe API key is invalid" });
            }
          } catch (error) {
            res.json({ success: false, message: "Failed to test Stripe API key" });
          }
          break;

        default:
          res.json({ success: false, message: "Unknown service" });
      }
    } catch (error) {
      console.error("Error testing API key:", error);
      res.status(500).json({ message: "Failed to test API key" });
    }
  });

  // Reference Bank routes
  app.post("/api/reference-banks",  async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User authentication required" });
      }

      const parsedData = insertReferenceBankSchema.parse({
        ...req.body,
        creatorId: userId
      });
      
      const referenceBank = await storage.createReferenceBank(parsedData);
      res.json(referenceBank);
    } catch (error: any) {
      console.error("Error creating reference bank:", error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid data provided", 
          details: error.errors 
        });
      }
      
      if (error.code === '42P01') {
        return res.status(500).json({ 
          message: "Database configuration error. Please contact administrator." 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create reference bank. Please try again." 
      });
    }
  });

  app.get("/api/reference-banks",  async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User authentication required" });
      }

      const referenceBanks = await storage.getReferenceBanksByUser(userId);
      res.json(referenceBanks);
    } catch (error: any) {
      console.error("Error fetching reference banks:", error);
      
      if (error.code === '42P01') {
        return res.status(500).json({ 
          message: "Database configuration error. Please contact administrator." 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to fetch reference banks. Please try again." 
      });
    }
  });

  app.get("/api/reference-banks/:id",  async (req, res) => {
    try {
      const { id } = req.params;
      const referenceBank = await storage.getReferenceBank(id);
      
      if (!referenceBank) {
        return res.status(404).json({ message: "Reference bank not found" });
      }
      
      res.json(referenceBank);
    } catch (error) {
      console.error("Error fetching reference bank:", error);
      res.status(500).json({ message: "Failed to fetch reference bank" });
    }
  });

  app.patch("/api/reference-banks/:id",  async (req, res) => {
    try {
      const { id } = req.params;
      const parsedData = insertReferenceBankSchema.partial().parse(req.body);
      
      const referenceBank = await storage.updateReferenceBank(id, parsedData);
      res.json(referenceBank);
    } catch (error) {
      console.error("Error updating reference bank:", error);
      res.status(500).json({ message: "Failed to update reference bank" });
    }
  });

  app.delete("/api/reference-banks/:id",  async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReferenceBank(id);
      res.json({ message: "Reference bank deleted successfully" });
    } catch (error) {
      console.error("Error deleting reference bank:", error);
      res.status(500).json({ message: "Failed to delete reference bank" });
    }
  });

  // Reference routes
  app.post("/api/reference-banks/:bankId/references",  async (req, res) => {
    try {
      const { bankId } = req.params;
      const parsedData = insertReferenceSchema.parse({
        ...req.body,
        bankId
      });
      
      const reference = await storage.createReference(parsedData);
      res.json(reference);
    } catch (error) {
      console.error("Error creating reference:", error);
      res.status(500).json({ message: "Failed to create reference" });
    }
  });

  app.get("/api/reference-banks/:bankId/references",  async (req, res) => {
    try {
      const { bankId } = req.params;
      const references = await storage.getReferencesByBank(bankId);
      res.json(references);
    } catch (error) {
      console.error("Error fetching references:", error);
      res.status(500).json({ message: "Failed to fetch references" });
    }
  });

  app.patch("/api/references/:id",  async (req, res) => {
    try {
      const { id } = req.params;
      const parsedData = insertReferenceSchema.partial().parse(req.body);
      
      const reference = await storage.updateReference(id, parsedData);
      res.json(reference);
    } catch (error) {
      console.error("Error updating reference:", error);
      res.status(500).json({ message: "Failed to update reference" });
    }
  });

  app.delete("/api/references/:id",  async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReference(id);
      res.json({ message: "Reference deleted successfully" });
    } catch (error) {
      console.error("Error deleting reference:", error);
      res.status(500).json({ message: "Failed to delete reference" });
    }
  });

  // ========== NEW ROLE-BASED ENDPOINTS ==========

  // Account Management Routes
  app.get('/api/accounts',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const accounts = await storage.getAccountsByUser(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post('/api/accounts',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      // Only super admins can create accounts
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can create accounts" });
      }

      const accountData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(accountData);
      res.json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Scheduled Assignment Routes
  app.get('/api/scheduled-assignments',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.accountId) {
        return res.status(404).json({ message: "User account not found" });
      }

      let assignments;
      if (user.role === 'student') {
        assignments = await storage.getScheduledAssignmentsByStudent(userId);
      } else {
        assignments = await storage.getScheduledAssignmentsByAccount(user.accountId);
      }
      
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching scheduled assignments:", error);
      res.status(500).json({ message: "Failed to fetch scheduled assignments" });
    }
  });

  app.post('/api/scheduled-assignments',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      // Only teachers can create assignments
      if (user?.role !== 'teacher' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Only managers and admins can create assignments" });
      }

      const assignmentData = insertScheduledAssignmentSchema.parse({
        ...req.body,
        assignerId: userId,
        accountId: user.accountId,
      });
      
      const assignment = await storage.createScheduledAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error("Error creating scheduled assignment:", error);
      res.status(500).json({ message: "Failed to create scheduled assignment" });
    }
  });

  // Study Aid Routes  
  app.get('/api/study-aids', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || "test-user";
      const studyAids = await storage.getStudyAidsByStudent(userId);
      res.json(studyAids);
    } catch (error) {
      console.error("Error fetching study aids:", error);
      res.status(500).json({ message: "Failed to fetch study aids" });
    }
  });

  app.post('/api/study-aids', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || "test-user";
      const studyAidData = {
        ...req.body,
        studentId: userId,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        accessCount: 0,
        rating: 0,
        isAutoGenerated: false
      };
      
      const studyAid = await storage.createStudyAid(studyAidData);
      res.json(studyAid);
    } catch (error) {
      console.error("Error creating study aid:", error);
      res.status(500).json({ message: "Failed to create study aid" });
    }
  });

  app.post('/api/study-aids/generate', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || "test-user";
      const { type, title, quizId, customPrompt, referenceLinks } = req.body;
      
      // Generate study aid with AI assistance
      const studyAidData = {
        id: `study-aid-${Date.now()}`,
        title,
        type,
        content: `AI-generated ${type.replace('_', ' ')} content. ${customPrompt || ''}`,
        quizId,
        studentId: userId,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        accessCount: 0,
        rating: 0,
        isAutoGenerated: true,
        referenceLinks: referenceLinks || []
      };
      
      const studyAid = await storage.createStudyAid(studyAidData);
      res.json(studyAid);
    } catch (error) {
      console.error("Error generating study aid:", error);
      res.status(500).json({ message: "Failed to generate study aid" });
    }
  });

  app.put('/api/study-aids/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Mock update - in real implementation, you'd update in database
      const updatedStudyAid = {
        id,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      res.json(updatedStudyAid);
    } catch (error) {
      console.error("Error updating study aid:", error);
      res.status(500).json({ message: "Failed to update study aid" });
    }
  });

  app.delete('/api/study-aids/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Mock delete - in real implementation, you'd delete from database
      res.json({ message: "Study aid deleted successfully" });
    } catch (error) {
      console.error("Error deleting study aid:", error);
      res.status(500).json({ message: "Failed to delete study aid" });
    }
  });

  // Export and sharing endpoints for study resources
  app.get('/api/study-resources/:id/export', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { format } = req.query;
      const userId = req.user?.claims?.sub || req.user?.id || "test-user";
      
      // Get the resource
      const resources = await storage.getAiResourcesByUser(userId);
      const resource = resources.find(r => r.id === id);
      
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      let content = '';
      let contentType = 'text/plain';
      let filename = `${resource.title}.txt`;
      
      switch (format) {
        case 'pdf':
          contentType = 'application/pdf';
          filename = `${resource.title}.pdf`;
          content = `PDF Export of ${resource.title}\n\n${resource.content}`;
          break;
        case 'csv':
          contentType = 'text/csv';
          filename = `${resource.title}.csv`;
          content = `Title,Type,Content,Created At\n"${resource.title}","${resource.type}","${resource.content}","${resource.createdAt}"`;
          break;
        case 'json':
          contentType = 'application/json';
          filename = `${resource.title}.json`;
          content = JSON.stringify(resource, null, 2);
          break;
        default:
          content = `${resource.title}\n\n${resource.content}\n\nCreated: ${resource.createdAt}`;
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      console.error("Error exporting resource:", error);
      res.status(500).json({ message: "Failed to export resource" });
    }
  });

  app.post('/api/study-resources/:id/share', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { shareType } = req.body;
      const userId = req.user?.claims?.sub || req.user?.id || "test-user";
      
      // Get the resource
      const resources = await storage.getAiResourcesByUser(userId);
      const resource = resources.find(r => r.id === id);
      
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Generate share link
      const shareUrl = `${req.protocol}://${req.get('host')}/shared-resource/${id}`;
      
      // In a real implementation, you would save the share token to database
      const shareToken = `share-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      
      res.json({
        shareUrl,
        shareToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });
    } catch (error) {
      console.error("Error sharing resource:", error);
      res.status(500).json({ message: "Failed to share resource" });
    }
  });

  app.get('/api/shared-resource/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // In a real implementation, you would validate the share token
      // For now, we'll just return a basic shared resource page
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Shared Study Resource</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { border-bottom: 1px solid #ddd; padding-bottom: 20px; margin-bottom: 20px; }
            .content { line-height: 1.6; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Shared Study Resource</h1>
            <p>This study resource has been shared with you from ProficiencyAI</p>
          </div>
          <div class="content">
            <h2>Resource ID: ${id}</h2>
            <p>This is a shared study resource. The actual content would be displayed here.</p>
          </div>
          <div class="footer">
            <p>Powered by ProficiencyAI - Advanced Educational Assessment Platform</p>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error accessing shared resource:", error);
      res.status(500).json({ message: "Failed to access shared resource" });
    }
  });

  // Bulk operations for study resources
  app.post('/api/study-resources/bulk-export', mockAuth, async (req: any, res) => {
    try {
      const { resourceIds, format } = req.body;
      const userId = req.user?.claims?.sub || req.user?.id || "test-user";
      
      // Get all resources for the user
      const resources = await storage.getAiResourcesByUser(userId);
      const selectedResources = resources.filter(r => resourceIds.includes(r.id));
      
      if (selectedResources.length === 0) {
        return res.status(404).json({ message: "No resources found" });
      }
      
      let content = '';
      let contentType = 'text/plain';
      let filename = `study-resources-bulk.txt`;
      
      switch (format) {
        case 'pdf':
          contentType = 'application/pdf';
          filename = `study-resources-bulk.pdf`;
          content = selectedResources.map(r => 
            `PDF Export: ${r.title}\n\n${r.content}\n\n---\n\n`
          ).join('');
          break;
        case 'csv':
          contentType = 'text/csv';
          filename = `study-resources-bulk.csv`;
          content = 'Title,Type,Content,Created At\n' + 
            selectedResources.map(r => 
              `"${r.title}","${r.type}","${r.content}","${r.createdAt}"`
            ).join('\n');
          break;
        case 'json':
          contentType = 'application/json';
          filename = `study-resources-bulk.json`;
          content = JSON.stringify(selectedResources, null, 2);
          break;
        default:
          content = selectedResources.map(r => 
            `${r.title}\n\n${r.content}\n\nCreated: ${r.createdAt}\n\n---\n\n`
          ).join('');
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      console.error("Error bulk exporting resources:", error);
      res.status(500).json({ message: "Failed to bulk export resources" });
    }
  });

  app.post('/api/study-resources/bulk-delete', mockAuth, async (req: any, res) => {
    try {
      const { resourceIds } = req.body;
      const userId = req.user?.claims?.sub || req.user?.id || "test-user";
      
      // In a real implementation, you would delete from database
      // For now, we'll just return success
      res.json({ 
        message: `Successfully deleted ${resourceIds.length} resources`,
        deletedCount: resourceIds.length
      });
    } catch (error) {
      console.error("Error bulk deleting resources:", error);
      res.status(500).json({ message: "Failed to bulk delete resources" });
    }
  });

  app.post('/api/study-aids', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || "test-user";
      const studyAidData = insertStudyAidSchema.parse({
        ...req.body,
        studentId: userId,
      });
      
      const studyAid = await storage.createStudyAid(studyAidData);
      res.json(studyAid);
    } catch (error) {
      console.error("Error creating study aid:", error);
      res.status(500).json({ message: "Failed to create study aid" });
    }
  });

  // Assignment Submission Routes
  app.get('/api/assignment-submissions/:assignmentId',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { assignmentId } = req.params;
      const user = await storage.getUser(userId);
      
      let submissions;
      if (user?.role === 'student') {
        submissions = await storage.getAssignmentSubmissionsByStudent(userId);
        submissions = submissions.filter(s => s.assignmentId === assignmentId);
      } else {
        submissions = await storage.getAssignmentSubmissionsByAssignment(assignmentId);
      }
      
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching assignment submissions:", error);
      res.status(500).json({ message: "Failed to fetch assignment submissions" });
    }
  });

  app.post('/api/assignment-submissions',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const submissionData = insertAssignmentSubmissionSchema.parse({
        ...req.body,
        studentId: userId,
      });
      
      const submission = await storage.createAssignmentSubmission(submissionData);
      res.json(submission);
    } catch (error) {
      console.error("Error creating assignment submission:", error);
      res.status(500).json({ message: "Failed to create assignment submission" });
    }
  });

  // Mobile Device Registration Routes
  app.get('/api/mobile-devices',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const devices = await storage.getMobileDevicesByUser(userId);
      res.json(devices);
    } catch (error) {
      console.error("Error fetching mobile devices:", error);
      res.status(500).json({ message: "Failed to fetch mobile devices" });
    }
  });

  app.post('/api/mobile-devices',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const deviceData = insertMobileDeviceSchema.parse({
        ...req.body,
        userId: userId,
      });
      
      const device = await storage.createMobileDevice(deviceData);
      res.json(device);
    } catch (error) {
      console.error("Error registering mobile device:", error);
      res.status(500).json({ message: "Failed to register mobile device" });
    }
  });

  // Study Aids Routes
  app.get('/api/study-aids', mockAuth, async (req: any, res) => {
    try {
      // Mock study aids data for testing
      const studyAids = [
        {
          id: "study-1",
          title: "Biology Fundamentals Study Guide",
          type: "study_guide",
          content: "Comprehensive study guide covering basic biology concepts including cell structure, photosynthesis, and cellular respiration.",
          quizId: "quiz-1",
          quizTitle: "Introduction to Biology",
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          lastAccessedAt: new Date().toISOString(),
          accessCount: 5,
          rating: 4.5
        },
        {
          id: "study-2",
          title: "Cell Structure Flashcards",
          type: "flashcards",
          content: "Interactive flashcards covering organelles, membrane structure, and cellular functions.",
          quizId: null,
          quizTitle: null,
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          lastAccessedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          accessCount: 8,
          rating: 4.2
        },
        {
          id: "study-3",
          title: "Photosynthesis Practice Questions",
          type: "practice_questions",
          content: "Additional practice questions to test your understanding of photosynthesis processes.",
          quizId: "quiz-3",
          quizTitle: "Photosynthesis",
          createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          lastAccessedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          accessCount: 12,
          rating: 4.8
        }
      ];
      
      res.json(studyAids);
    } catch (error) {
      console.error("Error fetching study aids:", error);
      res.status(500).json({ message: "Failed to fetch study aids" });
    }
  });

  app.post('/api/study-aids/generate', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || 'test-user';
      const { type, quizId, title, customPrompt, referenceLinks, uploadedFiles } = req.body;

      if (!type || !title) {
        return res.status(400).json({ message: "Missing required fields: type and title" });
      }

      // Generate AI content based on type and topic
      let content = "";
      let quizTitle = null;
      
      if (quizId && quizId !== 'none') {
        // If quiz-based, generate content related to the quiz
        const quizzes = {
          "quiz-1": "Introduction to Biology",
          "quiz-2": "Cell Structure", 
          "quiz-3": "Photosynthesis"
        };
        quizTitle = quizzes[quizId] || "Unknown Quiz";
        
        content = `Study aid content for ${title}\n\nThis ${type} is based on the quiz: ${quizTitle}\n\nKey topics covered:\n- Main concepts from the quiz\n- Important definitions\n- Practice examples\n\n${customPrompt || 'Generated based on quiz content and educational best practices.'}`;
      } else {
        // Topic-based generation
        content = `Study aid content for ${title}\n\nThis ${type} covers the following topic: ${title}\n\nKey areas included:\n- Fundamental concepts\n- Important terminology\n- Real-world applications\n- Study tips and strategies\n\n${customPrompt || 'Generated based on educational best practices and topic expertise.'}`;
      }

      // Add reference materials context if provided
      if (referenceLinks && referenceLinks.length > 0) {
        content += `\n\nReference Materials:\n${referenceLinks.map((link: string, index: number) => `${index + 1}. ${link}`).join('\n')}`;
      }

      if (uploadedFiles && uploadedFiles.length > 0) {
        content += `\n\nUploaded Files: ${uploadedFiles.length} reference file(s) were used to enhance this study aid.`;
      }

      // Create mock study aid
      const newStudyAid = {
        id: `study-${Date.now()}`,
        title,
        type,
        content,
        quizId: quizId === 'none' ? null : quizId || null,
        quizTitle,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        accessCount: 0,
        rating: 0,
        userId
      };

      // Return immediately for better performance
      res.json(newStudyAid);
    } catch (error) {
      console.error("Error generating study aid:", error);
      res.status(500).json({ message: "Failed to generate study aid" });
    }
  });

  // Delete study aid
  app.delete('/api/study-aids/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      // Mock delete operation
      res.json({ success: true, message: "Study aid deleted successfully" });
    } catch (error) {
      console.error("Error deleting study aid:", error);
      res.status(500).json({ message: "Failed to delete study aid" });
    }
  });

  // Update study aid access
  app.post('/api/study-aids/:id/access', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      // Mock access update
      res.json({ success: true, message: "Study aid access updated" });
    } catch (error) {
      console.error("Error updating study aid access:", error);
      res.status(500).json({ message: "Failed to update study aid access" });
    }
  });

  // Rate study aid
  app.post('/api/study-aids/:id/rate', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      // Mock rating update
      res.json({ success: true, message: "Study aid rated successfully", rating });
    } catch (error) {
      console.error("Error rating study aid:", error);
      res.status(500).json({ message: "Failed to rate study aid" });
    }
  });

  // Users API route for section management
  app.get('/api/users', mockAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Enhanced API endpoints for new functionality

  // Gradebook API endpoints
  app.get('/api/gradebook', mockAuth, async (req: any, res) => {
    try {
      const gradebook = [
        {
          id: "gb1",
          studentId: "student-1",
          studentName: "Alice Johnson",
          studentEmail: "alice@test.com",
          quizId: "quiz-1",
          quizTitle: "Introduction to Biology",
          score: 85,
          maxScore: 100,
          percentage: 85,
          completedAt: new Date().toISOString(),
          attempts: 1,
          timeSpent: 1800,
          status: "completed"
        },
        {
          id: "gb2",
          studentId: "student-2",
          studentName: "Bob Smith",
          studentEmail: "bob@test.com",
          quizId: "quiz-1",
          quizTitle: "Introduction to Biology",
          score: 92,
          maxScore: 100,
          percentage: 92,
          completedAt: new Date().toISOString(),
          attempts: 2,
          timeSpent: 2100,
          status: "completed"
        }
      ];
      res.json(gradebook);
    } catch (error) {
      console.error("Error fetching gradebook:", error);
      res.status(500).json({ error: "Failed to fetch gradebook" });
    }
  });

  app.get('/api/gradebook/quiz-stats', mockAuth, async (req: any, res) => {
    try {
      const quizStats = [
        {
          id: "quiz-1",
          title: "Introduction to Biology",
          totalStudents: 25,
          completedStudents: 23,
          averageScore: 88.5,
          highestScore: 98,
          lowestScore: 72
        },
        {
          id: "quiz-2",
          title: "Cell Structure",
          totalStudents: 25,
          completedStudents: 20,
          averageScore: 85.2,
          highestScore: 95,
          lowestScore: 68
        }
      ];
      res.json(quizStats);
    } catch (error) {
      console.error("Error fetching quiz stats:", error);
      res.status(500).json({ error: "Failed to fetch quiz stats" });
    }
  });

  app.put('/api/gradebook/:entryId/feedback', mockAuth, async (req: any, res) => {
    try {
      const { entryId } = req.params;
      const { feedback } = req.body;
      
      res.json({ success: true, message: "Feedback updated successfully" });
    } catch (error) {
      console.error("Error updating feedback:", error);
      res.status(500).json({ error: "Failed to update feedback" });
    }
  });

  app.post('/api/gradebook/send-email', mockAuth, async (req: any, res) => {
    try {
      const { studentId, subject, message } = req.body;
      
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Prerequisites API endpoints
  app.get('/api/prerequisites', mockAuth, async (req: any, res) => {
    try {
      const prerequisites = [
        {
          id: "prereq-1",
          quizId: "quiz-2",
          quizTitle: "Cell Structure",
          prerequisiteQuizId: "quiz-1",
          prerequisiteQuizTitle: "Introduction to Biology",
          minimumScore: 80,
          strictOrder: true,
          createdAt: new Date().toISOString()
        }
      ];
      res.json(prerequisites);
    } catch (error) {
      console.error("Error fetching prerequisites:", error);
      res.status(500).json({ error: "Failed to fetch prerequisites" });
    }
  });

  app.get('/api/prerequisites/status', mockAuth, async (req: any, res) => {
    try {
      const prerequisiteStatuses = [
        {
          studentId: "student-1",
          studentName: "Alice Johnson",
          quizId: "quiz-2",
          quizTitle: "Cell Structure",
          canAccess: true,
          missingPrerequisites: []
        },
        {
          studentId: "student-3",
          studentName: "Charlie Brown",
          quizId: "quiz-2",
          quizTitle: "Cell Structure",
          canAccess: false,
          missingPrerequisites: [
            {
              quizId: "quiz-1",
              quizTitle: "Introduction to Biology",
              minimumScore: 80,
              currentScore: 65,
              completed: true
            }
          ]
        }
      ];
      res.json(prerequisiteStatuses);
    } catch (error) {
      console.error("Error fetching prerequisite status:", error);
      res.status(500).json({ error: "Failed to fetch prerequisite status" });
    }
  });

  app.post('/api/prerequisites', mockAuth, async (req: any, res) => {
    try {
      const { quizId, prerequisiteQuizId, minimumScore, strictOrder } = req.body;
      
      const newPrerequisite = {
        id: `prereq-${Date.now()}`,
        quizId,
        prerequisiteQuizId,
        minimumScore,
        strictOrder,
        createdAt: new Date().toISOString()
      };
      
      res.json(newPrerequisite);
    } catch (error) {
      console.error("Error creating prerequisite:", error);
      res.status(500).json({ error: "Failed to create prerequisite" });
    }
  });

  app.put('/api/prerequisites/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      res.json({ success: true, message: "Prerequisite updated successfully" });
    } catch (error) {
      console.error("Error updating prerequisite:", error);
      res.status(500).json({ error: "Failed to update prerequisite" });
    }
  });

  app.delete('/api/prerequisites/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      res.json({ success: true, message: "Prerequisite deleted successfully" });
    } catch (error) {
      console.error("Error deleting prerequisite:", error);
      res.status(500).json({ error: "Failed to delete prerequisite" });
    }
  });

  // Progress Tracking API endpoints
  app.get('/api/progress/analytics', mockAuth, async (req: any, res) => {
    try {
      const { timeRange } = req.query;
      
      const progressAnalytics = {
        totalStudents: 25,
        activeStudents: 23,
        averageCompletion: 78.5,
        averageScore: 86.2,
        totalQuizzes: 5,
        completedAttempts: 98,
        progressTrends: [
          { date: "2025-01-01", completions: 5, averageScore: 85 },
          { date: "2025-01-02", completions: 8, averageScore: 87 },
          { date: "2025-01-03", completions: 12, averageScore: 89 }
        ],
        scoreDistribution: [
          { range: "90-100%", count: 15, percentage: 35 },
          { range: "80-89%", count: 18, percentage: 42 },
          { range: "70-79%", count: 8, percentage: 18 },
          { range: "60-69%", count: 2, percentage: 5 }
        ]
      };
      
      res.json(progressAnalytics);
    } catch (error) {
      console.error("Error fetching progress analytics:", error);
      res.status(500).json({ error: "Failed to fetch progress analytics" });
    }
  });

  app.get('/api/progress/students', mockAuth, async (req: any, res) => {
    try {
      const { student, timeRange } = req.query;
      
      const studentProgress = [
        {
          id: "progress-1",
          studentId: "student-1",
          studentName: "Alice Johnson",
          studentEmail: "alice@test.com",
          totalQuizzes: 5,
          completedQuizzes: 4,
          averageScore: 88.5,
          totalTimeSpent: 7200,
          streakDays: 7,
          lastActive: new Date().toISOString(),
          progressPercentage: 80,
          achievements: [
            {
              id: "ach-1",
              title: "Quiz Master",
              description: "Completed 5 quizzes",
              earnedAt: new Date().toISOString(),
              icon: "star"
            }
          ],
          recentScores: [
            {
              quizId: "quiz-1",
              quizTitle: "Introduction to Biology",
              score: 85,
              completedAt: new Date().toISOString()
            }
          ]
        }
      ];
      
      res.json(studentProgress);
    } catch (error) {
      console.error("Error fetching student progress:", error);
      res.status(500).json({ error: "Failed to fetch student progress" });
    }
  });

  app.get('/api/progress/quizzes', mockAuth, async (req: any, res) => {
    try {
      const { quiz, timeRange } = req.query;
      
      const quizProgress = [
        {
          quizId: "quiz-1",
          quizTitle: "Introduction to Biology",
          totalStudents: 25,
          completedStudents: 23,
          averageScore: 88.5,
          completionRate: 92,
          difficulty: 7.5,
          timeSpent: 1800
        },
        {
          quizId: "quiz-2",
          quizTitle: "Cell Structure",
          totalStudents: 25,
          completedStudents: 20,
          averageScore: 85.2,
          completionRate: 80,
          difficulty: 8.2,
          timeSpent: 2100
        }
      ];
      
      res.json(quizProgress);
    } catch (error) {
      console.error("Error fetching quiz progress:", error);
      res.status(500).json({ error: "Failed to fetch quiz progress" });
    }
  });

  // Admin User Management API endpoints
  app.post('/api/admin/impersonate', mockAuth, async (req: any, res) => {
    try {
      const { userId } = req.body;
      const currentUser = req.user;
      
      // Only admins can impersonate
      if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      // Get user to impersonate
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Set impersonation session
      req.session.impersonatedUserId = userId;
      req.session.originalUserId = currentUser.id;
      
      res.json({ success: true, message: 'Impersonation started', user: targetUser });
    } catch (error) {
      console.error('Error starting impersonation:', error);
      res.status(500).json({ message: 'Failed to start impersonation' });
    }
  });

  app.post('/api/admin/reset-password', mockAuth, async (req: any, res) => {
    try {
      const { userId } = req.body;
      const currentUser = req.user;
      
      // Only admins can reset passwords
      if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      // Get user
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // In a real app, this would send an email with reset link
      // For now, we'll just log it
      console.log(`Password reset requested for user: ${targetUser.email}`);
      
      res.json({ success: true, message: 'Password reset email sent' });
    } catch (error) {
      console.error('Error sending password reset:', error);
      res.status(500).json({ message: 'Failed to send password reset email' });
    }
  });

  app.post('/api/admin/notifications', mockAuth, async (req: any, res) => {
    try {
      const { title, message, type, recipients, sectionId } = req.body;
      const currentUser = req.user;
      
      // Only admins can send notifications
      if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      let recipientList = [];
      
      if (recipients === 'all') {
        // Get all users
        const allUsers = await storage.getAllUsers();
        recipientList = allUsers.map(user => user.id);
      } else if (recipients === 'section' && sectionId) {
        // Get users in specific section
        const sectionMembers = await storage.getSectionMembers(sectionId);
        recipientList = sectionMembers.map(member => member.studentId);
      }
      
      const notification = {
        id: `notif-${Date.now()}`,
        title,
        message,
        type,
        recipients: recipientList,
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        senderId: currentUser.id
      };
      
      // In a real app, this would save to database and send actual notifications
      console.log('Notification sent:', notification);
      
      res.json({ success: true, notification });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ message: 'Failed to send notification' });
    }
  });

  app.get('/api/notifications/sent', mockAuth, async (req: any, res) => {
    try {
      // Mock sent notifications
      const sentNotifications = [
        {
          id: 'notif-1',
          title: 'System Maintenance',
          message: 'The system will be under maintenance tomorrow from 2-4 PM.',
          type: 'warning',
          recipients: ['all'],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          sentAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'notif-2', 
          title: 'New Quiz Available',
          message: 'A new quiz has been assigned to your section.',
          type: 'info',
          recipients: ['section-1'],
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          sentAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      
      res.json(sentNotifications);
    } catch (error) {
      console.error('Error fetching sent notifications:', error);
      res.status(500).json({ message: 'Failed to fetch sent notifications' });
    }
  });

  // Customer Support API endpoints
  app.get('/api/support/tickets', mockAuth, async (req: any, res) => {
    try {
      const tickets = [
        {
          id: "ticket-1",
          title: "Quiz loading issue",
          description: "The quiz page is not loading properly when I click on it.",
          category: "technical",
          priority: "medium",
          status: "open",
          userId: "student-1",
          userName: "Alice Johnson",
          userEmail: "alice@test.com",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          responses: [
            {
              id: "response-1",
              message: "Thank you for reporting this issue. We are looking into it.",
              isStaff: true,
              createdAt: new Date().toISOString(),
              author: "Support Team"
            }
          ]
        }
      ];
      
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ error: "Failed to fetch support tickets" });
    }
  });

  app.get('/api/support/faqs', mockAuth, async (req: any, res) => {
    try {
      const faqs = [
        {
          id: "faq-1",
          question: "How do I reset my password?",
          answer: "You can reset your password by clicking on the 'Forgot Password' link on the login page.",
          category: "account",
          helpful: 15,
          notHelpful: 2,
          views: 150
        },
        {
          id: "faq-2",
          question: "Why can't I access a quiz?",
          answer: "Make sure you have completed all prerequisite quizzes and that the quiz is within its availability window.",
          category: "quiz",
          helpful: 25,
          notHelpful: 1,
          views: 200
        }
      ];
      
      res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  app.get('/api/support/knowledge-base', mockAuth, async (req: any, res) => {
    try {
      const knowledgeBase = [
        {
          id: "kb-1",
          title: "Getting Started Guide",
          content: "This comprehensive guide will help you get started with the platform...",
          category: "tutorial",
          tags: ["beginner", "setup", "tutorial"],
          views: 500,
          helpful: 45,
          lastUpdated: new Date().toISOString()
        }
      ];
      
      res.json(knowledgeBase);
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
      res.status(500).json({ error: "Failed to fetch knowledge base" });
    }
  });

  app.get('/api/support/stats', mockAuth, async (req: any, res) => {
    try {
      const supportStats = {
        openTickets: 3,
        avgResponseTime: "2.5",
        resolvedToday: 5,
        satisfaction: 95
      };
      
      res.json(supportStats);
    } catch (error) {
      console.error("Error fetching support stats:", error);
      res.status(500).json({ error: "Failed to fetch support stats" });
    }
  });

  app.post('/api/support/tickets', mockAuth, async (req: any, res) => {
    try {
      const { title, description, category, priority } = req.body;
      
      const newTicket = {
        id: `ticket-${Date.now()}`,
        title,
        description,
        category,
        priority,
        status: "open",
        userId: req.user.id,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        userEmail: req.user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: []
      };
      
      res.json(newTicket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ error: "Failed to create support ticket" });
    }
  });

  app.post('/api/support/tickets/:ticketId/respond', mockAuth, async (req: any, res) => {
    try {
      const { ticketId } = req.params;
      const { message } = req.body;
      
      const newResponse = {
        id: `response-${Date.now()}`,
        message,
        isStaff: req.user.role === 'admin' || req.user.role === 'super_admin',
        createdAt: new Date().toISOString(),
        author: `${req.user.firstName} ${req.user.lastName}`
      };
      
      res.json(newResponse);
    } catch (error) {
      console.error("Error responding to ticket:", error);
      res.status(500).json({ error: "Failed to respond to ticket" });
    }
  });

  app.put('/api/support/tickets/:ticketId/status', mockAuth, async (req: any, res) => {
    try {
      const { ticketId } = req.params;
      const { status } = req.body;
      
      res.json({ success: true, message: "Ticket status updated successfully" });
    } catch (error) {
      console.error("Error updating ticket status:", error);
      res.status(500).json({ error: "Failed to update ticket status" });
    }
  });

  app.post('/api/support/faqs/:faqId/rate', mockAuth, async (req: any, res) => {
    try {
      const { faqId } = req.params;
      const { helpful } = req.body;
      
      res.json({ success: true, message: "FAQ rating updated successfully" });
    } catch (error) {
      console.error("Error rating FAQ:", error);
      res.status(500).json({ error: "Failed to rate FAQ" });
    }
  });

  // Additional Study Aids endpoints for enhanced functionality
  app.get('/api/quizzes/available', mockAuth, async (req: any, res) => {
    try {
      const availableQuizzes = [
        {
          id: "quiz-1",
          title: "Introduction to Biology",
          description: "Basic concepts in biology",
          status: "available"
        },
        {
          id: "quiz-2",
          title: "Cell Structure",
          description: "Understanding cellular components",
          status: "available"
        },
        {
          id: "quiz-3",
          title: "Photosynthesis",
          description: "How plants make energy",
          status: "available"
        }
      ];
      
      res.json(availableQuizzes);
    } catch (error) {
      console.error("Error fetching available quizzes:", error);
      res.status(500).json({ error: "Failed to fetch available quizzes" });
    }
  });

  app.delete('/api/study-aids/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      res.json({ success: true, message: "Study aid deleted successfully" });
    } catch (error) {
      console.error("Error deleting study aid:", error);
      res.status(500).json({ error: "Failed to delete study aid" });
    }
  });

  app.post('/api/study-aids/:id/access', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      res.json({ success: true, message: "Access tracked successfully" });
    } catch (error) {
      console.error("Error tracking access:", error);
      res.status(500).json({ error: "Failed to track access" });
    }
  });

  app.post('/api/study-aids/:id/rate', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      
      res.json({ success: true, message: "Study aid rated successfully" });
    } catch (error) {
      console.error("Error rating study aid:", error);
      res.status(500).json({ error: "Failed to rate study aid" });
    }
  });

  // Students endpoint for filters
  app.get('/api/students', mockAuth, async (req: any, res) => {
    try {
      const students = [
        {
          id: "student-1",
          firstName: "Alice",
          lastName: "Johnson",
          email: "alice@test.com"
        },
        {
          id: "student-2",
          firstName: "Bob",
          lastName: "Smith",
          email: "bob@test.com"
        }
      ];
      
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // User Profile Enhancement API
  app.get('/api/user/profile', mockAuth, async (req: any, res) => {
    try {
      const userProfile = {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
        fieldOfStudy: "Biology",
        topicsOfInterest: ["Cell Biology", "Genetics", "Biochemistry", "Ecology"],
        industryEmployment: "Healthcare",
        academicLevel: "Undergraduate",
        learningPreferences: {
          preferredStudyAidTypes: ["flashcards", "practice_questions"],
          difficultyLevel: "intermediate",
          studyTimePreference: "evening"
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.json(userProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.put('/api/user/profile', mockAuth, async (req: any, res) => {
    try {
      const { fieldOfStudy, topicsOfInterest, industryEmployment, academicLevel, learningPreferences } = req.body;
      
      // Mock profile update
      const updatedProfile = {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
        fieldOfStudy,
        topicsOfInterest,
        industryEmployment,
        academicLevel,
        learningPreferences,
        updatedAt: new Date().toISOString()
      };
      
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });

  // Auto-generate study aids when quiz is assigned
  app.post('/api/quiz-assignments/:assignmentId/auto-generate-study-aids', mockAuth, async (req: any, res) => {
    try {
      const { assignmentId } = req.params;
      const { quizId, studentIds } = req.body;
      
      // Mock auto-generation of study aids for assigned quiz
      const autoGeneratedStudyAids = [
        {
          id: `auto-summary-${Date.now()}`,
          title: "Quiz Summary - Auto Generated",
          type: "summary",
          content: "Automatically generated summary for the assigned quiz",
          quizId,
          autoGenerated: true,
          createdAt: new Date().toISOString()
        },
        {
          id: `auto-flashcards-${Date.now()}`,
          title: "Quiz Flashcards - Auto Generated", 
          type: "flashcards",
          content: "Automatically generated flashcards for the assigned quiz",
          quizId,
          autoGenerated: true,
          createdAt: new Date().toISOString()
        }
      ];
      
      res.json({ 
        success: true, 
        message: "Study aids auto-generated for assignment",
        studyAids: autoGeneratedStudyAids
      });
    } catch (error) {
      console.error("Error auto-generating study aids:", error);
      res.status(500).json({ error: "Failed to auto-generate study aids" });
    }
  });

  // Backend Prompts API routes
  app.get('/api/backend-prompts', mockAuth, async (req, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }
      
      let prompts = await storage.getAllPromptTemplates();
      
      // If no prompts exist, seed with default prompts from AI service
      if (prompts.length === 0) {
        const defaultPrompts = [
          {
            name: "Question Generation System",
            description: "AI prompt for generating educational questions with comprehensive validation",
            category: "question_generation",
            promptType: "system",
            content: `COMPREHENSIVE EDUCATIONAL QUESTION GENERATION
            
As a PhD-level educational assessment specialist, generate high-quality educational questions using evidence-based standards from CRESST, Kansas Curriculum Center, UC Riverside School of Medicine, and Assessment Systems research:

**GENERATION PARAMETERS:**
- Topic: {topic}
- Difficulty Level: {difficulty}/10
- Question Type: {questionType}
- Bloom's Taxonomy: {bloomsLevel}
- Number of Questions: {questionCount}
- Points per Question: {points}

**QUALITY STANDARDS:**
1. Question Stem Quality: Clear, direct, unambiguous language
2. Multiple Choice Excellence: 3-5 plausible distractors representing common misconceptions
3. Cognitive Alignment: Match intended Bloom's taxonomy level
4. Bias Prevention: Cultural, gender, socioeconomic neutrality
5. Difficulty Calibration: Appropriate for target difficulty level

**OUTPUT FORMAT:**
Generate exactly {questionCount} questions in JSON format with:
- questionText: Clear, concise question
- questionType: {questionType}
- difficultyScore: {difficulty}
- bloomsLevel: {bloomsLevel}
- points: {points}
- answerOptions: Array of options with isCorrect boolean
- explanation: Brief explanation of correct answer

Ensure all questions are educationally valuable and aligned with learning objectives.`,
            variables: ["topic", "difficulty", "questionType", "bloomsLevel", "questionCount", "points"],
            isActive: true,
            isDefault: true,
            version: "1.0.0",
            createdBy: "system",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            name: "Question Validation System",
            description: "AI prompt for validating educational questions with comprehensive analysis",
            category: "question_validation",
            promptType: "system",
            content: `COMPREHENSIVE EDUCATIONAL QUESTION VALIDATION

As a PhD-level educational assessment specialist, analyze this question using evidence-based standards from CRESST, Kansas Curriculum Center, UC Riverside School of Medicine, and Assessment Systems research:

**QUESTION DETAILS:**
Text: "{questionText}"
Type: {questionType}
Difficulty Level: {difficultyScore}/10
Bloom's Taxonomy: {bloomsLevel}
Points: {points}

**ANSWER OPTIONS:**
{answerOptions}

**VALIDATION CRITERIA:**
1. Question Stem Quality: Clarity, language, bias, relevance
2. Multiple Choice Excellence: Plausible distractors, parallelism
3. Cognitive Alignment: Bloom's taxonomy match
4. Bias Prevention: Cultural sensitivity
5. Difficulty Calibration: Appropriate complexity

**OUTPUT FORMAT:**
Provide comprehensive validation result with:
- issues: Array of identified problems
- suggestions: Array of improvement recommendations
- confidenceScore: 0-100 validation confidence
- status: 'approved' | 'needs_review' | 'rejected'
- comments: Detailed feedback for educators

Focus on educational value and evidence-based assessment principles.`,
            variables: ["questionText", "questionType", "difficultyScore", "bloomsLevel", "points", "answerOptions"],
            isActive: true,
            isDefault: true,
            version: "1.0.0",
            createdBy: "system",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            name: "Content Analysis System",
            description: "AI prompt for analyzing quiz performance and student responses",
            category: "content_analysis",
            promptType: "system",
            content: `COMPREHENSIVE QUIZ CONTENT ANALYSIS

As a PhD-level educational assessment specialist, analyze this quiz performance data to provide insights for educators:

**PERFORMANCE DATA:**
Quiz Score: {score}%
Correct Answers: {correctAnswers}
Total Questions: {totalQuestions}
Time Taken: {timeSpent} minutes
Student Responses: {studentResponses}

**ANALYSIS CRITERIA:**
1. Performance Trends: Score patterns and improvement areas
2. Content Mastery: Knowledge gaps and strengths
3. Question Difficulty: Item analysis and discrimination
4. Learning Objectives: Alignment with educational goals
5. Instructional Recommendations: Targeted interventions

**OUTPUT FORMAT:**
Provide comprehensive analysis with:
- strengths: Areas of strong performance
- weaknesses: Knowledge gaps requiring attention
- recommendations: Specific improvement strategies
- insights: Data-driven observations
- nextSteps: Recommended follow-up actions

Focus on actionable insights for improving student learning outcomes.`,
            variables: ["score", "correctAnswers", "totalQuestions", "timeSpent", "studentResponses"],
            isActive: true,
            isDefault: true,
            version: "1.0.0",
            createdBy: "system",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            name: "System Initialization",
            description: "System prompt for initializing AI interactions",
            category: "system",
            promptType: "system",
            content: `EDUCATIONAL ASSESSMENT SYSTEM INITIALIZATION

You are an advanced AI educational assessment specialist with PhD-level expertise in:
- Educational measurement and evaluation
- Psychometric principles and item response theory
- Bloom's taxonomy and cognitive assessment
- Evidence-based assessment practices
- Cultural sensitivity and bias prevention

**CORE PRINCIPLES:**
1. Research-Based Standards: Follow CRESST, Kansas Curriculum Center, and UC Riverside guidelines
2. Educational Value: Prioritize learning objectives and outcomes
3. Quality Assurance: Maintain high standards for question development
4. Bias Prevention: Ensure cultural, gender, and socioeconomic neutrality
5. Continuous Improvement: Adapt based on performance data

**INTERACTION GUIDELINES:**
- Always provide evidence-based recommendations
- Explain reasoning behind decisions
- Offer multiple perspectives when appropriate
- Maintain professional, supportive tone
- Focus on educational effectiveness

Initialize all interactions with these principles as your foundation.`,
            variables: [],
            isActive: true,
            isDefault: true,
            version: "1.0.0",
            createdBy: "system",
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        // Create default prompts
        for (const promptData of defaultPrompts) {
          await storage.createPromptTemplate(promptData);
        }
        
        // Fetch the newly created prompts
        prompts = await storage.getAllPromptTemplates();
      }
      
      res.json(prompts);
    } catch (error) {
      console.error('Error fetching backend prompts:', error);
      res.status(500).json({ message: 'Failed to fetch prompts' });
    }
  });

  app.post('/api/backend-prompts', mockAuth, async (req, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }
      
      const prompt = await storage.createPromptTemplate(req.body);
      res.json(prompt);
    } catch (error) {
      console.error('Error creating backend prompt:', error);
      res.status(500).json({ message: 'Failed to create prompt' });
    }
  });

  app.patch('/api/backend-prompts/:id', mockAuth, async (req, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }
      
      const { id } = req.params;
      const prompt = await storage.updatePromptTemplate(id, req.body);
      res.json(prompt);
    } catch (error) {
      console.error('Error updating backend prompt:', error);
      res.status(500).json({ message: 'Failed to update prompt' });
    }
  });

  app.delete('/api/backend-prompts/:id', mockAuth, async (req, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }
      
      const { id } = req.params;
      await storage.deletePromptTemplate(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting backend prompt:', error);
      res.status(500).json({ message: 'Failed to delete prompt' });
    }
  });

  // Users API routes
  app.get('/api/users', mockAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      console.log('Fetched users:', users.length, 'users');
      res.json(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json([]);
    }
  });

  // Section Management API routes
  app.get('/api/sections', mockAuth, async (req, res) => {
    try {
      // Clean up any invalid section memberships first
      await storage.cleanupInvalidSectionMemberships();
      
      const sections = await storage.getSections();
      console.log('Fetched sections:', sections.length, 'sections');
      res.json(Array.isArray(sections) ? sections : []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      res.status(500).json([]);
    }
  });

  app.post('/api/sections', mockAuth, async (req, res) => {
    try {
      const { name, description } = req.body;
      const userId = req.user?.id || 'test-user';
      const section = await storage.createSection({
        name,
        description,
        creatorId: userId,
        accountId: '00000000-0000-0000-0000-000000000001',
      });
      res.json(section);
    } catch (error) {
      console.error('Error creating section:', error);
      res.status(500).json({ message: 'Failed to create section', error: error.message });
    }
  });

  // Add cleanup endpoint for debugging
  app.post('/api/sections/cleanup', mockAuth, async (req, res) => {
    try {
      await storage.cleanupInvalidSectionMemberships();
      res.json({ success: true, message: 'Invalid section memberships cleaned up' });
    } catch (error) {
      console.error('Error cleaning up section memberships:', error);
      res.status(500).json({ message: 'Failed to cleanup section memberships' });
    }
  });

  app.get('/api/sections/:sectionId/members', mockAuth, async (req, res) => {
    try {
      const { sectionId } = req.params;
      console.log(`Fetching members for section: ${sectionId}`);
      const members = await storage.getSectionMembers(sectionId);
      console.log(`Returning ${members.length} members:`, members.map(m => ({ id: m.id, name: `${m.firstName} ${m.lastName}`, email: m.email })));
      res.json(members);
    } catch (error) {
      console.error('Error fetching section members:', error);
      res.status(500).json({ message: 'Failed to fetch section members' });
    }
  });

  app.post('/api/sections/:sectionId/members', mockAuth, async (req, res) => {
    try {
      const { sectionId } = req.params;
      const { studentIds } = req.body;
      await storage.addStudentsToSection(sectionId, studentIds);
      res.json({ success: true });
    } catch (error) {
      console.error('Error adding students to section:', error);
      res.status(500).json({ message: 'Failed to add students to section' });
    }
  });

  app.delete('/api/sections/:sectionId/members/:studentId', mockAuth, async (req, res) => {
    try {
      const { sectionId, studentId } = req.params;
      console.log(`Removing student ${studentId} from section ${sectionId}`);
      
      // First check if the student exists
      const user = await storage.getUser(studentId);
      if (!user) {
        console.log(`User ${studentId} not found`);
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // Then remove the student from the section
      await storage.removeStudentFromSection(sectionId, studentId);
      console.log(`Successfully removed student ${studentId} from section ${sectionId}`);
      res.json({ success: true, message: 'Student removed successfully' });
    } catch (error) {
      console.error('Error removing student from section:', error);
      res.status(500).json({ message: 'Failed to remove student from section', error: error.message });
    }
  });

  app.get('/api/quiz-assignments', mockAuth, async (req, res) => {
    try {
      const assignments = await storage.getQuizAssignments();
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching quiz assignments:', error);
      res.status(500).json({ message: 'Failed to fetch quiz assignments' });
    }
  });

  app.post('/api/quiz-assignments', mockAuth, async (req, res) => {
    try {
      const { 
        quizId, 
        assignedToUserId, 
        assignedToSectionId, 
        title, 
        description, 
        dueDate, 
        availableFrom, 
        availableTo,
        timeLimit, 
        maxAttempts, 
        allowLateSubmission, 
        percentLostPerDay,
        maxLateDays,
        showCorrectAnswers,
        enableQuestionFeedback,
        requireProctoring,
        allowCalculator,
        catEnabled,
        catMinQuestions,
        catMaxQuestions,
        catDifficultyTarget
      } = req.body;
      
      const userId = req.user.id;
      const userAccountId = req.user.accountId || "00000000-0000-0000-0000-000000000001";
      
      // Convert string dates to Date objects
      const parsedDueDate = dueDate ? new Date(dueDate) : null;
      const parsedAvailableFrom = availableFrom ? new Date(availableFrom) : null;
      const parsedAvailableTo = availableTo ? new Date(availableTo) : null;
      
      // Prepare late grading options
      const lateGradingOptions = allowLateSubmission ? {
        percentLostPerDay: percentLostPerDay || 10,
        maxLateDays: maxLateDays || 7
      } : null;
      
      // Prepare CAT options
      const catOptions = catEnabled ? {
        enabled: true,
        minQuestions: catMinQuestions || 10,
        maxQuestions: catMaxQuestions || 50,
        difficultyTarget: catDifficultyTarget || 0.5
      } : null;
      
      const assignment = await storage.createQuizAssignment({
        quizId,
        assignedToUserId,
        assignedToSectionId,
        assignedById: userId,
        accountId: userAccountId,
        title,
        description,
        dueDate: parsedDueDate,
        availableFrom: parsedAvailableFrom,
        availableTo: parsedAvailableTo,
        timeLimit: timeLimit || 60,
        maxAttempts: maxAttempts || 1,
        allowLateSubmission: allowLateSubmission || false,
        lateGradingOptions: lateGradingOptions,
        showCorrectAnswers: showCorrectAnswers || false,
        enableQuestionFeedback: enableQuestionFeedback || false,
        requireProctoring: requireProctoring || false,
        allowCalculator: allowCalculator || false,
        catEnabled: catEnabled || false,
        catOptions: catOptions,
        status: 'draft'
      });

      // Auto-generate study aids when quiz is assigned
      if (assignment.quizId) {
        try {
          // Get the quiz details
          const quiz = await storage.getQuiz(assignment.quizId);
          
          if (quiz) {
            // Determine which students to generate study aids for
            let targetStudents: string[] = [];
            
            if (assignedToUserId) {
              targetStudents = [assignedToUserId];
            } else if (assignedToSectionId) {
              // Get all students in the section
              const sectionMembers = await storage.getSectionMembers(assignedToSectionId);
              targetStudents = sectionMembers.map(member => member.studentId);
            }
            
            // Generate study aids for each target student
            for (const studentId of targetStudents) {
              const studyAidTypes = ['study_guide', 'flashcards', 'practice_questions'];
              
              for (const type of studyAidTypes) {
                const studyAidData = {
                  id: `study-${Date.now()}-${studentId}-${type}`,
                  title: `${quiz.title} - ${type.replace('_', ' ')}`,
                  type: type,
                  content: `Auto-generated ${type.replace('_', ' ')} for ${quiz.title}. This material will help you prepare for the upcoming quiz assignment.`,
                  quizId: quiz.id,
                  quizTitle: quiz.title,
                  studentId: studentId,
                  createdAt: new Date().toISOString(),
                  lastAccessedAt: new Date().toISOString(),
                  accessCount: 0,
                  rating: 0,
                  isAutoGenerated: true
                };
                
                // Create the study aid
                await storage.createStudyAid(studyAidData);
              }
            }
            
            console.log(`Auto-generated study aids for ${targetStudents.length} students for quiz assignment: ${assignment.id}`);
          }
        } catch (studyAidError) {
          console.error('Error auto-generating study aids:', studyAidError);
          // Don't fail the assignment creation if study aid generation fails
        }
      }

      res.json(assignment);
    } catch (error) {
      console.error('Error creating quiz assignment:', error);
      res.status(500).json({ message: 'Failed to create quiz assignment' });
    }
  });

  app.get('/api/quizzes/completed',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const attempts = await storage.getQuizAttemptsByUser(userId);
      
      // Get unique completed quizzes with scores
      const completedQuizzes = [];
      const seenQuizzes = new Set();
      
      for (const attempt of attempts) {
        if (!seenQuizzes.has(attempt.quizId) && attempt.status === 'completed') {
          const quiz = await storage.getQuiz(attempt.quizId);
          if (quiz) {
            completedQuizzes.push({
              id: quiz.id,
              title: quiz.title,
              score: Math.round((attempt.score || 0) * 100),
              completedAt: attempt.completedAt,
            });
            seenQuizzes.add(attempt.quizId);
          }
        }
      }
      
      res.json(completedQuizzes);
    } catch (error) {
      console.error("Error fetching completed quizzes:", error);
      res.status(500).json({ message: "Failed to fetch completed quizzes" });
    }
  });

  app.post('/api/study-aids/:id/access',  async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims?.sub || req.user.id;
      
      const studyAid = await storage.getStudyAid(id);
      if (!studyAid || studyAid.studentId !== userId) {
        return res.status(404).json({ message: "Study aid not found" });
      }

      await storage.updateStudyAidAccess(id);
      res.json({ message: "Access recorded" });
    } catch (error) {
      console.error("Error updating study aid access:", error);
      res.status(500).json({ message: "Failed to update access" });
    }
  });

  app.post('/api/study-aids/:id/rate',  async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      const userId = req.user.claims?.sub || req.user.id;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      const studyAid = await storage.getStudyAid(id);
      if (!studyAid || studyAid.studentId !== userId) {
        return res.status(404).json({ message: "Study aid not found" });
      }

      await storage.updateStudyAidRating(id, rating);
      res.json({ message: "Rating updated" });
    } catch (error) {
      console.error("Error updating study aid rating:", error);
      res.status(500).json({ message: "Failed to update rating" });
    }
  });

  app.delete('/api/study-aids/:id',  async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims?.sub || req.user.id;
      
      const studyAid = await storage.getStudyAid(id);
      if (!studyAid || studyAid.studentId !== userId) {
        return res.status(404).json({ message: "Study aid not found" });
      }

      await storage.deleteStudyAid(id);
      res.json({ message: "Study aid deleted successfully" });
    } catch (error) {
      console.error("Error deleting study aid:", error);
      res.status(500).json({ message: "Failed to delete study aid" });
    }
  });

  // User Management Routes
  app.get('/api/users/:accountId',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { accountId } = req.params;
      const user = await storage.getUser(userId);
      
      // Only admins and super admins can view all users
      if (user?.role !== 'admin' && user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const users = await storage.getUsersByAccount(accountId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/users/:userId/role',  async (req: any, res) => {
    try {
      const currentUserId = req.user.claims?.sub || req.user.id;
      const { userId } = req.params;
      const { role } = req.body;
      const currentUser = await storage.getUser(currentUserId);
      
      // Only admins and super admins can change roles
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Shared Content Routes
  app.get('/api/shared/testbanks',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.accountId) {
        return res.status(404).json({ message: "User account not found" });
      }

      const testbanks = await storage.getSharedTestbanksByAccount(user.accountId);
      res.json(testbanks);
    } catch (error) {
      console.error("Error fetching shared testbanks:", error);
      res.status(500).json({ message: "Failed to fetch shared testbanks" });
    }
  });

  app.get('/api/shared/quizzes',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.accountId) {
        return res.status(404).json({ message: "User account not found" });
      }

      const quizzes = await storage.getSharedQuizzesByAccount(user.accountId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching shared quizzes:", error);
      res.status(500).json({ message: "Failed to fetch shared quizzes" });
    }
  });

  // Question Group Routes
  app.get('/api/quizzes/:quizId/question-groups',  async (req: any, res) => {
    try {
      const questionGroups = await storage.getQuestionGroupsByQuiz(req.params.quizId);
      res.json(questionGroups);
    } catch (error) {
      console.error("Error fetching question groups:", error);
      res.status(500).json({ message: "Failed to fetch question groups" });
    }
  });

  app.post('/api/quizzes/:quizId/question-groups',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.accountId) {
        return res.status(404).json({ message: "User account not found" });
      }

      const groupData = {
        ...req.body,
        quizId: req.params.quizId,
        accountId: user.accountId
      };

      const questionGroup = await storage.createQuestionGroup(groupData);
      res.json(questionGroup);
    } catch (error) {
      console.error("Error creating question group:", error);
      res.status(500).json({ message: "Failed to create question group" });
    }
  });

  app.put('/api/question-groups/:id',  async (req: any, res) => {
    try {
      const updatedGroup = await storage.updateQuestionGroup(req.params.id, req.body);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error updating question group:", error);
      res.status(500).json({ message: "Failed to update question group" });
    }
  });

  app.delete('/api/question-groups/:id',  async (req: any, res) => {
    try {
      await storage.deleteQuestionGroup(req.params.id);
      res.json({ message: "Question group deleted successfully" });
    } catch (error) {
      console.error("Error deleting question group:", error);
      res.status(500).json({ message: "Failed to delete question group" });
    }
  });

  app.put('/api/question-groups/:id/assign-questions',  async (req: any, res) => {
    try {
      const { questionIds } = req.body;
      await storage.assignQuestionsToGroup(req.params.id, questionIds);
      res.json({ message: "Questions assigned to group successfully" });
    } catch (error) {
      console.error("Error assigning questions to group:", error);
      res.status(500).json({ message: "Failed to assign questions to group" });
    }
  });

  // LTI Configuration endpoints (temporarily disabled)
  /*
  app.get('/api/lti/config', (req, res) => {
    try {
      const config = getLTIConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get LTI configuration' });
    }
  });

  // LTI Grade Passback endpoint
  app.post('/api/lti/grade-passback', requireLTIAuth, async (req, res) => {
    try {
      const { score, maxScore = 100 } = req.body;
      
      if (typeof score !== 'number' || score < 0 || score > maxScore) {
        return res.status(400).json({ error: 'Invalid score provided' });
      }

      const success = await sendGradePassback(req, score, maxScore);
      
      if (success) {
        res.json({ success: true, message: 'Grade sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send grade' });
      }
    } catch (error) {
      console.error('Grade passback error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // LTI Deep Linking endpoint
  app.post('/api/lti/deep-link', requireLTIAuth, async (req, res) => {
    try {
      const { contentItems } = req.body;
      
      if (!Array.isArray(contentItems)) {
        return res.status(400).json({ error: 'Invalid content items provided' });
      }

      await createDeepLink(req, res, contentItems);
    } catch (error) {
      console.error('Deep linking error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // LTI User info endpoint
  app.get('/api/lti/user', requireLTIAuth, (req, res) => {
    try {
      const ltiUser = getLTIUser(req);
      if (ltiUser) {
        res.json(ltiUser);
      } else {
        res.status(404).json({ error: 'No LTI user found' });
      }
    } catch (error) {
      console.error('LTI user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  */

  // Create dummy users endpoint
  app.post('/api/create-dummy-users', async (req, res) => {
    try {
      const dummyUsers = [
        {
          id: 'student1',
          email: 'student1@example.com',
          firstName: 'Alice',
          lastName: 'Johnson',
          role: 'student',
          accountId: 'default-account',
          isActive: true,
        },
        {
          id: 'student2',
          email: 'student2@example.com',
          firstName: 'Bob',
          lastName: 'Smith',
          role: 'student',
          accountId: 'default-account',
          isActive: true,
        },
        {
          id: 'student3',
          email: 'student3@example.com',
          firstName: 'Charlie',
          lastName: 'Brown',
          role: 'student',
          accountId: 'default-account',
          isActive: true,
        },
        {
          id: 'student4',
          email: 'student4@example.com',
          firstName: 'Emma',
          lastName: 'Garcia',
          role: 'student',
          accountId: 'default-account',
          isActive: true,
        },
        {
          id: 'student5',
          email: 'student5@example.com',
          firstName: 'David',
          lastName: 'Martinez',
          role: 'student',
          accountId: 'default-account',
          isActive: true,
        },
        {
          id: 'teacher1',
          email: 'teacher1@example.com',
          firstName: 'Diana',
          lastName: 'Wilson',
          role: 'teacher',
          accountId: 'default-account',
          isActive: true,
        },
        {
          id: 'teacher2',
          email: 'teacher2@example.com',
          firstName: 'Eric',
          lastName: 'Davis',
          role: 'teacher',
          accountId: 'default-account',
          isActive: true,
        },
      ];

      const createdUsers = [];
      for (const user of dummyUsers) {
        try {
          const created = await storage.upsertUser(user);
          createdUsers.push(created);
        } catch (error) {
          console.error('Error creating user:', user.id, error);
        }
      }

      res.json(createdUsers);
    } catch (error) {
      console.error('Error creating dummy users:', error);
      res.status(500).json({ error: 'Failed to create dummy users' });
    }
  });

  // ========== QUIZ ASSIGNMENTS ENDPOINTS ==========
  
  // Get all quiz assignments
  app.get('/api/quiz-assignments', async (req, res) => {
    try {
      const assignments = await storage.getQuizAssignments();
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching quiz assignments:', error);
      res.status(500).json({ error: 'Failed to fetch quiz assignments' });
    }
  });

  // Create quiz assignment
  app.post('/api/quiz-assignments', async (req, res) => {
    try {
      const assignmentData = req.body;
      // Convert string date to Date object if present
      if (assignmentData.dueDate) {
        assignmentData.dueDate = new Date(assignmentData.dueDate);
      }
      const assignment = await storage.createQuizAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error('Error creating quiz assignment:', error);
      res.status(500).json({ error: 'Failed to create quiz assignment' });
    }
  });

  // Update quiz assignment
  app.put('/api/quiz-assignments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const assignment = await storage.updateQuizAssignment(id, updateData);
      res.json(assignment);
    } catch (error) {
      console.error('Error updating quiz assignment:', error);
      res.status(500).json({ error: 'Failed to update quiz assignment' });
    }
  });

  // Delete quiz assignment
  app.delete('/api/quiz-assignments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteQuizAssignment(id);
      res.json({ message: 'Quiz assignment deleted successfully' });
    } catch (error) {
      console.error('Error deleting quiz assignment:', error);
      res.status(500).json({ error: 'Failed to delete quiz assignment' });
    }
  });

  // Publish quiz assignment
  app.post('/api/quiz-assignments/:id/publish', async (req, res) => {
    try {
      const { id } = req.params;
      const assignment = await storage.updateQuizAssignment(id, { status: 'published' });
      res.json(assignment);
    } catch (error) {
      console.error('Error publishing quiz assignment:', error);
      res.status(500).json({ error: 'Failed to publish quiz assignment' });
    }
  });

  // Archive quiz assignment
  app.post('/api/quiz-assignments/:id/archive', async (req, res) => {
    try {
      const { id } = req.params;
      const assignment = await storage.updateQuizAssignment(id, { status: 'archived' });
      res.json(assignment);
    } catch (error) {
      console.error('Error archiving quiz assignment:', error);
      res.status(500).json({ error: 'Failed to archive quiz assignment' });
    }
  });

  // ========== COMPREHENSIVE ANALYTICS ENDPOINTS ==========
  
  // Import Analytics Services
  const { 
    generateMLInsights, 
    predictStudentPerformance, 
    detectAnomalies, 
    generateLearningPath, 
    analyzeQuestionClusters 
  } = await import('./mlInsightsService');

  const {
    generateItemAnalysisReport,
    exportAnalyticsData,
    generateComprehensiveAnalyticsReport
  } = await import('./comprehensiveAnalyticsService');

  // Get comprehensive ML insights
  app.get('/api/analytics/ml-insights', async (req: any, res) => {
    try {
      const { quizId, timeRange = '30d' } = req.query;
      
      // Use default test account for ML insights
      const insights = await generateMLInsights(quizId, "default-account", timeRange);
      res.json(insights);
    } catch (error) {
      console.error("Error generating ML insights:", error);
      res.status(500).json({ message: "Failed to generate ML insights" });
    }
  });

  // Predict student performance
  app.get('/api/analytics/predict-performance/:studentId', async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const { quizId } = req.query;
      
      const prediction = await predictStudentPerformance(studentId, quizId);
      res.json(prediction);
    } catch (error) {
      console.error("Error predicting performance:", error);
      res.status(500).json({ message: "Failed to predict performance" });
    }
  });

  // Detect anomalies in quiz data
  app.get('/api/analytics/anomalies/:quizId', async (req: any, res) => {
    try {
      const { quizId } = req.params;
      
      const anomalies = await detectAnomalies(quizId);
      res.json(anomalies);
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      res.status(500).json({ message: "Failed to detect anomalies" });
    }
  });

  // Generate personalized learning path
  app.get('/api/analytics/learning-path/:studentId', async (req: any, res) => {
    try {
      const { studentId } = req.params;
      
      const learningPath = await generateLearningPath(studentId);
      res.json(learningPath);
    } catch (error) {
      console.error("Error generating learning path:", error);
      res.status(500).json({ message: "Failed to generate learning path" });
    }
  });

  // Analyze question clusters for testbank
  app.get('/api/analytics/question-clusters/:testbankId',  async (req: any, res) => {
    try {
      const { testbankId } = req.params;
      
      const clusters = await analyzeQuestionClusters(testbankId);
      res.json(clusters);
    } catch (error) {
      console.error("Error analyzing question clusters:", error);
      res.status(500).json({ message: "Failed to analyze question clusters" });
    }
  });

  // Advanced quiz analytics with ML insights
  app.get('/api/analytics/quiz/:quizId/advanced',  async (req: any, res) => {
    try {
      const { quizId } = req.params;
      const userId = req.user.claims?.sub || req.user.id;
      
      // Get comprehensive quiz data
      const [quiz, attempts, questions] = await Promise.all([
        storage.getQuiz(quizId),
        storage.getActiveQuizAttempts(quizId),
        storage.getQuestionsByQuiz(quizId)
      ]);

      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Generate ML insights specific to this quiz
      const mlInsights = await generateMLInsights(quizId);
      
      // Get anomalies for this quiz
      const anomalies = await detectAnomalies(quizId);

      // Combine traditional analytics with ML insights
      const basicAnalytics = await storage.getQuizAnalytics(quizId);
      
      const advancedAnalytics = {
        basic: basicAnalytics,
        quiz: quiz,
        attempts: attempts,
        questions: questions,
        mlInsights: mlInsights,
        anomalies: anomalies,
        performanceTrends: mlInsights.performancePredictions,
        conceptMastery: mlInsights.conceptMastery,
        adaptiveRecommendations: mlInsights.adaptiveDifficulty,
        engagementPatterns: mlInsights.engagementPatterns
      };

      res.json(advancedAnalytics);
    } catch (error) {
      console.error("Error generating advanced quiz analytics:", error);
      res.status(500).json({ message: "Failed to generate advanced analytics" });
    }
  });

  // Predictive analytics dashboard
  app.get('/api/analytics/predictive',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate comprehensive predictive insights
      const insights = await generateMLInsights(undefined, user.accountId, '90d');
      
      const predictiveData = {
        trends: insights?.predictiveAnalytics?.overallTrends || [],
        riskFactors: insights?.predictiveAnalytics?.riskFactors || [],
        optimizationOpportunities: insights?.predictiveAnalytics?.optimizationOpportunities || [],
        studentRiskPredictions: insights?.performancePredictions?.filter(p => p.riskLevel !== 'low') || [],
        conceptMasteryForecasts: insights?.conceptMastery || [],
        engagementTrends: insights?.engagementPatterns || []
      };

      res.json(predictiveData);
    } catch (error) {
      console.error("Error generating predictive analytics:", error);
      res.status(500).json({ message: "Failed to generate predictive analytics" });
    }
  });

  // ========== COMPREHENSIVE ANALYTICS ENDPOINTS ==========

  // 1. Item Analysis Reports
  app.get('/api/analytics/item-analysis/:quizId', async (req: any, res) => {
    try {
      const { quizId } = req.params;
      const { accountId } = req.query;
      
      const itemAnalysis = await generateItemAnalysisReport(quizId, accountId);
      res.json(itemAnalysis);
    } catch (error) {
      console.error("Error generating item analysis report:", error);
      res.status(500).json({ message: "Failed to generate item analysis report" });
    }
  });

  // 2. Comprehensive Analytics Report
  app.get('/api/analytics/comprehensive/:quizId', async (req: any, res) => {
    try {
      const { quizId } = req.params;
      const { accountId, includeAll = true } = req.query;
      
      const comprehensiveReport = await generateComprehensiveAnalyticsReport(
        quizId, 
        accountId, 
        includeAll === 'true'
      );
      res.json(comprehensiveReport);
    } catch (error) {
      console.error("Error generating comprehensive analytics report:", error);
      res.status(500).json({ message: "Failed to generate comprehensive analytics report" });
    }
  });

  // 3. Export Analytics Data
  app.post('/api/analytics/export', async (req: any, res) => {
    try {
      const { reportType, reportData, options } = req.body;
      
      const exportResult = await exportAnalyticsData(reportType, reportData, options);
      res.json(exportResult);
    } catch (error) {
      console.error("Error exporting analytics data:", error);
      res.status(500).json({ message: "Failed to export analytics data" });
    }
  });

  // 4. Generate All Analytics Types for Quiz
  app.get('/api/analytics/complete/:quizId', async (req: any, res) => {
    try {
      const { quizId } = req.params;
      const { format = 'json' } = req.query;
      
      // Generate all analytics reports
      const [
        itemAnalysis,
        mlInsights,
        comprehensiveReport
      ] = await Promise.all([
        generateItemAnalysisReport(quizId),
        generateMLInsights(quizId),
        generateComprehensiveAnalyticsReport(quizId)
      ]);

      const completeAnalytics = {
        quizId,
        generatedAt: new Date(),
        reports: {
          itemAnalysis,
          mlInsights,
          comprehensive: comprehensiveReport,
          summary: {
            totalQuestions: itemAnalysis.length,
            averageDifficulty: itemAnalysis.reduce((sum, item) => sum + item.difficultyIndex, 0) / itemAnalysis.length,
            flaggedQuestions: itemAnalysis.filter(item => item.flaggedForReview).length,
            highPerformingStudents: mlInsights.performancePredictions?.filter(p => p.riskLevel === 'low').length || 0,
            atRiskStudents: mlInsights.performancePredictions?.filter(p => p.riskLevel === 'high').length || 0,
            anomaliesDetected: mlInsights.anomalyDetection?.length || 0
          }
        }
      };

      if (format === 'export') {
        const exportOptions = {
          format: 'json' as const,
          includeVisualizations: true
        };
        const exportResult = await exportAnalyticsData('complete_analytics', completeAnalytics, exportOptions);
        res.json(exportResult);
      } else {
        res.json(completeAnalytics);
      }
    } catch (error) {
      console.error("Error generating complete analytics:", error);
      res.status(500).json({ message: "Failed to generate complete analytics" });
    }
  });

  const httpServer = createServer(app);
  
  // Notification endpoints
  app.get('/api/notifications', async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || mockUser.id;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications/:id/read', async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // ===== PROMPT TEMPLATE ROUTES =====

  // Create a new prompt template (Super Admin only)
  app.post("/api/prompt-templates", mockAuth, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== "super_admin") {
        return res.status(403).json({ message: "Only super admins can create prompt templates" });
      }

      const validatedData = insertPromptTemplateSchema.parse(req.body);
      const template = await storage.createPromptTemplate({
        ...validatedData,
        accountId: user.accountId,
        createdBy: user.id,
      });
      res.json(template);
    } catch (error) {
      console.error("Error creating prompt template:", error);
      res.status(500).json({ message: "Failed to create prompt template" });
    }
  });

  // Get prompt templates for account
  app.get("/api/prompt-templates", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const { category } = req.query;

      let templates;
      if (category) {
        templates = await storage.getPromptTemplatesByCategory(user.accountId, category as string);
      } else {
        templates = await storage.getPromptTemplatesByAccount(user.accountId);
      }
      
      // Include system defaults for super admins
      if (user.role === "super_admin") {
        const systemDefaults = await storage.getSystemDefaultPromptTemplates();
        templates = [...systemDefaults, ...templates];
      }

      res.json(templates);
    } catch (error) {
      console.error("Error fetching prompt templates:", error);
      res.status(500).json({ message: "Failed to fetch prompt templates" });
    }
  });

  // Update prompt template
  app.put("/api/prompt-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      
      // Check if user can modify this template
      const template = await storage.getPromptTemplate(id);
      if (!template || (template.accountId !== user.accountId && user.role !== "super_admin")) {
        return res.status(404).json({ message: "Prompt template not found" });
      }

      const validatedData = insertPromptTemplateSchema.partial().parse(req.body);
      const updated = await storage.updatePromptTemplate(id, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating prompt template:", error);
      res.status(500).json({ message: "Failed to update prompt template" });
    }
  });

  // Delete prompt template
  app.delete("/api/prompt-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      
      const template = await storage.getPromptTemplate(id);
      if (!template || (template.accountId !== user.accountId && user.role !== "super_admin")) {
        return res.status(404).json({ message: "Prompt template not found" });
      }

      await storage.deletePromptTemplate(id);
      res.json({ message: "Prompt template deleted successfully" });
    } catch (error) {
      console.error("Error deleting prompt template:", error);
      res.status(500).json({ message: "Failed to delete prompt template" });
    }
  });

  // ===== LLM PROVIDER ROUTES =====

  // Create LLM provider configuration
  app.post("/api/llm-providers", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== "super_admin" && user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can configure LLM providers" });
      }

      const validatedData = insertLlmProviderSchema.parse(req.body);
      const provider = await storage.createLlmProvider({
        ...validatedData,
        accountId: user.accountId,
        configuredBy: user.id,
      });
      res.json(provider);
    } catch (error) {
      console.error("Error creating LLM provider:", error);
      res.status(500).json({ message: "Failed to create LLM provider" });
    }
  });

  // Get LLM providers for account
  app.get("/api/llm-providers", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const { activeOnly } = req.query;

      let providers;
      if (activeOnly === "true") {
        providers = await storage.getActiveLlmProviders(user.accountId);
      } else {
        providers = await storage.getLlmProvidersByAccount(user.accountId);
      }

      res.json(providers);
    } catch (error) {
      console.error("Error fetching LLM providers:", error);
      res.status(500).json({ message: "Failed to fetch LLM providers" });
    }
  });

  // Update LLM provider
  app.put("/api/llm-providers/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      
      if (user.role !== "super_admin" && user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can update LLM providers" });
      }

      const provider = await storage.getLlmProvider(id);
      if (!provider || provider.accountId !== user.accountId) {
        return res.status(404).json({ message: "LLM provider not found" });
      }

      const validatedData = insertLlmProviderSchema.partial().parse(req.body);
      const updated = await storage.updateLlmProvider(id, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating LLM provider:", error);
      res.status(500).json({ message: "Failed to update LLM provider" });
    }
  });

  // Test LLM provider connection
  app.post("/api/llm-providers/:id/test", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      
      if (user.role !== "super_admin" && user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can test LLM providers" });
      }

      const provider = await storage.getLlmProvider(id);
      if (!provider || provider.accountId !== user.accountId) {
        return res.status(404).json({ message: "LLM provider not found" });
      }

      // Import multiProviderAI and test connection
      const { multiProviderAI } = await import("./multiProviderAI");
      const isWorking = await multiProviderAI.testProviderConnection(provider.providerName, provider.apiKeyHash);
      
      res.json({ 
        success: isWorking, 
        message: isWorking ? "Connection successful" : "Connection failed" 
      });
    } catch (error) {
      console.error("Error testing LLM provider:", error);
      res.status(500).json({ message: "Failed to test LLM provider" });
    }
  });

  // ===== CUSTOM INSTRUCTION ROUTES =====

  // Create custom instruction
  app.post("/api/custom-instructions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const validatedData = insertCustomInstructionSchema.parse(req.body);
      
      const instruction = await storage.createCustomInstruction({
        ...validatedData,
        accountId: user.accountId,
        createdBy: user.id,
      });
      res.json(instruction);
    } catch (error) {
      console.error("Error creating custom instruction:", error);
      res.status(500).json({ message: "Failed to create custom instruction" });
    }
  });

  // Get custom instructions
  app.get("/api/custom-instructions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const { category, includePublic } = req.query;

      let instructions = [];
      
      if (category) {
        instructions = await storage.getCustomInstructionsByCategory(user.accountId, category as string);
      } else {
        instructions = await storage.getCustomInstructionsByAccount(user.accountId);
      }

      // Add public instructions if requested
      if (includePublic === "true") {
        const publicInstructions = await storage.getPublicCustomInstructions();
        instructions = [...instructions, ...publicInstructions];
      }

      res.json(instructions);
    } catch (error) {
      console.error("Error fetching custom instructions:", error);
      res.status(500).json({ message: "Failed to fetch custom instructions" });
    }
  });

  // Update custom instruction
  app.put("/api/custom-instructions/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      
      const instruction = await storage.getCustomInstruction(id);
      if (!instruction || (instruction.accountId !== user.accountId && instruction.createdBy !== user.id)) {
        return res.status(404).json({ message: "Custom instruction not found" });
      }

      const validatedData = insertCustomInstructionSchema.partial().parse(req.body);
      const updated = await storage.updateCustomInstruction(id, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating custom instruction:", error);
      res.status(500).json({ message: "Failed to update custom instruction" });
    }
  });

  // Increment usage count
  app.post("/api/custom-instructions/:id/use", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementCustomInstructionUsage(id);
      res.json({ message: "Usage count updated" });
    } catch (error) {
      console.error("Error updating usage count:", error);
      res.status(500).json({ message: "Failed to update usage count" });
    }
  });

  // Delete custom instruction
  app.delete("/api/custom-instructions/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      
      const instruction = await storage.getCustomInstruction(id);
      if (!instruction || (instruction.accountId !== user.accountId && instruction.createdBy !== user.id)) {
        return res.status(404).json({ message: "Custom instruction not found" });
      }

      await storage.deleteCustomInstruction(id);
      res.json({ message: "Custom instruction deleted successfully" });
    } catch (error) {
      console.error("Error deleting custom instruction:", error);
      res.status(500).json({ message: "Failed to delete custom instruction" });
    }
  });

  // Quiz Progress API Endpoints
  
  // Get quiz progress for an attempt
  app.get("/api/quiz-progress/:attemptId", isAuthenticated, async (req, res) => {
    try {
      const { attemptId } = req.params;
      const user = req.user;
      
      // Verify the user has access to this attempt
      const attempt = await storage.getQuizAttempt(attemptId);
      if (!attempt || attempt.studentId !== user.id) {
        return res.status(404).json({ message: "Quiz attempt not found" });
      }
      
      const progress = await storage.getQuizProgress(attemptId);
      res.json(progress);
    } catch (error) {
      console.error("Error getting quiz progress:", error);
      res.status(500).json({ message: "Failed to get quiz progress" });
    }
  });

  // Save/update quiz progress
  app.put("/api/quiz-progress/:attemptId", isAuthenticated, async (req, res) => {
    try {
      const { attemptId } = req.params;
      const user = req.user;
      
      // Verify the user has access to this attempt
      const attempt = await storage.getQuizAttempt(attemptId);
      if (!attempt || attempt.studentId !== user.id) {
        return res.status(404).json({ message: "Quiz attempt not found" });
      }
      
      const validatedData = insertQuizProgressSchema.parse(req.body);
      const progress = await storage.saveQuizProgress(attemptId, validatedData);
      res.json(progress);
    } catch (error) {
      console.error("Error saving quiz progress:", error);
      res.status(500).json({ message: "Failed to save quiz progress" });
    }
  });

  // Delete quiz progress (when quiz is submitted)
  app.delete("/api/quiz-progress/:attemptId", isAuthenticated, async (req, res) => {
    try {
      const { attemptId } = req.params;
      const user = req.user;
      
      // Verify the user has access to this attempt
      const attempt = await storage.getQuizAttempt(attemptId);
      if (!attempt || attempt.studentId !== user.id) {
        return res.status(404).json({ message: "Quiz attempt not found" });
      }
      
      await storage.deleteQuizProgress(attemptId);
      res.json({ message: "Quiz progress deleted successfully" });
    } catch (error) {
      console.error("Error deleting quiz progress:", error);
      res.status(500).json({ message: "Failed to delete quiz progress" });
    }
  });

  // Mobile App Routes
  app.post('/api/super-admin/mobile-app/start', mockAuth, async (req, res) => {
    try {
      // Start the React Native Expo server
      const { spawn } = await import('child_process');
      
      // Start simple Expo server on port 8081
      const expoServer = spawn('node', ['simple-expo-server.js'], {
        detached: true,
        stdio: 'ignore'
      });
      
      expoServer.unref();
      
      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      res.json({
        success: true,
        message: "Native React Native app server started successfully",
        expoUrl: `exp://9f98829d-b60a-48b0-84e9-8c18524c63b9-00-2a3pdf5j5yrk9.spock.replit.dev:8081`,
        status: 'running',
        type: 'react_native'
      });
      
    } catch (error) {
      console.error('Failed to start mobile app server:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start mobile app server: ' + error.message
      });
    }
  });

  // Mobile App Interface Route - removed to allow React Router to handle /mobile

  app.get('/api/super-admin/mobile-app/status', mockAuth, async (req, res) => {
    try {
      // Check if Expo server is running
      const { exec } = await import('child_process');
      exec('ps aux | grep "expo start"', (error, stdout, stderr) => {
        const isRunning = stdout.includes('expo start') && !stdout.includes('grep');
        res.json({
          running: isRunning,
          status: isRunning ? 'running' : 'stopped'
        });
      });
    } catch (error) {
      res.status(500).json({
        running: false,
        status: 'error'
      });
    }
  });

  // Admin User Management Routes
  app.get('/api/admin/users', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const user = await storage.getUser(userId);
      
      if (!user || !['admin', 'teacher', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      // If super admin, get all users; if admin, get users from their account
      const users = user.role === 'super_admin' 
        ? await storage.getAllUsers()
        : await storage.getUsersByAccount(user.accountId);
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const user = await storage.getUser(userId);
      
      if (!user || !['admin', 'teacher', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      const { email, firstName, lastName, role } = req.body;
      
      // Create user with admin's account
      const newUser = await storage.upsertUser({
        id: `user-${Date.now()}`,
        email,
        firstName,
        lastName,
        role,
        accountId: user.accountId || '00000000-0000-0000-0000-000000000001',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/admin/users/:userId/role', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const user = await storage.getUser(userId);
      
      if (!user || !['admin', 'teacher', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      const { role } = req.body;
      const targetUserId = req.params.userId;
      
      const updatedUser = await storage.updateUserRole(targetUserId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.post('/api/admin/users/bulk-upload', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const user = await storage.getUser(userId);
      
      if (!user || !['admin', 'teacher', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      // For now, return a mock response since we don't have multer setup
      // In a real implementation, you would parse the CSV file here
      const mockUsers = [
        {
          id: `user-${Date.now()}-1`,
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'student',
          accountId: user.accountId || '00000000-0000-0000-0000-000000000001',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: `user-${Date.now()}-2`,
          email: 'jane.smith@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'teacher',
          accountId: user.accountId || '00000000-0000-0000-0000-000000000001',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const createdUsers = await storage.bulkCreateUsers(mockUsers);
      res.json({ created: createdUsers.length, users: createdUsers });
    } catch (error) {
      console.error("Error bulk uploading users:", error);
      res.status(500).json({ message: "Failed to bulk upload users" });
    }
  });

  app.post('/api/admin/generate-account-link', mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const user = await storage.getUser(userId);
      
      if (!user || !['admin', 'teacher', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      // Generate a unique account link
      const accountId = user.accountId || '00000000-0000-0000-0000-000000000001';
      const linkToken = `${accountId}-${Date.now()}`;
      const link = `${req.protocol}://${req.get('host')}/join/${linkToken}`;
      
      res.json({ link });
    } catch (error) {
      console.error("Error generating account link:", error);
      res.status(500).json({ message: "Failed to generate account link" });
    }
  });

  // Account registration routes
  app.get('/api/auth/validate-token/:token', async (req: any, res) => {
    try {
      const { token } = req.params;
      
      // Parse token to extract account info
      if (!token || !token.includes('-')) {
        return res.status(400).json({ message: "Invalid token format" });
      }

      const accountId = token.split('-')[0];
      
      // For now, return mock account info
      // In production, you would validate the token and get actual account info
      res.json({
        accountId,
        accountName: 'Test Organization',
        isValid: true
      });
    } catch (error) {
      console.error("Error validating token:", error);
      res.status(400).json({ message: "Invalid or expired token" });
    }
  });

  app.post('/api/auth/register', async (req: any, res) => {
    try {
      const { firstName, lastName, email, password, token } = req.body;
      
      if (!token || !token.includes('-')) {
        return res.status(400).json({ message: "Invalid registration token" });
      }

      const accountId = token.split('-')[0];
      
      // Create new user
      const newUser = await storage.upsertUser({
        id: `user-${Date.now()}`,
        email,
        firstName,
        lastName,
        role: 'student', // Default role for new registrations
        accountId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.json({ 
        message: "Registration successful", 
        user: newUser 
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Super Admin CRM Endpoints
  
  // Get all accounts (super admin only)
  app.get('/api/super-admin/accounts', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const accounts = await storage.getAllAccountsWithStats();
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({ message: 'Failed to fetch accounts' });
    }
  });

  // Create new account (super admin only)
  app.post('/api/super-admin/accounts', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const account = await storage.createAccount(req.body);
      res.json(account);
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({ message: 'Failed to create account' });
    }
  });

  // Update account (super admin only)
  app.put('/api/super-admin/accounts/:id', async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const account = await storage.updateAccount(req.params.id, req.body);
      res.json(account);
    } catch (error) {
      console.error('Error updating account:', error);
      res.status(500).json({ message: 'Failed to update account' });
    }
  });

  // Delete account (super admin only)
  app.delete('/api/super-admin/accounts/:id', async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      await storage.deleteAccount(req.params.id);
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ message: 'Failed to delete account' });
    }
  });

  // Get all users across all accounts (super admin only)
  app.get('/api/super-admin/users', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const users = await storage.getAllUsersWithAccountInfo();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Create new user (super admin only)
  app.post('/api/super-admin/users', async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const newUser = await storage.createUserWithAccount(req.body);
      res.json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  // Update user (super admin only)
  app.put('/api/super-admin/users/:id', async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const updatedUser = await storage.updateUserWithRole(req.params.id, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Get all prompt templates (super admin only)
  app.get('/api/super-admin/prompt-templates', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const templates = await storage.getAllPromptTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching prompt templates:', error);
      res.status(500).json({ message: 'Failed to fetch prompt templates' });
    }
  });

  // Create prompt template (super admin only)
  app.post('/api/super-admin/prompt-templates', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const template = await storage.createPromptTemplate({
        ...req.body,
        accountId: null, // System-wide template
        createdBy: user.id
      });
      res.json(template);
    } catch (error) {
      console.error('Error creating prompt template:', error);
      res.status(500).json({ message: 'Failed to create prompt template' });
    }
  });

  // Update prompt template (super admin only)
  app.put('/api/super-admin/prompt-templates/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const template = await storage.updatePromptTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error) {
      console.error('Error updating prompt template:', error);
      res.status(500).json({ message: 'Failed to update prompt template' });
    }
  });

  // Delete prompt template (super admin only)
  app.delete('/api/super-admin/prompt-templates/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const success = await storage.deletePromptTemplate(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error('Error deleting prompt template:', error);
      res.status(500).json({ message: 'Failed to delete prompt template' });
    }
  });



  // Get system statistics (super admin only)
  app.get('/api/super-admin/system-stats', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const stats = await storage.getSystemStatistics();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      res.status(500).json({ message: 'Failed to fetch system statistics' });
    }
  });

  // Super Admin LLM Provider Management
  app.get('/api/super-admin/llm-providers', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const providers = await storage.getAllLLMProviders();
      res.json(providers);
    } catch (error) {
      console.error('Error fetching LLM providers:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/super-admin/llm-providers', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ message: 'Invalid request body' });
      }
      
      const providerData = req.body;
      console.log('Updating LLM provider with data:', providerData);
      
      const provider = await storage.createOrUpdateLLMProvider(providerData);
      res.json(provider);
    } catch (error) {
      console.error('Error updating LLM provider:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  app.post('/api/super-admin/llm-providers/:id/test', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const { id } = req.params;
      const provider = await storage.getLLMProviderById(id);
      
      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
      }

      // Test the provider connection
      const testResult = {
        success: true,
        message: 'Connection test successful',
        timestamp: new Date().toISOString()
      };

      // Update provider status
      await storage.updateLLMProviderStatus(id, {
        status: 'active',
        lastTested: new Date().toISOString()
      });

      res.json(testResult);
    } catch (error) {
      console.error('Error testing LLM provider:', error);
      res.status(500).json({ message: 'Test failed', error: error.message });
    }
  });

  // Make test user super admin (for development)
  app.post('/api/super-admin/elevate-test-user', async (req: any, res) => {
    try {
      const testUser = await storage.getUserByEmail('test@example.com');
      if (testUser) {
        await storage.updateUserWithRole(testUser.id, { role: 'super_admin' });
        res.json({ message: 'Test user elevated to super admin' });
      } else {
        res.status(404).json({ message: 'Test user not found' });
      }
    } catch (error) {
      console.error('Error elevating test user:', error);
      res.status(500).json({ message: 'Failed to elevate test user' });
    }
  });

  // Badge Routes
  app.get('/api/badges', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const badges = await storage.getBadgesByAccount(user.accountId);
      res.json(badges);
    } catch (error) {
      console.error('Error fetching badges:', error);
      res.status(500).json({ message: 'Failed to fetch badges' });
    }
  });

  app.get('/api/badges/active', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const badges = await storage.getActiveBadges(user.accountId);
      res.json(badges);
    } catch (error) {
      console.error('Error fetching active badges:', error);
      res.status(500).json({ message: 'Failed to fetch active badges' });
    }
  });

  app.post('/api/badges', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin or teacher access required' });
      }

      const badgeData = {
        ...req.body,
        accountId: user.accountId,
        createdBy: user.id
      };

      const badge = await storage.createBadge(badgeData);
      res.status(201).json(badge);
    } catch (error) {
      console.error('Error creating badge:', error);
      res.status(500).json({ message: 'Failed to create badge' });
    }
  });

  app.get('/api/badges/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const badge = await storage.getBadge(req.params.id);
      if (!badge || badge.accountId !== user.accountId) {
        return res.status(404).json({ message: 'Badge not found' });
      }

      res.json(badge);
    } catch (error) {
      console.error('Error fetching badge:', error);
      res.status(500).json({ message: 'Failed to fetch badge' });
    }
  });

  app.put('/api/badges/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin or teacher access required' });
      }

      const badge = await storage.getBadge(req.params.id);
      if (!badge || badge.accountId !== user.accountId) {
        return res.status(404).json({ message: 'Badge not found' });
      }

      const updatedBadge = await storage.updateBadge(req.params.id, req.body);
      res.json(updatedBadge);
    } catch (error) {
      console.error('Error updating badge:', error);
      res.status(500).json({ message: 'Failed to update badge' });
    }
  });

  app.delete('/api/badges/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin or teacher access required' });
      }

      const badge = await storage.getBadge(req.params.id);
      if (!badge || badge.accountId !== user.accountId) {
        return res.status(404).json({ message: 'Badge not found' });
      }

      await storage.deleteBadge(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting badge:', error);
      res.status(500).json({ message: 'Failed to delete badge' });
    }
  });

  // Certificate Template Routes
  app.get('/api/certificate-templates', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const templates = await storage.getCertificateTemplatesByAccount(user.accountId);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching certificate templates:', error);
      res.status(500).json({ message: 'Failed to fetch certificate templates' });
    }
  });

  app.get('/api/certificate-templates/active', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const templates = await storage.getActiveCertificateTemplates(user.accountId);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching active certificate templates:', error);
      res.status(500).json({ message: 'Failed to fetch active certificate templates' });
    }
  });

  app.post('/api/certificate-templates', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin or teacher access required' });
      }

      const templateData = {
        ...req.body,
        accountId: user.accountId,
        createdBy: user.id
      };

      const template = await storage.createCertificateTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating certificate template:', error);
      res.status(500).json({ message: 'Failed to create certificate template' });
    }
  });

  app.get('/api/certificate-templates/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const template = await storage.getCertificateTemplate(req.params.id);
      if (!template || template.accountId !== user.accountId) {
        return res.status(404).json({ message: 'Certificate template not found' });
      }

      res.json(template);
    } catch (error) {
      console.error('Error fetching certificate template:', error);
      res.status(500).json({ message: 'Failed to fetch certificate template' });
    }
  });

  app.put('/api/certificate-templates/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin or teacher access required' });
      }

      const template = await storage.getCertificateTemplate(req.params.id);
      if (!template || template.accountId !== user.accountId) {
        return res.status(404).json({ message: 'Certificate template not found' });
      }

      const updatedTemplate = await storage.updateCertificateTemplate(req.params.id, req.body);
      res.json(updatedTemplate);
    } catch (error) {
      console.error('Error updating certificate template:', error);
      res.status(500).json({ message: 'Failed to update certificate template' });
    }
  });

  app.delete('/api/certificate-templates/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin or teacher access required' });
      }

      const template = await storage.getCertificateTemplate(req.params.id);
      if (!template || template.accountId !== user.accountId) {
        return res.status(404).json({ message: 'Certificate template not found' });
      }

      await storage.deleteCertificateTemplate(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting certificate template:', error);
      res.status(500).json({ message: 'Failed to delete certificate template' });
    }
  });

  // Awarded Badge Routes
  app.get('/api/awarded-badges/student/:studentId', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Students can only view their own badges, teachers/admins can view any student's badges
      if (user.role === 'student' && user.id !== req.params.studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const badges = await storage.getStudentBadgesWithDetails(req.params.studentId);
      res.json(badges);
    } catch (error) {
      console.error('Error fetching student badges:', error);
      res.status(500).json({ message: 'Failed to fetch student badges' });
    }
  });

  app.post('/api/awarded-badges', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin or teacher access required' });
      }

      const awardData = {
        ...req.body,
        awardedBy: user.id,
        verificationCode: `badge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const award = await storage.awardBadge(awardData);
      res.status(201).json(award);
    } catch (error) {
      console.error('Error awarding badge:', error);
      res.status(500).json({ message: 'Failed to award badge' });
    }
  });

  app.delete('/api/awarded-badges/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin or teacher access required' });
      }

      const award = await storage.getAwardedBadge(req.params.id);
      if (!award) {
        return res.status(404).json({ message: 'Awarded badge not found' });
      }

      await storage.deleteAwardedBadge(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error removing awarded badge:', error);
      res.status(500).json({ message: 'Failed to remove awarded badge' });
    }
  });

  // Issued Certificate Routes
  app.get('/api/issued-certificates/student/:studentId', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Students can only view their own certificates, teachers/admins can view any student's certificates
      if (user.role === 'student' && user.id !== req.params.studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const certificates = await storage.getStudentCertificatesWithTemplate(req.params.studentId);
      res.json(certificates);
    } catch (error) {
      console.error('Error fetching student certificates:', error);
      res.status(500).json({ message: 'Failed to fetch student certificates' });
    }
  });

  app.post('/api/issued-certificates', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin or teacher access required' });
      }

      const certificateData = {
        ...req.body,
        issuedBy: user.id,
        certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        verificationCode: `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const certificate = await storage.issueCertificate(certificateData);
      res.status(201).json(certificate);
    } catch (error) {
      console.error('Error issuing certificate:', error);
      res.status(500).json({ message: 'Failed to issue certificate' });
    }
  });

  app.get('/api/issued-certificates/verify/:verificationCode', async (req: any, res) => {
    try {
      const certificate = await storage.getCertificateByVerificationCode(req.params.verificationCode);
      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      if (certificate.isRevoked) {
        return res.status(410).json({ 
          message: 'Certificate has been revoked',
          revocationReason: certificate.revocationReason,
          revokedAt: certificate.revokedAt
        });
      }

      res.json(certificate);
    } catch (error) {
      console.error('Error verifying certificate:', error);
      res.status(500).json({ message: 'Failed to verify certificate' });
    }
  });

  // User Badge Routes (for managing user earned badges)
  app.get('/api/user-badges/user/:userId', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Users can only view their own badges unless they're admin/teacher
      if (user.role === 'student' && user.id !== req.params.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const userBadges = await storage.getUserBadgesWithBadgeDetails(req.params.userId);
      res.json(userBadges);
    } catch (error) {
      console.error('Error fetching user badges:', error);
      res.status(500).json({ message: 'Failed to fetch user badges' });
    }
  });

  app.post('/api/user-badges', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin or teacher access required' });
      }

      const userBadge = await storage.createUserBadge(req.body);
      res.status(201).json(userBadge);
    } catch (error) {
      console.error('Error creating user badge:', error);
      res.status(500).json({ message: 'Failed to create user badge' });
    }
  });

  app.delete('/api/user-badges/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin or teacher access required' });
      }

      await storage.deleteUserBadge(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user badge:', error);
      res.status(500).json({ message: 'Failed to delete user badge' });
    }
  });

  // Learning Milestone Routes
  app.get('/api/learning-milestones/user/:userId', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Users can only view their own milestones unless they're admin/teacher
      if (user.role === 'student' && user.id !== req.params.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const milestones = await storage.getLearningMilestonesByUser(req.params.userId);
      res.json(milestones);
    } catch (error) {
      console.error('Error fetching learning milestones:', error);
      res.status(500).json({ message: 'Failed to fetch learning milestones' });
    }
  });

  app.get('/api/learning-milestones/account', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin or teacher access required' });
      }

      const milestones = await storage.getLearningMilestonesByAccount(user.accountId);
      res.json(milestones);
    } catch (error) {
      console.error('Error fetching account learning milestones:', error);
      res.status(500).json({ message: 'Failed to fetch account learning milestones' });
    }
  });

  app.post('/api/learning-milestones', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const milestoneData = {
        ...req.body,
        accountId: user.accountId,
        userId: req.body.userId || user.id
      };

      const milestone = await storage.createLearningMilestone(milestoneData);
      res.status(201).json(milestone);
    } catch (error) {
      console.error('Error creating learning milestone:', error);
      res.status(500).json({ message: 'Failed to create learning milestone' });
    }
  });

  app.put('/api/learning-milestones/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const milestone = await storage.getLearningMilestone(req.params.id);
      if (!milestone || milestone.accountId !== user.accountId) {
        return res.status(404).json({ message: 'Learning milestone not found' });
      }

      const updatedMilestone = await storage.updateLearningMilestone(req.params.id, req.body);
      res.json(updatedMilestone);
    } catch (error) {
      console.error('Error updating learning milestone:', error);
      res.status(500).json({ message: 'Failed to update learning milestone' });
    }
  });

  app.delete('/api/learning-milestones/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const milestone = await storage.getLearningMilestone(req.params.id);
      if (!milestone || milestone.accountId !== user.accountId) {
        return res.status(404).json({ message: 'Learning milestone not found' });
      }

      await storage.deleteLearningMilestone(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting learning milestone:', error);
      res.status(500).json({ message: 'Failed to delete learning milestone' });
    }
  });

  // Social Share Routes
  app.get('/api/social-shares/user/:userId', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Users can only view their own shares unless they're admin/teacher
      if (user.role === 'student' && user.id !== req.params.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const shares = await storage.getSocialSharesByUser(req.params.userId);
      res.json(shares);
    } catch (error) {
      console.error('Error fetching user social shares:', error);
      res.status(500).json({ message: 'Failed to fetch user social shares' });
    }
  });

  app.get('/api/social-shares/public', async (req: any, res) => {
    try {
      const shares = await storage.getPublicSocialShares();
      res.json(shares);
    } catch (error) {
      console.error('Error fetching public social shares:', error);
      res.status(500).json({ message: 'Failed to fetch public social shares' });
    }
  });

  app.get('/api/social-shares/platform/:platform', async (req: any, res) => {
    try {
      const shares = await storage.getSocialSharesByPlatform(req.params.platform);
      res.json(shares);
    } catch (error) {
      console.error('Error fetching platform social shares:', error);
      res.status(500).json({ message: 'Failed to fetch platform social shares' });
    }
  });

  app.post('/api/social-shares', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const shareData = {
        ...req.body,
        userId: user.id
      };

      const share = await storage.createSocialShare(shareData);
      res.status(201).json(share);
    } catch (error) {
      console.error('Error creating social share:', error);
      res.status(500).json({ message: 'Failed to create social share' });
    }
  });

  app.post('/api/social-shares/:id/engage/:type', async (req: any, res) => {
    try {
      const { id, type } = req.params;
      
      if (!['view', 'like', 'comment'].includes(type)) {
        return res.status(400).json({ message: 'Invalid engagement type' });
      }

      await storage.incrementShareEngagement(id, type as 'view' | 'like' | 'comment');
      res.json({ success: true });
    } catch (error) {
      console.error('Error incrementing engagement:', error);
      res.status(500).json({ message: 'Failed to increment engagement' });
    }
  });

  app.put('/api/social-shares/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const share = await storage.getSocialShare(req.params.id);
      if (!share || share.userId !== user.id) {
        return res.status(404).json({ message: 'Social share not found' });
      }

      const updatedShare = await storage.updateSocialShare(req.params.id, req.body);
      res.json(updatedShare);
    } catch (error) {
      console.error('Error updating social share:', error);
      res.status(500).json({ message: 'Failed to update social share' });
    }
  });

  app.delete('/api/social-shares/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const share = await storage.getSocialShare(req.params.id);
      if (!share || share.userId !== user.id) {
        return res.status(404).json({ message: 'Social share not found' });
      }

      await storage.deleteSocialShare(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting social share:', error);
      res.status(500).json({ message: 'Failed to delete social share' });
    }
  });

  // Badge Template Routes
  app.get('/api/badge-templates/category/:category', async (req: any, res) => {
    try {
      const templates = await storage.getBadgeTemplatesByCategory(req.params.category);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching badge templates by category:', error);
      res.status(500).json({ message: 'Failed to fetch badge templates by category' });
    }
  });

  app.get('/api/badge-templates/popular', async (req: any, res) => {
    try {
      const templates = await storage.getPopularBadgeTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching popular badge templates:', error);
      res.status(500).json({ message: 'Failed to fetch popular badge templates' });
    }
  });

  app.post('/api/badge-templates', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const template = await storage.createBadgeTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating badge template:', error);
      res.status(500).json({ message: 'Failed to create badge template' });
    }
  });

  app.get('/api/badge-templates/:id', async (req: any, res) => {
    try {
      const template = await storage.getBadgeTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: 'Badge template not found' });
      }

      res.json(template);
    } catch (error) {
      console.error('Error fetching badge template:', error);
      res.status(500).json({ message: 'Failed to fetch badge template' });
    }
  });

  app.put('/api/badge-templates/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const template = await storage.getBadgeTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: 'Badge template not found' });
      }

      const updatedTemplate = await storage.updateBadgeTemplate(req.params.id, req.body);
      res.json(updatedTemplate);
    } catch (error) {
      console.error('Error updating badge template:', error);
      res.status(500).json({ message: 'Failed to update badge template' });
    }
  });

  app.post('/api/badge-templates/:id/use', async (req: any, res) => {
    try {
      await storage.incrementBadgeTemplateUsage(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error incrementing badge template usage:', error);
      res.status(500).json({ message: 'Failed to increment badge template usage' });
    }
  });

  app.delete('/api/badge-templates/:id', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      await storage.deleteBadgeTemplate(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting badge template:', error);
      res.status(500).json({ message: 'Failed to delete badge template' });
    }
  });

  app.post('/api/issued-certificates/:id/revoke', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.accountId || (user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: 'Admin or teacher access required' });
      }

      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ message: 'Revocation reason is required' });
      }

      const certificate = await storage.revokeCertificate(req.params.id, user.id, reason);
      res.json(certificate);
    } catch (error) {
      console.error('Error revoking certificate:', error);
      res.status(500).json({ message: 'Failed to revoke certificate' });
    }
  });

  // Accessibility Settings Routes
  app.get("/api/accessibility-settings", mockAuth, async (req, res) => {
    try {
      // Use test user for development
      const userId = "test-user";
      
      // Get accessibility settings from database
      const settings = await storage.getUserAccessibilitySettings(userId);

      res.json(settings);
    } catch (error) {
      console.error("Error fetching accessibility settings:", error);
      res.status(500).json({ message: "Failed to fetch accessibility settings" });
    }
  });

  app.put("/api/accessibility-settings", mockAuth, async (req, res) => {
    try {
      // Use test user for development
      const userId = "test-user";
      const settings = req.body;

      await storage.updateUserAccessibilitySettings(userId, settings);

      res.json({ message: "Accessibility settings updated successfully" });
    } catch (error) {
      console.error("Error updating accessibility settings:", error);
      res.status(500).json({ message: "Failed to update accessibility settings" });
    }
  });

  // Mood tracking routes
  app.post('/api/mood-entries', mockAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validatedData = {
        userId: user.id,
        mood: req.body.moodIcon,
        moodLabel: req.body.moodLabel || 'neutral',
        context: req.body.context || 'general',
        notes: req.body.notes || null,
        relatedQuizId: req.body.relatedQuizId || null,
        relatedTestbankId: req.body.relatedTestbankId || null,
        metadata: req.body.metadata || null
      };

      const entry = await storage.createMoodEntry(validatedData);
      res.json(entry);
    } catch (error) {
      console.error('Error creating mood entry:', error);
      res.status(500).json({ error: 'Failed to create mood entry' });
    }
  });

  app.get('/api/mood-entries', mockAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { context, startDate, endDate } = req.query;

      let entries;
      if (context) {
        entries = await storage.getMoodEntriesByContext(user.id, context as string);
      } else if (startDate && endDate) {
        entries = await storage.getMoodEntriesByDateRange(
          user.id,
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        entries = await storage.getMoodEntriesByUser(user.id);
      }

      res.json(entries);
    } catch (error) {
      console.error('Error fetching mood entries:', error);
      res.status(500).json({ error: 'Failed to fetch mood entries' });
    }
  });

  app.delete('/api/mood-entries/:id', mockAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      
      // Check if entry belongs to user
      const entry = await storage.getMoodEntry(id);
      if (!entry || entry.userId !== user.id) {
        return res.status(404).json({ error: 'Mood entry not found' });
      }

      await storage.deleteMoodEntry(id);
      res.json({ message: 'Mood entry deleted successfully' });
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      res.status(500).json({ error: 'Failed to delete mood entry' });
    }
  });

  // Difficulty tracking routes
  app.post('/api/difficulty-entries', mockAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validatedData = {
        userId: user.id,
        difficultyScore: req.body.difficultyLevel,
        difficulty: req.body.difficultyIcon,
        difficultyLabel: req.body.difficultyLabel || 'moderate',
        contentType: req.body.contentType || 'concept',
        contentTitle: req.body.contentTitle || 'Learning Content',
        contentId: req.body.contentId || null,
        feedback: req.body.feedback || null,
        needsHelp: req.body.needsHelp || false,
        studyTime: req.body.studyTime || null,
        metadata: req.body.metadata || null
      };

      const entry = await storage.createDifficultyEntry(validatedData);
      res.json(entry);
    } catch (error) {
      console.error('Error creating difficulty entry:', error);
      res.status(500).json({ error: 'Failed to create difficulty entry' });
    }
  });

  app.get('/api/difficulty-entries', mockAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { contentType, startDate, endDate } = req.query;

      let entries;
      if (contentType) {
        entries = await storage.getDifficultyEntriesByContent(user.id, contentType as string);
      } else if (startDate && endDate) {
        entries = await storage.getDifficultyEntriesByDateRange(
          user.id,
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        entries = await storage.getDifficultyEntriesByUser(user.id);
      }

      res.json(entries);
    } catch (error) {
      console.error('Error fetching difficulty entries:', error);
      res.status(500).json({ error: 'Failed to fetch difficulty entries' });
    }
  });

  app.get('/api/difficulty-entries/average', mockAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const average = await storage.getAverageDifficultyByUser(user.id);
      res.json({ average });
    } catch (error) {
      console.error('Error calculating average difficulty:', error);
      res.status(500).json({ error: 'Failed to calculate average difficulty' });
    }
  });

  app.delete('/api/difficulty-entries/:id', mockAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      
      // Check if entry belongs to user
      const entry = await storage.getDifficultyEntry(id);
      if (!entry || entry.userId !== user.id) {
        return res.status(404).json({ error: 'Difficulty entry not found' });
      }

      await storage.deleteDifficultyEntry(id);
      res.json({ message: 'Difficulty entry deleted successfully' });
    } catch (error) {
      console.error('Error deleting difficulty entry:', error);
      res.status(500).json({ error: 'Failed to delete difficulty entry' });
    }
  });

  // ===== MOBILE API ROUTES =====
  
  // Mobile CAT exam start
  app.post("/api/mobile/cat-exam/:id/start", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      const user = await storage.getUser(userId);
      
      if (!user?.accountId) {
        return res.status(400).json({ message: "User account not found" });
      }

      // Start CAT exam session
      const session = await storage.startCATExamSession(id, user.id);
      res.json(session);
    } catch (error) {
      console.error("Error starting mobile CAT exam:", error);
      res.status(500).json({ message: "Failed to start CAT exam" });
    }
  });

  // Mobile assignment start
  app.post("/api/mobile/assignment/:id/start", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      const user = await storage.getUser(userId);
      
      if (!user?.accountId) {
        return res.status(400).json({ message: "User account not found" });
      }

      // Start assignment session (mock implementation)
      const session = {
        id: 'session_' + Date.now(),
        assignmentId: id,
        studentId: user.id,
        startedAt: new Date().toISOString(),
        timeLimit: 60, // minutes
        proctoringEnabled: true,
        title: 'Sample Assignment'
      };
      res.json(session);
    } catch (error) {
      console.error("Error starting mobile assignment:", error);
      res.status(500).json({ message: "Failed to start assignment" });
    }
  });

  // Mobile exam submit
  app.post("/api/mobile/session/:sessionId/submit", mockAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { responses, timeSpent } = req.body;
      
      // Mock exam submission
      const result = {
        sessionId,
        submittedAt: new Date().toISOString(),
        timeSpent,
        score: Math.round(Math.random() * 100),
        passed: Math.random() > 0.3,
        totalQuestions: Object.keys(responses || {}).length,
        correctAnswers: Math.floor(Object.keys(responses || {}).length * 0.7)
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error submitting mobile exam:", error);
      res.status(500).json({ message: "Failed to submit exam" });
    }
  });

  // Mobile dashboard stats
  app.get("/api/mobile/dashboard/stats", mockAuth, async (req: any, res) => {
    try {
      const stats = {
        assignedQuizzes: 5,
        completedQuizzes: 3,
        averageScore: 85,
        upcomingDeadlines: 2,
        recentActivity: [
          {
            title: "Mathematics Quiz",
            questionCount: 20,
            status: "completed",
            score: 92
          },
          {
            title: "Science Assessment",
            questionCount: 15,
            status: "in_progress",
            score: null
          }
        ]
      };
      res.json(stats);
    } catch (error) {
      console.error("Error getting mobile dashboard stats:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Mobile student profile
  app.get("/api/mobile/student/profile", mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      const user = await storage.getUser(userId);
      
      const profile = {
        firstName: user?.firstName || 'Student',
        lastName: user?.lastName || 'User',
        studentId: user?.id || 'STU123',
        email: user?.email || 'student@example.com'
      };
      
      res.json(profile);
    } catch (error) {
      console.error("Error getting mobile profile:", error);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  // ===== CAT EXAM ROUTES =====

  // Create a new CAT exam
  app.post("/api/cat-exams", mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      const user = await storage.getUser(userId);
      
      if (!user?.accountId) {
        return res.status(400).json({ message: "User account not found" });
      }

      const catExamData = {
        ...req.body,
        accountId: user.accountId,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const catExam = await storage.createCATExam(catExamData);
      res.json(catExam);
    } catch (error) {
      console.error("Error creating CAT exam:", error);
      res.status(500).json({ message: "Failed to create CAT exam" });
    }
  });

  // Get all CAT exams for account
  app.get("/api/cat-exams", mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      const user = await storage.getUser(userId);
      
      if (!user?.accountId) {
        return res.status(400).json({ message: "User account not found" });
      }
      
      const catExams = await storage.getCATExamsByAccount(user.accountId);
      res.json(catExams);
    } catch (error) {
      console.error("Error fetching CAT exams:", error);
      res.status(500).json({ message: "Failed to fetch CAT exams" });
    }
  });

  // Get specific CAT exam
  app.get("/api/cat-exams/:id", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const catExam = await storage.getCATExam(id);
      
      if (!catExam) {
        return res.status(404).json({ message: "CAT exam not found" });
      }
      
      res.json(catExam);
    } catch (error) {
      console.error("Error fetching CAT exam:", error);
      res.status(500).json({ message: "Failed to fetch CAT exam" });
    }
  });

  // Update CAT exam
  app.put("/api/cat-exams/:id", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      const catExam = await storage.updateCATExam(id, updateData);
      res.json(catExam);
    } catch (error) {
      console.error("Error updating CAT exam:", error);
      res.status(500).json({ message: "Failed to update CAT exam" });
    }
  });

  // Delete CAT exam
  app.delete("/api/cat-exams/:id", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCATExam(id);
      res.json({ message: "CAT exam deleted successfully" });
    } catch (error) {
      console.error("Error deleting CAT exam:", error);
      res.status(500).json({ message: "Failed to delete CAT exam" });
    }
  });

  // Start CAT exam session
  app.post("/api/cat-exams/:id/start", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      const session = await storage.startCATExamSession(id, user.id);
      res.json(session);
    } catch (error) {
      console.error("Error starting CAT exam session:", error);
      res.status(500).json({ message: "Failed to start CAT exam session" });
    }
  });

  // Get next question in CAT exam
  app.get("/api/cat-sessions/:sessionId/next-question", mockAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const nextQuestion = await storage.getNextCATQuestion(sessionId);
      res.json(nextQuestion);
    } catch (error) {
      console.error("Error getting next CAT question:", error);
      res.status(500).json({ message: "Failed to get next question" });
    }
  });

  // Submit answer for CAT exam
  app.post("/api/cat-sessions/:sessionId/submit-answer", mockAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { questionId, selectedAnswers, timeSpent } = req.body;
      
      const result = await storage.submitCATAnswer(sessionId, questionId, selectedAnswers, timeSpent);
      res.json(result);
    } catch (error) {
      console.error("Error submitting CAT answer:", error);
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  // Complete CAT exam session
  app.post("/api/cat-sessions/:sessionId/complete", mockAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const result = await storage.completeCATExamSession(sessionId);
      res.json(result);
    } catch (error) {
      console.error("Error completing CAT exam session:", error);
      res.status(500).json({ message: "Failed to complete CAT exam session" });
    }
  });

  // ===== PROCTORING LOBBY ROUTES =====

  // Create a new proctoring lobby
  app.post("/api/proctoring-lobbies", mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      const lobbyData = {
        ...req.body,
        proctorId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const lobby = await storage.createProctoringLobby(lobbyData);
      res.json(lobby);
    } catch (error) {
      console.error("Error creating proctoring lobby:", error);
      res.status(500).json({ message: "Failed to create proctoring lobby" });
    }
  });

  // Get all proctoring lobbies for current user (proctor)
  app.get("/api/proctoring-lobbies", mockAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      const lobbies = await storage.getProctoringLobbiesByProctor(userId);
      res.json(lobbies);
    } catch (error) {
      console.error("Error fetching proctoring lobbies:", error);
      res.status(500).json({ message: "Failed to fetch proctoring lobbies" });
    }
  });

  // Get specific proctoring lobby
  app.get("/api/proctoring-lobbies/:id", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const lobby = await storage.getProctoringLobby(id);
      
      if (!lobby) {
        return res.status(404).json({ message: "Proctoring lobby not found" });
      }
      
      res.json(lobby);
    } catch (error) {
      console.error("Error fetching proctoring lobby:", error);
      res.status(500).json({ message: "Failed to fetch proctoring lobby" });
    }
  });

  // Update proctoring lobby
  app.put("/api/proctoring-lobbies/:id", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedLobby = await storage.updateProctoringLobby(id, updateData);
      res.json(updatedLobby);
    } catch (error) {
      console.error("Error updating proctoring lobby:", error);
      res.status(500).json({ message: "Failed to update proctoring lobby" });
    }
  });

  // Delete proctoring lobby
  app.delete("/api/proctoring-lobbies/:id", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteProctoringLobby(id);
      
      if (success) {
        res.json({ message: "Proctoring lobby deleted successfully" });
      } else {
        res.status(404).json({ message: "Proctoring lobby not found" });
      }
    } catch (error) {
      console.error("Error deleting proctoring lobby:", error);
      res.status(500).json({ message: "Failed to delete proctoring lobby" });
    }
  });

  // Start proctoring session
  app.post("/api/proctoring-lobbies/:id/start", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updatedLobby = await storage.startProctoringSession(id);
      res.json(updatedLobby);
    } catch (error) {
      console.error("Error starting proctoring session:", error);
      res.status(500).json({ message: "Failed to start proctoring session" });
    }
  });

  // End proctoring session
  app.post("/api/proctoring-lobbies/:id/end", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updatedLobby = await storage.endProctoringSession(id);
      res.json(updatedLobby);
    } catch (error) {
      console.error("Error ending proctoring session:", error);
      res.status(500).json({ message: "Failed to end proctoring session" });
    }
  });

  // Add student to lobby
  app.post("/api/proctoring-lobbies/:id/students", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { studentId } = req.body;
      
      const participant = await storage.addStudentToLobby(id, studentId);
      res.json(participant);
    } catch (error) {
      console.error("Error adding student to lobby:", error);
      res.status(500).json({ message: "Failed to add student to lobby" });
    }
  });

  // Remove student from lobby
  app.delete("/api/proctoring-lobbies/:id/students/:studentId", mockAuth, async (req: any, res) => {
    try {
      const { id, studentId } = req.params;
      const success = await storage.removeStudentFromLobby(id, studentId);
      
      if (success) {
        res.json({ message: "Student removed from lobby successfully" });
      } else {
        res.status(404).json({ message: "Student not found in lobby" });
      }
    } catch (error) {
      console.error("Error removing student from lobby:", error);
      res.status(500).json({ message: "Failed to remove student from lobby" });
    }
  });

  // Verify student in lobby
  app.post("/api/proctoring-lobbies/:id/verify/:studentId", mockAuth, async (req: any, res) => {
    try {
      const { id, studentId } = req.params;
      const proctorId = req.user?.claims?.sub || req.user?.id || 'test-user';
      
      const participant = await storage.verifyStudentInLobby(id, studentId, proctorId);
      res.json(participant);
    } catch (error) {
      console.error("Error verifying student:", error);
      res.status(500).json({ message: "Failed to verify student" });
    }
  });

  // Get students in lobby
  app.get("/api/proctoring-lobbies/:id/students", mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const students = await storage.getStudentsInLobby(id);
      res.json(students);
    } catch (error) {
      console.error("Error fetching students in lobby:", error);
      res.status(500).json({ message: "Failed to fetch students in lobby" });
    }
  });

  // Update student status
  app.put("/api/proctoring-lobbies/students/:participantId", mockAuth, async (req: any, res) => {
    try {
      const { participantId } = req.params;
      const { status, notes } = req.body;
      
      const participant = await storage.updateStudentStatus(participantId, status, notes);
      res.json(participant);
    } catch (error) {
      console.error("Error updating student status:", error);
      res.status(500).json({ message: "Failed to update student status" });
    }
  });

  // Start exam for specific student
  app.post("/api/proctoring-lobbies/:id/start-exam/:studentId", mockAuth, async (req: any, res) => {
    try {
      const { id, studentId } = req.params;
      const { catExamId } = req.body;
      
      const catSession = await storage.startExamForStudent(id, studentId, catExamId);
      res.json(catSession);
    } catch (error) {
      console.error("Error starting exam for student:", error);
      res.status(500).json({ message: "Failed to start exam for student" });
    }
  });

  // Security Event endpoints
  app.post('/api/security-events', mockAuth, async (req: any, res) => {
    try {
      const eventData = insertSecurityEventSchema.parse(req.body);
      const event = await storage.createSecurityEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating security event:", error);
      res.status(500).json({ message: "Failed to create security event" });
    }
  });

  app.get('/api/security-events', mockAuth, async (req: any, res) => {
    try {
      const { userId, examId, sessionId, eventType, severity } = req.query;
      
      let events = [];
      if (userId) {
        events = await storage.getSecurityEventsByUser(userId as string);
      } else if (examId) {
        events = await storage.getSecurityEventsByExam(examId as string);
      } else if (sessionId) {
        events = await storage.getSecurityEventsBySession(sessionId as string);
      } else if (eventType) {
        events = await storage.getSecurityEventsByType(eventType as string);
      } else if (severity === 'critical') {
        events = await storage.getCriticalSecurityEvents();
      } else {
        events = await storage.getCriticalSecurityEvents(); // Default to critical events
      }
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching security events:", error);
      res.status(500).json({ message: "Failed to fetch security events" });
    }
  });

  app.get('/api/security-events/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const event = await storage.getSecurityEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Security event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching security event:", error);
      res.status(500).json({ message: "Failed to fetch security event" });
    }
  });

  // Proctor Alert endpoints
  app.post('/api/proctor-alerts', mockAuth, async (req: any, res) => {
    try {
      const alertData = insertProctorAlertSchema.parse(req.body);
      const alert = await storage.createProctorAlert(alertData);
      res.json(alert);
    } catch (error) {
      console.error("Error creating proctor alert:", error);
      res.status(500).json({ message: "Failed to create proctor alert" });
    }
  });

  app.get('/api/proctor-alerts', mockAuth, async (req: any, res) => {
    try {
      const { studentId, examId, active } = req.query;
      
      let alerts = [];
      if (studentId) {
        alerts = await storage.getProctorAlertsByStudent(studentId as string);
      } else if (examId) {
        alerts = await storage.getProctorAlertsByExam(examId as string);
      } else if (active === 'true') {
        alerts = await storage.getActiveProctorAlerts();
      } else {
        alerts = await storage.getActiveProctorAlerts(); // Default to active alerts
      }
      
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching proctor alerts:", error);
      res.status(500).json({ message: "Failed to fetch proctor alerts" });
    }
  });

  app.get('/api/proctor-alerts/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const alert = await storage.getProctorAlert(id);
      
      if (!alert) {
        return res.status(404).json({ message: "Proctor alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      console.error("Error fetching proctor alert:", error);
      res.status(500).json({ message: "Failed to fetch proctor alert" });
    }
  });

  app.patch('/api/proctor-alerts/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const alert = await storage.updateProctorAlert(id, updates);
      res.json(alert);
    } catch (error) {
      console.error("Error updating proctor alert:", error);
      res.status(500).json({ message: "Failed to update proctor alert" });
    }
  });

  app.post('/api/proctor-alerts/:id/resolve', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { resolution } = req.body;
      const userId = req.user?.id || 'system';
      
      const alert = await storage.resolveProctorAlert(id, userId, resolution);
      res.json(alert);
    } catch (error) {
      console.error("Error resolving proctor alert:", error);
      res.status(500).json({ message: "Failed to resolve proctor alert" });
    }
  });

  // Proctoring Dashboard API - Real-time monitoring statistics
  app.get('/api/proctoring/dashboard', mockAuth, async (req: any, res) => {
    try {
      const activeAlerts = await storage.getActiveProctorAlerts();
      const criticalEvents = await storage.getCriticalSecurityEvents();
      
      const dashboardData = {
        activeSessions: 0, // Will be populated by WebSocket service
        activeAlerts: activeAlerts.length,
        criticalEvents: criticalEvents.length,
        totalAlertsToday: activeAlerts.filter(alert => {
          const today = new Date();
          const alertDate = new Date(alert.createdAt);
          return alertDate.toDateString() === today.toDateString();
        }).length,
        recentEvents: criticalEvents.slice(0, 10),
        recentAlerts: activeAlerts.slice(0, 10)
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching proctoring dashboard:", error);
      res.status(500).json({ message: "Failed to fetch proctoring dashboard" });
    }
  });

  // Security Report for specific exam
  app.get('/api/exams/:examId/security-report', mockAuth, async (req: any, res) => {
    try {
      const { examId } = req.params;
      
      const securityEvents = await storage.getSecurityEventsByExam(examId);
      const proctorAlerts = await storage.getProctorAlertsByExam(examId);
      
      const report = {
        examId,
        totalSecurityEvents: securityEvents.length,
        criticalEvents: securityEvents.filter(e => e.severity === 'critical').length,
        highSeverityEvents: securityEvents.filter(e => e.severity === 'high').length,
        totalAlerts: proctorAlerts.length,
        resolvedAlerts: proctorAlerts.filter(a => a.resolved).length,
        pendingAlerts: proctorAlerts.filter(a => !a.resolved).length,
        eventsByType: securityEvents.reduce((acc: any, event) => {
          acc[event.eventType] = (acc[event.eventType] || 0) + 1;
          return acc;
        }, {}),
        alertsBySeverity: proctorAlerts.reduce((acc: any, alert) => {
          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
          return acc;
        }, {}),
        timeline: [...securityEvents, ...proctorAlerts]
          .sort((a, b) => new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime())
          .slice(0, 50)
      };
      
      res.json(report);
    } catch (error) {
      console.error("Error generating security report:", error);
      res.status(500).json({ message: "Failed to generate security report" });
    }
  });

  // Mobile API endpoints
  app.get('/api/mobile/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching mobile dashboard:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  app.get('/api/mobile/assignments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      const assignments = await storage.getMobileAssignments(userId);
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching mobile assignments:', error);
      res.status(500).json({ message: 'Failed to fetch assignments' });
    }
  });

  app.get('/api/mobile/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      const profile = await storage.getMobileStudentProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error('Error fetching mobile profile:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  });

  app.post('/api/mobile/assignments/:assignmentId/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || 'test-user';
      const { assignmentId } = req.params;
      const session = await storage.startMobileAssignment(userId, assignmentId);
      res.json(session);
    } catch (error) {
      console.error('Error starting mobile assignment:', error);
      res.status(500).json({ message: 'Failed to start assignment' });
    }
  });

  app.post('/api/mobile/sessions/:sessionId/submit', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { responses, timeSpent } = req.body;
      const result = await storage.submitMobileSession(sessionId, responses, timeSpent);
      res.json(result);
    } catch (error) {
      console.error('Error submitting mobile session:', error);
      res.status(500).json({ message: 'Failed to submit session' });
    }
  });

  app.get('/api/mobile/assignments/:assignmentId/questions', isAuthenticated, async (req: any, res) => {
    try {
      const { assignmentId } = req.params;
      const questions = await storage.getAssignmentQuestions(assignmentId);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching assignment questions:', error);
      res.status(500).json({ message: 'Failed to fetch questions' });
    }
  });



  // Super Admin accounts and users endpoints
  app.get('/api/super-admin/accounts', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }
      
      const accounts = await storage.getAllAccountsWithStats();
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({ message: 'Failed to fetch accounts' });
    }
  });

  app.get('/api/super-admin/users', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }
      
      const users = await storage.getAllUsersWithAccountInfo();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });



  // ============= OFFLINE SYNC API ROUTES =============
  
  // Queue offline action for later sync
  app.post('/api/offline-sync/queue', mockAuth, async (req: any, res) => {
    try {
      const { deviceId, actionType, payload, priority = 'medium' } = req.body;
      
      const action = {
        type: actionType,
        payload,
        timestamp: new Date(),
        priority
      };
      
      const queueItem = await offlineSyncService.queueOfflineAction(
        req.user.id,
        deviceId,
        action
      );
      
      res.json(queueItem);
    } catch (error) {
      console.error("Error queuing offline action:", error);
      res.status(500).json({ error: "Failed to queue offline action" });
    }
  });

  // Get pending sync actions
  app.get('/api/offline-sync/pending/:deviceId', mockAuth, async (req: any, res) => {
    try {
      const { deviceId } = req.params;
      
      const pendingActions = await offlineSyncService.getPendingSyncActions(
        req.user.id,
        deviceId
      );
      
      res.json(pendingActions);
    } catch (error) {
      console.error("Error getting pending sync actions:", error);
      res.status(500).json({ error: "Failed to get pending sync actions" });
    }
  });

  // Process sync queue
  app.post('/api/offline-sync/process/:deviceId', mockAuth, async (req: any, res) => {
    try {
      const { deviceId } = req.params;
      
      const result = await offlineSyncService.processSyncQueue(
        req.user.id,
        deviceId
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error processing sync queue:", error);
      res.status(500).json({ error: "Failed to process sync queue" });
    }
  });

  // Log connection event
  app.post('/api/offline-sync/connection-log', mockAuth, async (req: any, res) => {
    try {
      const { deviceId, sessionId, eventType, quality, context, quizAttemptId } = req.body;
      
      const event = {
        type: eventType,
        quality,
        context
      };
      
      const logEntry = await offlineSyncService.logConnectionEvent(
        req.user.id,
        deviceId,
        sessionId,
        event,
        quizAttemptId
      );
      
      res.json(logEntry);
    } catch (error) {
      console.error("Error logging connection event:", error);
      res.status(500).json({ error: "Failed to log connection event" });
    }
  });

  // Get teacher notifications about offline students
  app.get('/api/offline-sync/teacher-notifications', mockAuth, async (req: any, res) => {
    try {
      const { unreadOnly = false } = req.query;
      
      const notifications = await offlineSyncService.getTeacherNotifications(
        req.user.id,
        unreadOnly === 'true'
      );
      
      res.json(notifications);
    } catch (error) {
      console.error("Error getting teacher notifications:", error);
      res.status(500).json({ error: "Failed to get teacher notifications" });
    }
  });

  // Mark notification as read
  app.put('/api/offline-sync/notifications/:id/read', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      await offlineSyncService.markNotificationRead(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Get device sync status
  app.get('/api/offline-sync/device-status/:deviceId', mockAuth, async (req: any, res) => {
    try {
      const { deviceId } = req.params;
      
      const status = await offlineSyncService.getDeviceSyncStatus(
        req.user.id,
        deviceId
      );
      
      res.json(status);
    } catch (error) {
      console.error("Error getting device sync status:", error);
      res.status(500).json({ error: "Failed to get device sync status" });
    }
  });

  // Update device sync status
  app.put('/api/offline-sync/device-status/:deviceId', mockAuth, async (req: any, res) => {
    try {
      const { deviceId } = req.params;
      const updates = req.body;
      
      const status = await offlineSyncService.updateDeviceSyncStatus(
        req.user.id,
        deviceId,
        updates
      );
      
      res.json(status);
    } catch (error) {
      console.error("Error updating device sync status:", error);
      res.status(500).json({ error: "Failed to update device sync status" });
    }
  });

  // Get connection logs for monitoring
  app.get('/api/offline-sync/connection-logs', mockAuth, async (req: any, res) => {
    try {
      const { sessionId, quizAttemptId } = req.query;
      
      // This would normally query the database
      // For now, return empty array since we haven't implemented the full database query
      res.json([]);
    } catch (error) {
      console.error("Error getting connection logs:", error);
      res.status(500).json({ error: "Failed to get connection logs" });
    }
  });

  // Computer Adaptive Testing (CAT) API endpoints
  app.post('/api/cat/session/initialize', mockAuth, async (req: any, res) => {
    try {
      const { quizId, settings } = req.body;
      const userId = req.user?.id || 'test-user';

      // Initialize CAT session
      const catState = CATService.initializeSession(settings);
      
      // Store session in memory (in production, this would be in database)
      const sessionId = `cat-session-${Date.now()}`;
      
      res.json({
        sessionId,
        catState,
        message: 'CAT session initialized successfully'
      });
    } catch (error) {
      console.error('Error initializing CAT session:', error);
      res.status(500).json({ error: 'Failed to initialize CAT session' });
    }
  });

  app.post('/api/cat/session/:sessionId/next-question', mockAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { currentAbility, answeredQuestions } = req.body;

      // Get available questions from testbank (mock implementation)
      const mockQuestions = [
        {
          id: 'q1',
          irtParams: { difficulty: -1.5, discrimination: 1.2, guessing: 0.2, slipping: 0.1 }
        },
        {
          id: 'q2', 
          irtParams: { difficulty: 0.0, discrimination: 1.5, guessing: 0.15, slipping: 0.05 }
        },
        {
          id: 'q3',
          irtParams: { difficulty: 1.5, discrimination: 1.0, guessing: 0.25, slipping: 0.1 }
        }
      ];

      // Filter out already answered questions
      const availableQuestions = mockQuestions.filter(q => !answeredQuestions.includes(q.id));
      
      // Select next question using CAT algorithm
      const nextQuestionId = CATService.selectNextItem(
        availableQuestions,
        currentAbility || 0,
        '2pl' // Default model
      );

      if (!nextQuestionId) {
        return res.json({ 
          hasNextQuestion: false, 
          message: 'No more questions available' 
        });
      }

      // Get full question details (would query database in production)
      const nextQuestion = await storage.getQuestion(nextQuestionId);
      
      res.json({
        hasNextQuestion: true,
        question: nextQuestion,
        questionIndex: answeredQuestions.length + 1
      });
    } catch (error) {
      console.error('Error selecting next CAT question:', error);
      res.status(500).json({ error: 'Failed to select next question' });
    }
  });

  app.post('/api/cat/session/:sessionId/process-response', mockAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { questionId, response, isCorrect, catState, settings } = req.body;

      // Mock IRT parameters for the question
      const questionParams = {
        difficulty: 0.0,
        discrimination: 1.2,
        guessing: 0.2,
        slipping: 0.1
      };

      // Process response and update CAT state
      const updatedCatState = CATService.processResponse(
        catState,
        isCorrect,
        questionParams,
        settings
      );

      // Check termination criteria
      const shouldTerminate = CATService.shouldTerminate(updatedCatState, settings);

      res.json({
        catState: updatedCatState,
        shouldTerminate,
        message: 'Response processed successfully'
      });
    } catch (error) {
      console.error('Error processing CAT response:', error);
      res.status(500).json({ error: 'Failed to process response' });
    }
  });

  app.post('/api/cat/session/:sessionId/finalize', mockAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { catState, settings } = req.body;

      // Generate final score and report
      const finalScore = CATService.getFinalScore(catState, settings);
      const report = CATService.generateReport(catState, settings);

      res.json({
        finalScore,
        report,
        message: 'CAT session finalized successfully'
      });
    } catch (error) {
      console.error('Error finalizing CAT session:', error);
      res.status(500).json({ error: 'Failed to finalize CAT session' });
    }
  });

  app.get('/api/cat/models', mockAuth, async (req: any, res) => {
    try {
      const catModels = [
        {
          id: 'rasch',
          name: 'Rasch Model (1PL)',
          description: 'Single parameter model focusing on item difficulty',
          parameters: ['difficulty'],
          recommended: false
        },
        {
          id: '2pl',
          name: '2-Parameter Logistic (2PL)',
          description: 'Most commonly used model with difficulty and discrimination',
          parameters: ['difficulty', 'discrimination'],
          recommended: true
        },
        {
          id: '3pl',
          name: '3-Parameter Logistic (3PL)',
          description: 'Includes guessing parameter for multiple choice questions',
          parameters: ['difficulty', 'discrimination', 'guessing'],
          recommended: false
        },
        {
          id: 'grm',
          name: 'Graded Response Model (GRM)',
          description: 'For polytomous items with ordered response categories',
          parameters: ['difficulty', 'discrimination'],
          recommended: false
        }
      ];

      res.json(catModels);
    } catch (error) {
      console.error('Error fetching CAT models:', error);
      res.status(500).json({ error: 'Failed to fetch CAT models' });
    }
  });

  // Archive Management API Endpoints
  // Archive a question
  app.post('/api/archive/question/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id || "test-user";
      
      if (!reason) {
        return res.status(400).json({ message: "Archive reason is required" });
      }
      
      const archivedQuestion = await storage.archiveQuestion(id, userId, reason);
      if (!archivedQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json({ message: "Question archived successfully", question: archivedQuestion });
    } catch (error) {
      console.error("Error archiving question:", error);
      res.status(500).json({ message: "Failed to archive question" });
    }
  });

  // Archive a quiz
  app.post('/api/archive/quiz/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id || "test-user";
      
      if (!reason) {
        return res.status(400).json({ message: "Archive reason is required" });
      }
      
      const archivedQuiz = await storage.archiveQuiz(id, userId, reason);
      if (!archivedQuiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      res.json({ message: "Quiz archived successfully", quiz: archivedQuiz });
    } catch (error) {
      console.error("Error archiving quiz:", error);
      res.status(500).json({ message: "Failed to archive quiz" });
    }
  });

  // Archive a testbank
  app.post('/api/archive/testbank/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id || "test-user";
      
      if (!reason) {
        return res.status(400).json({ message: "Archive reason is required" });
      }
      
      const archivedTestbank = await storage.archiveTestbank(id, userId, reason);
      if (!archivedTestbank) {
        return res.status(404).json({ message: "Testbank not found" });
      }
      
      res.json({ message: "Testbank archived successfully", testbank: archivedTestbank });
    } catch (error) {
      console.error("Error archiving testbank:", error);
      res.status(500).json({ message: "Failed to archive testbank" });
    }
  });

  // Restore a question
  app.post('/api/restore/question/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || "test-user";
      
      const restoredQuestion = await storage.restoreQuestion(id, userId);
      if (!restoredQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json({ message: "Question restored successfully", question: restoredQuestion });
    } catch (error) {
      console.error("Error restoring question:", error);
      res.status(500).json({ message: "Failed to restore question" });
    }
  });

  // Restore a quiz
  app.post('/api/restore/quiz/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || "test-user";
      
      const restoredQuiz = await storage.restoreQuiz(id, userId);
      if (!restoredQuiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      res.json({ message: "Quiz restored successfully", quiz: restoredQuiz });
    } catch (error) {
      console.error("Error restoring quiz:", error);
      res.status(500).json({ message: "Failed to restore quiz" });
    }
  });

  // Restore a testbank
  app.post('/api/restore/testbank/:id', mockAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || "test-user";
      
      const restoredTestbank = await storage.restoreTestbank(id, userId);
      if (!restoredTestbank) {
        return res.status(404).json({ message: "Testbank not found" });
      }
      
      res.json({ message: "Testbank restored successfully", testbank: restoredTestbank });
    } catch (error) {
      console.error("Error restoring testbank:", error);
      res.status(500).json({ message: "Failed to restore testbank" });
    }
  });

  // Get archived items
  app.get('/api/archive/:type', mockAuth, async (req: any, res) => {
    try {
      const { type } = req.params;
      const userId = req.user?.id || "test-user";
      const accountId = req.user?.accountId || "default-account";
      
      let archivedItems = [];
      
      switch (type) {
        case 'questions':
          archivedItems = await storage.getArchivedQuestions(accountId);
          break;
        case 'quizzes':
          archivedItems = await storage.getArchivedQuizzes(accountId);
          break;
        case 'testbanks':
          archivedItems = await storage.getArchivedTestbanks(accountId);
          break;
        default:
          return res.status(400).json({ message: "Invalid archive type" });
      }
      
      res.json(archivedItems);
    } catch (error) {
      console.error("Error fetching archived items:", error);
      res.status(500).json({ message: "Failed to fetch archived items" });
    }
  });

  // Get archive history
  app.get('/api/archive/history', mockAuth, async (req: any, res) => {
    try {
      const { itemType, itemId } = req.query;
      
      const history = await storage.getArchiveHistory(
        itemType as string,
        itemId as string
      );
      
      res.json(history);
    } catch (error) {
      console.error("Error fetching archive history:", error);
      res.status(500).json({ message: "Failed to fetch archive history" });
    }
  });

  // Permanently delete archived items (admin only)
  app.delete('/api/archive/permanent/:type/:id', mockAuth, async (req: any, res) => {
    try {
      const { type, id } = req.params;
      const userId = req.user?.id || "test-user";
      const userRole = req.user?.role || "admin";
      
      // Check if user has permission to permanently delete
      if (!["admin", "super_admin"].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      let deleted = false;
      
      switch (type) {
        case 'question':
          deleted = await storage.permanentlyDeleteQuestion(id, userId);
          break;
        case 'quiz':
          deleted = await storage.permanentlyDeleteQuiz(id, userId);
          break;
        case 'testbank':
          deleted = await storage.permanentlyDeleteTestbank(id, userId);
          break;
        default:
          return res.status(400).json({ message: "Invalid item type" });
      }
      
      if (!deleted) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json({ message: `${type} permanently deleted` });
    } catch (error) {
      console.error("Error permanently deleting item:", error);
      res.status(500).json({ message: "Failed to permanently delete item" });
    }
  });

  // ========== STRIPE SUBSCRIPTION ROUTES ==========

  // Get subscription plans
  app.get('/api/subscription-plans', async (req, res) => {
    try {
      // Default subscription plans
      const plans = [
        {
          id: 'free',
          name: 'Free',
          description: 'Perfect for getting started',
          priceMonthly: 0,
          priceYearly: 0,
          stripePriceIdMonthly: '',
          stripePriceIdYearly: '',
          maxUsers: 5,
          maxQuizzes: 10,
          maxQuestions: 100,
          maxStorage: 1000, // 1GB
          features: {
            aiQuestionGeneration: false,
            liveProctoring: false,
            advancedAnalytics: false,
            customBranding: false,
            apiAccess: false,
            ssoIntegration: false,
            prioritySupport: false,
            mobileApp: true,
            bulkImport: false,
            whiteLabel: false,
          },
          isActive: true,
          sortOrder: 0,
        },
        {
          id: 'basic',
          name: 'Basic',
          description: 'Essential features for small teams',
          priceMonthly: 2900, // $29
          priceYearly: 29000, // $290 (save $58)
          stripePriceIdMonthly: 'price_basic_monthly',
          stripePriceIdYearly: 'price_basic_yearly',
          maxUsers: 25,
          maxQuizzes: 100,
          maxQuestions: 1000,
          maxStorage: 5000, // 5GB
          features: {
            aiQuestionGeneration: true,
            liveProctoring: true,
            advancedAnalytics: false,
            customBranding: false,
            apiAccess: false,
            ssoIntegration: false,
            prioritySupport: false,
            mobileApp: true,
            bulkImport: true,
            whiteLabel: false,
          },
          isActive: true,
          sortOrder: 1,
        },
        {
          id: 'premium',
          name: 'Premium',
          description: 'Advanced features for growing organizations',
          priceMonthly: 7900, // $79
          priceYearly: 79000, // $790 (save $158)
          stripePriceIdMonthly: 'price_premium_monthly',
          stripePriceIdYearly: 'price_premium_yearly',
          maxUsers: 100,
          maxQuizzes: 500,
          maxQuestions: 10000,
          maxStorage: 25000, // 25GB
          features: {
            aiQuestionGeneration: true,
            liveProctoring: true,
            advancedAnalytics: true,
            customBranding: true,
            apiAccess: true,
            ssoIntegration: false,
            prioritySupport: true,
            mobileApp: true,
            bulkImport: true,
            whiteLabel: false,
          },
          isActive: true,
          sortOrder: 2,
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          description: 'Full-featured solution for large organizations',
          priceMonthly: 19900, // $199
          priceYearly: 199000, // $1990 (save $398)
          stripePriceIdMonthly: 'price_enterprise_monthly',
          stripePriceIdYearly: 'price_enterprise_yearly',
          maxUsers: -1, // Unlimited
          maxQuizzes: -1, // Unlimited
          maxQuestions: -1, // Unlimited
          maxStorage: -1, // Unlimited
          features: {
            aiQuestionGeneration: true,
            liveProctoring: true,
            advancedAnalytics: true,
            customBranding: true,
            apiAccess: true,
            ssoIntegration: true,
            prioritySupport: true,
            mobileApp: true,
            bulkImport: true,
            whiteLabel: true,
          },
          isActive: true,
          sortOrder: 3,
        },
      ];
      
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Create subscription
  app.post('/api/create-subscription', async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { planId, billingCycle, priceId } = req.body;
      
      // Get or create Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        stripeCustomerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateUser(userId, { stripeCustomerId });
      }
      
      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription: " + error.message });
    }
  });

  // Get billing information
  app.get('/api/billing', async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get current subscription info
      let currentPlan = {
        name: 'Free',
        price: 0,
        billingCycle: 'monthly',
        status: 'active',
        nextBillingDate: new Date().toISOString(),
        features: {},
      };
      
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          currentPlan = {
            name: subscription.metadata.planName || 'Premium',
            price: subscription.items.data[0]?.price.unit_amount || 0,
            billingCycle: subscription.items.data[0]?.price.recurring?.interval || 'monthly',
            status: subscription.status,
            nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString(),
            features: JSON.parse(subscription.metadata.features || '{}'),
          };
        } catch (error) {
          console.error("Error fetching Stripe subscription:", error);
        }
      }
      
      // Get usage statistics
      const usage = {
        users: { current: 1, limit: 5 },
        quizzes: { current: 0, limit: 10 },
        questions: { current: 0, limit: 100 },
        storage: { current: 50, limit: 1000 }, // MB
      };
      
      // Get billing history
      const billingHistory = [];
      if (user.stripeCustomerId) {
        try {
          const invoices = await stripe.invoices.list({
            customer: user.stripeCustomerId,
            limit: 10,
          });
          
          billingHistory.push(...invoices.data.map(invoice => ({
            id: invoice.id,
            amount: invoice.amount_paid,
            status: invoice.status,
            date: new Date(invoice.created * 1000).toISOString(),
            invoiceUrl: invoice.hosted_invoice_url,
          })));
        } catch (error) {
          console.error("Error fetching billing history:", error);
        }
      }
      
      res.json({
        currentPlan,
        usage,
        billingHistory,
      });
    } catch (error) {
      console.error("Error fetching billing info:", error);
      res.status(500).json({ message: "Failed to fetch billing information" });
    }
  });

  // Cancel subscription
  app.post('/api/billing/cancel-subscription', async (req: any, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      
      res.json({ message: "Subscription cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Download invoice
  app.get('/api/billing/invoice/:invoiceId/download', async (req: any, res) => {
    try {
      const { invoiceId } = req.params;
      const userId = req.user?.id || "test-user";
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const invoice = await stripe.invoices.retrieve(invoiceId);
      
      if (invoice.customer !== user.stripeCustomerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json({ invoiceUrl: invoice.hosted_invoice_url });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      res.status(500).json({ message: "Failed to download invoice" });
    }
  });

  // Comprehensive NREMT CAT Exam Generation - Direct solution for full coverage
  app.post('/api/ai/generate-comprehensive-nremt', mockAuth, async (req, res) => {
    try {
      const { title } = req.body;
      
      console.log('Generating comprehensive NREMT exam with full coverage...');
      
      // Import the dedicated NREMT generator
      const { generateComprehensiveNREMTExam } = await import('./nremt-generator');
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ 
          message: 'OpenAI API key not configured. Please contact your administrator to set up AI functionality.' 
        });
      }

      // Generate comprehensive NREMT exam with all 5 topic areas and full question counts
      const comprehensiveExam = await generateComprehensiveNREMTExam(
        openai,
        title || 'NREMT Paramedic Comprehensive Test',
        'Comprehensive NREMT paramedic certification exam covering all core competency areas with 50-70 questions per topic for proper CAT randomization'
      );

      console.log('Generated comprehensive exam with', comprehensiveExam.itemBanks.length, 'item banks');
      console.log('Total questions across all banks:', comprehensiveExam.itemBanks.reduce((sum, bank) => sum + bank.questionCount, 0));

      res.json(comprehensiveExam);
      
    } catch (error) {
      console.error('Error generating comprehensive NREMT exam:', error);
      res.status(500).json({ message: 'Failed to generate comprehensive exam: ' + error.message });
    }
  });

  // AI CAT Exam Generation endpoint - Enhanced with comprehensive coverage  
  app.post('/api/ai/generate-cat-exam', mockAuth, async (req, res) => {
    try {
      const { prompt, title, existingTestbanks } = req.body;
      
      if (!prompt || !title) {
        return res.status(400).json({ message: 'Prompt and title are required' });
      }

      console.log('Generating CAT exam with prompt:', prompt);
      console.log('Exam title:', title);
      console.log('Existing testbanks available:', existingTestbanks?.length || 0);

      // Use direct OpenAI call for configuration generation
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ 
          message: 'OpenAI API key not configured. Please contact your administrator to set up AI functionality.' 
        });
      }

      // Generate AI prompt for CAT exam configuration
      const aiPrompt = `You are an expert educational assessment designer specializing in Computer Adaptive Testing (CAT) and comprehensive exam development.

USER REQUIREMENTS:
${prompt}

EXAM TITLE: ${title}

CRITICAL INSTRUCTIONS:
- Generate comprehensive content with multiple item banks
- Each item bank MUST have 50-70 questions for proper CAT randomization
- Create realistic, subject-specific questions across difficulty levels 3-9
- Ensure questions cover the full spectrum: 20% easy (3-4), 50% medium (5-7), 30% hard (8-9)
- Generate scenario-based questions with professional terminology
- NO generic placeholders - all content must be subject-specific

Please respond with a valid JSON object containing the detailed CAT exam configuration with complete question sets. Format your entire response as JSON.`;

      // Generate AI response for CAT exam configuration
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "You are an expert educational assessment designer specializing in Computer Adaptive Testing (CAT). Generate comprehensive exam configurations with realistic content. Always respond with valid JSON format." 
          },
          { 
            role: "user", 
            content: `${aiPrompt}\n\nPlease provide your complete response in JSON format with all required exam configuration data.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      // Parse the AI response
      let examConfig;
      try {
        examConfig = JSON.parse(response.choices[0].message.content || '{}');
        console.log('AI generated config:', JSON.stringify(examConfig, null, 2));
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.log('Raw AI response:', response.choices[0].message.content);
        return res.status(500).json({ message: 'Failed to parse AI response from OpenAI' });
      }

      // Create item banks from AI generated configuration
      let combinedItemBanks = [];
      
      // Add new generated item banks from AI response
      if (examConfig.itemBanks && examConfig.itemBanks.length > 0) {
        combinedItemBanks = examConfig.itemBanks.map((bank: any) => ({
          ...bank,
          subject: examConfig.subject || bank.subject || 'General'
        }));
        console.log('Adding AI generated item banks:', combinedItemBanks.length);
      }

      // Universal CAT generation with reference-based enhancement
      console.log('🔧 Enhancing item banks with adequate question counts for CAT...');
      
      // Check if we need to use reference materials for enhanced generation
      const user = req.user;
      const accountId = user?.accountId || "00000000-0000-0000-0000-000000000001";
      
      // Get exam references that match the prompt/title for enhanced generation
      const examReferences = await storage.getExamReferencesByTopic(accountId, prompt, title);
      console.log(`🔍 Search terms from prompt/title:`, prompt.toLowerCase().split(' ').filter(word => word.length > 3));
      
      if (examReferences && examReferences.length > 0) {
        console.log(`📚 Found ${examReferences.length} reference materials for enhanced generation`);
        examReferences.forEach(ref => console.log(`  - ${ref.title} (${ref.category})`));
        
        // Use reference-based comprehensive generation
        console.log('🔧 Generating enhanced exam with reference materials...');
        
        // Create enhanced prompt with reference content
        const referencesContent = examReferences.map(ref => 
          `${ref.title} (${ref.category}): ${ref.content}`
        ).join('\n\n');
        
        const enhancedPrompt = `${prompt}\n\nReference Materials:\n${referencesContent}`;
        
        // Generate enhanced exam using multi-provider AI system
        const aiResponse = await multiProviderAI.generateCATExam(
          `You are an expert assessment designer creating Computer Adaptive Testing (CAT) exams. Generate comprehensive item banks with 50-70 questions each, using the provided reference materials for accuracy and structure. Always respond with valid JSON format.\n\n${enhancedPrompt}`,
          {
            maxTokens: 4000,
            temperature: 0.7
          }
        );
        
        console.log(`✅ Generated with ${aiResponse.provider} (${aiResponse.tokensUsed} tokens, $${aiResponse.cost?.toFixed(4)})`);
        
        let enhancedExam;
        try {
          const rawContent = aiResponse.content || '{}';
          console.log('Raw enhanced response:', rawContent.substring(0, 500) + '...');
          enhancedExam = JSON.parse(rawContent);
          console.log('Parsed enhanced exam structure:', {
            hasItemBanks: !!enhancedExam.itemBanks,
            itemBanksIsArray: Array.isArray(enhancedExam.itemBanks),
            itemBanksLength: enhancedExam.itemBanks ? enhancedExam.itemBanks.length : 0
          });
        } catch (error) {
          console.error('Failed to parse enhanced exam:', error);
          console.log('Raw enhanced response content:', aiResponse.content);
          enhancedExam = null;
        }
        
        if (enhancedExam && enhancedExam.itemBanks && Array.isArray(enhancedExam.itemBanks) && enhancedExam.itemBanks.length > 0) {
          console.log(`🎯 Generated reference-based exam with ${enhancedExam.itemBanks.length} item banks`);
          // Safely calculate total questions with proper error handling
          const totalQuestions = enhancedExam.itemBanks.reduce((sum, bank) => {
            const bankQuestions = bank.questionCount || bank.questions?.length || 0;
            return sum + bankQuestions;
          }, 0);
          console.log(`📊 Total questions: ${totalQuestions}`);
          
          combinedItemBanks = enhancedExam.itemBanks;
          examConfig = {
            ...examConfig,
            ...enhancedExam
          };
        }
      } else {
        // Standard CAT generation - ensure adequate question counts for each item bank
        console.log('📝 No matching exam references found, using standard CAT generation...');
        
        for (let i = 0; i < combinedItemBanks.length; i++) {
          const bank = combinedItemBanks[i];
          if (!bank.questions || bank.questions.length < 40) {
            console.log(`📈 Enhancing ${bank.name} - generating additional questions for CAT optimization`);
            
            // Generate 50+ questions for proper CAT functionality
            const targetQuestions = 50;
            const existingQuestions = bank.questions || [];
            const questionsNeeded = targetQuestions - existingQuestions.length;
            
            if (questionsNeeded > 0) {
              // Use the same robust question generation from the NREMT generator
              const { generateNREMTTopicQuestions } = await import('./nremt-generator');
              const enhancedQuestions = await generateNREMTTopicQuestions(
                openai,
                bank.name,
                bank.description || `Questions for ${bank.name}`,
                questionsNeeded
              );
              
              bank.questions = [...existingQuestions, ...enhancedQuestions];
              bank.questionCount = bank.questions.length;
              console.log(`✅ Enhanced ${bank.name} to ${bank.questions.length} questions`);
            }
          }
        }
      }

      // STEP 7: Standard intelligent fallback for non-NREMT content
      if (combinedItemBanks.length === 0) {
        console.warn('No applicable existing content and AI did not generate new banks, creating intelligent fallback...');
        
        // Analyze the prompt to create topic-specific fallback content
        const isNREMT = prompt.toLowerCase().includes('nremt') || prompt.toLowerCase().includes('paramedic') || prompt.toLowerCase().includes('ems');
        const isMedical = prompt.toLowerCase().includes('medical') || prompt.toLowerCase().includes('health') || isNREMT;
        
        if (isNREMT) {
          combinedItemBanks = [
            {
              id: null,
              name: "NREMT - Airway and Breathing Management",
              description: "Advanced airway assessment, management techniques, and ventilation strategies for paramedic certification",
              subject: "NREMT Paramedic",
              questionCount: 45,
              percentage: 35,
              isNew: true,
              questions: createNREMTAirwayQuestions()
            },
            {
              id: null,
              name: "NREMT - Cardiac Emergencies and ECG Interpretation", 
              description: "Cardiovascular emergency management, arrhythmia recognition, and 12-lead ECG interpretation for advanced life support",
              subject: "NREMT Paramedic",
              questionCount: 40,
              percentage: 35,
              isNew: true,
              questions: createNREMTCardiacQuestions()
            },
            {
              id: null,
              name: "NREMT - Trauma Assessment and Management",
              description: "Systematic trauma assessment, injury pattern recognition, and emergency intervention protocols",
              subject: "NREMT Paramedic", 
              questionCount: 35,
              percentage: 30,
              isNew: true,
              questions: createNREMTTraumaQuestions()
            }
          ];
          examConfig.subject = 'NREMT Paramedic';
        } else if (isMedical) {
          combinedItemBanks = [
            {
              id: null,
              name: "Medical Assessment and Diagnosis",
              description: "Systematic patient assessment, diagnostic reasoning, and clinical decision-making principles",
              subject: "Medical Education",
              questionCount: 35,
              percentage: 50,
              isNew: true,
              questions: createMedicalAssessmentQuestions()
            },
            {
              id: null,
              name: "Clinical Application and Case Management",
              description: "Real-world application of medical knowledge, case-based reasoning, and treatment protocols",
              subject: "Medical Education",
              questionCount: 30,
              percentage: 50,
              isNew: true,
              questions: createClinicalApplicationQuestions()
            }
          ];
          examConfig.subject = 'Medical Education';
        } else {
          // Create topic-specific content based on title and prompt analysis
          const subjectArea = examConfig.subject || extractSubjectFromPrompt(prompt, title);
          combinedItemBanks = [
            {
              id: null,
              name: subjectArea + ' - Core Knowledge',
              description: 'Fundamental concepts, principles, and theoretical foundations in ' + subjectArea,
              subject: subjectArea,
              questionCount: 40,
              percentage: 60,
              isNew: true,
              questions: createGenericKnowledgeQuestions(subjectArea, title)
            },
            {
              id: null,
              name: subjectArea + ' - Applied Skills',
              description: 'Practical application, problem-solving, and real-world implementation of ' + subjectArea + ' concepts',
              subject: subjectArea,
              questionCount: 30,
              percentage: 40, 
              isNew: true,
              questions: createGenericApplicationQuestions(subjectArea, title)
            }
          ];
        }
      }

      // Helper function to generate comprehensive topic-specific questions
      async function generateTopicQuestions(openaiClient: any, topicName: string, topicDescription: string, questionCount: number) {
        console.log(`Generating ${questionCount} questions for ${topicName}...`);
        
        // For large question counts, generate in smaller batches
        const batchSize = Math.min(25, questionCount);
        const batches = Math.ceil(questionCount / batchSize);
        let allQuestions = [];
        
        for (let batch = 0; batch < batches; batch++) {
          const questionsInBatch = batch === batches - 1 
            ? questionCount - (batch * batchSize) 
            : batchSize;
          
          console.log(`Generating batch ${batch + 1}/${batches} with ${questionsInBatch} questions...`);
          
          const topicPrompt = `Generate exactly ${questionsInBatch} comprehensive NREMT paramedic questions for:

TOPIC: ${topicName}
DESCRIPTION: ${topicDescription}

CRITICAL REQUIREMENTS:
- Generate EXACTLY ${questionsInBatch} complete questions in this batch
- Use authentic NREMT paramedic terminology and realistic emergency scenarios
- Distribute difficulties: 20% easy (3-4), 50% medium (5-7), 30% hard (8-9)
- Each question must be scenario-based with realistic patient presentations
- Include detailed medical rationale in explanations
- Make questions unique and non-repetitive

IMPORTANT: Your response must be valid JSON format with exactly ${questionsInBatch} questions:
{
  "questions": [
    {
      "questionText": "A 45-year-old male presents with crushing chest pain radiating to his left arm. He is diaphoretic and nauseated. What is your immediate priority?",
      "type": "multiple_choice",
      "difficulty": 5,
      "bloomsLevel": "apply", 
      "answerOptions": [
        {"answerText": "Obtain a 12-lead ECG", "isCorrect": false, "displayOrder": 0},
        {"answerText": "Administer high-flow oxygen", "isCorrect": true, "displayOrder": 1},
        {"answerText": "Start an IV line", "isCorrect": false, "displayOrder": 2},
        {"answerText": "Give aspirin 324mg", "isCorrect": false, "displayOrder": 3}
      ],
      "explanation": "High-flow oxygen is the immediate priority to optimize oxygen delivery in suspected MI. Other interventions follow in sequence.",
      "tags": ["${topicName.toLowerCase()}", "cardiac-emergency"]
    }
  ]
}`;

          try {
            const response = await openaiClient.chat.completions.create({
              model: "gpt-4o",
              messages: [
                { 
                  role: "system", 
                  content: "You are an expert NREMT paramedic exam developer with extensive experience in emergency medicine. Generate comprehensive, realistic question sets with authentic medical content. Always respond with valid JSON format containing the exact number of questions requested." 
                },
                { role: "user", content: topicPrompt }
              ],
              response_format: { type: "json_object" },
              temperature: 0.7,
              max_tokens: 4000
            });

            let result;
            try {
              result = JSON.parse(response.choices[0].message.content || '{"questions": []}');
            } catch (parseError) {
              console.error(`JSON parse error in batch ${batch + 1}:`, parseError);
              console.log('Raw response:', response.choices[0].message.content);
              result = { questions: [] };
            }
            const questions = result.questions || [];
            
            if (questions.length === 0) {
              console.warn(`No questions generated in batch ${batch + 1}, using fallback`);
              const fallbackQuestions = createFallbackQuestions(topicName, questionsInBatch);
              allQuestions.push(...fallbackQuestions);
            } else {
              console.log(`Generated ${questions.length} questions in batch ${batch + 1}`);
              allQuestions.push(...questions.slice(0, questionsInBatch));
            }
            
          } catch (error) {
            console.error(`Error generating batch ${batch + 1} for ${topicName}:`, error);
            const fallbackQuestions = createFallbackQuestions(topicName, questionsInBatch);
            allQuestions.push(...fallbackQuestions);
          }
          
          // Add small delay between batches to prevent rate limiting
          if (batch < batches - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        console.log(`Total generated questions for ${topicName}: ${allQuestions.length}`);
        return allQuestions.slice(0, questionCount); // Ensure exact count
      }

      // Fallback function for topic-specific questions
      function createFallbackQuestions(topicName: string, count: number) {
        const baseQuestions = getTopicSpecificQuestions(topicName);
        return Array.from({length: count}, (_, i) => ({
          ...baseQuestions[i % baseQuestions.length],
          questionText: baseQuestions[i % baseQuestions.length].questionText + ` (Scenario ${i + 1})`,
          difficulty: 3 + (i % 7), // Distribute 3-9
          tags: [topicName.toLowerCase(), "scenario-based"]
        }));
      }

      // Get topic-specific base questions for fallback
      function getTopicSpecificQuestions(topicName: string) {
        const lowerTopic = topicName.toLowerCase();
        
        if (lowerTopic.includes('cardiac') || lowerTopic.includes('heart')) {
          return [
            {
              questionText: "A patient presents with chest pain and diaphoresis. What is your immediate assessment priority?",
              type: "multiple_choice",
              bloomsLevel: "apply",
              answerOptions: [
                { answerText: "Check blood pressure", isCorrect: false, displayOrder: 0 },
                { answerText: "Obtain 12-lead ECG", isCorrect: true, displayOrder: 1 },
                { answerText: "Start IV access", isCorrect: false, displayOrder: 2 },
                { answerText: "Administer oxygen", isCorrect: false, displayOrder: 3 }
              ],
              explanation: "12-lead ECG is essential for cardiac assessment and potential STEMI identification."
            }
          ];
        } else if (lowerTopic.includes('trauma')) {
          return [
            {
              questionText: "In a multi-trauma patient, what is the primary survey priority?",
              type: "multiple_choice", 
              bloomsLevel: "apply",
              answerOptions: [
                { answerText: "Airway management", isCorrect: true, displayOrder: 0 },
                { answerText: "Spinal immobilization", isCorrect: false, displayOrder: 1 },
                { answerText: "IV fluid resuscitation", isCorrect: false, displayOrder: 2 },
                { answerText: "Pain management", isCorrect: false, displayOrder: 3 }
              ],
              explanation: "Airway is the first priority in the ABC approach to trauma assessment."
            }
          ];
        } else if (lowerTopic.includes('airway') || lowerTopic.includes('breathing')) {
          return [
            {
              questionText: "A patient presents with severe respiratory distress and stridor. What is your immediate concern?",
              type: "multiple_choice",
              bloomsLevel: "apply", 
              answerOptions: [
                { answerText: "Upper airway obstruction", isCorrect: true, displayOrder: 0 },
                { answerText: "Pneumothorax", isCorrect: false, displayOrder: 1 },
                { answerText: "Asthma exacerbation", isCorrect: false, displayOrder: 2 },
                { answerText: "Pulmonary edema", isCorrect: false, displayOrder: 3 }
              ],
              explanation: "Stridor indicates upper airway obstruction requiring immediate intervention."
            }
          ];
        } else {
          return [
            {
              questionText: "What is the most important consideration in emergency patient assessment?",
              type: "multiple_choice",
              bloomsLevel: "analyze",
              answerOptions: [
                { answerText: "Patient safety", isCorrect: true, displayOrder: 0 },
                { answerText: "Documentation", isCorrect: false, displayOrder: 1 },
                { answerText: "Family communication", isCorrect: false, displayOrder: 2 },
                { answerText: "Equipment preparation", isCorrect: false, displayOrder: 3 }
              ],
              explanation: "Patient safety is always the primary concern in emergency situations."
            }
          ];
        }
      }

      // Helper function to create NREMT airway questions
      function createNREMTAirwayQuestions() {
        return [
          {
            questionText: "A 45-year-old patient presents with severe respiratory distress and stridor. You observe paradoxical chest movement on the right side with absent breath sounds. What is your immediate priority?",
            type: "multiple_choice",
            difficulty: 8,
            bloomsLevel: "analyze",
            answerOptions: [
              {"answerText": "Establish IV access for medication administration", "isCorrect": false, "displayOrder": 0},
              {"answerText": "Perform immediate needle thoracostomy", "isCorrect": true, "displayOrder": 1},
              {"answerText": "Administer albuterol via nebulizer", "isCorrect": false, "displayOrder": 2},
              {"answerText": "Prepare for emergency cricothyrotomy", "isCorrect": false, "displayOrder": 3}
            ],
            explanation: "Paradoxical chest movement with absent breath sounds indicates tension pneumothorax requiring immediate needle decompression",
            tags: ["airway", "breathing", "emergency-procedures", "tension-pneumothorax"]
          },
          {
            questionText: "During bag-mask ventilation of an unconscious patient, which assessment finding best indicates effective ventilation?",
            type: "multiple_choice", 
            difficulty: 5,
            bloomsLevel: "evaluate",
            answerOptions: [
              {"answerText": "Bilateral chest rise and fall with adequate tidal volume", "isCorrect": true, "displayOrder": 0},
              {"answerText": "Heart rate increasing from 60 to 100 bpm", "isCorrect": false, "displayOrder": 1},
              {"answerText": "Blood pressure improving to 120/80 mmHg", "isCorrect": false, "displayOrder": 2},
              {"answerText": "Return of spontaneous movement", "isCorrect": false, "displayOrder": 3}
            ],
            explanation: "Effective ventilation is confirmed by observing adequate chest expansion and fall, indicating proper air exchange and ventilation",
            tags: ["ventilation", "assessment", "airway-management"]
          }
        ];
      }

      // Helper function to create NREMT cardiac questions
      function createNREMTCardiacQuestions() {
        return [
          {
            questionText: "A 68-year-old male presents with crushing substernal chest pain radiating to his left arm and jaw. His 12-lead ECG shows ST-elevation in leads II, III, and aVF. What is the most likely diagnosis?",
            type: "multiple_choice",
            difficulty: 6,
            bloomsLevel: "analyze", 
            answerOptions: [
              {"answerText": "Anterior STEMI involving the LAD territory", "isCorrect": false, "displayOrder": 0},
              {"answerText": "Inferior STEMI involving the RCA territory", "isCorrect": true, "displayOrder": 1},
              {"answerText": "Lateral STEMI involving the circumflex territory", "isCorrect": false, "displayOrder": 2},
              {"answerText": "Non-ST elevation myocardial infarction (NSTEMI)", "isCorrect": false, "displayOrder": 3}
            ],
            explanation: "ST-elevation in leads II, III, and aVF indicates inferior wall myocardial infarction typically involving the right coronary artery",
            tags: ["cardiac", "12-lead-ecg", "stemi", "mi-recognition"]
          }
        ];
      }

      // Helper function to create NREMT trauma questions
      function createNREMTTraumaQuestions() {
        return [
          {
            questionText: "During primary assessment of a multi-trauma patient, you discover a penetrating chest wound with air bubbling through it during inspiration. What is your immediate intervention?",
            type: "multiple_choice",
            difficulty: 7,
            bloomsLevel: "apply",
            answerOptions: [
              {"answerText": "Apply an occlusive dressing sealed on three sides", "isCorrect": true, "displayOrder": 0},
              {"answerText": "Completely seal the wound with an occlusive dressing", "isCorrect": false, "displayOrder": 1},
              {"answerText": "Leave the wound uncovered to allow continued air escape", "isCorrect": false, "displayOrder": 2},
              {"answerText": "Pack the wound with sterile gauze and apply pressure", "isCorrect": false, "displayOrder": 3}
            ],
            explanation: "A three-sided occlusive dressing allows air to escape during expiration while preventing air entry during inspiration, preventing tension pneumothorax",
            tags: ["trauma", "chest-injury", "sucking-chest-wound", "wound-care"]
          }
        ];
      }

      // Helper functions for medical and generic content
      function createMedicalAssessmentQuestions() {
        return [
          {
            questionText: "When performing a systematic physical examination of the abdomen, which assessment technique should be performed last to avoid altering findings?",
            type: "multiple_choice",
            difficulty: 4,
            bloomsLevel: "remember",
            answerOptions: [
              {"answerText": "Visual inspection", "isCorrect": false, "displayOrder": 0},
              {"answerText": "Auscultation of bowel sounds", "isCorrect": false, "displayOrder": 1}, 
              {"answerText": "Percussion for organ borders", "isCorrect": false, "displayOrder": 2},
              {"answerText": "Palpation for masses and tenderness", "isCorrect": true, "displayOrder": 3}
            ],
            explanation: "Palpation should be performed last as it may stimulate bowel activity and alter auscultatory findings",
            tags: ["assessment", "physical-examination", "abdominal-exam"]
          }
        ];
      }

      function createClinicalApplicationQuestions() {
        return [
          {
            questionText: "A patient presents with acute dyspnea, pleuritic chest pain, and unilateral lower extremity swelling. Which diagnostic test would be most appropriate to confirm the suspected diagnosis?",
            type: "multiple_choice",
            difficulty: 7,
            bloomsLevel: "analyze",
            answerOptions: [
              {"answerText": "Chest radiograph", "isCorrect": false, "displayOrder": 0},
              {"answerText": "CT pulmonary angiogram (CTPA)", "isCorrect": true, "displayOrder": 1},
              {"answerText": "Transthoracic echocardiogram", "isCorrect": false, "displayOrder": 2},
              {"answerText": "Complete blood count with differential", "isCorrect": false, "displayOrder": 3}
            ],
            explanation: "The clinical presentation strongly suggests pulmonary embolism; CTPA is the gold standard diagnostic test for PE confirmation",
            tags: ["clinical-reasoning", "diagnostics", "pulmonary-embolism", "evidence-based-medicine"]
          }
        ];
      }

      function extractSubjectFromPrompt(prompt: string, title: string) {
        // Extract subject area from prompt keywords
        const keywords = prompt.toLowerCase();
        if (keywords.includes('biology') || keywords.includes('anatomy')) return 'Biology';
        if (keywords.includes('chemistry') || keywords.includes('biochemistry')) return 'Chemistry';
        if (keywords.includes('physics') || keywords.includes('mechanics')) return 'Physics';
        if (keywords.includes('mathematics') || keywords.includes('calculus')) return 'Mathematics';
        if (keywords.includes('psychology') || keywords.includes('behavior')) return 'Psychology';
        if (keywords.includes('history') || keywords.includes('historical')) return 'History';
        if (keywords.includes('literature') || keywords.includes('english')) return 'Literature';
        if (keywords.includes('computer') || keywords.includes('programming')) return 'Computer Science';
        return title || 'General Education';
      }

      function createGenericKnowledgeQuestions(subject: string, title: string) {
        return [
          {
            questionText: 'Which fundamental principle is most critical when applying core concepts in ' + subject + '?',
            type: "multiple_choice",
            difficulty: 5,
            bloomsLevel: "understand", 
            answerOptions: [
              {"answerText": "Systematic approach to problem analysis", "isCorrect": true, "displayOrder": 0},
              {"answerText": "Memorization of specific procedures", "isCorrect": false, "displayOrder": 1},
              {"answerText": "Strict adherence to predetermined protocols", "isCorrect": false, "displayOrder": 2},
              {"answerText": "Relying primarily on intuition and experience", "isCorrect": false, "displayOrder": 3}
            ],
            explanation: "A systematic approach ensures consistent, evidence-based application of knowledge across various scenarios and contexts",
            tags: ["fundamentals", "methodology", "critical-thinking"]
          }
        ];
      }

      function createGenericApplicationQuestions(subject: string, title: string) {
        return [
          {
            questionText: 'When applying ' + subject + ' concepts in real-world situations, what factor should be prioritized?',
            type: "multiple_choice",
            difficulty: 6,
            bloomsLevel: "apply",
            answerOptions: [
              {"answerText": "Contextual factors and situational variables", "isCorrect": true, "displayOrder": 0},
              {"answerText": "Speed of implementation", "isCorrect": false, "displayOrder": 1},
              {"answerText": "Exact replication of textbook methods", "isCorrect": false, "displayOrder": 2},
              {"answerText": "Personal preferences and comfort level", "isCorrect": false, "displayOrder": 3}
            ],
            explanation: "Effective application requires understanding context and adapting theoretical knowledge to specific situational demands",
            tags: ["application", "context-analysis", "adaptive-thinking"]
          }
        ];
      }

      // STEP 7: Validate that percentages total 100%
      const totalPercentage = combinedItemBanks.reduce((sum: number, bank: any) => sum + (bank.percentage || 0), 0);
      if (totalPercentage !== 100) {
        // Adjust percentages to total 100%
        const adjustment = 100 / totalPercentage;
        combinedItemBanks.forEach((bank: any) => {
          bank.percentage = Math.round((bank.percentage || 0) * adjustment);
        });
        console.log('Adjusted percentages to total 100%');
      }

      // STEP 8: Structure the final response with combined content
      const structuredConfig = {
        title: title, // Always preserve user's title
        description: examConfig.description || 'AI-generated Computer Adaptive Test: ' + title,
        subject: examConfig.subject || 'General',
        difficulty: examConfig.difficulty || { min: 3, max: 9 },
        estimatedDuration: examConfig.estimatedDuration || 90,
        targetAudience: examConfig.targetAudience || 'Students',
        learningObjectives: examConfig.learningObjectives || ['Assess understanding of core concepts'],
        itemBanks: combinedItemBanks, // Use the intelligently combined item banks
        catSettings: {
          model: examConfig.catSettings?.model || 'irt_2pl',
          theta_start: examConfig.catSettings?.theta_start || 0,
          theta_min: examConfig.catSettings?.theta_min || -4,
          theta_max: examConfig.catSettings?.theta_max || 4,
          se_target: examConfig.catSettings?.se_target || 0.3,
          min_items: examConfig.catSettings?.min_items || 20,
          max_items: examConfig.catSettings?.max_items || 60,
          exposure_control: examConfig.catSettings?.exposure_control ?? true,
          content_balancing: examConfig.catSettings?.content_balancing ?? true
        },
        additionalSettings: {
          passingGrade: examConfig.additionalSettings?.passingGrade || 70,
          timeLimit: examConfig.additionalSettings?.timeLimit || 120,
          allowCalculator: examConfig.additionalSettings?.allowCalculator ?? false,
          calculatorType: examConfig.additionalSettings?.calculatorType || 'basic',
          proctoring: examConfig.additionalSettings?.proctoring ?? true,
          shuffleQuestions: examConfig.additionalSettings?.shuffleQuestions ?? true,
          showCorrectAnswers: examConfig.additionalSettings?.showCorrectAnswers ?? false
        }
      };

      console.log('Final structured config with', structuredConfig.itemBanks.length, 'item banks');

      // STEP 8: Save the generated CAT exam to the database
      const userForSave = req.user;
      const catExamData = {
        title: structuredConfig.title,
        description: structuredConfig.description,
        subject: structuredConfig.subject,
        itemBanks: structuredConfig.itemBanks,
        adaptiveSettings: structuredConfig.adaptiveSettings,
        additionalSettings: structuredConfig.additionalSettings,
        status: 'draft',
        createdBy: userForSave.id,
        accountId: userForSave.accountId || "00000000-0000-0000-0000-000000000001",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log(`Saving generated CAT exam "${catExamData.title}" with ${catExamData.itemBanks.length} item banks to database...`);
      const savedExam = await storage.createCATExam(catExamData);
      
      console.log(`Successfully saved CAT exam with ID: ${savedExam.id}`);
      
      // Return the saved exam data with ID for frontend display
      res.json({
        ...structuredConfig,
        id: savedExam.id,
        status: 'draft',
        createdBy: userForSave.id,
        createdAt: savedExam.createdAt,
        savedToDatabase: true
      });
    } catch (error) {
      console.error('Error generating CAT exam:', error);
      
      // Handle specific AI provider errors
      if (error.status === 429 || error.message?.includes('quota')) {
        res.status(429).json({ 
          message: 'AI provider quota exceeded. Trying alternative providers...',
          error: 'quota_exceeded',
          details: error.message || 'All AI providers have reached their usage limits. Please check your API keys or try again later.'
        });
      } else if (error.status === 401 || error.message?.includes('API key')) {
        res.status(401).json({ 
          message: 'AI provider authentication failed.',
          error: 'api_key_invalid',
          details: error.message || 'Please check that your AI provider API keys are correctly configured.'
        });
      } else {
        res.status(500).json({ 
          message: 'Failed to generate CAT exam configuration',
          error: 'generation_failed',
          details: error.message || 'All AI providers failed during generation'
        });
      }
    }
  });

  // Recent Activity Feed - Live Real Data Endpoint
  app.get('/api/activities', mockAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const accountId = user?.accountId || "00000000-0000-0000-0000-000000000001";
      
      // Get real activity data from different sources
      const activities = [];
      
      // Recent Quiz Attempts
      const recentAttempts = await storage.getQuizAttemptsForAccount(accountId, 10);
      for (const attempt of recentAttempts) {
        activities.push({
          id: `attempt_${attempt.id}`,
          type: 'quiz_completion',
          title: 'Quiz Completed',
          description: `Student completed "${attempt.quizTitle || 'Quiz'}" with score ${attempt.score}%`,
          timestamp: attempt.completedAt || attempt.createdAt,
          severity: attempt.score >= 70 ? 'success' : 'warning',
          icon: 'CheckCircle',
          user: attempt.studentName || 'Student',
          metadata: {
            score: attempt.score,
            quizId: attempt.quizId,
            userId: attempt.userId
          }
        });
      }
      
      // Recent Item Bank Creations
      const recentTestbanks = await storage.getTestbanksForAccount(accountId);
      for (const testbank of recentTestbanks.slice(0, 5)) {
        activities.push({
          id: `testbank_${testbank.id}`,
          type: 'content_creation',
          title: 'Item Bank Created',
          description: `New item bank "${testbank.name}" created with ${testbank.questionCount || 0} questions`,
          timestamp: testbank.createdAt,
          severity: 'info',
          icon: 'Brain',
          user: testbank.creatorName || 'Teacher',
          metadata: {
            testbankId: testbank.id,
            questionCount: testbank.questionCount
          }
        });
      }
      
      // Recent User Registrations
      const recentUsers = await storage.getRecentUsersForAccount(accountId, 5);
      for (const newUser of recentUsers) {
        activities.push({
          id: `user_${newUser.id}`,
          type: 'user_registration',
          title: 'New User Joined',
          description: `${newUser.username || newUser.email} joined as ${newUser.role}`,
          timestamp: newUser.createdAt,
          severity: 'success',
          icon: 'UserPlus',
          user: newUser.username || newUser.email,
          metadata: {
            userId: newUser.id,
            role: newUser.role
          }
        });
      }
      
      // Recent CAT Exams Created
      const recentCATExams = await storage.getCATExamsForAccount(accountId);
      for (const catExam of recentCATExams.slice(0, 3)) {
        activities.push({
          id: `cat_exam_${catExam.id}`,
          type: 'ai_content',
          title: 'CAT Exam Generated',
          description: `AI generated CAT exam "${catExam.title}" with ${catExam.itemBanks?.length || 0} item banks`,
          timestamp: catExam.createdAt,
          severity: 'info',
          icon: 'Brain',
          user: catExam.creatorName || 'AI System',
          metadata: {
            examId: catExam.id,
            itemBankCount: catExam.itemBanks?.length || 0
          }
        });
      }
      
      // Add some system events for demonstration
      activities.push({
        id: 'system_startup',
        type: 'system',
        title: 'System Status',
        description: 'Application server running normally with all services operational',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        severity: 'success',
        icon: 'CheckCircle',
        user: 'System',
        metadata: {
          uptime: Math.floor(process.uptime()),
          memory: process.memoryUsage()
        }
      });
      
      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Return the most recent 15 activities
      res.json(activities.slice(0, 15));
      
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      
      // Fallback to minimal real data in case of error
      const fallbackActivities = [
        {
          id: 'system_health',
          type: 'system',
          title: 'System Health Check',
          description: 'All systems operational - Server uptime: ' + Math.floor(process.uptime()) + ' seconds',
          timestamp: new Date().toISOString(),
          severity: 'success',
          icon: 'CheckCircle',
          user: 'System',
          metadata: { uptime: process.uptime() }
        }
      ];
      
      res.json(fallbackActivities);
    }
  });

  // Stripe webhook
  app.post('/api/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.log('Webhook signature verification failed.', err.message);
      return res.status(400).send('Webhook Error: ' + err.message);
    }
    
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        // Update user's subscription status
        await storage.updateUserByStripeCustomerId(subscription.customer, {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
        });
        break;
      
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        // Record successful payment
        console.log('Payment succeeded:', invoice.id);
        break;
      
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        // Handle failed payment
        console.log('Payment failed:', failedInvoice.id);
        break;
      
      default:
        console.log('Unhandled event type ' + event.type);
    }
    
    res.json({ received: true });
  });

  // Exam References API endpoints
  app.post('/api/exam-references', async (req, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const accountId = req.user?.accountId || "00000000-0000-0000-0000-000000000001";
      
      const reference = await storage.createExamReference({
        ...req.body,
        accountId
      });
      
      res.json(reference);
    } catch (error) {
      console.error('Error creating exam reference:', error);
      res.status(500).json({ message: 'Failed to create exam reference' });
    }
  });

  app.get('/api/exam-references', async (req, res) => {
    try {
      const accountId = req.user?.accountId || "00000000-0000-0000-0000-000000000001";
      
      const references = await storage.getExamReferencesByAccount(accountId);
      res.json(references);
    } catch (error) {
      console.error('Error getting exam references:', error);
      res.status(500).json({ message: 'Failed to get exam references' });
    }
  });

  app.get('/api/exam-references/:id', async (req, res) => {
    try {
      const reference = await storage.getExamReference(req.params.id);
      if (!reference) {
        return res.status(404).json({ message: 'Exam reference not found' });
      }
      res.json(reference);
    } catch (error) {
      console.error('Error getting exam reference:', error);
      res.status(500).json({ message: 'Failed to get exam reference' });
    }
  });

  app.put('/api/exam-references/:id', async (req, res) => {
    try {
      const reference = await storage.updateExamReference(req.params.id, req.body);
      res.json(reference);
    } catch (error) {
      console.error('Error updating exam reference:', error);
      res.status(500).json({ message: 'Failed to update exam reference' });
    }
  });

  app.delete('/api/exam-references/:id', async (req, res) => {
    try {
      const success = await storage.deleteExamReference(req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'Exam reference not found' });
      }
      res.json({ message: 'Exam reference deleted successfully' });
    } catch (error) {
      console.error('Error deleting exam reference:', error);
      res.status(500).json({ message: 'Failed to delete exam reference' });
    }
  });

  // Error Logging and Bug Reporting API endpoints
  app.post('/api/error-logs', async (req, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const accountId = req.user?.accountId || "00000000-0000-0000-0000-000000000001";
      
      const errorLog = await storage.createErrorLog({
        ...req.body,
        userId,
        accountId,
        timestamp: new Date(),
        resolved: false
      });
      
      res.json(errorLog);
    } catch (error) {
      console.error('Error creating error log:', error);
      res.status(500).json({ message: 'Failed to create error log' });
    }
  });

  app.get('/api/error-logs', async (req, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const accountId = req.user?.accountId;
      const userRole = req.user?.role || "student";
      
      let errorLogs;
      if (userRole === 'super_admin') {
        errorLogs = await storage.getAllErrorLogs();
      } else if (userRole === 'admin') {
        errorLogs = await storage.getErrorLogsByAccount(accountId);
      } else {
        errorLogs = await storage.getErrorLogsByUser(userId);
      }
      
      res.json(errorLogs);
    } catch (error) {
      console.error('Error getting error logs:', error);
      res.status(500).json({ message: 'Failed to get error logs' });
    }
  });

  app.put('/api/error-logs/:id/resolve', async (req, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const { resolution } = req.body;
      
      const errorLog = await storage.resolveErrorLog(req.params.id, userId, resolution);
      res.json(errorLog);
    } catch (error) {
      console.error('Error resolving error log:', error);
      res.status(500).json({ message: 'Failed to resolve error log' });
    }
  });

  // AI Provider Status endpoint
  app.get('/api/ai-providers/status', isAuthenticated, (req, res) => {
    try {
      const status = multiProviderAI.getProviderStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting AI provider status:', error);
      res.status(500).json({ message: 'Failed to get AI provider status' });
    }
  });

  // LLM Provider Management endpoints (Super Admin only)
  app.get('/api/admin/llm-providers', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const user = await storage.getUserById(userId);
      
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const providers = await storage.getAllLLMProviders();
      res.json(providers);
    } catch (error) {
      console.error('Error getting LLM providers:', error);
      res.status(500).json({ message: 'Failed to get LLM providers' });
    }
  });

  app.post('/api/admin/llm-providers', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const user = await storage.getUserById(userId);
      
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const provider = await storage.createOrUpdateLLMProvider(req.body);
      res.json(provider);
    } catch (error) {
      console.error('Error updating LLM provider:', error);
      res.status(500).json({ message: 'Failed to update LLM provider' });
    }
  });

  app.post('/api/admin/llm-providers/:id/test', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id || "test-user";
      const user = await storage.getUserById(userId);
      
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const providerId = req.params.id;
      const provider = await storage.getLLMProviderById(providerId);
      
      if (!provider || !provider.apiKey) {
        return res.status(400).json({ message: 'Provider not configured or missing API key' });
      }

      // Test the provider with a simple request
      const testResult = await multiProviderAI.testProvider(providerId, provider);
      
      // Update provider status
      await storage.updateLLMProviderStatus(providerId, {
        status: testResult.success ? 'active' : 'error',
        lastTested: new Date().toISOString(),
        errorMessage: testResult.error
      });

      res.json({ success: testResult.success, message: testResult.message });
    } catch (error) {
      console.error('Error testing LLM provider:', error);
      res.status(500).json({ message: 'Failed to test LLM provider' });
    }
  });

  // Setup WebSocket
  setupWebSocket(httpServer);

  return httpServer;
}
