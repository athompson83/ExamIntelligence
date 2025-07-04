import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  insertProctoringLogSchema,
  insertValidationLogSchema,
  insertAiResourceSchema,
  insertNotificationSchema,
  insertReferenceBankSchema,
  insertReferenceSchema,
  insertAccountSchema,
  insertScheduledAssignmentSchema,
  insertAssignmentSubmissionSchema,
  insertStudyAidSchema,
  insertMobileDeviceSchema,
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
import { z } from "zod";

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

  // Mock auth for testing
  const mockUser = {
    id: "test-user",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    accountId: "default-account",
    role: "teacher"
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

  // API Key check route
  app.get('/api/check-openai-key', async (req, res) => {
    try {
      const hasKey = !!process.env.OPENAI_API_KEY;
      res.json({ available: hasKey });
    } catch (error) {
      res.status(500).json({ available: false });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', async (req: any, res) => {
    try {
      const userId = "test-user"; // Mock user ID for testing
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Testbank routes
  app.post('/api/testbanks',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
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

  app.get('/api/testbanks',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const testbanks = await storage.getTestbanksByUser(userId);
      res.json(testbanks);
    } catch (error) {
      console.error("Error fetching testbanks:", error);
      res.status(500).json({ message: "Failed to fetch testbanks" });
    }
  });

  app.get('/api/testbanks/:id',  async (req: any, res) => {
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

  app.put('/api/testbanks/:id',  async (req: any, res) => {
    try {
      const testbankData = insertTestbankSchema.partial().parse(req.body);
      const testbank = await storage.updateTestbank(req.params.id, testbankData);
      res.json(testbank);
    } catch (error) {
      console.error("Error updating testbank:", error);
      res.status(400).json({ message: "Failed to update testbank" });
    }
  });

  app.delete('/api/testbanks/:id',  async (req: any, res) => {
    try {
      await storage.deleteTestbank(req.params.id);
      res.json({ message: "Testbank deleted successfully" });
    } catch (error) {
      console.error("Error deleting testbank:", error);
      res.status(500).json({ message: "Failed to delete testbank" });
    }
  });

  // Question routes
  app.post('/api/questions',  async (req: any, res) => {
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

  app.delete('/api/questions/:id',  async (req: any, res) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // AI Question Generation routes
  app.post('/api/testbanks/:id/generate-questions',  upload.any(), async (req: any, res) => {
    try {
      // Parse the data from the multipart form
      const data = JSON.parse(req.body.data || '{}');
      
      console.log("Received AI generation request:", JSON.stringify(data, null, 2)); // Debug log
      console.log("Files received:", req.files?.length || 0); // Debug log
      
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
        questionStyle: data.questionStyle || "formal",
        includeImages: data.includeImages || false,
        includeMultimedia: data.includeMultimedia || false,
        customInstructions: data.customInstructions,
        testbankId: req.params.id
      });

      // Save generated questions to database
      const savedQuestions = [];
      for (const generatedQuestion of generatedQuestions) {
        const questionData = insertQuestionSchema.parse({
          ...generatedQuestion,
          testbankId: req.params.id,
          creatorId: req.user.claims?.sub || req.user.id,
          // Convert numeric values to strings for validation
          points: generatedQuestion.points?.toString() || "1.00",
          difficultyScore: generatedQuestion.difficultyScore?.toString() || "5.0",
          aiConfidenceScore: generatedQuestion.aiConfidenceScore?.toString() || "0.75",
        });
        
        const question = await storage.createQuestion(questionData);
        
        // Create answer options if provided
        if (generatedQuestion.answerOptions && Array.isArray(generatedQuestion.answerOptions)) {
          for (const option of generatedQuestion.answerOptions) {
            const optionData = insertAnswerOptionSchema.parse({
              ...option,
              questionId: question.id,
            });
            await storage.createAnswerOption(optionData);
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
  app.post('/api/testbanks/:id/questions',  async (req: any, res) => {
    try {
      const questionData = insertQuestionSchema.parse({
        ...req.body,
        testbankId: req.params.id,
        creatorId: req.user.claims?.sub || req.user.id,
      });
      
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

  app.post('/api/questions/:id/similar',  async (req: any, res) => {
    try {
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
          creatorId: req.user.id,
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
  app.post('/api/quizzes',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.accountId) {
        return res.status(400).json({ message: "User account not found" });
      }

      const quizData = insertQuizSchema.parse({
        ...req.body,
        creatorId: userId,
        accountId: user.accountId,
        // Handle date fields properly
        availableFrom: req.body.availableFrom ? new Date(req.body.availableFrom) : null,
        availableUntil: req.body.availableUntil ? new Date(req.body.availableUntil) : null,
        lockAt: req.body.lockAt ? new Date(req.body.lockAt) : null,
        unlockAt: req.body.unlockAt ? new Date(req.body.unlockAt) : null,
      });
      
      const quiz = await storage.createQuiz(quizData);
      res.json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(400).json({ message: "Failed to create quiz" });
    }
  });

  app.get('/api/quizzes',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const quizzes = await storage.getQuizzesByUser(userId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get('/api/quizzes/:id',  async (req: any, res) => {
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

  app.get('/api/ai/resources',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const resources = await storage.getAiResourcesByUser(userId);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching AI resources:", error);
      res.status(500).json({ message: "Failed to fetch AI resources" });
    }
  });

  // Notification routes
  app.get('/api/notifications',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
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
  app.get('/api/study-aids',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const studyAids = await storage.getStudyAidsByStudent(userId);
      res.json(studyAids);
    } catch (error) {
      console.error("Error fetching study aids:", error);
      res.status(500).json({ message: "Failed to fetch study aids" });
    }
  });

  app.post('/api/study-aids',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
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
  app.get('/api/study-aids',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const studyAids = await storage.getStudyAidsByUser(userId);
      res.json(studyAids);
    } catch (error) {
      console.error("Error fetching study aids:", error);
      res.status(500).json({ message: "Failed to fetch study aids" });
    }
  });

  app.post('/api/study-aids/generate',  async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { type, quizId, title, customPrompt } = req.body;

      if (!type || !quizId || !title) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get quiz information for context
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Generate AI content based on type
      let content = "";
      try {
        content = await generateStudyGuide(title, type, quizId);
      } catch (error) {
        console.error("AI generation error:", error);
        content = `Study aid content for ${title}\n\nThis is a ${type} based on your quiz: ${quiz.title}\n\n${customPrompt || 'Please review your quiz materials and create your own study notes.'}`;
      }

      const studyAidData = insertStudyAidSchema.parse({
        title,
        type,
        content,
        quizId,
        userId,
        customPrompt: customPrompt || null,
      });

      const studyAid = await storage.createStudyAid(studyAidData);
      res.json(studyAid);
    } catch (error) {
      console.error("Error generating study aid:", error);
      res.status(500).json({ message: "Failed to generate study aid" });
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
  
  // Setup WebSocket
  setupWebSocket(httpServer);

  return httpServer;
}
