import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Lightbulb, 
  Shield, 
  Download,
  Users,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const performanceData = [
  { name: 'Mon', score: 75 },
  { name: 'Tue', score: 82 },
  { name: 'Wed', score: 78 },
  { name: 'Thu', score: 85 },
  { name: 'Fri', score: 88 },
  { name: 'Sat', score: 82 },
  { name: 'Sun', score: 79 },
];

const mockPerformanceData = {
  totalAttempts: 1247,
  averageScore: 78.5,
  completionRate: 92.3,
  totalTimeSpent: 15680,
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

export function AnalyticsOverview() {
  const { toast } = useToast();
  const [selectedTimeRange, setSelectedTimeRange] = useState("7days");
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");

  const { data: systemAnalytics, isLoading } = useQuery({
    queryKey: ["/api/analytics/system"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: quizzes } = useQuery({
    queryKey: ["/api/quizzes"],
    retry: false,
  });

  const { data: overallStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/overview", selectedTimeRange],
    retry: false,
  });

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

  if (isLoading) {
    return (
      <Card className="rounded-2xl shadow-lg animate-shimmer" data-testid="card-analytics-overview">
        <CardHeader className="p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted rounded-2xl p-4">
                <Skeleton className="h-6 w-32 mb-3" />
                <Skeleton className="h-32 w-full mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-0 rounded-2xl shadow-lg animate-fade-in" data-testid="card-analytics-overview">
      <CardHeader className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Performance Analytics
          </CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32 rounded-xl border-2 focus:ring-4 focus:ring-blue-100" data-testid="select-time-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportData('csv')}
              className="rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
              data-testid="button-export-analytics"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="inline-flex h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-full gap-1">
            <TabsTrigger 
              value="overview" 
              className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300" 
              data-testid="tab-overview"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300" 
              data-testid="tab-performance"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="questions" 
              className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300" 
              data-testid="tab-questions"
            >
              Questions
            </TabsTrigger>
            <TabsTrigger 
              value="students" 
              className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300" 
              data-testid="tab-students"
            >
              Students
            </TabsTrigger>
            <TabsTrigger 
              value="trends" 
              className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300" 
              data-testid="tab-trends"
            >
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-0" data-testid="stat-total-attempts">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Attempts</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {mockPerformanceData.totalAttempts.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +12% vs last period
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-0" data-testid="stat-average-score">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {mockPerformanceData.averageScore}%
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +3.2% improvement
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-0" data-testid="stat-completion-rate">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {mockPerformanceData.completionRate}%
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +1.8% vs last month
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-0" data-testid="stat-avg-time">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Time Spent</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.round(mockPerformanceData.totalTimeSpent / mockPerformanceData.totalAttempts)}m
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center mt-1">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        +2m vs target
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-xl shadow-md border-0">
                <CardHeader className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">Exam Performance Trends</h4>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                        <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip />
                        <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
                    Average score: 78.5%
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-xl shadow-md border-0">
                <CardHeader className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">Question Difficulty Distribution</h4>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Easy Questions</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {mockPerformanceData.difficultyDistribution.easy}%
                        </span>
                      </div>
                      <Progress value={mockPerformanceData.difficultyDistribution.easy} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Medium Questions</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {mockPerformanceData.difficultyDistribution.medium}%
                        </span>
                      </div>
                      <Progress value={mockPerformanceData.difficultyDistribution.medium} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hard Questions</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {mockPerformanceData.difficultyDistribution.hard}%
                        </span>
                      </div>
                      <Progress value={mockPerformanceData.difficultyDistribution.hard} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10">
              <CardHeader className="p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  AI-Powered Insights
                </h4>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Performance Improving</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Overall scores have increased by 3.2% this period. Students are responding well to recent curriculum changes.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Exam Integrity Strong</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        No suspicious patterns detected. Proctoring systems are functioning optimally.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Review DNA Replication Topic</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        68% accuracy rate suggests this topic needs additional coverage or clearer question wording.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="p-6">
                <CardTitle className="text-lg font-semibold">Performance Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  {mockPerformanceData.performanceTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="font-medium text-gray-900 dark:text-white">{trend.week}</span>
                      <div className="flex items-center gap-4 flex-1 ml-6">
                        <Progress value={trend.score} className="flex-1 h-2" />
                        <span className="font-semibold text-sm text-gray-900 dark:text-white w-12 text-right">
                          {trend.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="p-6">
                  <CardTitle className="text-lg font-semibold">Performance Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
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
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="p-6">
                <CardTitle className="text-lg font-semibold">Question Performance Analysis</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Analyze individual question performance and identify areas for improvement
                </p>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  {mockPerformanceData.questionAccuracy.map((question, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{question.question}</h4>
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
                      {question.accuracy < 70 && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                          ⚠ Consider reviewing this topic with students
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="p-6">
                  <CardTitle className="text-lg font-semibold">Top Performers</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
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
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
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

              <Card className="shadow-sm">
                <CardHeader className="p-6">
                  <CardTitle className="text-lg font-semibold">Students Needing Support</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="space-y-3">
                    {[
                      { name: "David Brown", score: 58, attempts: 8, issue: "Time management" },
                      { name: "Jennifer Lee", score: 55, attempts: 6, issue: "Concept understanding" },
                      { name: "Robert Garcia", score: 52, attempts: 9, issue: "Question comprehension" },
                    ].map((student, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
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

          <TabsContent value="trends" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="p-6">
                <CardTitle className="text-lg font-semibold">Learning Analytics Insights</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/10">
                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Positive Trends</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Overall scores improving by 3.2%</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Completion rates up 1.8%</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>More students achieving 80%+</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">Areas to Monitor</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Time spent increasing</span>
                      </li>
                      <li className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Hard questions showing lower scores</span>
                      </li>
                      <li className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Some students struggling consistently</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Recommendations</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex items-start">
                        <Lightbulb className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Review DNA Replication topic</span>
                      </li>
                      <li className="flex items-start">
                        <Lightbulb className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Provide additional practice for struggling students</span>
                      </li>
                      <li className="flex items-start">
                        <Lightbulb className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Consider time limit adjustments</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
