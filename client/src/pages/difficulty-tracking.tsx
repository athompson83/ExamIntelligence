import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Brain, TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle2, XCircle, Search, Filter, RefreshCw, BarChart3 } from 'lucide-react';

interface DifficultyStats {
  questionId: string;
  questionText: string;
  currentDifficulty: number;
  originalDifficulty: number;
  correctResponses: number;
  totalResponses: number;
  accuracyPercentage: number;
  isPilotQuestion: boolean;
  pilotResponsesNeeded: number;
  pilotResponsesCount: number;
  pilotValidated: boolean;
  questionType: string;
  testbankName: string;
  lastUpdated: Date;
  difficultyTrend: 'increasing' | 'decreasing' | 'stable';
  confidenceScore: number;
}

interface DifficultyAnalytics {
  totalQuestions: number;
  pilotQuestions: number;
  validatedQuestions: number;
  avgDifficulty: number;
  difficultyDistribution: Record<number, number>;
  recentAdjustments: number;
}

interface DifficultyRange {
  min: number;
  max: number;
  label: string;
}

const DIFFICULTY_RANGES: Record<number, DifficultyRange> = {
  1: { min: 90, max: 100, label: "Very Easy" },
  2: { min: 80, max: 89.99, label: "Easy" },
  3: { min: 70, max: 79.99, label: "Moderate-Easy" },
  4: { min: 60, max: 69.99, label: "Moderate" },
  5: { min: 50, max: 59.99, label: "Balanced" },
  6: { min: 40, max: 49.99, label: "Moderate-Hard" },
  7: { min: 30, max: 39.99, label: "Hard" },
  8: { min: 20, max: 29.99, label: "Very Hard" },
  9: { min: 10, max: 19.99, label: "Extremely Hard" },
  10: { min: 0, max: 9.99, label: "Nearly Impossible" }
};

