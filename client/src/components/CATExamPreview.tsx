import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Brain, 
  Target, 
  Clock, 
  TrendingUp, 
  Users, 
  Award,
  Eye,
  Settings,
  Play,
  ChevronRight,
  Activity,
  Zap,
  Shield,
  Calculator
} from 'lucide-react';

interface CATExamPreviewProps {
  examId: string;
  onStartExam?: () => void;
  onEditExam?: () => void;
}

export default function CATExamPreview({ examId, onStartExam, onEditExam }: CATExamPreviewProps) {
  const [exam, setExam] = useState<any>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState([5]);
  const [simulationMode, setSimulationMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Mock difficulty distribution data
  const difficultyData = [
    { level: 'Very Easy', count: 45, difficulty: 1, color: '#22c55e' },
    { level: 'Easy', count: 78, difficulty: 2, color: '#84cc16' },
    { level: 'Medium', count: 156, difficulty: 3, color: '#eab308' },
    { level: 'Hard', count: 123, difficulty: 4, color: '#f97316' },
    { level: 'Very Hard', count: 67, difficulty: 5, color: '#ef4444' },
    { level: 'Expert', count: 34, difficulty: 6, color: '#dc2626' },
  ];

  // Mock adaptive progression simulation
  const adaptiveProgressData = [
    { question: 1, difficulty: 3, correct: true, abilityEstimate: 0.2 },
    { question: 2, difficulty: 4, correct: true, abilityEstimate: 0.4 },
    { question: 3, difficulty: 5, correct: false, abilityEstimate: 0.3 },
    { question: 4, difficulty: 4, correct: true, abilityEstimate: 0.45 },
    { question: 5, difficulty: 4.5, correct: true, abilityEstimate: 0.6 },
    { question: 6, difficulty: 5.5, correct: false, abilityEstimate: 0.5 },
    { question: 7, difficulty: 5, correct: true, abilityEstimate: 0.65 },
    { question: 8, difficulty: 5.5, correct: true, abilityEstimate: 0.75 },
  ];

  // Mock category breakdown
  const categoryData = [
    { name: 'Cell Biology', percentage: 40, questions: 156, avgDifficulty: 4.2 },
    { name: 'Genetics', percentage: 30, questions: 117, avgDifficulty: 4.6 },
    { name: 'Evolution', percentage: 30, questions: 98, avgDifficulty: 3.8 },
  ];

  const pieColors = ['#8884d8', '#82ca9d', '#ffc658'];

  useEffect(() => {
    fetchExamData();
  }, [examId]);

  const fetchExamData = async () => {
    try {
      const response = await fetch(`/api/cat-exams/${examId}`);
      if (response.ok) {
        const examData = await response.json();
        setExam(examData);
      }
    } catch (error) {
      console.error('Error fetching exam data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-500';
    if (difficulty <= 3) return 'bg-yellow-500';
    if (difficulty <= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return 'Easy';
    if (difficulty <= 3) return 'Medium';
    if (difficulty <= 4) return 'Hard';
    return 'Expert';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!exam) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Exam not found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                {exam.title}
              </CardTitle>
              <CardDescription className="text-base">
                {exam.description}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onEditExam} className="hidden sm:flex">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button onClick={onStartExam} className="bg-blue-600 hover:bg-blue-700">
                <Play className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Start Exam</span>
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {exam.subject}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {exam.estimatedDuration}
            </Badge>
            <Badge variant={exam.status === 'published' ? 'default' : 'secondary'}>
              {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
            </Badge>
            {exam.proctoringEnabled && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Proctored
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Interactive Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="difficulty">Difficulty</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Sessions</p>
                    <p className="text-2xl font-bold">{exam.sessions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Avg Score</p>
                    <p className="text-2xl font-bold">{exam.avgScore || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Pass Rate</p>
                    <p className="text-2xl font-bold">78%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Avg Time</p>
                    <p className="text-2xl font-bold">32 min</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((category, index) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{category.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{category.questions} questions</Badge>
                        <Badge className={getDifficultyColor(category.avgDifficulty)}>
                          {getDifficultyLabel(category.avgDifficulty)}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                    <p className="text-sm text-gray-600">{category.percentage}% of exam</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Difficulty Analysis Tab */}
        <TabsContent value="difficulty" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Question Difficulty Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={difficultyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="level" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Difficulty Level Explorer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Selected Difficulty Level: {selectedDifficulty[0]}</Label>
                  <Slider
                    value={selectedDifficulty}
                    onValueChange={setSelectedDifficulty}
                    max={6}
                    min={1}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium mb-2">
                    Level {selectedDifficulty[0]} - {getDifficultyLabel(selectedDifficulty[0])}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Questions at this difficulty level test {
                      selectedDifficulty[0] <= 2 ? 'basic understanding and recall' :
                      selectedDifficulty[0] <= 3 ? 'application and comprehension' :
                      selectedDifficulty[0] <= 4 ? 'analysis and synthesis' :
                      'evaluation and expert-level critical thinking'
                    }.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getDifficultyColor(selectedDifficulty[0])}`}></div>
                    <span className="text-sm">
                      ~{Math.round(120 - (selectedDifficulty[0] * 15))} questions available
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Adaptive Algorithm Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Adaptive Algorithm Preview
              </CardTitle>
              <CardDescription>
                This shows how the exam adapts difficulty based on student responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={adaptiveProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="question" label={{ value: 'Question Number', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Difficulty Level', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'difficulty' ? 'Difficulty' : 'Ability Estimate']}
                    labelFormatter={(label) => `Question ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="difficulty" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    name="Question Difficulty"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="abilityEstimate" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Student Ability Estimate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulation Tab */}
        <TabsContent value="simulation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Interactive Exam Simulation
              </CardTitle>
              <CardDescription>
                Experience how the adaptive exam works from a student's perspective
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="simulation-mode"
                  checked={simulationMode}
                  onCheckedChange={setSimulationMode}
                />
                <Label htmlFor="simulation-mode">Enable Interactive Simulation</Label>
              </div>

              {simulationMode ? (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Simulation Progress</h4>
                    <Badge>Question 3 of 10-50</Badge>
                  </div>
                  
                  <Progress value={30} className="h-2" />
                  
                  <div className="bg-white dark:bg-gray-900 p-4 rounded border">
                    <h5 className="font-medium mb-2">Sample Question (Difficulty: 4.2)</h5>
                    <p className="mb-4">
                      Which cellular process is primarily responsible for ATP production in eukaryotic cells?
                    </p>
                    <div className="space-y-2">
                      {['Glycolysis', 'Cellular Respiration', 'Photosynthesis', 'Fermentation'].map((option, i) => (
                        <button
                          key={i}
                          className="w-full text-left p-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          {String.fromCharCode(65 + i)}. {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline">Previous</Button>
                    <Button>Next Question</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Enable simulation mode to try the interactive exam preview
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={adaptiveProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="question" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="abilityEstimate" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Exam Settings Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Exam Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Starting Difficulty</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">5.0</div>
                </div>
                <div className="space-y-2">
                  <Label>Min Questions</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">10</div>
                </div>
                <div className="space-y-2">
                  <Label>Max Questions</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">50</div>
                </div>
                <div className="space-y-2">
                  <Label>Time Limit</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">120 minutes</div>
                </div>
                <div className="space-y-2">
                  <Label>Passing Score</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">70%</div>
                </div>
                <div className="space-y-2">
                  <Label>Calculator</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Not Allowed
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}