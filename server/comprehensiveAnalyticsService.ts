import OpenAI from "openai";
import { storage } from "./storage";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, avg, sum, isNull, isNotNull } from "drizzle-orm";
import { 
  quizzes, 
  quizAttempts, 
  questions, 
  quizResponses, 
  answerOptions, 
  users,
  testbanks,
  validationLogs
} from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ==================== INTERFACES ====================

// 1. Item Analysis Reports
export interface ItemAnalysisReport {
  questionId: string;
  questionText: string;
  difficultyIndex: number; // P-value (% who answered correctly)
  discriminationIndex: number; // How well it differentiates high vs low performers
  pointBiserialCorrelation: number; // Correlation with overall exam score
  distractorAnalysis: DistractorAnalysis[];
  totalResponses: number;
  correctResponses: number;
  averageTimeSpent: number;
  flaggedForReview: boolean;
}

export interface DistractorAnalysis {
  optionText: string;
  optionId: string;
  isCorrect: boolean;
  selectionCount: number;
  selectionPercentage: number;
  averageScoreOfSelectors: number;
}

// 2. Test Reliability & Validity Analytics
export interface ReliabilityValidityReport {
  quizId: string;
  quizTitle: string;
  cronbachsAlpha: number;
  kr20: number;
  kr21: number;
  standardErrorOfMeasurement: number;
  contentValidityMapping: ContentValidityMapping[];
  totalQuestions: number;
  averageItemDifficulty: number;
  averageDiscrimination: number;
}

export interface ContentValidityMapping {
  competencyId: string;
  competencyName: string;
  questionsCount: number;
  averagePerformance: number;
  alignmentScore: number;
}

// 3. Performance & Outcome Reports
export interface PerformanceOutcomeReport {
  quizId: string;
  quizTitle: string;
  scoreDistribution: ScoreDistribution;
  passFailRates: PassFailRates;
  masteryReports: MasteryReport[];
  gradebookData: GradebookEntry[];
  performanceMetrics: PerformanceMetrics;
}

export interface ScoreDistribution {
  mean: number;
  median: number;
  mode: number;
  standardDeviation: number;
  minimum: number;
  maximum: number;
  quartiles: number[];
  histogram: HistogramBin[];
}

export interface HistogramBin {
  range: string;
  count: number;
  percentage: number;
}

export interface PassFailRates {
  passingThreshold: number;
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  passRate: number;
  failRate: number;
}

export interface MasteryReport {
  learningObjective: string;
  studentsAttempted: number;
  studentsMastered: number;
  masteryPercentage: number;
  averageScore: number;
  questionsInObjective: number;
}

export interface GradebookEntry {
  studentId: string;
  studentName: string;
  email: string;
  score: number;
  percentage: number;
  timeSpent: number;
  attemptDate: Date;
  passed: boolean;
  masteredObjectives: string[];
}

export interface PerformanceMetrics {
  totalAttempts: number;
  averageScore: number;
  averageTimeSpent: number;
  completionRate: number;
  retakeRate: number;
}

// 4. Question Bank Health & Utilization Reports
export interface QuestionBankHealthReport {
  testbankId: string;
  testbankName: string;
  totalQuestions: number;
  activeQuestions: number;
  retiredQuestions: number;
  questionUtilization: QuestionUtilization[];
  questionLifecycle: QuestionLifecycleData[];
  validationStatus: ValidationStatusData[];
  healthScore: number;
}

export interface QuestionUtilization {
  questionId: string;
  questionText: string;
  usageCount: number;
  lastUsed: Date;
  averagePerformance: number;
  flaggedCount: number;
  needsReview: boolean;
}

export interface QuestionLifecycleData {
  questionId: string;
  questionText: string;
  createdAt: Date;
  lastReviewed: Date;
  lastValidated: Date;
  retiredAt: Date | null;
  lifecycle: string;
  ageInDays: number;
}

export interface ValidationStatusData {
  questionId: string;
  questionText: string;
  lastValidated: Date;
  validationScore: number;
  validationStatus: string;
  needsRevalidation: boolean;
  daysOverdue: number;
}