export default function DifficultyTrackingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Use React Query for data fetching
  const { data: questions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/difficulty-tracking/questions'],
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds if enabled
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/difficulty-tracking/analytics'],
    refetchInterval: autoRefresh ? 60000 : false, // Analytics refresh every minute
  });

  // Enhanced mock data with more realistic scenarios
  const getMockData = (): DifficultyStats[] => {
      const mockData: DifficultyStats[] = [
        {
          questionId: "1",
          questionText: "What is the capital of France?",
          currentDifficulty: 3.2,
          originalDifficulty: 4.0,
          correctResponses: 85,
          totalResponses: 100,
          accuracyPercentage: 85.0,
          isPilotQuestion: false,
          pilotResponsesNeeded: 30,
          pilotResponsesCount: 100,
          pilotValidated: true
        },
        {
          questionId: "2", 
          questionText: "Explain the concept of neural networks in machine learning",
          currentDifficulty: 7.8,
          originalDifficulty: 7.0,
          correctResponses: 15,
          totalResponses: 50,
          accuracyPercentage: 30.0,
          isPilotQuestion: true,
          pilotResponsesNeeded: 30,
          pilotResponsesCount: 15,
          pilotValidated: false
        },
        {
          questionId: "3",
          questionText: "Calculate the derivative of x²+3x-5",
          currentDifficulty: 5.1,
          originalDifficulty: 5.0,
          correctResponses: 42,
          totalResponses: 80,
          accuracyPercentage: 52.5,
          isPilotQuestion: false,
          pilotResponsesNeeded: 30,
          pilotResponsesCount: 80,
          pilotValidated: true
        }
      ];
      
      setQuestions(mockData);
    } catch (err) {
      setError('Failed to load question statistics');
      console.error('Error fetching question stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionStats();
  }, []);

  const getDifficultyLabel = (difficulty: number): string => {
    const rounded = Math.round(difficulty);
    return DIFFICULTY_RANGES[Math.max(1, Math.min(10, rounded))]?.label || "Unknown";
  };

  const getDifficultyColor = (difficulty: number): string => {
    if (difficulty <= 3) return "text-green-600";
    if (difficulty <= 5) return "text-yellow-600";
    if (difficulty <= 7) return "text-orange-600";
    return "text-red-600";
  };

  const getDifficultyTrend = (current: number, original: number) => {
    const diff = current - original;
    if (Math.abs(diff) < 0.1) return { icon: Target, text: "Stable", color: "text-blue-600" };
    if (diff > 0) return { icon: TrendingUp, text: "Harder", color: "text-red-600" };
    return { icon: TrendingDown, text: "Easier", color: "text-green-600" };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading difficulty tracking data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Dynamic Difficulty Tracking</h1>
          <p className="text-gray-600">Real-time question difficulty adjustment based on student performance</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                <div className="text-sm text-gray-600">Questions Tracked</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {questions.filter(q => q.pilotValidated).length}
                </div>
                <div className="text-sm text-gray-600">Validated Questions</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {questions.filter(q => q.isPilotQuestion && !q.pilotValidated).length}
                </div>
                <div className="text-sm text-gray-600">Pilot Questions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {questions.map((question, index) => {
          const trend = getDifficultyTrend(question.currentDifficulty, question.originalDifficulty);
          const TrendIcon = trend.icon;
          
          return (
            <Card key={question.questionId} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">Question {index + 1}</CardTitle>
                    <p className="text-gray-700 mb-3">{question.questionText}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {question.isPilotQuestion && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        Pilot Question
                      </Badge>
                    )}
                    {question.pilotValidated ? (
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Validated
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-orange-300 text-orange-700">
                        <XCircle className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">Difficulty Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Original Difficulty:</span>
                        <span className={`font-medium ${getDifficultyColor(question.originalDifficulty)}`}>
                          {question.originalDifficulty.toFixed(1)} - {getDifficultyLabel(question.originalDifficulty)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Current Difficulty:</span>
                        <span className={`font-medium ${getDifficultyColor(question.currentDifficulty)}`}>
                          {question.currentDifficulty.toFixed(1)} - {getDifficultyLabel(question.currentDifficulty)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Trend:</span>
                        <div className={`flex items-center gap-1 ${trend.color}`}>
                          <TrendIcon className="w-4 h-4" />
                          <span className="font-medium">{trend.text}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">Performance Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Success Rate:</span>
                        <span className="font-medium">{question.accuracyPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="space-y-1">
                        <Progress value={question.accuracyPercentage} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{question.correctResponses} correct</span>
                          <span>{question.totalResponses} total</span>
                        </div>
                      </div>
                      {question.isPilotQuestion && (
                        <div className="mt-2 p-2 bg-purple-50 rounded">
                          <div className="text-xs text-purple-700">
                            Pilot Progress: {question.pilotResponsesCount}/{question.pilotResponsesNeeded} responses
                          </div>
                          <Progress 
                            value={(question.pilotResponsesCount / question.pilotResponsesNeeded) * 100} 
                            className="h-1 mt-1" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">How Dynamic Difficulty Tracking Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Difficulty Scale (1-10)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>1-3: Easy</span>
                  <span className="text-green-600">90-100% success rate</span>
                </div>
                <div className="flex justify-between">
                  <span>4-5: Moderate</span>
                  <span className="text-yellow-600">50-70% success rate</span>
                </div>
                <div className="flex justify-between">
                  <span>6-7: Hard</span>
                  <span className="text-orange-600">30-50% success rate</span>
                </div>
                <div className="flex justify-between">
                  <span>8-10: Very Hard</span>
                  <span className="text-red-600">0-30% success rate</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Pilot Question System</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>• New questions start as pilot questions</p>
                <p>• Requires 30+ responses for validation</p>
                <p>• Difficulty adjusts based on actual performance</p>
                <p>• Validated questions maintain stable difficulty</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={fetchQuestionStats} variant="outline">
          Refresh Data
        </Button>
      </div>
    </div>
  );
}