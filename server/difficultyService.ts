import { storage } from './storage';

export interface DifficultyRange {
  min: number;
  max: number;
  label: string;
}

// Difficulty mapping based on your specifications
export const DIFFICULTY_RANGES: Record<number, DifficultyRange> = {
  1: { min: 90, max: 100, label: "Very Easy (90%+ correct)" },
  2: { min: 80, max: 89, label: "Easy (80-89% correct)" },
  3: { min: 70, max: 79, label: "Moderate (70-79% correct)" },
  4: { min: 60, max: 69, label: "Somewhat Hard (60-69% correct)" },
  5: { min: 50, max: 59, label: "Hard (50-59% correct)" },
  6: { min: 40, max: 49, label: "Very Hard (40-49% correct)" },
  7: { min: 30, max: 39, label: "Extremely Hard (30-39% correct)" },
  8: { min: 20, max: 29, label: "Nearly Impossible (20-29% correct)" },
  9: { min: 10, max: 19, label: "Expert Only (10-19% correct)" },
  10: { min: 0, max: 9, label: "Master Level (<10% correct)" }
};

export class DifficultyService {
  /**
   * Calculate the appropriate difficulty score based on accuracy percentage
   */
  static calculateDifficultyFromAccuracy(accuracyPercentage: number): number {
    for (const [difficulty, range] of Object.entries(DIFFICULTY_RANGES)) {
      if (accuracyPercentage >= range.min && accuracyPercentage <= range.max) {
        return parseInt(difficulty);
      }
    }
    
    // Default to middle difficulty if no match
    return 5;
  }

