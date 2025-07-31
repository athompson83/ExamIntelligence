import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Award,
  Eye,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";

interface QuizAnalytics {
  id: string;
  title: string;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  averageTime: number;
  difficultyAnalysis: {
    easy: number;
    medium: number;
    hard: number;
  };
  questionAnalysis: Array<{
    questionId: string;
    questionText: string;
    correctRate: number;
    averageTime: number;
    discriminationIndex: number;
    responses: Array<{
      option: string;
      count: number;
      percentage: number;
    }>;
  }>;
  timeAnalysis: Array<{
    date: string;
    attempts: number;
    averageScore: number;
  }>;
  studentPerformance: Array<{
    studentId: string;
    studentName: string;
    score: number;
    timeSpent: number;
    attempts: number;
    submittedAt: string;
  }>;
}

interface CourseAnalytics {
  totalStudents: number;
  activeStudents: number;
  totalQuizzes: number;
  completionRate: number;
  averageGrade: number;
  engagementScore: number;
  timeSpentDistribution: Array<{
    range: string;
    count: number;
  }>;
  gradeDistribution: Array<{
    grade: string;
    count: number;
    percentage: number;
  }>;
  weeklyActivity: Array<{
    week: string;
    submissions: number;
    logins: number;
    timeSpent: number;
  }>;
  studentRiskAnalysis: Array<{
    studentId: string;
    studentName: string;
    riskLevel: 'low' | 'medium' | 'high';
    factors: string[];
    lastActivity: string;
  }>;
}

