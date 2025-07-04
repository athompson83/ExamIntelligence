import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
// import AnalyticsCharts from "@/components/AnalyticsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  Download,
  Filter,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

export default function Analytics() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: quizzes } = useQuery({
    queryKey: ["/api/quizzes"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: overallStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/overview", selectedTimeRange],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: quizAnalytics } = useQuery({
    queryKey: ["/api/analytics/quiz", selectedQuiz],
    enabled: isAuthenticated && selectedQuiz !== "all",
    retry: false,
  });

  const mockPerformanceData = {
    totalAttempts: 1247,
    averageScore: 78.5,
    completionRate: 92.3,
    totalTimeSpent: 15680, // minutes
    topPerformers: 15,
    needsImprovement: 8,
    questionAccuracy: [
      { question: "Cell Structure", accuracy: 85, difficulty: 6 },
      { question: "Photosynthesis", accuracy: 72, difficulty: 8 },
      { question: "Mitosis", accuracy: 91, difficulty: 4 },
      { question: "DNA Replication", accuracy: 68, difficulty: 9 },
      { question: "Enzyme Function", accuracy: 79, difficulty: 7 },
    ],
    performanceTrends: [
      { week: "Week 1", score: 75 },
      { week: "Week 2", score: 78 },
      { week: "Week 3", score: 76 },
      { week: "Week 4", score: 82 },
      { week: "Week 5", score: 79 },
      { week: "Week 6", score: 85 },
    ],
    difficultyDistribution: {
      easy: 35,
      medium: 45,
      hard: 20
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Comprehensive performance insights and assessment analytics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
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
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Attempts</p>
                  <p className="text-3xl font-bold text-primary">{mockPerformanceData.totalAttempts.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">↑ 12% from last period</p>
                </div>
                <div className="stats-icon bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Average Score</p>
                  <p className="text-3xl font-bold text-secondary">{mockPerformanceData.averageScore}%</p>
                  <p className="text-xs text-green-600 mt-1">↑ 3.2% improvement</p>
                </div>
                <div className="stats-icon bg-secondary/10">
                  <Target className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completion Rate</p>
                  <p className="text-3xl font-bold text-accent">{mockPerformanceData.completionRate}%</p>
                  <p className="text-xs text-red-600 mt-1">↓ 1.5% from last period</p>
                </div>
                <div className="stats-icon bg-accent/10">
                  <CheckCircle className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg. Time Spent</p>
                  <p className="text-3xl font-bold text-purple-600">{Math.round(mockPerformanceData.totalTimeSpent / mockPerformanceData.totalAttempts)}m</p>
                  <p className="text-xs text-gray-500 mt-1">Per attempt</p>
                </div>
                <div className="stats-icon bg-purple-100">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance Trends</TabsTrigger>
            <TabsTrigger value="questions">Question Analysis</TabsTrigger>
            <TabsTrigger value="students">Student Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Analytics Chart Placeholder</p>
                  </div>
                </CardContent>
              </Card>

              {/* Question Difficulty Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Question Difficulty Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Easy Questions</span>
                      <span className="text-sm text-gray-600">{mockPerformanceData.difficultyDistribution.easy}%</span>
                    </div>
                    <Progress value={mockPerformanceData.difficultyDistribution.easy} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Medium Questions</span>
                      <span className="text-sm text-gray-600">{mockPerformanceData.difficultyDistribution.medium}%</span>
                    </div>
                    <Progress value={mockPerformanceData.difficultyDistribution.medium} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Hard Questions</span>
                      <span className="text-sm text-gray-600">{mockPerformanceData.difficultyDistribution.hard}%</span>
                    </div>
                    <Progress value={mockPerformanceData.difficultyDistribution.hard} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Insights */}
            <Card className="ai-insight">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{mockPerformanceData.topPerformers}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Students scoring above 90%</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">{mockPerformanceData.needsImprovement}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Students needing support</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">23</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Questions flagged for review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <div className="space-y-6">
              {/* Quiz Selector */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Quiz Performance Analysis</CardTitle>
                    <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select a quiz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Quizzes</SelectItem>
                        {quizzes?.map((quiz: any) => (
                          <SelectItem key={quiz.id} value={quiz.id}>
                            {quiz.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedQuiz === "all" ? (
                    <AnalyticsCharts
                      type="bar"
                      data={mockPerformanceData.performanceTrends}
                      xKey="week"
                      yKey="score"
                      height={400}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-300">
                        {quizAnalytics ? "Loading quiz analytics..." : "Select a specific quiz to view detailed analytics"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Question Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPerformanceData.questionAccuracy.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{item.question}</h4>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Accuracy:</span>
                            <Badge className={item.accuracy >= 80 ? "bg-green-100 text-green-800" : item.accuracy >= 60 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                              {item.accuracy}%
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Difficulty:</span>
                            <Badge className={`difficulty-indicator ${item.difficulty <= 3 ? "difficulty-easy" : item.difficulty <= 7 ? "difficulty-medium" : "difficulty-hard"}`}>
                              {item.difficulty}/10
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.accuracy < 70 && (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student Performance Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsCharts
                    type="histogram"
                    data={[
                      { range: "0-49", count: 12 },
                      { range: "50-59", count: 28 },
                      { range: "60-69", count: 45 },
                      { range: "70-79", count: 67 },
                      { range: "80-89", count: 78 },
                      { range: "90-100", count: 43 },
                    ]}
                    xKey="range"
                    yKey="count"
                    height={300}
                  />
                </CardContent>
              </Card>

              {/* Time Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Time Spent Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average completion time</span>
                      <span className="text-sm font-bold">24 minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Fastest completion</span>
                      <span className="text-sm font-bold">8 minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Slowest completion</span>
                      <span className="text-sm font-bold">58 minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Incomplete attempts</span>
                      <span className="text-sm font-bold text-red-600">7.7%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
