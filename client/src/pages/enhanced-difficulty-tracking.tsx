import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { 
  Brain, TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle2, XCircle, 
  Search, Filter, RefreshCw, BarChart3, Clock, Users, BookOpen, Activity,
  Download, FileText, PieChart, LineChart, Settings
} from 'lucide-react';

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
  accuracyTrends: Array<{ date: string; accuracy: number }>;
  topPerformingQuestions: DifficultyStats[];
  needsAttentionQuestions: DifficultyStats[];
}

const DIFFICULTY_RANGES: Record<number, { min: number; max: number; label: string; color: string }> = {
  1: { min: 90, max: 100, label: "Very Easy", color: "bg-green-500" },
  2: { min: 80, max: 89.99, label: "Easy", color: "bg-green-400" },
  3: { min: 70, max: 79.99, label: "Moderate-Easy", color: "bg-yellow-300" },
  4: { min: 60, max: 69.99, label: "Moderate", color: "bg-yellow-400" },
  5: { min: 50, max: 59.99, label: "Balanced", color: "bg-orange-400" },
  6: { min: 40, max: 49.99, label: "Moderate-Hard", color: "bg-orange-500" },
  7: { min: 30, max: 39.99, label: "Hard", color: "bg-red-400" },
  8: { min: 20, max: 29.99, label: "Very Hard", color: "bg-red-500" },
  9: { min: 10, max: 19.99, label: "Extremely Hard", color: "bg-red-600" },
  10: { min: 0, max: 9.99, label: "Nearly Impossible", color: "bg-red-800" }
};

export default function EnhancedDifficultyTrackingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedTestbank, setSelectedTestbank] = useState('all');
  const [sortBy, setSortBy] = useState('lastUpdated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Enhanced mock data with realistic scenarios
  const getMockAnalytics = (): DifficultyAnalytics => ({
    totalQuestions: 247,
    pilotQuestions: 23,
    validatedQuestions: 224,
    avgDifficulty: 4.7,
    difficultyDistribution: {
      1: 12, 2: 28, 3: 45, 4: 52, 5: 38, 6: 31, 7: 24, 8: 12, 9: 4, 10: 1
    },
    recentAdjustments: 18,
    accuracyTrends: [
      { date: '2025-01-01', accuracy: 72.5 },
      { date: '2025-01-02', accuracy: 74.2 },
      { date: '2025-01-03', accuracy: 71.8 },
      { date: '2025-01-04', accuracy: 75.1 },
      { date: '2025-01-05', accuracy: 73.9 }
    ],
    topPerformingQuestions: [],
    needsAttentionQuestions: []
  });

  const getMockQuestions = (): DifficultyStats[] => [
    {
      questionId: "q1",
      questionText: "What is the capital of France?",
      currentDifficulty: 2.1,
      originalDifficulty: 3.0,
      correctResponses: 167,
      totalResponses: 180,
      accuracyPercentage: 92.8,
      isPilotQuestion: false,
      pilotResponsesNeeded: 30,
      pilotResponsesCount: 180,
      pilotValidated: true,
      questionType: "multiple_choice",
      testbankName: "Geography Basics",
      lastUpdated: new Date('2025-01-05T14:30:00'),
      difficultyTrend: 'decreasing',
      confidenceScore: 0.95
    },
    {
      questionId: "q2",
      questionText: "Explain the quantum mechanical model of the atom and its implications for electron behavior",
      currentDifficulty: 8.2,
      originalDifficulty: 7.5,
      correctResponses: 12,
      totalResponses: 65,
      accuracyPercentage: 18.5,
      isPilotQuestion: false,
      pilotResponsesNeeded: 30,
      pilotResponsesCount: 65,
      pilotValidated: true,
      questionType: "essay",
      testbankName: "Advanced Physics",
      lastUpdated: new Date('2025-01-05T10:15:00'),
      difficultyTrend: 'increasing',
      confidenceScore: 0.87
    },
    {
      questionId: "q3",
      questionText: "Calculate the derivative of f(x) = 3x² + 2x - 5",
      currentDifficulty: 4.8,
      originalDifficulty: 5.0,
      correctResponses: 34,
      totalResponses: 67,
      accuracyPercentage: 50.7,
      isPilotQuestion: false,
      pilotResponsesNeeded: 30,
      pilotResponsesCount: 67,
      pilotValidated: true,
      questionType: "calculation",
      testbankName: "Calculus I",
      lastUpdated: new Date('2025-01-05T09:45:00'),
      difficultyTrend: 'stable',
      confidenceScore: 0.92
    },
    {
      questionId: "q4",
      questionText: "Analyze the impact of machine learning algorithms on modern healthcare diagnostics",
      currentDifficulty: 6.5,
      originalDifficulty: 6.0,
      correctResponses: 8,
      totalResponses: 22,
      accuracyPercentage: 36.4,
      isPilotQuestion: true,
      pilotResponsesNeeded: 30,
      pilotResponsesCount: 22,
      pilotValidated: false,
      questionType: "analysis",
      testbankName: "AI in Healthcare",
      lastUpdated: new Date('2025-01-05T16:20:00'),
      difficultyTrend: 'increasing',
      confidenceScore: 0.73
    }
  ];

  // Use React Query for data fetching with real API
  const { data: questions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/difficulty-tracking/questions'],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: analytics = getMockAnalytics() } = useQuery({
    queryKey: ['/api/difficulty-tracking/analytics'],
    refetchInterval: autoRefresh ? 60000 : false,
  });

  // Filter and sort questions
  const filteredQuestions = questions
    .filter(q => {
      const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           q.testbankName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = filterDifficulty === 'all' || 
                               Math.round(q.currentDifficulty) === parseInt(filterDifficulty);
      const matchesStatus = filterStatus === 'all' ||
                           (filterStatus === 'pilot' && q.isPilotQuestion) ||
                           (filterStatus === 'validated' && q.pilotValidated) ||
                           (filterStatus === 'needs-attention' && (q.accuracyPercentage < 40 || q.accuracyPercentage > 90));
      const matchesTestbank = selectedTestbank === 'all' || q.testbankName === selectedTestbank;
      
      return matchesSearch && matchesDifficulty && matchesStatus && matchesTestbank;
    })
    .sort((a, b) => {
      const factor = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'difficulty':
          return (a.currentDifficulty - b.currentDifficulty) * factor;
        case 'accuracy':
          return (a.accuracyPercentage - b.accuracyPercentage) * factor;
        case 'responses':
          return (a.totalResponses - b.totalResponses) * factor;
        case 'lastUpdated':
        default:
          return (new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()) * factor;
      }
    });

  const getDifficultyLabel = (difficulty: number): string => {
    const rounded = Math.round(difficulty);
    return DIFFICULTY_RANGES[Math.max(1, Math.min(10, rounded))]?.label || "Unknown";
  };

  const getDifficultyColor = (difficulty: number): string => {
    const rounded = Math.round(difficulty);
    return DIFFICULTY_RANGES[Math.max(1, Math.min(10, rounded))]?.color || "bg-gray-400";
  };

  const getDifficultyTrend = (current: number, original: number, trend: string) => {
    if (trend === 'stable') return { icon: Target, text: "Stable", color: "text-blue-600" };
    if (trend === 'increasing') return { icon: TrendingUp, text: "Harder", color: "text-red-600" };
    return { icon: TrendingDown, text: "Easier", color: "text-green-600" };
  };

  const getUniqueTestbanks = () => {
    const testbanks = [...new Set(questions.map(q => q.testbankName))];
    return testbanks.sort();
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Question ID,Question Text,Current Difficulty,Original Difficulty,Accuracy %,Responses,Status,Testbank\n" +
      filteredQuestions.map(q => 
        `"${q.questionId}","${q.questionText.substring(0, 50)}...","${q.currentDifficulty}","${q.originalDifficulty}","${q.accuracyPercentage}","${q.totalResponses}","${q.pilotValidated ? 'Validated' : 'Pilot'}","${q.testbankName}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "difficulty_tracking_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <div className="flex-1 p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading difficulty tracking data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="h-14 md:h-16 flex-shrink-0"></div>
        <div className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Enhanced Difficulty Tracking</h1>
            <p className="text-gray-600">Real-time adaptive question difficulty management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              id="auto-refresh"
            />
            <label htmlFor="auto-refresh" className="text-sm text-gray-600">
              Auto-refresh
            </label>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Questions</p>
                    <p className="text-2xl font-bold">{analytics.totalQuestions}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pilot Questions</p>
                    <p className="text-2xl font-bold text-orange-600">{analytics.pilotQuestions}</p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Difficulty</p>
                    <p className="text-2xl font-bold">{analytics.avgDifficulty.toFixed(1)}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Recent Adjustments</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.recentAdjustments}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Difficulty Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Difficulty Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {Object.entries(analytics.difficultyDistribution).map(([level, count]) => (
                  <div key={level} className="text-center">
                    <div className={`h-16 rounded ${DIFFICULTY_RANGES[parseInt(level)]?.color} flex items-end justify-center`}>
                      <div className="bg-white/90 px-1 py-0.5 rounded text-xs font-medium mb-1">
                        {count}
                      </div>
                    </div>
                    <p className="text-xs mt-1">Level {level}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredQuestions.slice(0, 5).map((question) => {
                  const trend = getDifficultyTrend(question.currentDifficulty, question.originalDifficulty, question.difficultyTrend);
                  const TrendIcon = trend.icon;
                  
                  return (
                    <div key={question.questionId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{question.questionText.substring(0, 60)}...</p>
                        <p className="text-xs text-gray-600">{question.testbankName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${trend.color}`}>
                          <TrendIcon className="w-3 h-3 mr-1" />
                          {trend.text}
                        </Badge>
                        <span className="text-sm font-medium">{question.currentDifficulty.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    {[1,2,3,4,5,6,7,8,9,10].map(level => (
                      <SelectItem key={level} value={level.toString()}>
                        Level {level} - {DIFFICULTY_RANGES[level]?.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pilot">Pilot Questions</SelectItem>
                    <SelectItem value="validated">Validated</SelectItem>
                    <SelectItem value="needs-attention">Needs Attention</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedTestbank} onValueChange={setSelectedTestbank}>
                  <SelectTrigger>
                    <SelectValue placeholder="Testbank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Testbanks</SelectItem>
                    {getUniqueTestbanks().map(testbank => (
                      <SelectItem key={testbank} value={testbank}>{testbank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastUpdated">Last Updated</SelectItem>
                    <SelectItem value="difficulty">Difficulty</SelectItem>
                    <SelectItem value="accuracy">Accuracy</SelectItem>
                    <SelectItem value="responses">Responses</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder.toUpperCase()}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.map((question) => {
              const trend = getDifficultyTrend(question.currentDifficulty, question.originalDifficulty, question.difficultyTrend);
              const TrendIcon = trend.icon;
              
              return (
                <Card key={question.questionId} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{question.questionText}</CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{question.testbankName}</Badge>
                          <Badge variant="outline">{question.questionType}</Badge>
                          {question.isPilotQuestion && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              Pilot Question
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800">Difficulty Analysis</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Original:</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.originalDifficulty)} text-white`}>
                              {question.originalDifficulty.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Current:</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.currentDifficulty)} text-white`}>
                              {question.currentDifficulty.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Trend:</span>
                            <div className={`flex items-center gap-1 ${trend.color}`}>
                              <TrendIcon className="w-4 h-4" />
                              <span className="font-medium text-sm">{trend.text}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Confidence:</span>
                            <span className="font-medium text-sm">{(question.confidenceScore * 100).toFixed(0)}%</span>
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
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800">Status & Timeline</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Last Updated:</span>
                            <span className="text-sm">{new Date(question.lastUpdated).toLocaleDateString()}</span>
                          </div>
                          {question.isPilotQuestion && (
                            <div className="mt-2 p-2 bg-purple-50 rounded">
                              <div className="text-xs text-purple-700 mb-1">
                                Pilot Progress: {question.pilotResponsesCount}/{question.pilotResponsesNeeded} responses
                              </div>
                              <Progress 
                                value={(question.pilotResponsesCount / question.pilotResponsesNeeded) * 100} 
                                className="h-1" 
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

          {filteredQuestions.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No questions match your current filters.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterDifficulty('all');
                    setFilterStatus('all');
                    setSelectedTestbank('all');
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                System Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Advanced Analytics Dashboard</p>
                <p className="text-gray-500 text-sm mt-2">
                  Detailed performance trends, prediction models, and optimization recommendations coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Difficulty Tracking Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-Refresh Data</h3>
                    <p className="text-sm text-gray-600">Automatically update difficulty data every 30 seconds</p>
                  </div>
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Difficulty Adjustment Sensitivity</h3>
                  <p className="text-sm text-gray-600 mb-4">How quickly questions adjust to student performance</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Conservative</span>
                      <span>Moderate</span>
                      <span>Aggressive</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Pilot Question Requirements</h3>
                  <p className="text-sm text-gray-600 mb-4">Minimum responses needed before validation</p>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20 responses</SelectItem>
                      <SelectItem value="30">30 responses</SelectItem>
                      <SelectItem value="50">50 responses</SelectItem>
                      <SelectItem value="100">100 responses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">How Enhanced Difficulty Tracking Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Dynamic Adjustment Algorithm</h4>
              <div className="space-y-1 text-sm">
                <p>• Real-time analysis of student performance data</p>
                <p>• Machine learning-powered difficulty prediction</p>
                <p>• Confidence scoring for adjustment reliability</p>
                <p>• Trend analysis for long-term optimization</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Quality Assurance Process</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>• Pilot questions require minimum response threshold</p>
                <p>• Statistical validation before difficulty finalization</p>
                <p>• Expert review flags for manual oversight</p>
                <p>• Continuous monitoring for outlier detection</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
          </div>
        </div>
      </div>
    </div>
  );
}