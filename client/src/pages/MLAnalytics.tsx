import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Target,
  Clock,
  BookOpen,
  BarChart3,
  Lightbulb,
  Shield,
  Activity,
  Zap,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Filter,
  Download
} from "lucide-react";

interface MLInsights {
  performancePredictions: StudentPerformancePrediction[];
  questionDifficultyClustering: QuestionCluster[];
  learningPathRecommendations: LearningPathRecommendation[];
  anomalyDetection: AnomalyDetection[];
  conceptMastery: ConceptMasteryAnalysis[];
  predictiveAnalytics: PredictiveAnalytics;
  adaptiveDifficulty: AdaptiveDifficultyRecommendation[];
  engagementPatterns: EngagementPattern[];
}

interface StudentPerformancePrediction {
  studentId: string;
  studentName: string;
  predictedPerformance: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
}

interface QuestionCluster {
  clusterId: string;
  difficulty: number;
  concept: string;
  questionIds: string[];
  characteristicFeatures: string[];
  averageCorrectRate: number;
  discriminationIndex: number;
}

interface LearningPathRecommendation {
  studentId: string;
  studentName: string;
  currentLevel: string;
  recommendedPath: {
    step: number;
    concept: string;
    difficulty: number;
    estimatedTime: number;
    resources: string[];
  }[];
  personalizedGoals: string[];
}

interface AnomalyDetection {
  type: 'performance_drop' | 'cheating_pattern' | 'technical_issue' | 'outlier_response';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedStudents: string[];
  affectedQuestions: string[];
  timestamp: Date;
  confidence: number;
  recommendedActions: string[];
}

interface ConceptMasteryAnalysis {
  concept: string;
  masteryLevel: number;
  progressTrend: 'improving' | 'stable' | 'declining';
  studentsAtLevel: {
    beginner: number;
    intermediate: number;
    advanced: number;
    expert: number;
  };
  prerequisites: string[];
  nextConcepts: string[];
}

interface PredictiveAnalytics {
  overallTrends: {
    metric: string;
    currentValue: number;
    predictedValue: number;
    timeframe: string;
    confidence: number;
  }[];
  riskFactors: {
    factor: string;
    impact: number;
    mitigation: string;
  }[];
  optimizationOpportunities: {
    area: string;
    potentialImprovement: number;
    implementation: string;
  }[];
}

interface AdaptiveDifficultyRecommendation {
  studentId: string;
  currentDifficulty: number;
  recommendedDifficulty: number;
  rationale: string;
  expectedImprovement: number;
}

interface EngagementPattern {
  pattern: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  affectedStudents: number;
  recommendations: string[];
}

