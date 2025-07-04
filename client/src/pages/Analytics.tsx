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

  const exportData = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}&timeRange=${selectedTimeRange}&quiz=${selectedQuiz}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${format}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `Analytics data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed", 
        description: "Unable to export analytics data",
        variant: "destructive",
      });
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">Comprehensive assessment analytics and insights</p>
          </div>
          <div className="flex items-center gap-3">
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
            <Button variant="outline" onClick={() => exportData('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Attempts</p>
                  <p className="text-2xl font-bold">{mockPerformanceData.totalAttempts.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% vs last period
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                  <p className="text-2xl font-bold">{mockPerformanceData.averageScore}%</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +3.2% improvement
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold">{mockPerformanceData.completionRate}%</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +1.8% vs last month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Time Spent</p>
                  <p className="text-2xl font-bold">{Math.round(mockPerformanceData.totalTimeSpent / mockPerformanceData.totalAttempts)}m</p>
                  <p className="text-xs text-red-600 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    +2m vs target
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="questions">Question Analysis</TabsTrigger>
            <TabsTrigger value="students">Student Insights</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">High Performers (80%+)</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        {mockPerformanceData.topPerformers} students
                      </Badge>
                    </div>
                    <Progress value={65} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Average Performers (60-79%)</span>
                      <Badge variant="outline">24 students</Badge>
                    </div>
                    <Progress value={45} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Needs Support (&lt; 60%)</span>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                        {mockPerformanceData.needsImprovement} students
                      </Badge>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Question Difficulty Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Easy Questions</span>
                      <span className="font-semibold">{mockPerformanceData.difficultyDistribution.easy}%</span>
                    </div>
                    <Progress value={mockPerformanceData.difficultyDistribution.easy} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Medium Questions</span>
                      <span className="font-semibold">{mockPerformanceData.difficultyDistribution.medium}%</span>
                    </div>
                    <Progress value={mockPerformanceData.difficultyDistribution.medium} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Hard Questions</span>
                      <span className="font-semibold">{mockPerformanceData.difficultyDistribution.hard}%</span>
                    </div>
                    <Progress value={mockPerformanceData.difficultyDistribution.hard} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPerformanceData.performanceTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="font-medium">{trend.week}</span>
                      <div className="flex items-center gap-3">
                        <Progress value={trend.score} className="w-32 h-2" />
                        <span className="font-semibold text-sm">{trend.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Question Analysis Tab */}
          <TabsContent value="questions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Performance Analysis</CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Analyze individual question performance and identify areas for improvement
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPerformanceData.questionAccuracy.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{question.question}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Difficulty Level: {question.difficulty}/10
                          </p>
                        </div>
                        <Badge 
                          className={
                            question.accuracy >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                            question.accuracy >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          }
                        >
                          {question.accuracy}% accuracy
                        </Badge>
                      </div>
                      <Progress value={question.accuracy} className="h-2" />
                      <div className="mt-2 text-xs text-gray-500">
                        {question.accuracy < 70 && (
                          <span className="text-red-600">⚠ Consider reviewing this topic with students</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student Insights Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Sarah Johnson", score: 94, attempts: 12 },
                      { name: "Michael Chen", score: 91, attempts: 15 },
                      { name: "Emma Davis", score: 89, attempts: 10 },
                      { name: "James Wilson", score: 87, attempts: 14 },
                      { name: "Lisa Anderson", score: 85, attempts: 11 },
                    ].map((student, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{student.attempts} attempts</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          {student.score}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Students Needing Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "David Brown", score: 58, attempts: 8, issue: "Time management" },
                      { name: "Jennifer Lee", score: 55, attempts: 6, issue: "Concept understanding" },
                      { name: "Robert Garcia", score: 52, attempts: 9, issue: "Question comprehension" },
                    ].map((student, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{student.issue}</p>
                          </div>
                        </div>
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                          {student.score}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Analytics Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-green-600">Positive Trends</h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Overall scores improving by 3.2%</li>
                      <li>• Completion rates up 1.8%</li>
                      <li>• More students achieving 80%+</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-yellow-600">Areas to Monitor</h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Time spent increasing</li>
                      <li>• Hard questions showing lower scores</li>
                      <li>• Some students struggling consistently</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-blue-600">Recommendations</h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Review DNA Replication topic</li>
                      <li>• Provide additional practice for struggling students</li>
                      <li>• Consider time limit adjustments</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
