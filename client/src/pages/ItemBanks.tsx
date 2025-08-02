import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TestbankList } from "@/components/testbank/TestbankList";
import { TestbankEditor } from "@/components/testbank/TestbankEditor";
// Import the correct QuestionEditor component  
import MainQuestionEditor from "@/components/QuestionEditor";
// TESTING: Add explicit console log to verify which component loads
console.log("🔍 ItemBanks.tsx: QuestionEditor imported from @/components/QuestionEditor");
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
    console.log("🔍 handleCreateQuestion called - switching to edit-question mode");
    alert("handleCreateQuestion() executed! Switching to edit-question mode...");
    if (!selectedTestbank) return;
    setSelectedQuestion(null);
    setViewMode("edit-question");
    console.log("🔍 ViewMode should now be 'edit-question'");
    alert("ViewMode set to edit-question! Component should now render QuestionEditor");
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
        console.log("🔍 ItemBanks.tsx: Rendering QuestionEditor component");
        return (
          <div style={{ border: "3px solid red", padding: "10px", margin: "10px" }}>
            <div style={{ backgroundColor: "red", color: "white", padding: "10px", marginBottom: "10px" }}>
              🚨 WRAPPER: This red border is from ItemBanks.tsx to confirm this path is taken
            </div>
            <MainQuestionEditor
              testbankId={selectedTestbank.id.toString()}
              questionId={selectedQuestion?.id?.toString()}
              onClose={handleCancel}
            />
          </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Item Banks
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{testbank.title}</h1>
            <p className="text-muted-foreground">{testbank.description}</p>
          </div>
        </div>
        <Button onClick={() => {
          console.log("🔍 Add Question button clicked!");
          alert("BUTTON CLICKED! This should switch to edit-question mode");
          onCreateQuestion();
          alert("onCreateQuestion() called! ViewMode should now change");
        }} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Testbank Info */}
      <Card>
        <CardHeader>
          <CardTitle>Testbank Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {testbank.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Learning Objectives</h4>
              <ul className="text-sm text-muted-foreground">
                {testbank.learningObjectives.map((objective, index) => (
                  <li key={index}>• {objective}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({questions?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading questions...</div>
          ) : questions?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No questions in this testbank yet.</p>
              <Button onClick={onCreateQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions?.map((question: Question) => (
                <div key={question.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground line-clamp-2">
                        {question.questionText}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {question.questionType.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {question.points} pts
                        </Badge>
                        {question.bloomsLevel && (
                          <Badge variant="outline" className="text-xs">
                            {question.bloomsLevel}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {question.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditQuestion(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
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