  /**
   * Update question difficulty based on response data
   */
  static async updateQuestionDifficulty(questionId: string): Promise<void> {
    try {
      // Get current question data
      const question = await storage.getQuestionById(questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      // Calculate accuracy percentage
      const accuracyPercentage = question.totalResponsesCount > 0 
        ? (question.correctResponsesCount / question.totalResponsesCount) * 100 
        : 0;

      // Only update if we have meaningful data (at least 5 responses)
      if (question.totalResponsesCount < 5) {
        return;
      }

      // Calculate new difficulty
      const newDifficulty = this.calculateDifficultyFromAccuracy(accuracyPercentage);

      // Update the question with new difficulty
      await storage.updateQuestion(questionId, {
        currentDifficultyScore: newDifficulty,
        accuracyPercentage: accuracyPercentage,
        lastDifficultyUpdate: new Date(),
      });

      console.log(`Updated question ${questionId} difficulty: ${question.currentDifficultyScore} → ${newDifficulty} (${accuracyPercentage.toFixed(1)}% accuracy)`);
    } catch (error) {
      console.error('Error updating question difficulty:', error);
    }
  }

  /**
   * Process quiz response and update question statistics
   */
  static async processQuestionResponse(
    questionId: string, 
    isCorrect: boolean, 
    isPilotQuestion: boolean = false
  ): Promise<void> {
    try {
      const question = await storage.getQuestionById(questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      // Update response counts
      const updates: any = {
        totalResponsesCount: (question.totalResponsesCount || 0) + 1,
        correctResponsesCount: (question.correctResponsesCount || 0) + (isCorrect ? 1 : 0),
      };

      // Handle pilot question logic
      if (isPilotQuestion || question.isPilotQuestion) {
        updates.pilotResponsesCount = (question.pilotResponsesCount || 0) + 1;
        
        // Check if pilot validation is complete
        if (updates.pilotResponsesCount >= (question.pilotResponsesNeeded || 30)) {
          updates.pilotValidated = true;
          updates.pilotValidationDate = new Date();
          console.log(`Pilot question ${questionId} validation complete with ${updates.pilotResponsesCount} responses`);
        }
      }

      // Update the question
      await storage.updateQuestion(questionId, updates);

      // Update difficulty if we have enough responses
      await this.updateQuestionDifficulty(questionId);
    } catch (error) {
      console.error('Error processing question response:', error);
    }
  }

  /**
   * Get pilot questions that need validation
   */
  static async getPilotQuestionsNeedingValidation(testbankId?: string): Promise<any[]> {
    try {
      // This would need to be implemented in storage
      return await storage.getPilotQuestionsNeedingValidation(testbankId);
    } catch (error) {
      console.error('Error getting pilot questions:', error);
      return [];
    }
  }

  /**
   * Mark question as pilot question
   */
  static async markQuestionAsPilot(
    questionId: string, 
    responsesNeeded: number = 30
  ): Promise<void> {
    try {
      await storage.updateQuestion(questionId, {
        isPilotQuestion: true,
        pilotResponsesNeeded: responsesNeeded,
        pilotResponsesCount: 0,
        pilotValidated: false,
      });
      
      console.log(`Question ${questionId} marked as pilot (${responsesNeeded} responses needed)`);
    } catch (error) {
      console.error('Error marking question as pilot:', error);
    }
  }

  /**
   * Get difficulty statistics for a testbank
   */
  static async getTestbankDifficultyStats(testbankId: string): Promise<any> {
    try {
      const questions = await storage.getQuestionsByTestbank(testbankId);
      
      const stats = {
        totalQuestions: questions.length,
        pilotQuestions: questions.filter(q => q.isPilotQuestion && !q.pilotValidated).length,
        validatedPilots: questions.filter(q => q.isPilotQuestion && q.pilotValidated).length,
        difficultyDistribution: {} as Record<number, number>,
        averageAccuracy: 0,
        questionsNeedingUpdate: questions.filter(q => 
          q.totalResponsesCount >= 5 && 
          (!q.lastDifficultyUpdate || 
           new Date().getTime() - new Date(q.lastDifficultyUpdate).getTime() > 7 * 24 * 60 * 60 * 1000)
        ).length,
      };

      // Calculate difficulty distribution
      for (let i = 1; i <= 10; i++) {
        stats.difficultyDistribution[i] = questions.filter(q => 
          Math.round(q.currentDifficultyScore || q.difficultyScore || 5) === i
        ).length;
      }

      // Calculate average accuracy
      const questionsWithData = questions.filter(q => q.totalResponsesCount > 0);
      if (questionsWithData.length > 0) {
        stats.averageAccuracy = questionsWithData.reduce((sum, q) => 
          sum + (q.accuracyPercentage || 0), 0
        ) / questionsWithData.length;
      }

      return stats;
    } catch (error) {
      console.error('Error getting testbank difficulty stats:', error);
      return null;
    }
  }

  /**
   * Select questions for adaptive testing based on student performance
   */
  static selectAdaptiveQuestions(
    availableQuestions: any[],
    studentPerformanceLevel: number = 5,
    questionCount: number = 10
  ): any[] {
    // Sort questions by how close their difficulty is to student performance level
    const sortedQuestions = availableQuestions
      .filter(q => !q.isPilotQuestion || q.pilotValidated) // Only use validated questions
      .sort((a, b) => {
        const aDiff = Math.abs((a.currentDifficultyScore || a.difficultyScore || 5) - studentPerformanceLevel);
        const bDiff = Math.abs((b.currentDifficultyScore || b.difficultyScore || 5) - studentPerformanceLevel);
        return aDiff - bDiff;
      });

    // Select the best matching questions
    return sortedQuestions.slice(0, questionCount);
  }

  /**
   * Add pilot questions to an exam (5-10% of total questions)
   */
  static addPilotQuestionsToExam(
    selectedQuestions: any[],
    availablePilotQuestions: any[]
  ): any[] {
    const pilotCount = Math.max(1, Math.floor(selectedQuestions.length * 0.1)); // 10% pilot questions
    const pilotQuestions = availablePilotQuestions
      .filter(q => q.isPilotQuestion && !q.pilotValidated)
      .slice(0, pilotCount);

    return [...selectedQuestions, ...pilotQuestions];
  }
}