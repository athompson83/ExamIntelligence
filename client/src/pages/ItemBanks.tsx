import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TestbankList } from "@/components/testbank/TestbankList";
import { TestbankEditor } from "@/components/testbank/TestbankEditor";
import MainQuestionEditor from "@/components/QuestionEditor";
import { Testbank, Question } from "@/types";

type ViewMode = "list" | "edit-testbank" | "view-testbank" | "edit-question";

export default function ItemBanks() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedTestbank, setSelectedTestbank] = useState<Testbank | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
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

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const handleCreateNew = () => {
    setSelectedTestbank(null);
    setViewMode("edit-testbank");
  };

  const handleEdit = (testbank: Testbank) => {
    setSelectedTestbank(testbank);
    setViewMode("edit-testbank");
  };

  const handleView = (testbank: Testbank) => {
    setSelectedTestbank(testbank);
    setViewMode("view-testbank");
  };

  const handleSaveTestbank = (testbank: Testbank) => {
    setSelectedTestbank(testbank);
    setViewMode("list");
  };

  const handleCreateQuestion = () => {
    if (!selectedTestbank) return;
    setSelectedQuestion(null);
    setViewMode("edit-question");
    toast({
      title: "Creating Question",
      description: "Question editor loaded successfully",
    });
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setViewMode("edit-question");
  };

  const handleSaveQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setViewMode("view-testbank");
  };

  const handleCancel = () => {
    if (viewMode === "edit-question") {
      setViewMode("view-testbank");
    } else {
      setViewMode("list");
    }
    setSelectedQuestion(null);
    if (viewMode === "edit-testbank") {
      setSelectedTestbank(null);
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case "edit-testbank":
        return (
          <TestbankEditor
            testbank={selectedTestbank || undefined}
            onSave={handleSaveTestbank}
            onCancel={handleCancel}
          />
        );

      case "view-testbank":
        if (!selectedTestbank) return null;
        return (
          <TestbankDetail
            testbank={selectedTestbank}
            onCreateQuestion={handleCreateQuestion}
            onEditQuestion={handleEditQuestion}
            onBack={() => setViewMode("list")}
          />
        );

      case "edit-question":
        if (!selectedTestbank) return null;
        return (
          <MainQuestionEditor
            testbankId={selectedTestbank.id.toString()}
            questionId={selectedQuestion?.id?.toString()}
            onClose={handleCancel}
          />
        );

      default:
        return (
          <TestbankList
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onView={handleView}
          />
        );
    }
  };

  return (
    <DashboardLayout title="Item Banks">
      {renderContent()}
    </DashboardLayout>
  );
}

// Testbank Detail Component
function TestbankDetail({
  testbank,
  onCreateQuestion,
  onEditQuestion,
  onBack,
}: {
  testbank: Testbank;
  onCreateQuestion: () => void;
  onEditQuestion: (question: Question) => void;
  onBack: () => void;
}) {
  const { useQuery } = require("@tanstack/react-query");
  const { Button } = require("@/components/ui/button");
  const { Card, CardContent, CardHeader, CardTitle } = require("@/components/ui/card");
  const { Badge } = require("@/components/ui/badge");
  const { ChevronLeft, Plus, Edit, Eye } = require("lucide-react");

  const { data: questions, isLoading } = useQuery({
    queryKey: ["/api/testbanks", testbank.id, "questions"],
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{testbank.title}</h1>
            <p className="text-muted-foreground mt-1">{testbank.description}</p>
          </div>
        </div>
        <Button 
          onClick={onCreateQuestion}
          className="gradient-blue text-white hover:shadow-xl hover:scale-105 transition-all duration-300 h-12 px-8 rounded-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Testbank Info */}
      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader className="gradient-blue p-6">
          <CardTitle className="text-xl font-bold text-white">Testbank Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-foreground">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {testbank.tags.length > 0 ? testbank.tags.map((tag, index) => (
                  <Badge key={index} className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0">
                    {tag}
                  </Badge>
                )) : (
                  <span className="text-sm text-muted-foreground">No tags</span>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-foreground">Learning Objectives</h4>
              {testbank.learningObjectives.length > 0 ? (
                <ul className="text-sm text-muted-foreground space-y-1">
                  {testbank.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">No learning objectives</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card className="rounded-2xl shadow-lg border-0">
        <CardHeader className="p-6 border-b">
          <CardTitle className="text-2xl font-bold text-foreground">
            Questions ({questions?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-blue animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-muted-foreground">Loading questions...</p>
            </div>
          ) : questions?.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full gradient-blue flex items-center justify-center">
                <Plus className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No questions yet</h3>
              <p className="text-muted-foreground mb-6">
                Start building your testbank by adding your first question.
              </p>
              <Button 
                onClick={onCreateQuestion}
                className="gradient-blue text-white hover:shadow-xl hover:scale-105 transition-all duration-300 h-12 px-8 rounded-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add First Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions?.map((question: Question, index: number) => (
                <div 
                  key={question.id} 
                  className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground line-clamp-2 mb-3">
                        {index + 1}. {question.questionText}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className="rounded-full gradient-blue text-white border-0 text-xs">
                          {question.questionType.replace('_', ' ')}
                        </Badge>
                        <Badge className="rounded-full gradient-green text-white border-0 text-xs">
                          {question.points} pts
                        </Badge>
                        {question.bloomsLevel && (
                          <Badge className="rounded-full gradient-purple text-white border-0 text-xs">
                            {question.bloomsLevel}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {question.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Badge key={tagIndex} className="rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-0 text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {question.tags.length > 3 && (
                          <Badge className="rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-0 text-xs">
                            +{question.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditQuestion(question)}
                      className="rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
