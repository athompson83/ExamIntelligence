import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Code, 
  Database, 
  User, 
  Settings, 
  BookOpen, 
  Brain,
  Target,
  FileText,
  Hash,
  Calendar,
  Clock,
  Star,
  Tag,
  Link,
  Info
} from 'lucide-react';

interface Variable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'array' | 'object' | 'boolean' | 'date';
  description: string;
  defaultValue?: string;
  isRequired: boolean;
  category: 'quiz_data' | 'user_data' | 'system_data' | 'custom';
  icon?: React.ComponentType<{ className?: string }>;
}

interface DragDropVariableBuilderProps {
  variables: Variable[];
  onVariablesChange: (variables: Variable[]) => void;
  promptContent: string;
  onPromptContentChange: (content: string) => void;
  category: 'question_generation' | 'question_validation' | 'content_analysis' | 'system';
}

// Available quiz builder variables based on category
const QUIZ_BUILDER_VARIABLES: Record<string, Variable[]> = {
  question_generation: [
    {
      id: 'topic',
      name: 'topic',
      type: 'text',
      description: 'The main topic or subject for question generation',
      isRequired: true,
      category: 'quiz_data',
      icon: BookOpen
    },
    {
      id: 'questionCount',
      name: 'questionCount',
      type: 'number',
      description: 'Number of questions to generate',
      defaultValue: '10',
      isRequired: true,
      category: 'quiz_data',
      icon: Hash
    },
    {
      id: 'questionTypes',
      name: 'questionTypes',
      type: 'array',
      description: 'Array of question types (multiple_choice, true_false, short_answer, essay)',
      defaultValue: '["multiple_choice"]',
      isRequired: true,
      category: 'quiz_data',
      icon: FileText
    },
    {
      id: 'difficultyMin',
      name: 'difficultyMin',
      type: 'number',
      description: 'Minimum difficulty level (1-10)',
      defaultValue: '1',
      isRequired: true,
      category: 'quiz_data',
      icon: Target
    },
    {
      id: 'difficultyMax',
      name: 'difficultyMax',
      type: 'number',
      description: 'Maximum difficulty level (1-10)',
      defaultValue: '10',
      isRequired: true,
      category: 'quiz_data',
      icon: Target
    },
    {
      id: 'bloomsLevels',
      name: 'bloomsLevels',
      type: 'array',
      description: 'Array of Bloom\'s taxonomy levels',
      defaultValue: '["understand", "apply"]',
      isRequired: true,
      category: 'quiz_data',
      icon: Brain
    },
    {
      id: 'targetAudience',
      name: 'targetAudience',
      type: 'text',
      description: 'Target audience for the questions',
      defaultValue: 'High school students',
      isRequired: false,
      category: 'user_data',
      icon: User
    },
    {
      id: 'learningObjectives',
      name: 'learningObjectives',
      type: 'array',
      description: 'Array of learning objectives',
      defaultValue: '[]',
      isRequired: false,
      category: 'quiz_data',
      icon: Target
    },
    {
      id: 'referenceLinks',
      name: 'referenceLinks',
      type: 'array',
      description: 'Array of reference materials and links',
      defaultValue: '[]',
      isRequired: false,
      category: 'quiz_data',
      icon: Link
    },
    {
      id: 'customInstructions',
      name: 'customInstructions',
      type: 'text',
      description: 'Custom instructions for question generation',
      defaultValue: '',
      isRequired: false,
      category: 'custom',
      icon: Settings
    }
  ],
  question_validation: [
    {
      id: 'questionText',
      name: 'questionText',
      type: 'text',
      description: 'The question text to validate',
      isRequired: true,
      category: 'quiz_data',
      icon: FileText
    },
    {
      id: 'questionType',
      name: 'questionType',
      type: 'text',
      description: 'Type of question (multiple_choice, true_false, etc.)',
      isRequired: true,
      category: 'quiz_data',
      icon: Tag
    },
    {
      id: 'difficultyScore',
      name: 'difficultyScore',
      type: 'number',
      description: 'Difficulty score (1-10)',
      isRequired: true,
      category: 'quiz_data',
      icon: Target
    },
    {
      id: 'bloomsLevel',
      name: 'bloomsLevel',
      type: 'text',
      description: 'Bloom\'s taxonomy level',
      isRequired: true,
      category: 'quiz_data',
      icon: Brain
    },
    {
      id: 'points',
      name: 'points',
      type: 'number',
      description: 'Points awarded for correct answer',
      isRequired: true,
      category: 'quiz_data',
      icon: Star
    },
    {
      id: 'answerOptions',
      name: 'answerOptions',
      type: 'array',
      description: 'Array of answer options with correct/incorrect flags',
      isRequired: true,
      category: 'quiz_data',
      icon: FileText
    }
  ],
  content_analysis: [
    {
      id: 'score',
      name: 'score',
      type: 'number',
      description: 'Quiz score percentage',
      isRequired: true,
      category: 'quiz_data',
      icon: Star
    },
    {
      id: 'correctAnswers',
      name: 'correctAnswers',
      type: 'number',
      description: 'Number of correct answers',
      isRequired: true,
      category: 'quiz_data',
      icon: Star
    },
    {
      id: 'totalQuestions',
      name: 'totalQuestions',
      type: 'number',
      description: 'Total number of questions',
      isRequired: true,
      category: 'quiz_data',
      icon: Hash
    },
    {
      id: 'incorrectCount',
      name: 'incorrectCount',
      type: 'number',
      description: 'Number of incorrect answers',
      isRequired: true,
      category: 'quiz_data',
      icon: Hash
    },
    {
      id: 'showCorrectAnswers',
      name: 'showCorrectAnswers',
      type: 'boolean',
      description: 'Whether to show correct answers to student',
      isRequired: true,
      category: 'system_data',
      icon: Settings
    },
    {
      id: 'conceptAnalysis',
      name: 'conceptAnalysis',
      type: 'object',
      description: 'Detailed analysis of student responses by concept',
      isRequired: true,
      category: 'quiz_data',
      icon: Brain
    },
    {
      id: 'title',
      name: 'title',
      type: 'text',
      description: 'Title of the study material',
      isRequired: false,
      category: 'quiz_data',
      icon: BookOpen
    },
    {
      id: 'studyType',
      name: 'studyType',
      type: 'text',
      description: 'Type of study material (guide, flashcards, etc.)',
      isRequired: false,
      category: 'quiz_data',
      icon: BookOpen
    },
    {
      id: 'quizId',
      name: 'quizId',
      type: 'text',
      description: 'Unique identifier for the quiz',
      isRequired: false,
      category: 'system_data',
      icon: Database
    },
    {
      id: 'questionCount',
      name: 'questionCount',
      type: 'number',
      description: 'Number of questions in the quiz',
      isRequired: false,
      category: 'quiz_data',
      icon: Hash
    }
  ],
  system: [
    {
      id: 'context',
      name: 'context',
      type: 'object',
      description: 'System context and configuration',
      isRequired: true,
      category: 'system_data',
      icon: Settings
    },
    {
      id: 'userId',
      name: 'userId',
      type: 'text',
      description: 'User identifier',
      isRequired: false,
      category: 'user_data',
      icon: User
    },
    {
      id: 'timestamp',
      name: 'timestamp',
      type: 'date',
      description: 'Current timestamp',
      isRequired: false,
      category: 'system_data',
      icon: Clock
    }
  ]
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'quiz_data': return Database;
    case 'user_data': return User;
    case 'system_data': return Settings;
    case 'custom': return Code;
    default: return Info;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'quiz_data': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'user_data': return 'bg-green-100 text-green-800 border-green-200';
    case 'system_data': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'custom': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

interface SortableVariableProps {
  variable: Variable;
  onRemove: (id: string) => void;
  onEdit: (variable: Variable) => void;
  onInsertVariable: (variableName: string) => void;
}

function SortableVariable({ variable, onRemove, onEdit, onInsertVariable }: SortableVariableProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variable.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = variable.icon || Info;
  const CategoryIcon = getCategoryIcon(variable.category);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-4 shadow-sm ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <IconComponent className="h-4 w-4 text-gray-600" />
            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {`{${variable.name}}`}
            </code>
            <Badge variant="outline" className={`text-xs ${getCategoryColor(variable.category)}`}>
              <CategoryIcon className="h-3 w-3 mr-1" />
              {variable.category.replace('_', ' ')}
            </Badge>
            {variable.isRequired && (
              <Badge variant="destructive" className="text-xs">Required</Badge>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-2">{variable.description}</p>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Type: {variable.type}</span>
            {variable.defaultValue && (
              <span>Default: {variable.defaultValue}</span>
            )}
          </div>
        </div>
        
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onInsertVariable(variable.name)}
            className="h-8 px-2"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(variable)}
            className="h-8 px-2"
          >
            <Settings className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRemove(variable.id)}
            className="h-8 px-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DragDropVariableBuilder({
  variables,
  onVariablesChange,
  promptContent,
  onPromptContentChange,
  category
}: DragDropVariableBuilderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVariable, setNewVariable] = useState<Partial<Variable>>({
    name: '',
    type: 'text',
    description: '',
    isRequired: false,
    category: 'custom'
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = variables.findIndex((item) => item.id === active.id);
      const newIndex = variables.findIndex((item) => item.id === over?.id);
      onVariablesChange(arrayMove(variables, oldIndex, newIndex));
    }

    setActiveId(null);
  };

  const handleRemoveVariable = (id: string) => {
    onVariablesChange(variables.filter(v => v.id !== id));
  };

  const handleEditVariable = (variable: Variable) => {
    setNewVariable(variable);
    setShowAddDialog(true);
  };

  const handleAddVariable = () => {
    if (newVariable.name && newVariable.description) {
      const variable: Variable = {
        id: newVariable.id || `var_${Date.now()}`,
        name: newVariable.name,
        type: newVariable.type || 'text',
        description: newVariable.description,
        defaultValue: newVariable.defaultValue,
        isRequired: newVariable.isRequired || false,
        category: newVariable.category || 'custom'
      };
      
      if (newVariable.id) {
        // Edit existing
        onVariablesChange(variables.map(v => v.id === newVariable.id ? variable : v));
      } else {
        // Add new
        onVariablesChange([...variables, variable]);
      }
      
      setNewVariable({
        name: '',
        type: 'text',
        description: '',
        isRequired: false,
        category: 'custom'
      });
      setShowAddDialog(false);
    }
  };

  const handleInsertVariable = (variableName: string) => {
    const cursorPosition = (document.activeElement as HTMLTextAreaElement)?.selectionStart || promptContent.length;
    const beforeCursor = promptContent.substring(0, cursorPosition);
    const afterCursor = promptContent.substring(cursorPosition);
    const newContent = `${beforeCursor}{${variableName}}${afterCursor}`;
    onPromptContentChange(newContent);
  };

  const handleAddQuizBuilderVariable = (variable: Variable) => {
    if (!variables.find(v => v.id === variable.id)) {
      onVariablesChange([...variables, variable]);
    }
  };

  const availableVariables = QUIZ_BUILDER_VARIABLES[category] || [];

  return (
    <div className="space-y-6">
      {/* Available Quiz Builder Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Available Quiz Builder Variables
          </CardTitle>
          <CardDescription>
            Drag these variables into your prompt or click the + button to add them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableVariables.map((variable) => {
              const IconComponent = variable.icon || Info;
              const CategoryIcon = getCategoryIcon(variable.category);
              const isUsed = variables.some(v => v.id === variable.id);
              
              return (
                <div
                  key={variable.id}
                  className={`border rounded-lg p-3 ${
                    isUsed ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-4 w-4 text-gray-600 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {`{${variable.name}}`}
                        </code>
                        <Badge variant="outline" className={`text-xs ${getCategoryColor(variable.category)}`}>
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {variable.category.replace('_', ' ')}
                        </Badge>
                        {variable.isRequired && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{variable.description}</p>
                      <div className="text-xs text-gray-500">
                        Type: {variable.type}
                        {variable.defaultValue && ` | Default: ${variable.defaultValue}`}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInsertVariable(variable.name)}
                        className="h-8 px-2"
                        disabled={isUsed}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddQuizBuilderVariable(variable)}
                        className="h-8 px-2"
                        disabled={isUsed}
                      >
                        {isUsed ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Current Prompt Variables
          </CardTitle>
          <CardDescription>
            Drag to reorder variables or click + to insert into prompt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {variables.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No variables added yet. Add variables from the available list above or create custom ones.
              </AlertDescription>
            </Alert>
          ) : (
            <DndContext
              sensors={sensors}
              modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={variables.map(v => v.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {variables.map((variable) => (
                    <SortableVariable
                      key={variable.id}
                      variable={variable}
                      onRemove={handleRemoveVariable}
                      onEdit={handleEditVariable}
                      onInsertVariable={handleInsertVariable}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <SortableVariable
                    variable={variables.find(v => v.id === activeId)!}
                    onRemove={() => {}}
                    onEdit={() => {}}
                    onInsertVariable={() => {}}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Prompt Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prompt Content
          </CardTitle>
          <CardDescription>
            Edit your prompt content. Use {`{variableName}`} to reference variables.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={promptContent}
            onChange={(e) => onPromptContentChange(e.target.value)}
            placeholder="Enter your prompt content here. Use {variableName} to reference variables."
            className="min-h-[300px] font-mono"
          />
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Custom Variable
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Variable Dialog */}
      {showAddDialog && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>
              {newVariable.id ? 'Edit Variable' : 'Add Custom Variable'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="var-name">Variable Name</Label>
                <Input
                  id="var-name"
                  value={newVariable.name || ''}
                  onChange={(e) => setNewVariable({...newVariable, name: e.target.value})}
                  placeholder="variableName"
                />
              </div>
              <div>
                <Label htmlFor="var-type">Type</Label>
                <Select
                  value={newVariable.type || 'text'}
                  onValueChange={(value) => setNewVariable({...newVariable, type: value as Variable['type']})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="var-description">Description</Label>
              <Input
                id="var-description"
                value={newVariable.description || ''}
                onChange={(e) => setNewVariable({...newVariable, description: e.target.value})}
                placeholder="Describe what this variable represents"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="var-default">Default Value (Optional)</Label>
                <Input
                  id="var-default"
                  value={newVariable.defaultValue || ''}
                  onChange={(e) => setNewVariable({...newVariable, defaultValue: e.target.value})}
                  placeholder="Default value"
                />
              </div>
              <div>
                <Label htmlFor="var-category">Category</Label>
                <Select
                  value={newVariable.category || 'custom'}
                  onValueChange={(value) => setNewVariable({...newVariable, category: value as Variable['category']})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz_data">Quiz Data</SelectItem>
                    <SelectItem value="user_data">User Data</SelectItem>
                    <SelectItem value="system_data">System Data</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="var-required"
                checked={newVariable.isRequired || false}
                onChange={(e) => setNewVariable({...newVariable, isRequired: e.target.checked})}
              />
              <Label htmlFor="var-required">Required variable</Label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleAddVariable}>
                {newVariable.id ? 'Update Variable' : 'Add Variable'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}