// 5. Learner Behavior & Engagement Analytics
export interface LearnerBehaviorReport {
  quizId: string;
  quizTitle: string;
  timeAnalytics: TimeAnalytics;
  engagementMetrics: EngagementMetrics;
  behaviorPatterns: BehaviorPattern[];
  questionSkippingPatterns: QuestionSkippingPattern[];
}

export interface TimeAnalytics {
  averageTestTime: number;
  medianTestTime: number;
  timeDistribution: TimeDistribution[];
  timePerQuestion: TimePerQuestion[];
  fastestCompletion: number;
  slowestCompletion: number;
}

export interface TimeDistribution {
  timeRange: string;
  count: number;
  percentage: number;
}

export interface TimePerQuestion {
  questionId: string;
  questionText: string;
  averageTime: number;
  medianTime: number;
  timeVariation: number;
  tooFastCount: number;
  tooSlowCount: number;
}

export interface EngagementMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  completionRate: number;
  retakeRate: number;
  averageAttempts: number;
}

export interface BehaviorPattern {
  patternType: string;
  description: string;
  frequency: number;
  studentsAffected: number;
  impact: 'positive' | 'negative' | 'neutral';
  recommendations: string[];
}

export interface QuestionSkippingPattern {
  questionId: string;
  questionText: string;
  timesSkipped: number;
  skipPercentage: number;
  returnedToCount: number;
  finalSkipCount: number;
  difficulty: number;
}

// 6. Adaptive & AI Analytics
export interface AdaptiveAIAnalytics {
  quizId: string;
  quizTitle: string;
  aiConfidenceMetrics: AIConfidenceMetrics;
  adaptivePathReporting: AdaptivePathReport[];
  aiQualityAssessment: AIQualityAssessment[];
  intelligentRecommendations: IntelligentRecommendation[];
}

export interface AIConfidenceMetrics {
  overallConfidence: number;
  questionQualityConfidence: number;
  alignmentConfidence: number;
  biasDetectionConfidence: number;
  recommendationConfidence: number;
}

export interface AdaptivePathReport {
  studentId: string;
  studentName: string;
  pathTaken: PathStep[];
  adaptiveScore: number;
  efficiencyScore: number;
  recommendedNextSteps: string[];
}

export interface PathStep {
  stepNumber: number;
  questionId: string;
  difficulty: number;
  correct: boolean;
  timeSpent: number;
  adaptiveReason: string;
}

export interface AIQualityAssessment {
  questionId: string;
  questionText: string;
  aiQualityScore: number;
  qualityFactors: QualityFactor[];
  improvementSuggestions: string[];
  flaggedIssues: string[];
}

export interface QualityFactor {
  factor: string;
  score: number;
  description: string;
}

export interface IntelligentRecommendation {
  type: 'curriculum' | 'question' | 'student' | 'system';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  evidence: string[];
  actionItems: string[];
  expectedImpact: string;
}

// 7. Cohort & Comparative Analytics
export interface CohortComparativeReport {
  comparisonType: string;
  cohorts: CohortData[];
  comparativeMetrics: ComparativeMetrics;
  benchmarkingData: BenchmarkingData[];
  prePostAnalysis: PrePostAnalysis[];
  demographicAnalysis: DemographicAnalysis[];
}

export interface CohortData {
  cohortId: string;
  cohortName: string;
  studentCount: number;
  averageScore: number;
  passRate: number;
  completionRate: number;
  averageTime: number;
  performanceLevel: string;
}

export interface ComparativeMetrics {
  significanceTests: SignificanceTest[];
  effectSizes: EffectSize[];
  confidenceIntervals: ConfidenceInterval[];
  performanceGaps: PerformanceGap[];
}

export interface SignificanceTest {
  comparison: string;
  testType: string;
  pValue: number;
  isSignificant: boolean;
  interpretation: string;
}

export interface EffectSize {
  comparison: string;
  effectSize: number;
  interpretation: string;
  practicalSignificance: string;
}

export interface ConfidenceInterval {
  metric: string;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
}

export interface PerformanceGap {
  comparison: string;
  gap: number;
  gapType: string;
  recommendations: string[];
}

