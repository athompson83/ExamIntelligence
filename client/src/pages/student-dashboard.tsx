import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Users, Award } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface QuizForStudent {
  id: string;
  title: string;
  description: string;
  instructions: string;
  timeLimit: number;
  maxAttempts: number;
  availableFrom: string;
  availableUntil: string;
  status: string;
  passingGrade: number;
  pointsPerQuestion: number;
  questionsCount: number;
  allowCalculator: boolean;
  calculatorType: string;
}

interface UserAttempt {
  id: string;
  quizId: string;
  score: number;
  maxScore: number;
  completedAt: string;
  timeSpent: number;
  passed: boolean;
  attemptNumber: number;
}

export default function StudentDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch available quizzes for the student
  const { data: availableQuizzes, isLoading: quizzesLoading } = useQuery<QuizForStudent[]>({
    queryKey: ['/api/student/available-quizzes'],
  });

  // Fetch user's quiz attempts
  const { data: userAttempts, isLoading: attemptsLoading } = useQuery<UserAttempt[]>({
    queryKey: ['/api/student/quiz-attempts'],
  });

  const startQuiz = async (quizId: string) => {
    try {
      const response = await fetch(`/api/student/start-quiz/${quizId}`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        navigate(`/student/quiz/${quizId}`);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to start quiz",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast({
        title: "Error",
        description: "An error occurred while starting the quiz",
        variant: "destructive",
      });
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getAttemptInfo = (quizId: string) => {
    const attempts = (userAttempts || []).filter((attempt: UserAttempt) => attempt.quizId === quizId);
    const attemptCount = attempts.length;
    const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a: UserAttempt) => a.score)) : 0;
    const lastAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;
    
    return { attemptCount, bestScore, lastAttempt };
  };

  const canTakeQuiz = (quiz: QuizForStudent) => {
    const now = new Date();
    const availableFrom = new Date(quiz.availableFrom);
    const availableUntil = new Date(quiz.availableUntil);
    const { attemptCount } = getAttemptInfo(quiz.id);
    
    return now >= availableFrom && now <= availableUntil && attemptCount < quiz.maxAttempts;
  };

  if (quizzesLoading || attemptsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to your assessment center</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Quizzes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {availableQuizzes?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userAttempts?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Best Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(userAttempts || []).length > 0 ? Math.max(...(userAttempts || []).map((a: UserAttempt) => a.score)) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Time Saved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(userAttempts || []).reduce((total: number, a: UserAttempt) => total + a.timeSpent, 0)}m
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Quizzes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Quizzes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(availableQuizzes || []).map((quiz: QuizForStudent) => {
              const { attemptCount, bestScore, lastAttempt } = getAttemptInfo(quiz.id);
              const canTake = canTakeQuiz(quiz);
              
              return (
                <Card key={quiz.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {quiz.description}
                        </CardDescription>
                      </div>
                      <Badge variant={canTake ? "default" : "secondary"}>
                        {canTake ? "Available" : "Not Available"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Time Limit:</span>
                        <span className="font-medium">{formatTime(quiz.timeLimit)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Questions:</span>
                        <span className="font-medium">{quiz.questionsCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Attempts:</span>
                        <span className="font-medium">{attemptCount}/{quiz.maxAttempts}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Passing Grade:</span>
                        <span className="font-medium">{quiz.passingGrade}%</span>
                      </div>
                      {bestScore > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Best Score:</span>
                          <span className="font-medium text-green-600">{bestScore}%</span>
                        </div>
                      )}
                      {quiz.allowCalculator && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Calculator:</span>
                          <span className="font-medium capitalize">{quiz.calculatorType}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-6">
                      <Button
                        onClick={() => startQuiz(quiz.id)}
                        disabled={!canTake}
                        className="w-full"
                      >
                        {canTake ? "Start Quiz" : "Not Available"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Attempts */}
        {userAttempts && userAttempts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Attempts</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userAttempts.slice(0, 4).map((attempt: UserAttempt) => (
                <Card key={attempt.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {(availableQuizzes || []).find((q: QuizForStudent) => q.id === attempt.quizId)?.title || "Unknown Quiz"}
                        </CardTitle>
                        <CardDescription>
                          Attempt #{attempt.attemptNumber}
                        </CardDescription>
                      </div>
                      <Badge variant={attempt.passed ? "default" : "secondary"}>
                        {attempt.passed ? "Passed" : "Failed"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Score:</span>
                        <span className="font-medium">{attempt.score}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Time Spent:</span>
                        <span className="font-medium">{formatTime(attempt.timeSpent)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium">
                          {new Date(attempt.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}