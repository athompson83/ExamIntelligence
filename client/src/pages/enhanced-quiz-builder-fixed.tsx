import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, ChevronDown, BookOpen, GripVertical, Plus } from "lucide-react";

// Types
interface QuizQuestion {
  id: string;
  questionText: string;
  questionType: string;
  difficulty: number;
  points: number;
  groupId?: string | null;
  displayOrder: number;
}

interface QuestionGroup {
  id: string;
  name: string;
  description: string;
  pickCount: number;
  pointsPerQuestion: number;
  displayOrder: number;
  questions: QuizQuestion[];
}

interface DraggableQuestionProps {
  question: QuizQuestion;
  onRemove: (questionId: string) => void;
}

// Components
function DraggableQuestion({ question, onRemove }: DraggableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-3 border rounded-lg bg-background",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing hover:bg-muted p-1 rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="font-medium">{question.questionText}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {question.questionType} • Difficulty: {question.difficulty}/10 • Points: {question.points}
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(question.id);
        }}
      >
        Remove
      </Button>
    </div>
  );
}

function DroppableArea({ children, id }: { children: React.ReactNode; id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] p-4 border-2 border-dashed rounded-lg transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-muted"
      )}
    >
      {children}
    </div>
  );
}

export default function EnhancedQuizBuilder() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("questions");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch questions and groups
  const { data: availableQuestions = [] } = useQuery({
    queryKey: ['/api/questions'],
  });

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the question being dragged
    const draggedQuestion = quizQuestions.find(q => q.id === activeId);
    if (!draggedQuestion) return;

    // Handle dropping into a group
    if (overId.startsWith('group-')) {
      const groupId = overId.replace('group-', '');
      const targetGroup = questionGroups.find(g => g.id === groupId);
      
      if (targetGroup) {
        // Remove question from current location
        setQuizQuestions(prev => prev.filter(q => q.id !== activeId));
        
        // Add to target group
        setQuestionGroups(prev => prev.map(group => {
          if (group.id === groupId) {
            return {
              ...group,
              questions: [...group.questions, { ...draggedQuestion, groupId }]
            };
          }
          return group;
        }));

        toast({
          title: "Question moved",
          description: `Question moved to group "${targetGroup.name}"`,
        });
      }
    }
    // Handle dropping to ungrouped area
    else if (overId === 'ungrouped') {
      // Remove from any group
      setQuestionGroups(prev => prev.map(group => ({
        ...group,
        questions: group.questions.filter(q => q.id !== activeId)
      })));
      
      // Add to ungrouped questions if not already there
      if (!quizQuestions.find(q => q.id === activeId)) {
        setQuizQuestions(prev => [...prev, { ...draggedQuestion, groupId: null }]);
      }

      toast({
        title: "Question moved",
        description: "Question moved to ungrouped section",
      });
    }
    // Handle reordering within the same container
    else {
      const activeIndex = quizQuestions.findIndex(q => q.id === activeId);
      const overIndex = quizQuestions.findIndex(q => q.id === overId);

      if (activeIndex !== -1 && overIndex !== -1) {
        setQuizQuestions(prev => arrayMove(prev, activeIndex, overIndex));
      }
    }
  };

  const removeQuestion = (questionId: string) => {
    setQuizQuestions(prev => prev.filter(q => q.id !== questionId));
    setQuestionGroups(prev => prev.map(group => ({
      ...group,
      questions: group.questions.filter(q => q.id !== questionId)
    })));
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const addSampleData = () => {
    const sampleQuestions: QuizQuestion[] = [
      {
        id: "q1",
        questionText: "What is the capital of France?",
        questionType: "multiple_choice",
        difficulty: 3,
        points: 1,
        displayOrder: 1,
      },
      {
        id: "q2", 
        questionText: "Explain the concept of photosynthesis.",
        questionType: "essay",
        difficulty: 7,
        points: 5,
        displayOrder: 2,
      },
      {
        id: "q3",
        questionText: "Calculate 15 × 8 =",
        questionType: "fill_blank",
        difficulty: 4,
        points: 2,
        displayOrder: 3,
      }
    ];

    const sampleGroups: QuestionGroup[] = [
      {
        id: "g1",
        name: "Easy Questions",
        description: "Basic knowledge questions",
        pickCount: 2,
        pointsPerQuestion: 1,
        displayOrder: 1,
        questions: []
      },
      {
        id: "g2",
        name: "Advanced Topics",
        description: "Complex analysis questions",
        pickCount: 1,
        pointsPerQuestion: 5,
        displayOrder: 2,
        questions: []
      }
    ];

    setQuizQuestions(sampleQuestions);
    setQuestionGroups(sampleGroups);
    setExpandedGroups(new Set(['g1', 'g2']));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Quiz Builder</h1>
          <p className="text-muted-foreground">Create and organize quiz questions with drag-and-drop functionality</p>
        </div>
        <Button onClick={addSampleData} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Sample Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="questions">Questions & Groups</TabsTrigger>
          <TabsTrigger value="settings">Quiz Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Question Organization</CardTitle>
              <CardDescription>
                Drag and drop questions between ungrouped and grouped sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-6">
                  {/* Ungrouped Questions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Ungrouped Questions</h3>
                    <DroppableArea id="ungrouped">
                      {quizQuestions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-8 w-8 mx-auto mb-2" />
                          <p>No ungrouped questions. Add sample data or drag questions here.</p>
                        </div>
                      ) : (
                        <SortableContext items={quizQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {quizQuestions.map((question) => (
                              <DraggableQuestion
                                key={question.id}
                                question={question}
                                onRemove={removeQuestion}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      )}
                    </DroppableArea>
                  </div>

                  {/* Question Groups */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Question Groups</h3>
                    {questionGroups.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>No question groups created yet. Add sample data to see groups.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {questionGroups.map((group) => (
                          <Card key={group.id} className="border-l-4 border-l-primary">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleGroupExpansion(group.id)}
                                  >
                                    {expandedGroups.has(group.id) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <div>
                                    <h4 className="font-medium">{group.name}</h4>
                                    <p className="text-sm text-muted-foreground">{group.description}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant="secondary">
                                    Pick {group.pickCount} questions
                                  </Badge>
                                  <Badge variant="outline">
                                    {group.pointsPerQuestion} pts each
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            {expandedGroups.has(group.id) && (
                              <CardContent>
                                <DroppableArea id={`group-${group.id}`}>
                                  {group.questions.length === 0 ? (
                                    <div className="text-center py-4 text-muted-foreground">
                                      <p>Drop questions here to add them to this group</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {group.questions.map((question) => (
                                        <DraggableQuestion
                                          key={question.id}
                                          question={question}
                                          onRemove={removeQuestion}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </DroppableArea>
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DndContext>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
              <CardDescription>Configure quiz options and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input id="title" placeholder="Enter quiz title" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Quiz description" />
                </div>
                <div>
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input id="timeLimit" type="number" placeholder="60" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}