export interface BenchmarkingData {
  benchmark: string;
  currentPerformance: number;
  benchmarkValue: number;
  difference: number;
  ranking: string;
  interpretation: string;
}

export interface PrePostAnalysis {
  cohortId: string;
  cohortName: string;
  preTestScore: number;
  postTestScore: number;
  learningGain: number;
  effectSize: number;
  significance: boolean;
  interpretation: string;
}

export interface DemographicAnalysis {
  demographic: string;
  groups: DemographicGroup[];
  disparityAnalysis: DisparityAnalysis[];
}

export interface DemographicGroup {
  groupName: string;
  studentCount: number;
  averageScore: number;
  passRate: number;
  performanceLevel: string;
}

export interface DisparityAnalysis {
  comparison: string;
  disparityMagnitude: number;
  isSignificant: boolean;
  recommendations: string[];
}

// 8. Flagged Question & Error Reports
export interface FlaggedQuestionReport {
  quizId: string;
  quizTitle: string;
  flaggedQuestions: FlaggedQuestion[];
  errorPatterns: ErrorPattern[];
  anomalyDetection: AnomalyDetection[];
  qualityIssues: QualityIssue[];
  recommendedActions: RecommendedAction[];
}

export interface FlaggedQuestion {
  questionId: string;
  questionText: string;
  flagReason: string;
  flagCount: number;
  missRate: number;
  expectedMissRate: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  lastFlagged: Date;
  reviewStatus: string;
}

export interface ErrorPattern {
  patternType: string;
  description: string;
  questionsAffected: number;
  studentsAffected: number;
  frequency: number;
  impact: string;
  rootCause: string;
}

export interface AnomalyDetection {
  anomalyType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedItems: string[];
  detectionDate: Date;
  confidence: number;
  investigation: string;
}

export interface QualityIssue {
  issueType: string;
  description: string;
  questionsAffected: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolutionRecommendation: string;
  priority: number;
}

export interface RecommendedAction {
  actionType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  targetItems: string[];
  expectedOutcome: string;
  timeframe: string;
}

// 9. Remediation & Learning Needs Reports
export interface RemediationReport {
  quizId: string;
  quizTitle: string;
  competencyWeaknesses: CompetencyWeakness[];
  individualNeedsAnalysis: IndividualNeedsAnalysis[];
  cohortNeedsAnalysis: CohortNeedsAnalysis[];
  remediationActions: RemediationAction[];
  interventionTracking: InterventionTracking[];
}

export interface CompetencyWeakness {
  competencyId: string;
  competencyName: string;
  weaknessLevel: 'mild' | 'moderate' | 'severe';
  studentsAffected: number;
  averagePerformance: number;
  targetPerformance: number;
  gap: number;
  recommendations: string[];
}

export interface IndividualNeedsAnalysis {
  studentId: string;
  studentName: string;
  overallPerformance: number;
  strengthAreas: string[];
  weaknessAreas: string[];
  priority: 'low' | 'medium' | 'high';
  personalizedPlan: PersonalizedPlan[];
}

export interface PersonalizedPlan {
  competency: string;
  currentLevel: string;
  targetLevel: string;
  interventions: string[];
  estimatedTime: number;
  resources: string[];
}

