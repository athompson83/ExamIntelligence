import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Target, 
  Award,
  Download,
  Filter,
  Activity
} from "lucide-react";
import { useEffect } from "react";

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [timeRange, setTimeRange] = useState("30");
  const [selectedMetric, setSelectedMetric] = useState("performance");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/analytics/comprehensive', timeRange],
    enabled: isAuthenticated,
  });

  const mockData = {
    overview: {
      totalExams: 45,
      totalStudents: 1247,
      averageScore: 78.5,
      completionRate: 94.2
    },
    performance: {
      scoreDistribution: [
        { range: "90-100", count: 234, percentage: 18.8 },
        { range: "80-89", count: 387, percentage: 31.0 },
        { range: "70-79", count: 298, percentage: 23.9 },
        { range: "60-69", count: 187, percentage: 15.0 },
        { range: "0-59", count: 141, percentage: 11.3 }
      ],
      trends: [
        { period: "Week 1", score: 76.2 },
        { period: "Week 2", score: 77.8 },
        { period: "Week 3", score: 78.5 },
        { period: "Week 4", score: 79.1 }
      ]
    },
    questions: {
      totalQuestions: 1284,
      averageDifficulty: 6.2,
      validationStatus: {
        validated: 89,
        pending: 11
      },
      topPerforming: [
        { id: 1, text: "What is photosynthesis?", correctRate: 94.5 },
        { id: 2, text: "Define mitosis", correctRate: 91.2 },
        { id: 3, text: "Explain cellular respiration", correctRate: 88.7 }
      ],
      poorPerforming: [
        { id: 4, text: "Advanced genetics question", correctRate: 45.2 },
        { id: 5, text: "Complex chemistry problem", correctRate: 52.1 },
        { id: 6, text: "Physics calculation", correctRate: 58.3 }
      ]
    },
    engagement: {
      averageTimePerQuestion: 2.3,
      dropoutRate: 5.8,
      retakeRate: 12.4,
      helpRequestsPerExam: 3.7
    }
  };

  const data = analyticsData || mockData;

  if (isLoading || analyticsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 md:ml-64">
        <TopBar />
        <main className="pb-32 md:pb-8">
          {/* Gradient Hero Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 md:p-8 mb-6 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="animate-fade-in">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
                <p className="text-blue-100">Comprehensive assessment analytics and insights</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-full sm:w-40 bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 sm:flex-none bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20 transition-all">
                    <Filter className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                  
                  <Button className="flex-1 sm:flex-none bg-white text-blue-600 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 md:px-6">
            {/* Overview Stat Cards */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card 
                  className="rounded-2xl shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: '0ms' }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-100 mb-1">Total Exams</p>
                        <p className="text-3xl font-bold text-white">{(data as any).overview.totalExams}</p>
                        <p className="text-xs text-blue-100 mt-2">+12% from last period</p>
                      </div>
                      <BarChart3 className="h-12 w-12 text-white opacity-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="rounded-2xl shadow-lg bg-gradient-to-br from-green-500 to-green-600 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: '100ms' }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-green-100 mb-1">Total Students</p>
                        <p className="text-3xl font-bold text-white">{(data as any).overview.totalStudents}</p>
                        <p className="text-xs text-green-100 mt-2">+8% from last period</p>
                      </div>
                      <Users className="h-12 w-12 text-white opacity-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="rounded-2xl shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: '200ms' }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-amber-100 mb-1">Average Score</p>
                        <p className="text-3xl font-bold text-white">{(data as any).overview.averageScore}%</p>
                        <p className="text-xs text-amber-100 mt-2">+2.3% from last period</p>
                      </div>
                      <Target className="h-12 w-12 text-white opacity-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="rounded-2xl shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: '300ms' }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-purple-100 mb-1">Completion Rate</p>
                        <p className="text-3xl font-bold text-white">{(data as any).overview.completionRate}%</p>
                        <p className="text-xs text-purple-100 mt-2">+1.2% from last period</p>
                      </div>
                      <Award className="h-12 w-12 text-white opacity-20" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-6">
              <TabsList className="bg-white shadow-md rounded-xl p-1">
                <TabsTrigger value="performance" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                  Performance
                </TabsTrigger>
                <TabsTrigger value="questions" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                  Question Analysis
                </TabsTrigger>
                <TabsTrigger value="engagement" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                  Student Engagement
                </TabsTrigger>
                <TabsTrigger value="trends" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                  Trends
                </TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                    <CardHeader className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-t-2xl">
                      <CardTitle className="text-xl font-semibold">Score Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {(data as any).performance.scoreDistribution.map((item: any, index: number) => (
                          <div key={item.range} className="flex items-center justify-between animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                            <span className="text-sm font-medium min-w-20">{item.range}%</span>
                            <div className="flex items-center space-x-3 flex-1 max-w-md">
                              <Progress value={item.percentage} className="flex-1 h-3" />
                              <span className="text-sm text-muted-foreground w-16 text-right font-medium">{item.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                    <CardHeader className="p-6 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-t-2xl">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Performance Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-64 flex items-end justify-between gap-3">
                        {(data as any).performance.trends.map((item: any, index: number) => (
                          <div key={index} className="flex flex-col items-center flex-1 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                            <div 
                              className="bg-gradient-to-t from-blue-600 to-blue-400 w-full rounded-t-lg transition-all duration-500 hover:scale-105"
                              style={{ height: `${(item.score / 100) * 200}px` }}
                            />
                            <span className="text-xs text-muted-foreground mt-3 font-medium">{item.period}</span>
                            <span className="text-xs font-bold text-blue-600">{item.score}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="questions" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                    <CardHeader className="p-6 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-t-2xl">
                      <CardTitle className="flex items-center text-xl font-semibold">
                        <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                        Top Performing Questions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {(data as any).questions.topPerforming.map((question: any, index: number) => (
                          <div 
                            key={question.id} 
                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md hover:scale-102 transition-all duration-200 animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-2">{question.text}</p>
                              <Badge className="rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white border-0 px-3 py-1">
                                {question.correctRate}% correct
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                    <CardHeader className="p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-t-2xl">
                      <CardTitle className="flex items-center text-xl font-semibold">
                        <Target className="mr-2 h-5 w-5 text-red-600" />
                        Questions Needing Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {(data as any).questions.poorPerforming.map((question: any, index: number) => (
                          <div 
                            key={question.id} 
                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md hover:scale-102 transition-all duration-200 animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-2">{question.text}</p>
                              <Badge className="rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white border-0 px-3 py-1">
                                {question.correctRate}% correct
                              </Badge>
                            </div>
                            <Button variant="outline" size="sm" className="ml-3 rounded-xl hover:bg-blue-50 transition-all">
                              Review
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                  <CardHeader className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-t-2xl">
                    <CardTitle className="text-xl font-semibold">Question Bank Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 hover:scale-105 transition-all">
                        <p className="text-3xl font-bold text-blue-600 mb-1">{(data as any).questions.totalQuestions}</p>
                        <p className="text-sm text-muted-foreground font-medium">Total Questions</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/10 hover:scale-105 transition-all">
                        <p className="text-3xl font-bold text-green-600 mb-1">{(data as any).questions.averageDifficulty}/10</p>
                        <p className="text-sm text-muted-foreground font-medium">Avg. Difficulty</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 hover:scale-105 transition-all">
                        <p className="text-3xl font-bold text-amber-600 mb-1">{(data as any).questions.validationStatus.validated}%</p>
                        <p className="text-sm text-muted-foreground font-medium">AI Validated</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 hover:scale-105 transition-all">
                        <p className="text-3xl font-bold text-purple-600 mb-1">{(data as any).questions.validationStatus.pending}%</p>
                        <p className="text-sm text-muted-foreground font-medium">Pending Review</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="engagement" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="rounded-2xl shadow-lg bg-white dark:bg-gray-800 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-1">Avg. Time/Question</p>
                          <p className="text-2xl font-bold text-blue-600">{(data as any).engagement.averageTimePerQuestion} min</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl shadow-lg bg-white dark:bg-gray-800 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-1">Dropout Rate</p>
                          <p className="text-2xl font-bold text-red-600">{(data as any).engagement.dropoutRate}%</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl shadow-lg bg-white dark:bg-gray-800 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-1">Retake Rate</p>
                          <p className="text-2xl font-bold text-green-600">{(data as any).engagement.retakeRate}%</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Users className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl shadow-lg bg-white dark:bg-gray-800 border-0 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-1">Help Requests</p>
                          <p className="text-2xl font-bold text-amber-600">{(data as any).engagement.helpRequestsPerExam}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Activity className="h-6 w-6 text-amber-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                  <CardHeader className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-t-2xl">
                    <CardTitle className="text-xl font-semibold">Long-term Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center">
                      <div className="text-center">
                        <Activity className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">Advanced trend analysis chart would be displayed here</p>
                        <Button className="mt-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all">
                          View Detailed Trends
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
