import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, FileText, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useParams } from "wouter";

export default function QuizPreview() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const quizId = params.id;

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
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
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Quiz Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The quiz you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => setLocation('/published-quizzes')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Provide default values to prevent property access errors
  const safeQuiz = {
    title: '',
    description: '',
    publishedAt: null,
    timeLimit: null,
    instructions: '',
    questions: [],
    groups: [],
    ...quiz
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/published-quizzes')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setLocation(`/enhanced-quiz-builder?id=${quizId}`)}
          >
            Edit Quiz
          </Button>
          <Button
            onClick={() => setLocation(`/student/quiz/${quizId}`)}
          >
            Take Quiz
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{safeQuiz.title || "Untitled Quiz"}</CardTitle>
              <CardDescription className="mt-2 text-base">
                {safeQuiz.description || "No description provided"}
              </CardDescription>
            </div>
            <Badge variant={safeQuiz.publishedAt ? "default" : "secondary"} className={safeQuiz.publishedAt ? "bg-green-100 text-green-800" : ""}>
              {safeQuiz.publishedAt ? "Published" : "Draft"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Time Limit</p>
                <p className="text-sm text-muted-foreground">
                  {safeQuiz.timeLimit ? `${safeQuiz.timeLimit} minutes` : "No time limit"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Questions</p>
                <p className="text-sm text-muted-foreground">
                  {safeQuiz.questions?.length || 0} questions
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Attempts</p>
                <p className="text-sm text-muted-foreground">
                  0 submissions
                </p>
              </div>
            </div>
          </div>

          {safeQuiz.instructions && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-2">Instructions</h3>
              <p className="text-muted-foreground">{safeQuiz.instructions}</p>
            </div>
          )}

          {safeQuiz.questions && safeQuiz.questions.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-4">Questions Preview</h3>
              <div className="space-y-4">
                {safeQuiz.questions.slice(0, 3).map((question: any, index: number) => (
                  <Card key={index} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{question.questionText || "Question text"}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Type: {question.questionType || "multiple_choice"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {safeQuiz.questions.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    ... and {safeQuiz.questions.length - 3} more questions
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}