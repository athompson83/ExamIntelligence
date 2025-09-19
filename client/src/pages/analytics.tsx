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
  Filter
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

  // Mock comprehensive analytics data
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 md:ml-64">
        <TopBar />
        <main className="p-4 md:p-6 pb-32 md:pb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
              <p className="text-gray-600">Comprehensive assessment analytics and insights</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-40">
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
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <Filter className="mr-2 h-4 w-4" />
                  <span className="hidden xs:inline">Filters</span>
                </Button>
                
                <Button className="flex-1 sm:flex-none bg-primary hover:bg-primary/90">
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden xs:inline">Export Report</span>
                  <span className="xs:hidden">Export</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Overview Cards - Mobile Carousel */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Overview</h3>
            <div className="mobile-carousel lg:grid lg:grid-cols-4 lg:gap-6 lg:space-x-0">
              <div className="mobile-carousel-item lg:w-auto">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Exams</p>
                        <p className="text-3xl font-bold text-foreground">{data.overview.totalExams}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">+12% from last period</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mobile-carousel-item lg:w-auto">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                        <p className="text-3xl font-bold text-foreground">{data.overview.totalStudents}</p>
                      </div>
                      <Users className="h-8 w-8 text-secondary" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">+8% from last period</p>
                  </CardContent>
                </Card>
              </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                    <p className="text-3xl font-bold text-foreground">{data.overview.averageScore}%</p>
                  </div>
                  <Target className="h-8 w-8 text-accent" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">+2.3% from last period</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                    <p className="text-3xl font-bold text-foreground">{data.overview.completionRate}%</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">+1.2% from last period</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-6">
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="questions">Question Analysis</TabsTrigger>
              <TabsTrigger value="engagement">Student Engagement</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Score Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.performance.scoreDistribution.map((item: any) => (
                        <div key={item.range} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.range}%</span>
                          <div className="flex items-center space-x-2 flex-1 max-w-xs">
                            <Progress value={item.percentage} className="flex-1" />
                            <span className="text-sm text-muted-foreground w-12">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between space-x-2">
                      {data.performance.trends.map((item: any, index: number) => (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div 
                            className="bg-primary w-full rounded-t transition-all duration-500"
                            style={{ height: `${(item.score / 100) * 200}px` }}
                          />
                          <span className="text-xs text-muted-foreground mt-2">{item.period}</span>
                          <span className="text-xs font-medium">{item.score}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performing Questions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5 text-secondary" />
                      Top Performing Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.questions.topPerforming.map((question: any) => (
                        <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{question.text}</p>
                            <Badge variant="outline" className="mt-1 text-secondary border-secondary">
                              {question.correctRate}% correct
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Poor Performing Questions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="mr-2 h-5 w-5 text-destructive" />
                      Questions Needing Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.questions.poorPerforming.map((question: any) => (
                        <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{question.text}</p>
                            <Badge variant="outline" className="mt-1 text-destructive border-destructive">
                              {question.correctRate}% correct
                            </Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Question Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Question Bank Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{data.questions.totalQuestions}</p>
                      <p className="text-sm text-muted-foreground">Total Questions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-secondary">{data.questions.averageDifficulty}/10</p>
                      <p className="text-sm text-muted-foreground">Avg. Difficulty</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-accent">{data.questions.validationStatus.validated}%</p>
                      <p className="text-sm text-muted-foreground">AI Validated</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{data.questions.validationStatus.pending}%</p>
                      <p className="text-sm text-muted-foreground">Pending Review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg. Time/Question</p>
                        <p className="text-2xl font-bold">{data.engagement.averageTimePerQuestion} min</p>
                      </div>
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Dropout Rate</p>
                        <p className="text-2xl font-bold">{data.engagement.dropoutRate}%</p>
                      </div>
                      <TrendingUp className="h-6 w-6 text-destructive" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Retake Rate</p>
                        <p className="text-2xl font-bold">{data.engagement.retakeRate}%</p>
                      </div>
                      <Users className="h-6 w-6 text-secondary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Help Requests</p>
                        <p className="text-2xl font-bold">{data.engagement.helpRequestsPerExam}</p>
                      </div>
                      <Award className="h-6 w-6 text-accent" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Long-term Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Advanced trend analysis chart would be displayed here</p>
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
