import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupWebSocket } from "./websocket";
import { 
  insertTestbankSchema, 
  insertQuestionSchema, 
  insertQuizSchema, 
  insertQuizAttemptSchema,
  insertAnswerOptionSchema,
  insertQuizResponseSchema,
  insertProctoringLogSchema,
  insertValidationLogSchema,
  insertAiResourceSchema,
  insertNotificationSchema,
} from "@shared/schema";
import { validateQuestion, generateStudyGuide, generateImprovementPlan } from "./aiService";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Testbank routes
  app.post('/api/testbanks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const testbankData = insertTestbankSchema.parse({
        ...req.body,
        creatorId: userId,
      });
      
      const testbank = await storage.createTestbank(testbankData);
      res.json(testbank);
    } catch (error) {
      console.error("Error creating testbank:", error);
      res.status(400).json({ message: "Failed to create testbank" });
    }
  });

  app.get('/api/testbanks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const testbanks = await storage.getTestbanksByUser(userId);
      res.json(testbanks);
    } catch (error) {
      console.error("Error fetching testbanks:", error);
      res.status(500).json({ message: "Failed to fetch testbanks" });
    }
  });

  app.get('/api/testbanks/:id', isAuthenticated, async (req: any, res) => {
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

  app.put('/api/testbanks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const testbankData = insertTestbankSchema.partial().parse(req.body);
      const testbank = await storage.updateTestbank(req.params.id, testbankData);
      res.json(testbank);
    } catch (error) {
      console.error("Error updating testbank:", error);
      res.status(400).json({ message: "Failed to update testbank" });
    }
  });

  app.delete('/api/testbanks/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteTestbank(req.params.id);
      res.json({ message: "Testbank deleted successfully" });
    } catch (error) {
      console.error("Error deleting testbank:", error);
      res.status(500).json({ message: "Failed to delete testbank" });
    }
  });

  // Question routes
  app.post('/api/questions', isAuthenticated, async (req: any, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      
      // Create answer options if provided
      if (req.body.answerOptions && Array.isArray(req.body.answerOptions)) {
        for (const option of req.body.answerOptions) {
          const optionData = insertAnswerOptionSchema.parse({
            ...option,
            questionId: question.id,
          });
          await storage.createAnswerOption(optionData);
        }
      }
      
      res.json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(400).json({ message: "Failed to create question" });
    }
  });

  app.get('/api/testbanks/:id/questions', isAuthenticated, async (req: any, res) => {
    try {
      const questions = await storage.getQuestionsByTestbank(req.params.id);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get('/api/questions/:id', isAuthenticated, async (req: any, res) => {
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

  app.put('/api/questions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const questionData = insertQuestionSchema.partial().parse(req.body);
      const question = await storage.updateQuestion(req.params.id, questionData);
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(400).json({ message: "Failed to update question" });
    }
  });

  app.delete('/api/questions/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // AI Validation routes
  app.post('/api/questions/:id/validate', isAuthenticated, async (req: any, res) => {
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

  // Quiz routes
  app.post('/api/quizzes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quizData = insertQuizSchema.parse({
        ...req.body,
        creatorId: userId,
      });
      
      const quiz = await storage.createQuiz(quizData);
      res.json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(400).json({ message: "Failed to create quiz" });
    }
  });

  app.get('/api/quizzes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quizzes = await storage.getQuizzesByUser(userId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get('/api/quizzes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  // Quiz attempt routes
  app.post('/api/quizzes/:id/attempts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/quizzes/:id/attempts', isAuthenticated, async (req: any, res) => {
    try {
      const attempts = await storage.getActiveQuizAttempts(req.params.id);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  app.put('/api/attempts/:id', isAuthenticated, async (req: any, res) => {
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
  app.post('/api/attempts/:id/responses', isAuthenticated, async (req: any, res) => {
    try {
      const responseData = insertQuizResponseSchema.parse({
        ...req.body,
        attemptId: req.params.id,
      });
      
      const response = await storage.createQuizResponse(responseData);
      res.json(response);
    } catch (error) {
      console.error("Error creating quiz response:", error);
      res.status(400).json({ message: "Failed to create quiz response" });
    }
  });

  // Proctoring routes
  app.post('/api/proctoring/logs', isAuthenticated, async (req: any, res) => {
    try {
      const logData = insertProctoringLogSchema.parse(req.body);
      const log = await storage.createProctoringLog(logData);
      res.json(log);
    } catch (error) {
      console.error("Error creating proctoring log:", error);
      res.status(400).json({ message: "Failed to create proctoring log" });
    }
  });

  app.get('/api/proctoring/logs/unresolved', isAuthenticated, async (req: any, res) => {
    try {
      const logs = await storage.getUnresolvedProctoringLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching unresolved proctoring logs:", error);
      res.status(500).json({ message: "Failed to fetch unresolved proctoring logs" });
    }
  });

  app.put('/api/proctoring/logs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post('/api/ai/study-guide', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post('/api/ai/improvement-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/ai/resources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const resources = await storage.getAiResourcesByUser(userId);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching AI resources:", error);
      res.status(500).json({ message: "Failed to fetch AI resources" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/quiz/:id', isAuthenticated, async (req: any, res) => {
    try {
      const analytics = await storage.getQuizAnalytics(req.params.id);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching quiz analytics:", error);
      res.status(500).json({ message: "Failed to fetch quiz analytics" });
    }
  });

  app.get('/api/analytics/testbank/:id', isAuthenticated, async (req: any, res) => {
    try {
      const analytics = await storage.getTestbankAnalytics(req.params.id);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching testbank analytics:", error);
      res.status(500).json({ message: "Failed to fetch testbank analytics" });
    }
  });

  // Admin Settings Routes
  app.get('/api/admin/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.put('/api/admin/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post('/api/admin/test-api-key', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  
  // Setup WebSocket
  setupWebSocket(httpServer);

  return httpServer;
}
