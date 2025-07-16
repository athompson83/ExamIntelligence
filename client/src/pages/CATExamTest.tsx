import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Target, 
  BookOpen, 
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Users,
  Plus
} from "lucide-react";

export default function CATExamTest() {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [catState, setCatState] = useState<any>(null);
  const [sessionResults, setSessionResults] = useState<any>(null);

  // Fetch available CAT exams
  const { data: catExams, isLoading: examsLoading } = useQuery({
    queryKey: ['/api/cat-exams'],
    enabled: !!user
  });

  // Fetch testbanks for category setup
  const { data: testbanks } = useQuery({
    queryKey: ['/api/testbanks'],
    enabled: !!user
  });

  // Start CAT exam session
  const startSessionMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await apiRequest(`/api/cat-exams/${examId}/start`, {
        method: 'POST'
      });
      return response;
    },
    onSuccess: (session) => {
      setActiveSession(session);
      setCatState({
        abilityEstimate: 0.0,
        standardError: 1.0,
        questionsAsked: 0,
        responses: [],
        questionDifficulties: []
      });
      getNextQuestion(session.id);
      toast({
        title: "Session Started",
        description: "CAT exam session has begun"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start CAT exam session",
        variant: "destructive"
      });
    }
  });

  // Get next question
  const getNextQuestion = async (sessionId: string) => {
    try {
      const response = await apiRequest(`/api/cat-sessions/${sessionId}/next-question`);
      setCurrentQuestion(response);
      setSelectedAnswer('');
    } catch (error) {
      console.error('Error getting next question:', error);
    }
  };

  // Submit answer
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ sessionId, questionId, answer }: { sessionId: string; questionId: string; answer: string }) => {
      const response = await apiRequest(`/api/cat-sessions/${sessionId}/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          selectedAnswers: [answer],
          timeSpent: 30
        })
      });
      return response;
    },
    onSuccess: (result) => {
      setCatState(prev => ({
        ...prev,
        abilityEstimate: result.abilityEstimate,
        standardError: result.standardError,
        questionsAsked: result.questionsAsked,
        responses: [...prev.responses, result.isCorrect],
        questionDifficulties: [...prev.questionDifficulties, currentQuestion.difficultyScore]
      }));

      if (result.shouldContinue) {
        getNextQuestion(activeSession.id);
      } else {
        completeSession();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit answer",
        variant: "destructive"
      });
    }
  });

  // Complete session
  const completeSession = async () => {
    try {
      const response = await apiRequest(`/api/cat-sessions/${activeSession.id}/complete`, {
        method: 'POST'
      });
      setSessionResults(response);
      setActiveSession(null);
      setCurrentQuestion(null);
      setCatState(null);
      
      toast({
        title: "Session Complete",
        description: `Final score: ${response.finalScore}`
      });
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const handleAnswerSubmit = () => {
    if (!selectedAnswer || !activeSession || !currentQuestion) return;
    
    submitAnswerMutation.mutate({
      sessionId: activeSession.id,
      questionId: currentQuestion.id,
      answer: selectedAnswer
    });
  };

  const createSampleExam = async () => {
    try {
      const examData = {
        title: 'Sample CAT Exam',
        description: 'Computer Adaptive Test with multiple categories',
        instructions: 'Answer questions to the best of your ability. The system will adapt to your performance.',
        itemBanks: [
          {
            bankId: testbanks?.[0]?.id || 'bank1',
            percentage: 50,
            minQuestions: 5,
            maxQuestions: 15
          },
          {
            bankId: testbanks?.[1]?.id || 'bank2',
            percentage: 50,
            minQuestions: 5,
            maxQuestions: 15
          }
        ],
        adaptiveSettings: {
          startingDifficulty: 5,
          difficultyAdjustment: 0.5,
          minQuestions: 10,
          maxQuestions: 30,
          terminationCriteria: {
            confidenceLevel: 0.95,
            standardError: 0.3,
            timeLimit: 120
          }
        }
      };

      const response = await apiRequest('/api/cat-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examData)
      });

      await queryClient.invalidateQueries({ queryKey: ['/api/cat-exams'] });
      
      toast({
        title: "Sample Exam Created",
        description: "A sample CAT exam has been created for testing"
      });
    } catch (error) {
      console.error('Error creating sample exam:', error);
      toast({
        title: "Error",
        description: "Failed to create sample exam",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CAT Exam Testing</h1>
          <p className="text-gray-600">Test Computer Adaptive Testing functionality</p>
        </div>

        <Tabs defaultValue="exams" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="exams">Available Exams</TabsTrigger>
            <TabsTrigger value="session">Active Session</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="debug">Debug Info</TabsTrigger>
          </TabsList>

          <TabsContent value="exams" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Available CAT Exams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {examsLoading ? (
                    <div className="text-center py-8">Loading exams...</div>
                  ) : catExams && catExams.length > 0 ? (
                    <div className="space-y-4">
                      {catExams.map((exam: any) => (
                        <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-semibold">{exam.title}</h3>
                            <p className="text-sm text-gray-600">{exam.description}</p>
                          </div>
                          <Button
                            onClick={() => startSessionMutation.mutate(exam.id)}
                            disabled={startSessionMutation.isPending || !!activeSession}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No CAT exams available</p>
                      <Button onClick={createSampleExam}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Sample Exam
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Item Banks Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {testbanks?.map((bank: any) => (
                      <div key={bank.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{bank.title}</p>
                          <p className="text-sm text-gray-600">{bank.questionCount || 0} questions</p>
                        </div>
                        <Badge variant="secondary">{bank.tags?.[0] || 'General'}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="session" className="space-y-6">
            {activeSession ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Current Question
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentQuestion ? (
                        <div className="space-y-6">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold mb-2">{currentQuestion.questionText}</h3>
                            <div className="space-y-2">
                              {currentQuestion.answerOptions?.map((option: any) => (
                                <div
                                  key={option.id}
                                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                    selectedAnswer === option.id
                                      ? 'bg-blue-50 border-blue-300'
                                      : 'hover:bg-gray-50'
                                  }`}
                                  onClick={() => setSelectedAnswer(option.id)}
                                >
                                  <span className="font-medium">{option.id.toUpperCase()}.</span> {option.answerText}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                Difficulty: {currentQuestion.difficultyScore}/10
                              </Badge>
                              <Badge variant="outline">
                                Category: {currentQuestion.category}
                              </Badge>
                            </div>
                            <Button
                              onClick={handleAnswerSubmit}
                              disabled={!selectedAnswer || submitAnswerMutation.isPending}
                            >
                              Submit Answer
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Loading next question...</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Session Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {catState && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Questions Asked</span>
                            <span className="text-sm">{catState.questionsAsked}</span>
                          </div>
                          <Progress value={(catState.questionsAsked / 30) * 100} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Ability Estimate</span>
                            <span className="text-sm">{catState.abilityEstimate.toFixed(2)}</span>
                          </div>
                          <Progress value={((catState.abilityEstimate + 3) / 6) * 100} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Standard Error</span>
                            <span className="text-sm">{catState.standardError.toFixed(2)}</span>
                          </div>
                          <Progress value={Math.max(0, 100 - (catState.standardError * 100))} className="h-2" />
                        </div>

                        <div className="pt-4 border-t">
                          <p className="text-sm text-gray-600">
                            Correct: {catState.responses.filter(Boolean).length} / {catState.responses.length}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
                  <p className="text-gray-600">Start a CAT exam to begin testing</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {sessionResults ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Session Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-green-800">Final Score</h3>
                      <p className="text-2xl font-bold text-green-600">{sessionResults.finalScore}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-800">Scaled Score</h3>
                      <p className="text-2xl font-bold text-blue-600">{sessionResults.scaledScore}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h3 className="font-semibold text-purple-800">Percentile</h3>
                      <p className="text-2xl font-bold text-purple-600">{sessionResults.percentileRank}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h3 className="font-semibold text-orange-800">Questions</h3>
                      <p className="text-2xl font-bold text-orange-600">{sessionResults.questionsAsked}</p>
                    </div>
                  </div>
                  
                  {sessionResults.categoryResults && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-4">Category Performance</h3>
                      <div className="space-y-3">
                        {Object.entries(sessionResults.categoryResults).map(([category, result]: [string, any]) => (
                          <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">{category}</span>
                            <div className="flex gap-4">
                              <span className="text-sm text-gray-600">Score: {result.score}</span>
                              <span className="text-sm text-gray-600">Questions: {result.questionsAsked}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Results Available</h3>
                  <p className="text-gray-600">Complete a CAT exam to see results</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="debug" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">User Information</h3>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Active Session</h3>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(activeSession, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">CAT State</h3>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(catState, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Current Question</h3>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(currentQuestion, null, 2)}
                    </pre>
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