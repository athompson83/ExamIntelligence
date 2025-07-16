/**
 * Computer Adaptive Testing (CAT) Service
 * Implements IRT-based adaptive testing algorithms
 */

export interface CATSettings {
  catModel: string;
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
  categories: CATCategory[];
}

export interface CATCategory {
  categoryId: string;
  categoryName: string;
  testbankId: string;
  percentage: number;
  minQuestions: number;
  maxQuestions: number;
  targetProficiency: number;
}

export interface IRTParameters {
  difficulty: number;    // b parameter
  discrimination: number; // a parameter  
  guessing: number;      // c parameter (3PL)
  slipping: number;      // upper asymptote (4PL)
}

export interface CATState {
  abilityEstimate: number;
  standardError: number;
  questionsAsked: number;
  responses: boolean[];
  questionDifficulties: number[];
  confidenceInterval: [number, number];
}

export class CATService {
  /**
   * Calculate probability of correct response using 2PL model
   */
  static calculateProbability2PL(
    ability: number,
    difficulty: number, 
    discrimination: number
  ): number {
    const z = discrimination * (ability - difficulty);
    return 1 / (1 + Math.exp(-z));
  }

  /**
   * Calculate probability of correct response using 3PL model
   */
  static calculateProbability3PL(
    ability: number,
    difficulty: number,
    discrimination: number,
    guessing: number
  ): number {
    const prob2pl = this.calculateProbability2PL(ability, difficulty, discrimination);
    return guessing + (1 - guessing) * prob2pl;
  }

  /**
   * Calculate information function for an item
   */
  static calculateInformation(
    ability: number,
    irtParams: IRTParameters,
    model: string = '2pl'
  ): number {
    const { difficulty, discrimination, guessing } = irtParams;
    
    if (model === 'rasch') {
      // Rasch model (discrimination = 1)
      const prob = this.calculateProbability2PL(ability, difficulty, 1);
      return prob * (1 - prob);
    } else if (model === '2pl') {
      // 2-Parameter Logistic
      const prob = this.calculateProbability2PL(ability, difficulty, discrimination);
      return discrimination * discrimination * prob * (1 - prob);
    } else if (model === '3pl') {
      // 3-Parameter Logistic
      const prob = this.calculateProbability3PL(ability, difficulty, discrimination, guessing);
      const prob2pl = this.calculateProbability2PL(ability, difficulty, discrimination);
      return (discrimination * discrimination * prob2pl * (1 - prob2pl)) / 
             ((1 - guessing) * (1 - guessing)) * 
             ((prob - guessing) * (prob - guessing)) / 
             (prob * (1 - prob));
    }
    
    return 0;
  }

  /**
   * Select next item using Maximum Information criterion
   */
  static selectNextItem(
    availableItems: Array<{id: string, irtParams: IRTParameters}>,
    currentAbility: number,
    catModel: string = '2pl'
  ): string | null {
    if (availableItems.length === 0) return null;

    let maxInformation = -1;
    let selectedItemId = null;

    for (const item of availableItems) {
      const information = this.calculateInformation(currentAbility, item.irtParams, catModel);
      
      if (information > maxInformation) {
        maxInformation = information;
        selectedItemId = item.id;
      }
    }

    return selectedItemId;
  }

  /**
   * Update ability estimate using EAP (Expected A Posteriori)
   */
  static updateAbilityEAP(
    responses: boolean[],
    questionParams: IRTParameters[],
    catModel: string = '2pl'
  ): { ability: number; standardError: number } {
    // Simplified EAP implementation
    // In production, this would use quadrature integration
    
    const minTheta = -4;
    const maxTheta = 4;
    const numQuads = 40;
    const step = (maxTheta - minTheta) / numQuads;
    
    let numerator = 0;
    let denominator = 0;
    let numeratorSquared = 0;
    
    for (let i = 0; i <= numQuads; i++) {
      const theta = minTheta + i * step;
      const prior = this.normalPDF(theta, 0, 1); // Standard normal prior
      
      let likelihood = 1;
      for (let j = 0; j < responses.length; j++) {
        const prob = catModel === '3pl' 
          ? this.calculateProbability3PL(theta, questionParams[j].difficulty, questionParams[j].discrimination, questionParams[j].guessing)
          : this.calculateProbability2PL(theta, questionParams[j].difficulty, questionParams[j].discrimination);
        
        likelihood *= responses[j] ? prob : (1 - prob);
      }
      
      const posterior = likelihood * prior;
      numerator += theta * posterior * step;
      numeratorSquared += theta * theta * posterior * step;
      denominator += posterior * step;
    }
    
    const ability = numerator / denominator;
    const variance = (numeratorSquared / denominator) - (ability * ability);
    const standardError = Math.sqrt(variance);
    
    return { ability, standardError };
  }