export default function MLAnalytics() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");

  // Temporarily disabled authentication check for testing
  // useEffect(() => {
  //   if (!authLoading && !isAuthenticated) {
  //     toast({
  //       title: "Unauthorized",
  //       description: "You are logged out. Logging in again...",
  //       variant: "destructive",
  //     });
  //     setTimeout(() => {
  //       window.location.href = "/api/login";
  //     }, 500);
  //     return;
  //   }
  // }, [isAuthenticated, authLoading, toast]);

  // Fetch ML insights
  const { data: mlInsights, isLoading: insightsLoading, error: insightsError } = useQuery<MLInsights>({
    queryKey: ['/api/analytics/ml-insights', selectedTimeRange, selectedQuiz],
    enabled: true, // Temporarily bypass auth check
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  // Fetch predictive analytics
  const { data: predictiveData, isLoading: predictiveLoading } = useQuery({
    queryKey: ['/api/analytics/predictive'],
    enabled: isAuthenticated,
  });

  if (authLoading || insightsLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  if (insightsError && !isUnauthorizedError(insightsError as Error)) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load ML analytics. Please check if you have an OpenAI API key configured.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <ArrowDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <Brain className="h-8 w-8 mr-3 text-primary" />
              ML Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Advanced machine learning insights and predictive analytics for educational assessment
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Risk Students</p>
                  <p className="text-3xl font-bold text-red-600">
                    {mlInsights?.performancePredictions?.filter(p => p.riskLevel === 'high').length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Predicted to struggle
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Anomalies Detected</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {mlInsights?.anomalyDetection?.length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-100">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Requiring investigation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Question Clusters</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {mlInsights?.questionDifficultyClustering?.length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                By difficulty & concept
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Learning Paths</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {mlInsights?.learningPathRecommendations?.length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Lightbulb className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Personalized recommendations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="predictions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="predictions">Performance Predictions</TabsTrigger>
            <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
            <TabsTrigger value="clusters">Question Analysis</TabsTrigger>
            <TabsTrigger value="paths">Learning Paths</TabsTrigger>
            <TabsTrigger value="mastery">Concept Mastery</TabsTrigger>
            <TabsTrigger value="predictive">Predictive Trends</TabsTrigger>
          </TabsList>

          {/* Performance Predictions Tab */}
          <TabsContent value="predictions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Student Performance Predictions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  AI-powered predictions of student performance based on historical data and learning patterns
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mlInsights?.performancePredictions?.map((prediction, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{prediction.studentName}</h4>
                          <p className="text-sm text-muted-foreground">Student ID: {prediction.studentId}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{prediction.predictedPerformance}%</div>
                          <Badge className={getRiskColor(prediction.riskLevel)}>
                            {prediction.riskLevel} risk
                          </Badge>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Confidence</span>
                          <span>{Math.round(prediction.confidence * 100)}%</span>
                        </div>
                        <Progress value={prediction.confidence * 100} className="h-2" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-sm mb-2">Key Factors</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {prediction.factors?.map((factor, idx) => (
                              <li key={idx} className="flex items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-sm mb-2">Recommendations</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {prediction.recommendations?.map((rec, idx) => (
                              <li key={idx} className="flex items-center">
                                <Lightbulb className="w-3 h-3 text-yellow-500 mr-2" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No performance predictions available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Anomaly Detection Tab */}
          <TabsContent value="anomalies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Anomaly Detection
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  AI-detected anomalies in student behavior, performance patterns, and quiz responses
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mlInsights?.anomalyDetection?.map((anomaly, index) => (
                    <Alert key={index} className="border-l-4 border-l-orange-500">
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(anomaly.severity)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium capitalize">
                              {anomaly.type.replace('_', ' ')}
                            </h4>
                            <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'secondary'}>
                              {anomaly.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {anomaly.description}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Affected Students:</span>
                              <p className="text-muted-foreground">{anomaly.affectedStudents?.length || 0}</p>
                            </div>
                            <div>
                              <span className="font-medium">Confidence:</span>
                              <p className="text-muted-foreground">{Math.round(anomaly.confidence * 100)}%</p>
                            </div>
                            <div>
                              <span className="font-medium">Detected:</span>
                              <p className="text-muted-foreground">
                                {new Date(anomaly.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {anomaly.recommendedActions?.length > 0 && (
                            <div className="mt-3">
                              <span className="font-medium text-sm">Recommended Actions:</span>
                              <ul className="mt-1 text-sm text-muted-foreground">
                                {anomaly.recommendedActions.map((action, idx) => (
                                  <li key={idx} className="flex items-center mt-1">
                                    <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </Alert>
                  )) || (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">No anomalies detected</p>
                      <p className="text-sm text-muted-foreground">Your system appears to be running smoothly</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Question Clusters Tab */}
          <TabsContent value="clusters">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Question Difficulty Clustering
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  ML-powered analysis of question difficulty and conceptual groupings
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mlInsights?.questionDifficultyClustering?.map((cluster, index) => (
                    <Card key={index} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{cluster.concept}</h4>
                          <Badge variant="outline">
                            Difficulty: {cluster.difficulty.toFixed(1)}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Questions:</span>
                            <span className="font-medium">{cluster.questionIds?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Correct Rate:</span>
                            <span className="font-medium">{Math.round(cluster.averageCorrectRate * 100)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Discrimination:</span>
                            <span className="font-medium">{cluster.discriminationIndex?.toFixed(2)}</span>
                          </div>
                        </div>
                        {cluster.characteristicFeatures?.length > 0 && (
                          <div className="mt-3">
                            <span className="text-sm font-medium">Key Features:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {cluster.characteristicFeatures.map((feature, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )) || (
                    <div className="col-span-full text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No question clusters available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Paths Tab */}
          <TabsContent value="paths">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Personalized Learning Paths
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  AI-generated personalized learning sequences for optimal knowledge acquisition
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mlInsights?.learningPathRecommendations?.map((path, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium">{path.studentName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Current Level: <Badge variant="outline">{path.currentLevel}</Badge>
                          </p>
                        </div>
                      </div>
                      
                      {path.recommendedPath?.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-sm mb-3">Recommended Learning Path</h5>
                          <div className="space-y-3">
                            {path.recommendedPath.map((step, stepIdx) => (
                              <div key={stepIdx} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                                  {step.step}
                                </div>
                                <div className="flex-1">
                                  <h6 className="font-medium">{step.concept}</h6>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <span>Difficulty: {step.difficulty}/10</span>
                                    <span>Time: {step.estimatedTime}h</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {path.personalizedGoals?.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Personalized Goals</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {path.personalizedGoals.map((goal, goalIdx) => (
                              <li key={goalIdx} className="flex items-center">
                                <Target className="w-3 h-3 text-blue-500 mr-2" />
                                {goal}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No learning paths available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Concept Mastery Tab */}
          <TabsContent value="mastery">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Concept Mastery Analysis
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  ML analysis of student mastery levels across different educational concepts
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mlInsights?.conceptMastery?.map((concept, index) => (
                    <Card key={index} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{concept.concept}</h4>
                          <div className="flex items-center space-x-2">
                            {getTrendIcon(concept.progressTrend)}
                            <span className="text-sm capitalize">{concept.progressTrend}</span>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Overall Mastery</span>
                            <span>{Math.round(concept.masteryLevel * 100)}%</span>
                          </div>
                          <Progress value={concept.masteryLevel * 100} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <div className="font-medium">{concept.studentsAtLevel?.beginner || 0}</div>
                            <div className="text-muted-foreground">Beginner</div>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <div className="font-medium">{concept.studentsAtLevel?.intermediate || 0}</div>
                            <div className="text-muted-foreground">Intermediate</div>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <div className="font-medium">{concept.studentsAtLevel?.advanced || 0}</div>
                            <div className="text-muted-foreground">Advanced</div>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <div className="font-medium">{concept.studentsAtLevel?.expert || 0}</div>
                            <div className="text-muted-foreground">Expert</div>
                          </div>
                        </div>

                        {concept.nextConcepts?.length > 0 && (
                          <div className="mt-4">
                            <span className="text-sm font-medium">Next Concepts:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {concept.nextConcepts.map((next, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {next}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )) || (
                    <div className="col-span-full text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No concept mastery data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictive Trends Tab */}
          <TabsContent value="predictive">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Predictive Analytics
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Future trends and optimization opportunities based on ML analysis
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Overall Trends */}
                  {mlInsights?.predictiveAnalytics?.overallTrends?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Predicted Trends</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mlInsights?.predictiveAnalytics?.overallTrends?.map((trend, index) => (
                          <Card key={index} className="border">
                            <CardContent className="p-4">
                              <h5 className="font-medium text-sm">{trend.metric}</h5>
                              <div className="flex items-center justify-between my-2">
                                <span className="text-2xl font-bold">{trend.currentValue}</span>
                                <div className="text-right">
                                  <div className="text-sm font-medium">→ {trend.predictedValue}</div>
                                  <div className="text-xs text-muted-foreground">{trend.timeframe}</div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Confidence</span>
                                <span>{Math.round(trend.confidence * 100)}%</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Factors */}
                  {mlInsights?.predictiveAnalytics?.riskFactors?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Risk Factors</h4>
                      <div className="space-y-3">
                        {mlInsights?.predictiveAnalytics?.riskFactors?.map((risk, index) => (
                          <Alert key={index}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{risk.factor}</span>
                                <Badge variant="destructive">
                                  {Math.round(risk.impact * 100)}% impact
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Mitigation: {risk.mitigation}
                              </p>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Optimization Opportunities */}
                  {mlInsights?.predictiveAnalytics?.optimizationOpportunities?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Optimization Opportunities</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mlInsights?.predictiveAnalytics?.optimizationOpportunities?.map((opp, index) => (
                          <Card key={index} className="border border-green-200 bg-green-50/50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{opp.area}</h5>
                                <Badge className="bg-green-100 text-green-700">
                                  +{Math.round(opp.potentialImprovement)}%
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {opp.implementation}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}