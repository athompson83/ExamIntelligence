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
  insertPromptTemplateSchema,
  insertLlmProviderSchema,
  insertCustomInstructionSchema,
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
import { DifficultyService } from "./difficultyService";
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
    role: "super_admin"
  };

  // Mock authentication middleware
  const mockAuth = (req: any, res: any, next: any) => {
    req.user = mockUser;
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

  app.get('/api/testbanks', async (req: any, res) => {
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
      for (const generatedQuestion of generatedQuestions) {
        const questionData = insertQuestionSchema.parse({
          ...generatedQuestion,
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
            const optionData = insertAnswerOptionSchema.parse({
              ...option,
              questionId: question.id,
            });
            await storage.createAnswerOption(optionData);
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
        const questionData = insertQuestionSchema.parse({
          ...generatedQuestion,
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
  app.get('/api/super-admin/prompt-templates', async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const templates = await storage.getAllPromptTemplatesWithStats();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching prompt templates:', error);
      res.status(500).json({ message: 'Failed to fetch prompt templates' });
    }
  });

  // Create prompt template (super admin only)
  app.post('/api/super-admin/prompt-templates', async (req: any, res) => {
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
  app.put('/api/super-admin/prompt-templates/:id', async (req: any, res) => {
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

  // Get all LLM providers across accounts (super admin only)
  app.get('/api/super-admin/llm-providers', async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const providers = await storage.getAllLLMProvidersWithAccountInfo();
      res.json(providers);
    } catch (error) {
      console.error('Error fetching LLM providers:', error);
      res.status(500).json({ message: 'Failed to fetch LLM providers' });
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

  // Setup WebSocket
  setupWebSocket(httpServer);

  return httpServer;
}
