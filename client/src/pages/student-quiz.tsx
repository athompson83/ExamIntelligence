import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, PlayCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useParams } from "wouter";

export default function StudentQuiz() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const quizId = params.id;
  const [quizStarted, setQuizStarted] = useState(false);

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['/api/quizzes', quizId],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-red-600">Quiz Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The requested quiz could not be found or you don't have permission to access it.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setLocation('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-auto"
            onClick={() => setLocation('/')}
          >
            Home
          </Button>
          <span>/</span>
          <span>Take Quiz</span>
        </div>

        {/* Quiz Information */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{quiz?.title || 'Untitled Quiz'}</CardTitle>
              <Badge variant="secondary">Ready to Start</Badge>
            </div>
            {quiz?.description && (
              <CardDescription className="text-base">
                {quiz.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quiz Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Time Limit: {quiz?.timeLimit ? `${quiz.timeLimit} minutes` : 'No time limit'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Questions: {quiz?.questions?.length || 0}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Attempts: {quiz?.maxAttempts || 1} allowed
                </span>
              </div>
            </div>

            {/* Instructions */}
            {quiz?.instructions && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Instructions</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {quiz.instructions}
                </p>
              </div>
            )}

            {/* Start Quiz Button */}
            <div className="border-t pt-4 flex gap-3">
              <Button
                size="lg"
                onClick={() => setQuizStarted(true)}
                className="flex items-center gap-2"
              >
                <PlayCircle className="h-5 w-5" />
                Start Quiz
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation(`/quiz/${quizId}`)}
              >
                Back to Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz interface when started
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{quiz?.title || 'Quiz'}</span>
            {quiz?.timeLimit && (
              <Badge variant="outline">
                <Clock className="h-4 w-4 mr-1" />
                {quiz.timeLimit} min remaining
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Quiz taking interface would go here */}
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">Quiz Interface</h3>
            <p className="text-muted-foreground mb-4">
              This is where the quiz questions would be displayed and answered.
            </p>
            <p className="text-sm text-muted-foreground">
              The full quiz-taking interface with questions, navigation, and submission would be implemented here.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setQuizStarted(false)}
            >
              Back to Quiz Info
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}