export interface CohortNeedsAnalysis {
  cohortId: string;
  cohortName: string;
  commonWeaknesses: string[];
  strengthAreas: string[];
  recommendedInterventions: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface RemediationAction {
  actionId: string;
  actionType: string;
  targetStudents: string[];
  targetCompetencies: string[];
  interventionPlan: string;
  timeline: string;
  expectedOutcome: string;
  status: 'planned' | 'in_progress' | 'completed';
}

export interface InterventionTracking {
  interventionId: string;
  studentId: string;
  interventionType: string;
  startDate: Date;
  completionDate: Date | null;
  progress: number;
  outcome: string;
  effectiveness: number;
}

// 10. Compliance & Accreditation Reports
export interface ComplianceAccreditationReport {
  accreditingBody: string;
  reportPeriod: string;
  standardsMapping: StandardsMapping[];
  competencyAttainment: CompetencyAttainment[];
  complianceMetrics: ComplianceMetrics;
  auditTrail: AuditTrail[];
  certificationTracking: CertificationTracking[];
}

export interface StandardsMapping {
  standardId: string;
  standardName: string;
  description: string;
  questionsAligned: number;
  totalQuestions: number;
  alignmentPercentage: number;
  averagePerformance: number;
  complianceStatus: 'compliant' | 'non_compliant' | 'partially_compliant';
}

export interface CompetencyAttainment {
  competencyId: string;
  competencyName: string;
  requiredLevel: string;
  studentsAssessed: number;
  studentsAttained: number;
  attainmentRate: number;
  benchmark: number;
  status: 'met' | 'not_met' | 'exceeded';
}

export interface ComplianceMetrics {
  overallCompliance: number;
  standardsCompliance: number;
  competencyCompliance: number;
  documentationCompliance: number;
  auditReadiness: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AuditTrail {
  eventId: string;
  eventType: string;
  timestamp: Date;
  userId: string;
  action: string;
  details: string;
  complianceRelevant: boolean;
}

export interface CertificationTracking {
  certificationId: string;
  certificationName: string;
  studentsEligible: number;
  studentsEarned: number;
  earnRate: number;
  expirationTracking: ExpirationTracking[];
}

export interface ExpirationTracking {
  studentId: string;
  studentName: string;
  certificationDate: Date;
  expirationDate: Date;
  daysUntilExpiration: number;
  renewalStatus: string;
}

// Export Data Types
export interface ExportOptions {
  format: 'csv' | 'excel' | 'json' | 'pdf';
  includeVisualizations: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  filters?: {
    cohorts?: string[];
    competencies?: string[];
    demographics?: string[];
  };
  customFields?: string[];
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  filename: string;
  format: string;
  size: number;
  generatedAt: Date;
  expiresAt: Date;
  error?: string;
}

// ==================== SERVICE FUNCTIONS ====================

// 1. Item Analysis Reports
export async function generateItemAnalysisReport(quizId: string, accountId?: string): Promise<ItemAnalysisReport[]> {
  try {
    // Get quiz data
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId));
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Get questions for the quiz
    const quizQuestions = await db.select().from(questions).where(eq(questions.quizId, quizId));
    
    // Get all responses for this quiz
    const responses = await db
      .select()
      .from(quizResponses)
      .leftJoin(quizAttempts, eq(quizResponses.attemptId, quizAttempts.id))
      .where(eq(quizAttempts.quizId, quizId));

    // Get answer options for distractor analysis
    const allAnswerOptions = await db
      .select()
      .from(answerOptions)
      .where(eq(answerOptions.quizId, quizId));

    const itemAnalysisReports: ItemAnalysisReport[] = [];

    for (const question of quizQuestions) {
      const questionResponses = responses.filter(r => r.quiz_responses.questionId === question.id);
      const correctResponses = questionResponses.filter(r => r.quiz_responses.isCorrect);
      
      // Calculate difficulty index (P-value)
      const difficultyIndex = questionResponses.length > 0 
        ? correctResponses.length / questionResponses.length 
        : 0;

      // Calculate discrimination index (simplified version)
      const discriminationIndex = await calculateDiscriminationIndex(question.id, quizId);

      // Calculate point-biserial correlation
      const pointBiserialCorrelation = await calculatePointBiserialCorrelation(question.id, quizId);

      // Get distractor analysis
      const questionAnswerOptions = allAnswerOptions.filter(ao => ao.questionId === question.id);
      const distractorAnalysis = await generateDistractorAnalysis(question.id, questionAnswerOptions, questionResponses);

      // Calculate average time spent
      const averageTimeSpent = questionResponses.length > 0
        ? questionResponses.reduce((sum, r) => sum + (r.quiz_responses.timeSpent || 0), 0) / questionResponses.length
        : 0;

      // Check if flagged for review
      const flaggedForReview = difficultyIndex < 0.3 || difficultyIndex > 0.9 || discriminationIndex < 0.2;

      itemAnalysisReports.push({
        questionId: question.id,
        questionText: question.questionText,
        difficultyIndex,
        discriminationIndex,
        pointBiserialCorrelation,
        distractorAnalysis,
        totalResponses: questionResponses.length,
        correctResponses: correctResponses.length,
        averageTimeSpent,
        flaggedForReview
      });
    }