  /**
   * Normal probability density function
   */
  static normalPDF(x: number, mean: number, stdDev: number): number {
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
           Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
  }

  /**
   * Check termination criteria
   */
  static shouldTerminate(
    catState: CATState,
    settings: CATSettings
  ): boolean {
    // Check minimum questions
    if (catState.questionsAsked < settings.minQuestions) {
      return false;
    }
    
    // Check maximum questions
    if (catState.questionsAsked >= settings.maxQuestions) {
      return true;
    }
    
    // Check standard error threshold
    if (catState.standardError <= settings.terminationCriteria.standardError) {
      return true;
    }
    
    return false;
  }

  /**
   * Initialize CAT session
   */
  static initializeSession(settings: CATSettings): CATState {
    return {
      abilityEstimate: settings.initialDifficulty,
      standardError: 1.0, // High initial uncertainty
      questionsAsked: 0,
      responses: [],
      questionDifficulties: [],
      confidenceInterval: [settings.initialDifficulty - 1.96, settings.initialDifficulty + 1.96]
    };
  }

  /**
   * Process response and update CAT state
   */
  static processResponse(
    catState: CATState,
    response: boolean,
    questionParams: IRTParameters,
    settings: CATSettings
  ): CATState {
    const newResponses = [...catState.responses, response];
    const newDifficulties = [...catState.questionDifficulties, questionParams.difficulty];
    
    // Update ability estimate
    const allQuestionParams = newDifficulties.map((difficulty, index) => ({
      difficulty,
      discrimination: questionParams.discrimination, // Simplified - would track per question
      guessing: questionParams.guessing,
      slipping: questionParams.slipping
    }));
    
    const { ability, standardError } = this.updateAbilityEAP(
      newResponses,
      allQuestionParams,
      settings.catModel
    );
    
    // Calculate confidence interval
    const marginOfError = 1.96 * standardError;
    const confidenceInterval: [number, number] = [
      ability - marginOfError,
      ability + marginOfError
    ];
    
    return {
      abilityEstimate: ability,
      standardError,
      questionsAsked: catState.questionsAsked + 1,
      responses: newResponses,
      questionDifficulties: newDifficulties,
      confidenceInterval
    };
  }

  /**
   * Get final score based on scoring method
   */
  static getFinalScore(
    catState: CATState,
    settings: CATSettings,
    scaledScoreRange: { min: number; max: number } = { min: 200, max: 800 }
  ): number {
    const { abilityEstimate } = catState;
    
    if (settings.scoringMethod === 'scaled') {
      // Convert theta to scaled score (e.g., 200-800 scale)
      const minTheta = -3;
      const maxTheta = 3;
      const scaledScore = scaledScoreRange.min + 
        ((abilityEstimate - minTheta) / (maxTheta - minTheta)) * 
        (scaledScoreRange.max - scaledScoreRange.min);
      
      return Math.round(Math.max(scaledScoreRange.min, Math.min(scaledScoreRange.max, scaledScore)));
    } else if (settings.scoringMethod === 'percent') {
      // Convert to percentage (simplified)
      const probability = this.calculateProbability2PL(abilityEstimate, 0, 1);
      return Math.round(probability * 100);
    }
    
    // Return raw theta score
    return Math.round(abilityEstimate * 100) / 100;
  }

  /**
   * Generate performance report
   */
  static generateReport(
    catState: CATState,
    settings: CATSettings
  ): {
    finalScore: number;
    abilityEstimate: number;
    standardError: number;
    confidenceInterval: [number, number];
    questionsAnswered: number;
    accuracy: number;
    performance: string;
  } {
    const finalScore = this.getFinalScore(catState, settings);
    const accuracy = catState.responses.filter(r => r).length / catState.responses.length;
    
    let performance = 'Average';
    if (catState.abilityEstimate > 1) performance = 'Above Average';
    if (catState.abilityEstimate > 2) performance = 'High';
    if (catState.abilityEstimate < -1) performance = 'Below Average';
    if (catState.abilityEstimate < -2) performance = 'Low';
    
    return {
      finalScore,
      abilityEstimate: catState.abilityEstimate,
      standardError: catState.standardError,
      confidenceInterval: catState.confidenceInterval,
      questionsAnswered: catState.questionsAsked,
      accuracy: Math.round(accuracy * 100),
      performance
    };
  }
}