export default function AnalyticsDashboard() {
  const { isAuthenticated } = useAuth();
  const [selectedQuiz, setSelectedQuiz] = useState<string>("");
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch course analytics
  const { data: courseAnalytics, isLoading: courseLoading } = useQuery({
    queryKey: ['/api/analytics/course', timeRange],
    enabled: isAuthenticated,
  });

  // Fetch quiz list
  const { data: quizzes } = useQuery({
    queryKey: ['/api/quizzes'],
    enabled: isAuthenticated,
  });

  // Fetch quiz analytics
  const { data: quizAnalytics, isLoading: quizLoading } = useQuery({
    queryKey: ['/api/analytics/quiz', selectedQuiz, timeRange],
    enabled: isAuthenticated && !!selectedQuiz,
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Please log in to access analytics.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <TopBar />
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
              <p className="text-gray-600">Comprehensive assessment analytics and insights</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Course Overview</TabsTrigger>
              <TabsTrigger value="quiz">Quiz Analytics</TabsTrigger>
              <TabsTrigger value="students">Student Performance</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>
            
            {/* Course Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {courseLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : courseAnalytics ? (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{courseAnalytics.totalStudents}</div>
                        <p className="text-xs text-muted-foreground">
                          {courseAnalytics.activeStudents} active this week
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{courseAnalytics.averageGrade}%</div>
                        <p className="text-xs text-muted-foreground">
                          {courseAnalytics.completionRate}% completion rate
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{courseAnalytics.totalQuizzes}</div>
                        <p className="text-xs text-muted-foreground">
                          Active assessments
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{courseAnalytics.engagementScore}/100</div>
                        <p className="text-xs text-muted-foreground">
                          Engagement score
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Weekly Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Weekly Activity</CardTitle>
                        <CardDescription>Student engagement over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={courseAnalytics.weeklyActivity}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="submissions" stackId="1" stroke="#8884d8" fill="#8884d8" />
                            <Area type="monotone" dataKey="logins" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Grade Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Grade Distribution</CardTitle>
                        <CardDescription>Student performance breakdown</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={courseAnalytics.gradeDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ grade, percentage }) => `${grade}: ${percentage}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                            >
                              {courseAnalytics.gradeDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* At-Risk Students */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Student Risk Analysis</CardTitle>
                      <CardDescription>Students who may need additional support</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {courseAnalytics.studentRiskAnalysis.map((student) => (
                            <div key={student.studentId} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  student.riskLevel === 'high' ? 'bg-red-500' :
                                  student.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                }`} />
                                <div>
                                  <p className="font-medium">{student.studentName}</p>
                                  <p className="text-sm text-gray-600">
                                    Last activity: {format(new Date(student.lastActivity), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className={getRiskColor(student.riskLevel)}>
                                  {student.riskLevel} risk
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">
                                  {student.factors.join(', ')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
                  <p className="text-gray-600">Analytics data will appear here once students start taking quizzes.</p>
                </div>
              )}
            </TabsContent>

            {/* Quiz Analytics Tab */}
            <TabsContent value="quiz" className="space-y-6">
              <div className="flex items-center space-x-4">
                <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a quiz to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes?.map((quiz: any) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedQuiz && quizAnalytics ? (
                <>
                  {/* Quiz Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{quizAnalytics.totalAttempts}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{quizAnalytics.averageScore}%</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{quizAnalytics.passRate}%</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatTime(quizAnalytics.averageTime)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Question Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Question Analysis</CardTitle>
                      <CardDescription>Performance breakdown by question</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <div className="space-y-4">
                          {quizAnalytics.questionAnalysis.map((question, index) => (
                            <div key={question.questionId} className="border rounded p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium">Question {index + 1}</h4>
                                <div className="flex items-center space-x-2">
                                  <Badge variant={question.correctRate >= 70 ? "default" : question.correctRate >= 50 ? "secondary" : "destructive"}>
                                    {question.correctRate}% correct
                                  </Badge>
                                  <Badge variant="outline">
                                    Avg: {formatTime(question.averageTime)}
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3">{question.questionText}</p>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">Correct Rate</span>
                                  <Progress value={question.correctRate} className="w-32" />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">Discrimination Index</span>
                                  <span className="text-sm">{question.discriminationIndex.toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Response Distribution */}
                              <div className="mt-3">
                                <h5 className="text-sm font-medium mb-2">Response Distribution</h5>
                                <div className="space-y-1">
                                  {question.responses.map((response, idx) => (
                                    <div key={idx} className="flex items-center space-x-2">
                                      <span className="text-sm w-8">{response.option}:</span>
                                      <Progress value={response.percentage} className="flex-1" />
                                      <span className="text-sm w-12">{response.percentage}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Performance Over Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Over Time</CardTitle>
                      <CardDescription>Quiz performance trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={quizAnalytics.timeAnalysis}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="averageScore" stroke="#8884d8" />
                          <Line type="monotone" dataKey="attempts" stroke="#82ca9d" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12">
                  <PieChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Quiz</h3>
                  <p className="text-gray-600">Choose a quiz from the dropdown to view detailed analytics.</p>
                </div>
              )}
            </TabsContent>

            {/* Student Performance Tab */}
            <TabsContent value="students" className="space-y-6">
              {selectedQuiz && quizAnalytics ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Student Performance - {quizAnalytics.title}</CardTitle>
                    <CardDescription>Individual student results and analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {quizAnalytics.studentPerformance.map((student) => (
                          <div key={student.studentId} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm">
                                {student.studentName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{student.studentName}</p>
                                <p className="text-sm text-gray-600">
                                  Submitted: {format(new Date(student.submittedAt), 'MMM d, yyyy HH:mm')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-semibold ${
                                student.score >= 90 ? 'text-green-600' :
                                student.score >= 80 ? 'text-blue-600' :
                                student.score >= 70 ? 'text-yellow-600' :
                                student.score >= 60 ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {student.score}%
                              </div>
                              <p className="text-sm text-gray-600">
                                {formatTime(student.timeSpent)} • {student.attempts} attempt{student.attempts !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Quiz</h3>
                  <p className="text-gray-600">Choose a quiz to view individual student performance.</p>
                </div>
              )}
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Insights</CardTitle>
                  <CardDescription>Intelligent analysis and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">AI Insights Coming Soon</h3>
                    <p className="text-gray-600">Advanced AI analysis will provide personalized insights and recommendations.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}