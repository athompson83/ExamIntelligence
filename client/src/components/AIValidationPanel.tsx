import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  TrendingUp,
  Clock
} from "lucide-react";

interface AIValidationPanelProps {
  questionId?: string;
  validationResults?: any;
  onValidate: () => void;
  isValidating: boolean;
}

export default function AIValidationPanel({ 
  questionId, 
  validationResults, 
  onValidate, 
  isValidating 
}: AIValidationPanelProps) {
  const { data: validationLogs } = useQuery({
    queryKey: ["/api/validation-logs", questionId],
    enabled: !!questionId,
    retry: false,
  });

  if (!questionId) {
    return (
      <div className="validation-panel">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Save the question first to enable AI validation features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Validation Action */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              AI Validation
            </CardTitle>
            <Button
              onClick={onValidate}
              disabled={isValidating}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isValidating ? "Validating..." : "Run AI Validation"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300">
            Use AI to analyze this question for clarity, bias, grammatical errors, and educational value.
          </p>
        </CardContent>
      </Card>

      {/* Current Validation Results */}
      {validationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {validationResults.isValid ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
              )}
              Latest Validation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quality Score</span>
                <Badge className={validationResults.isValid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {validationResults.isValid ? "Passed" : "Needs Review"}
                </Badge>
              </div>
              <Progress value={validationResults.confidenceScore * 100} className="h-2" />
              <div className="text-xs text-gray-500">
                Confidence: {Math.round(validationResults.confidenceScore * 100)}%
              </div>
            </div>

            {/* Difficulty Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Difficulty Level</span>
                <Badge className="difficulty-indicator">
                  {validationResults.difficultyScore}/10
                </Badge>
              </div>
              <Progress value={(validationResults.difficultyScore / 10) * 100} className="h-2" />
            </div>

            {/* Issues Found */}
            {validationResults.issues && validationResults.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Issues Found ({validationResults.issues.length})
                </h4>
                <div className="space-y-2">
                  {validationResults.issues.map((issue: string, index: number) => (
                    <div key={index} className="validation-issue">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {validationResults.suggestions && validationResults.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Improvement Suggestions ({validationResults.suggestions.length})
                </h4>
                <div className="space-y-2">
                  {validationResults.suggestions.map((suggestion: string, index: number) => (
                    <div key={index} className="validation-suggestion">
                      <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation History */}
      {validationLogs && validationLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Validation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {validationLogs.slice(0, 5).map((log: any, index: number) => (
                <div key={log.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        Run #{validationLogs.length - index}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(log.validatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {log.aiConfidenceScore && (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                        {Math.round(log.aiConfidenceScore * 100)}% confidence
                      </Badge>
                    )}
                  </div>
                  
                  {log.validationIssues && log.validationIssues.length > 0 && (
                    <div className="mb-2">
                      <h5 className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                        Issues ({log.validationIssues.length})
                      </h5>
                      <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                        {log.validationIssues.slice(0, 3).map((issue: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-1">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                        {log.validationIssues.length > 3 && (
                          <li className="text-gray-500">
                            ... and {log.validationIssues.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  {log.comments && (
                    <div>
                      <h5 className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                        Suggestions
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                        {log.comments}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card className="ai-insight">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            AI Insights & Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Clear Question Stems</p>
                <p className="text-gray-600 dark:text-gray-300">
                  Use direct, unambiguous language in your question prompts
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Avoid "All of the Above"</p>
                <p className="text-gray-600 dark:text-gray-300">
                  These options can reduce question quality and reliability
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Balance Difficulty</p>
                <p className="text-gray-600 dark:text-gray-300">
                  Aim for appropriate cognitive load based on learning objectives
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