    return itemAnalysisReports;
  } catch (error) {
    console.error('Error generating item analysis report:', error);
    throw error;
  }
}

// Helper function to calculate discrimination index
async function calculateDiscriminationIndex(questionId: string, quizId: string): Promise<number> {
  try {
    // Get all attempts for this quiz with total scores
    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId));

    // Sort by total score
    const sortedAttempts = attempts.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    
    // Get top 27% and bottom 27%
    const topGroupSize = Math.floor(sortedAttempts.length * 0.27);
    const bottomGroupSize = Math.floor(sortedAttempts.length * 0.27);
    
    const topGroup = sortedAttempts.slice(0, topGroupSize);
    const bottomGroup = sortedAttempts.slice(-bottomGroupSize);

    // Get responses for this question from both groups
    const topGroupResponses = await db
      .select()
      .from(quizResponses)
      .where(
        and(
          eq(quizResponses.questionId, questionId),
          eq(quizResponses.attemptId, topGroup[0]?.id || '')
        )
      );

    const bottomGroupResponses = await db
      .select()
      .from(quizResponses)
      .where(
        and(
          eq(quizResponses.questionId, questionId),
          eq(quizResponses.attemptId, bottomGroup[0]?.id || '')
        )
      );

    // Calculate proportion correct in each group
    const topGroupCorrect = topGroupResponses.filter(r => r.isCorrect).length;
    const bottomGroupCorrect = bottomGroupResponses.filter(r => r.isCorrect).length;

    const topProportion = topGroup.length > 0 ? topGroupCorrect / topGroup.length : 0;
    const bottomProportion = bottomGroup.length > 0 ? bottomGroupCorrect / bottomGroup.length : 0;

    return topProportion - bottomProportion;
  } catch (error) {
    console.error('Error calculating discrimination index:', error);
    return 0;
  }
}

// Helper function to calculate point-biserial correlation
async function calculatePointBiserialCorrelation(questionId: string, quizId: string): Promise<number> {
  try {
    // Get all responses for this question with total scores
    const responses = await db
      .select()
      .from(quizResponses)
      .leftJoin(quizAttempts, eq(quizResponses.attemptId, quizAttempts.id))
      .where(
        and(
          eq(quizResponses.questionId, questionId),
          eq(quizAttempts.quizId, quizId)
        )
      );

    if (responses.length === 0) return 0;

    // Extract data for correlation calculation
    const data = responses.map(r => ({
      correct: r.quiz_responses.isCorrect ? 1 : 0,
      totalScore: r.quiz_attempts?.totalScore || 0
    }));

    // Calculate point-biserial correlation
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.correct, 0);
    const sumY = data.reduce((sum, d) => sum + d.totalScore, 0);
    const sumXY = data.reduce((sum, d) => sum + (d.correct * d.totalScore), 0);
    const sumX2 = data.reduce((sum, d) => sum + (d.correct * d.correct), 0);
    const sumY2 = data.reduce((sum, d) => sum + (d.totalScore * d.totalScore), 0);

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));

    return denominator !== 0 ? numerator / denominator : 0;
  } catch (error) {
    console.error('Error calculating point-biserial correlation:', error);
    return 0;
  }
}

// Helper function to generate distractor analysis
async function generateDistractorAnalysis(
  questionId: string,
  answerOptions: any[],
  responses: any[]
): Promise<DistractorAnalysis[]> {
  const distractorAnalysis: DistractorAnalysis[] = [];

  for (const option of answerOptions) {
    const optionResponses = responses.filter(r => r.quiz_responses.selectedAnswer === option.id);
    const selectionCount = optionResponses.length;
    const selectionPercentage = responses.length > 0 ? (selectionCount / responses.length) * 100 : 0;
    
    // Calculate average score of students who selected this option
    const averageScoreOfSelectors = optionResponses.length > 0
      ? optionResponses.reduce((sum, r) => sum + (r.quiz_attempts?.totalScore || 0), 0) / optionResponses.length
      : 0;

    distractorAnalysis.push({
      optionId: option.id,
      optionText: option.optionText,
      isCorrect: option.isCorrect,
      selectionCount,
      selectionPercentage,
      averageScoreOfSelectors
    });
  }

  return distractorAnalysis;
}

