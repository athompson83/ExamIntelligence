import { useState, useEffect } from "react";
import { Plus, Settings, Move, Trash2, BookOpen, Target, BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import type { QuestionGroup, Question } from "@shared/schema";

interface QuestionGroupBuilderProps {
  quizId?: string;
  questionGroups: QuestionGroup[];
  availableQuestions: Question[];
  onAddGroup: (group: Partial<QuestionGroup>) => void;
  onUpdateGroup: (groupId: string, updates: Partial<QuestionGroup>) => void;
  onDeleteGroup: (groupId: string) => void;
  onAssignQuestions: (groupId: string, questionIds: string[]) => void;
}

interface GroupFormData {
  name: string;
  description: string;
  pickCount: number;
  pointsPerQuestion: number;
  difficultyWeight: number;
  bloomsWeight: number;
}

export function QuestionGroupBuilder({
  quizId,
  questionGroups,
  availableQuestions,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAssignQuestions,
}: QuestionGroupBuilderProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [groupForm, setGroupForm] = useState<GroupFormData>({
    name: "",
    description: "",
    pickCount: 1,
    pointsPerQuestion: 1,
    difficultyWeight: 1,
    bloomsWeight: 1,
  });
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const resetForm = () => {
    setGroupForm({
      name: "",
      description: "",
      pickCount: 1,
      pointsPerQuestion: 1,
      difficultyWeight: 1,
      bloomsWeight: 1,
    });
  };

  const handleCreateGroup = () => {
    if (!groupForm.name.trim()) return;

    onAddGroup({
      quizId: quizId!,
      name: groupForm.name,
      description: groupForm.description || null,
      pickCount: groupForm.pickCount,
      pointsPerQuestion: groupForm.pointsPerQuestion.toString(),
      difficultyWeight: groupForm.difficultyWeight.toString(),
      bloomsWeight: groupForm.bloomsWeight.toString(),
      displayOrder: questionGroups.length,
    });

    resetForm();
    setIsGroupDialogOpen(false);
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<QuestionGroup>) => {
    onUpdateGroup(groupId, updates);
  };

  const handleAssignQuestions = () => {
    if (selectedGroupId && selectedQuestions.length > 0) {
      onAssignQuestions(selectedGroupId, selectedQuestions);
      setSelectedQuestions([]);
      setIsQuestionDialogOpen(false);
    }
  };

  const getGroupQuestions = (groupId: string) => {
    // This would normally come from the quiz questions with group assignment
    return availableQuestions.filter(q => q.id === groupId); // Placeholder logic
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return "bg-green-500";
    if (difficulty <= 6) return "bg-yellow-500";
    if (difficulty <= 8) return "bg-orange-500";
    return "bg-red-500";
  };

  const getBloomsColor = (level: string) => {
    const colors: Record<string, string> = {
      remember: "bg-blue-500",
      understand: "bg-green-500",
      apply: "bg-yellow-500",
      analyze: "bg-orange-500",
      evaluate: "bg-red-500",
      create: "bg-purple-500",
    };
    return colors[level?.toLowerCase()] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Question Groups
          </h3>
          <p className="text-sm text-muted-foreground">
            Organize questions into groups for random selection
          </p>
        </div>
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Question Group</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Multiple Choice Section"
                  />
                </div>
                <div>
                  <Label htmlFor="pickCount">Questions to Pick</Label>
                  <Input
                    id="pickCount"
                    type="number"
                    min="1"
                    value={groupForm.pickCount}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, pickCount: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this question group..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pointsPerQuestion">Points per Question</Label>
                  <Input
                    id="pointsPerQuestion"
                    type="number"
                    min="0"
                    step="0.1"
                    value={groupForm.pointsPerQuestion}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, pointsPerQuestion: parseFloat(e.target.value) || 1 }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} disabled={!groupForm.name.trim()}>
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Question Groups List */}
      <div className="grid gap-4">
        {questionGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Question Groups</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Create question groups to organize your quiz questions and enable features like random selection and adaptive testing.
              </p>
            </CardContent>
          </Card>
        ) : (
          questionGroups.map((group) => {
            const groupQuestions = getGroupQuestions(group.id);
            const difficultyStats = groupQuestions.reduce((acc, q) => {
              acc[q.difficultyLevel] = (acc[q.difficultyLevel] || 0) + 1;
              return acc;
            }, {} as Record<number, number>);

            return (
              <Card key={group.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {group.name}
                        {group.useCAT && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            CAT
                          </Badge>
                        )}
                      </CardTitle>
                      {group.description && (
                        <CardDescription>{group.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          setIsQuestionDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Questions
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteGroup(group.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{group.totalQuestions || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{group.pickCount}</div>
                      <div className="text-xs text-muted-foreground">Questions to Pick</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{group.pointsPerQuestion}</div>
                      <div className="text-xs text-muted-foreground">Points Each</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {((group.pickCount || 1) * parseFloat(group.pointsPerQuestion || "1")).toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Points</div>
                    </div>
                  </div>

                  {groupQuestions.length > 0 && (
                    <div className="space-y-3">
                      <Separator />
                      <div>
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Question Distribution
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(difficultyStats).map(([level, count]) => (
                            <Badge
                              key={level}
                              variant="outline"
                              className={`${getDifficultyColor(parseInt(level))} text-white border-0`}
                            >
                              Level {level}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Question Assignment Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Questions to Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4">
              {availableQuestions.map((question) => (
                <Card key={question.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedQuestions.includes(question.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedQuestions(prev => [...prev, question.id]);
                        } else {
                          setSelectedQuestions(prev => prev.filter(id => id !== question.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`${getDifficultyColor(question.difficultyLevel)} text-white border-0`}>
                          Difficulty {question.difficultyLevel}
                        </Badge>
                        <Badge variant="outline" className={`${getBloomsColor(question.bloomsLevel)} text-white border-0`}>
                          {question.bloomsLevel}
                        </Badge>
                        <Badge variant="outline">
                          {question.questionType}
                        </Badge>
                      </div>
                      <h4 className="font-medium">{question.questionTitle}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {question.questionText?.slice(0, 200)}...
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-muted-foreground">
              {selectedQuestions.length} questions selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignQuestions} disabled={selectedQuestions.length === 0}>
                Assign Questions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}