// 2. Export Data Function
export async function exportAnalyticsData(
  reportType: string,
  reportData: any,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportType}_${timestamp}.${options.format}`;
    
    let exportData: string;
    let mimeType: string;

    switch (options.format) {
      case 'csv':
        exportData = convertToCSV(reportData);
        mimeType = 'text/csv';
        break;
      case 'json':
        exportData = JSON.stringify(reportData, null, 2);
        mimeType = 'application/json';
        break;
      case 'excel':
        // For Excel, we'll return CSV format for simplicity
        exportData = convertToCSV(reportData);
        mimeType = 'application/vnd.ms-excel';
        break;
      case 'pdf':
        exportData = await generatePDFReport(reportData, reportType);
        mimeType = 'application/pdf';
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    // In a real implementation, you would save to a file storage service
    // For now, we'll return the data as base64
    const base64Data = Buffer.from(exportData).toString('base64');
    
    return {
      success: true,
      downloadUrl: `data:${mimeType};base64,${base64Data}`,
      filename,
      format: options.format,
      size: exportData.length,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    };
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    return {
      success: false,
      filename: '',
      format: options.format,
      size: 0,
      generatedAt: new Date(),
      expiresAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

// Helper function to generate PDF report
async function generatePDFReport(data: any, reportType: string): Promise<string> {
  // This is a simplified PDF generation
  // In a real implementation, you would use a library like puppeteer or jsPDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportType} Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h1>${reportType} Report</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </body>
    </html>
  `;
  
  return htmlContent;
}

// Generate comprehensive analytics report
export async function generateComprehensiveAnalyticsReport(
  quizId: string,
  accountId?: string,
  includeAll = true
): Promise<any> {
  try {
    const report: any = {};

    if (includeAll) {
      // 1. Item Analysis Reports
      report.itemAnalysis = await generateItemAnalysisReport(quizId, accountId);

      // 2. Performance & Outcome Reports
      report.performanceOutcome = await generatePerformanceOutcomeReport(quizId, accountId);

      // 3. Learner Behavior & Engagement Analytics
      report.learnerBehavior = await generateLearnerBehaviorReport(quizId, accountId);

      // 4. Flagged Question & Error Reports
      report.flaggedQuestions = await generateFlaggedQuestionReport(quizId, accountId);

      // 5. AI-powered insights
      if (process.env.OPENAI_API_KEY) {
        report.aiInsights = await generateAIInsights(report);
      }
    }

    return report;
  } catch (error) {
    console.error('Error generating comprehensive analytics report:', error);
    throw error;
  }
}

// Placeholder functions for other report types
async function generatePerformanceOutcomeReport(quizId: string, accountId?: string): Promise<any> {
  // Implementation would go here
  return { message: 'Performance outcome report would be generated here' };
}

async function generateLearnerBehaviorReport(quizId: string, accountId?: string): Promise<any> {
  // Implementation would go here
  return { message: 'Learner behavior report would be generated here' };
}

async function generateFlaggedQuestionReport(quizId: string, accountId?: string): Promise<any> {
  // Implementation would go here
  return { message: 'Flagged question report would be generated here' };
}

async function generateAIInsights(reportData: any): Promise<any> {
  try {
    const prompt = `
    You are an expert educational data analyst. Analyze the following assessment data and provide comprehensive insights:

    ${JSON.stringify(reportData, null, 2)}

    Please provide:
    1. Key findings and patterns
    2. Areas of concern that need attention
    3. Recommendations for improvement
    4. Quality assurance insights
    5. Actionable next steps

    Format your response as structured JSON with clear categories.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return { error: 'Failed to generate AI insights' };
  }
}