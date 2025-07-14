import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'wouter';
import { 
  Home, 
  ChevronRight, 
  ClipboardCheck, 
  Plus, 
  Edit3, 
  Eye, 
  Trash2,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Search,
  Filter,
  Send,
  Settings,
  X,
  Check,
  UserPlus,
  UsersIcon
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  quizId: string;
  dueDate: string;
  availableFrom: string;
  availableTo: string;
  timeLimit: number;
  maxAttempts: number;
  allowLateSubmission: boolean;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  requireProctoring: boolean;
  allowCalculator: boolean;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  submissions: number;
  averageScore: number;
}

export default function Assignments() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quizId: '',
    dueDate: '',
    availableFrom: '',
    availableTo: '',
    timeLimit: 60,
    maxAttempts: 1,
    allowLateSubmission: false,
    percentLostPerDay: 10,
    maxLateDays: 7,
    showCorrectAnswers: false,
    requireProctoring: false,
    allowCalculator: false,
    enableQuestionFeedback: false,
    catEnabled: false,
    catMinQuestions: 10,
    catMaxQuestions: 50,
    catDifficultyTarget: 0.5
  });
  const [location] = useLocation();
  const queryClient = useQueryClient();

  // Use refs to track form values without causing re-renders
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const formDataRef = useRef(formData);

  // Update ref when formData changes
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Prevent component re-renders during input changes
  const [localInputs, setLocalInputs] = useState({
    title: formData.title,
    description: formData.description
  });

  // Synchronous input handlers that prevent keyboard issues
  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Sync local inputs with form data
  useEffect(() => {
    setLocalInputs({
      title: formData.title,
      description: formData.description
    });
  }, [formData.title, formData.description]);

  // Local input handlers that prevent keyboard issues
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalInputs(prev => ({ ...prev, title: value }));
    handleFormChange('title', value);
  }, [handleFormChange]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalInputs(prev => ({ ...prev, description: value }));
    handleFormChange('description', value);
  }, [handleFormChange]);

  // Parse URL parameters for pre-selected quiz
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const preSelectedQuizId = urlParams.get('quizId');
  const preSelectedQuizTitle = urlParams.get('quizTitle');

  // Auto-open create modal if coming from quiz manager
  useEffect(() => {
    if (preSelectedQuizId && location.includes('/assignments')) {
      setShowCreateModal(true);
      setFormData(prev => ({
        ...prev,
        quizId: preSelectedQuizId,
        title: preSelectedQuizTitle ? `Assignment: ${preSelectedQuizTitle}` : '',
      }));
    }
  }, [preSelectedQuizId, preSelectedQuizTitle, location]);

  // Reset form states when modals are closed or populate with editing data
  useEffect(() => {
    if (!showCreateModal && !editingAssignment) {
      setSelectedStudents([]);
      setSelectedSections([]);
      setStudentSearchTerm('');
      // Reset form data to defaults
      setFormData({
        title: '',
        description: '',
        quizId: '',
        dueDate: '',
        availableFrom: '',
        availableTo: '',
        timeLimit: 60,
        maxAttempts: 1,
        allowLateSubmission: false,
        percentLostPerDay: 10,
        maxLateDays: 7,
        showCorrectAnswers: false,
        requireProctoring: false,
        allowCalculator: false,
        enableQuestionFeedback: false,
        catEnabled: false,
        catMinQuestions: 10,
        catMaxQuestions: 50,
        catDifficultyTarget: 0.5
      });
    }
  }, [showCreateModal, editingAssignment]);

  // Populate form when editing an assignment
  useEffect(() => {
    if (editingAssignment) {
      setFormData({
        title: editingAssignment.title || '',
        description: editingAssignment.description || '',
        quizId: editingAssignment.quizId || '',
        dueDate: editingAssignment.dueDate?.slice(0, 16) || '',
        availableFrom: editingAssignment.availableFrom?.slice(0, 16) || '',
        availableTo: editingAssignment.availableTo?.slice(0, 16) || '',
        timeLimit: editingAssignment.timeLimit || 60,
        maxAttempts: editingAssignment.maxAttempts || 1,
        allowLateSubmission: editingAssignment.allowLateSubmission || false,
        percentLostPerDay: editingAssignment.lateGradingOptions?.percentLostPerDay || 10,
        maxLateDays: editingAssignment.lateGradingOptions?.maxLateDays || 7,
        showCorrectAnswers: editingAssignment.showCorrectAnswers || false,
        requireProctoring: editingAssignment.requireProctoring || false,
        allowCalculator: editingAssignment.allowCalculator || false,
        enableQuestionFeedback: editingAssignment.enableQuestionFeedback || false,
        catEnabled: editingAssignment.catEnabled || false,
        catMinQuestions: editingAssignment.catMinQuestions || 10,
        catMaxQuestions: editingAssignment.catMaxQuestions || 50,
        catDifficultyTarget: editingAssignment.catDifficultyTarget || 0.5
      });
    }
  }, [editingAssignment]);

  // Handle quiz selection change
  const handleQuizSelection = (value: string) => {
    if (value === 'add-new') {
      // Navigate to quiz builder
      window.location.href = '/quiz-builder';
    }
  };

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['/api/quiz-assignments'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/quiz-assignments');
        const result = await response.json();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error fetching assignments:', error);
        return [];
      }
    },
  });

  // Fetch quizzes for assignment creation
  const { data: quizzes = [] } = useQuery({
    queryKey: ['/api/quizzes'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/quizzes');
        const result = await response.json();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        return [];
      }
    },
  });

  // Fetch students for assignment
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/users');
        const result = await response.json();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error fetching students:', error);
        return [];
      }
    },
  });

  // Fetch sections for assignment
  const { data: sections = [] } = useQuery({
    queryKey: ['/api/sections'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/sections');
        const result = await response.json();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error fetching sections:', error);
        return [];
      }
    },
  });

  // Filter students by search term
  const filteredStudents = Array.isArray(students) ? students.filter((student: any) => 
    student && 
    student.role === 'student' && 
    (student.firstName?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
     student.lastName?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
     student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase()))
  ) : [];

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await apiRequest('/api/quiz-assignments', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return await response.json();
      } catch (error) {
        console.error('Assignment creation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-assignments'] });
    },
    onError: (error) => {
      console.error('Assignment creation error:', error);
    },
  });

  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/quiz-assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-assignments'] });
      setEditingAssignment(null);
      toast({
        title: "Success",
        description: "Assignment updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update assignment",
        variant: "destructive",
      });
    },
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/quiz-assignments/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-assignments'] });
      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
      });
    },
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => apiRequest('/api/sections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
      setShowCreateSection(false);
      toast({
        title: "Success",
        description: "Section created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create section",
        variant: "destructive",
      });
    },
  });

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment: Assignment) => {
    const matchesSearch = (assignment.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (assignment.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateAssignment = (formDataParam: FormData) => {
    // Use the controlled form state instead of FormData
    const assignmentData = formData;
    
    // Validate required fields
    if (!assignmentData.quizId || assignmentData.quizId === 'add-new' || assignmentData.quizId === 'no-quizzes') {
      toast({
        title: "Error",
        description: "Please select a valid quiz",
        variant: "destructive",
      });
      return;
    }
    
    if (!assignmentData.title || !assignmentData.dueDate) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedStudents.length === 0 && selectedSections.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student or section",
        variant: "destructive",
      });
      return;
    }
    
    // Create multiple assignments - one for each student and section
    const assignments = [];
    
    // Create assignments for individual students
    for (const studentId of selectedStudents) {
      assignments.push({
        quizId: assignmentData.quizId,
        title: assignmentData.title,
        description: assignmentData.description,
        dueDate: assignmentData.dueDate,
        availableFrom: assignmentData.availableFrom,
        availableTo: assignmentData.availableTo,
        timeLimit: assignmentData.timeLimit,
        maxAttempts: assignmentData.maxAttempts,
        allowLateSubmission: assignmentData.allowLateSubmission,
        percentLostPerDay: assignmentData.percentLostPerDay,
        maxLateDays: assignmentData.maxLateDays,
        showCorrectAnswers: assignmentData.showCorrectAnswers,
        enableQuestionFeedback: assignmentData.enableQuestionFeedback,
        requireProctoring: assignmentData.requireProctoring,
        allowCalculator: assignmentData.allowCalculator,
        catEnabled: assignmentData.catEnabled,
        catMinQuestions: assignmentData.catMinQuestions,
        catMaxQuestions: assignmentData.catMaxQuestions,
        catDifficultyTarget: assignmentData.catDifficultyTarget,
        assignedToUserId: studentId,
        assignedToSectionId: null,
      });
    }
    
    // Create assignments for sections
    for (const sectionId of selectedSections) {
      assignments.push({
        quizId: assignmentData.quizId,
        title: assignmentData.title,
        description: assignmentData.description,
        dueDate: assignmentData.dueDate,
        availableFrom: assignmentData.availableFrom,
        availableTo: assignmentData.availableTo,
        timeLimit: assignmentData.timeLimit,
        maxAttempts: assignmentData.maxAttempts,
        allowLateSubmission: assignmentData.allowLateSubmission,
        percentLostPerDay: assignmentData.percentLostPerDay,
        maxLateDays: assignmentData.maxLateDays,
        showCorrectAnswers: assignmentData.showCorrectAnswers,
        enableQuestionFeedback: assignmentData.enableQuestionFeedback,
        requireProctoring: assignmentData.requireProctoring,
        allowCalculator: assignmentData.allowCalculator,
        catEnabled: assignmentData.catEnabled,
        catMinQuestions: assignmentData.catMinQuestions,
        catMaxQuestions: assignmentData.catMaxQuestions,
        catDifficultyTarget: assignmentData.catDifficultyTarget,
        assignedToUserId: null,
        assignedToSectionId: sectionId,
      });
    }
    
    // Create all assignments
    Promise.all(assignments.map(data => createAssignmentMutation.mutateAsync(data)))
      .then(() => {
        toast({
          title: "Success",
          description: `Created ${assignments.length} assignment(s) successfully`,
        });
        setShowCreateModal(false);
        setSelectedStudents([]);
        setSelectedSections([]);
      })
      .catch((error) => {
        console.error('Error creating assignments:', error);
        toast({
          title: "Error",
          description: "Failed to create some assignments",
          variant: "destructive",
        });
      });
  };

  const handleUpdateAssignment = (formData: FormData) => {
    if (!editingAssignment) return;
    
    const data = {
      id: editingAssignment.id,
      title: formData.get('title'),
      description: formData.get('description'),
      quizId: formData.get('quizId'),
      dueDate: formData.get('dueDate'),
      availableFrom: formData.get('availableFrom'),
      availableTo: formData.get('availableTo'),
      timeLimit: parseInt(formData.get('timeLimit') as string),
      maxAttempts: parseInt(formData.get('maxAttempts') as string),
      allowLateSubmission: formData.get('allowLateSubmission') === 'on',
      shuffleQuestions: formData.get('shuffleQuestions') === 'on',
      showCorrectAnswers: formData.get('showCorrectAnswers') === 'on',
      requireProctoring: formData.get('requireProctoring') === 'on',
      allowCalculator: formData.get('allowCalculator') === 'on',
      status: editingAssignment.status
    };
    updateAssignmentMutation.mutate(data);
  };

  const publishAssignment = (id: string) => {
    updateAssignmentMutation.mutate({ id, status: 'published' });
  };

  const archiveAssignment = (id: string) => {
    updateAssignmentMutation.mutate({ id, status: 'archived' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const AssignmentForm = ({ assignment, onSubmit }: { assignment?: Assignment; onSubmit: (data: FormData) => void }) => (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formDataObj = new FormData();
      
      // Add all form data from controlled state
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value.toString());
      });
      
      // Add selected students and sections
      formDataObj.append('selectedStudents', JSON.stringify(selectedStudents));
      formDataObj.append('selectedSections', JSON.stringify(selectedSections));
      
      onSubmit(formDataObj);
    }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            ref={titleRef}
            id="title"
            name="title"
            value={localInputs.title}
            onChange={handleTitleChange}
            required
            placeholder="Enter assignment title"
          />
        </div>
        <div>
          <Label htmlFor="quizId">Quiz</Label>
          <Select 
            name="quizId" 
            value={formData.quizId}
            onValueChange={(value) => {
              if (value === 'add-new') {
                window.location.href = '/quiz-builder';
              } else {
                stableHandlers.quizId(value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a quiz" />
            </SelectTrigger>
            <SelectContent>
              {quizzes.length > 0 ? (
                quizzes.map((quiz: any) => (
                  <SelectItem key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-quizzes" disabled>No quizzes available</SelectItem>
              )}
              <SelectItem value="add-new" className="text-primary">
                <div className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Quiz
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          ref={descriptionRef}
          id="description"
          name="description"
          value={localInputs.description}
          onChange={handleDescriptionChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          rows={3}
          placeholder="Assignment description..."
        />
      </div>

      {/* Student and Section Selection */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Assign to Students</Label>
          <p className="text-sm text-muted-foreground mb-3">Select individual students or entire sections</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Individual Students */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Individual Students</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedStudents([])}
                  disabled={selectedStudents.length === 0}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              
              {/* Student Search */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student: any) => (
                    <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 border-b last:border-b-0">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents([...selectedStudents, student.id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={`student-${student.id}`} className="text-sm font-medium cursor-pointer">
                          {student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : student.email}
                        </Label>
                        <p className="text-xs text-gray-500 truncate">{student.email}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No students found</p>
                  </div>
                )}
              </div>
              
              {/* Selected Students Summary */}
              {selectedStudents.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-700">
                    {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>

            {/* Sections */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Sections</Label>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedSections([])}
                    disabled={selectedSections.length === 0}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCreateSection(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Section
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {sections.length > 0 ? (
                  sections.map((section: any) => (
                    <div key={section.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 border-b last:border-b-0">
                      <Checkbox
                        id={`section-${section.id}`}
                        checked={selectedSections.includes(section.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSections([...selectedSections, section.id]);
                          } else {
                            setSelectedSections(selectedSections.filter(id => id !== section.id));
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={`section-${section.id}`} className="text-sm font-medium cursor-pointer">
                          {section.name}
                        </Label>
                        <p className="text-xs text-gray-500">
                          {section.memberCount || 0} student{section.memberCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <UsersIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm mb-2">No sections available</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowCreateSection(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create First Section
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Selected Sections Summary */}
              {selectedSections.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-700">
                    {selectedSections.length} section{selectedSections.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Overall Selection Summary */}
          {(selectedStudents.length > 0 || selectedSections.length > 0) && (
            <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700 font-medium">
                  Assignment will be sent to: {selectedStudents.length} individual students and {selectedSections.length} sections
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="availableFrom">Available From</Label>
          <Input
            id="availableFrom"
            name="availableFrom"
            type="datetime-local"
            value={formData.availableFrom}
            onChange={stableHandlers.availableFrom}
          />
        </div>
        <div>
          <Label htmlFor="availableTo">Available To</Label>
          <Input
            id="availableTo"
            name="availableTo"
            type="datetime-local"
            value={formData.availableTo}
            onChange={stableHandlers.availableTo}
          />
        </div>
        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="datetime-local"
            value={formData.dueDate}
            onChange={stableHandlers.dueDate}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
          <Input
            id="timeLimit"
            name="timeLimit"
            type="number"
            value={formData.timeLimit}
            onChange={stableHandlers.timeLimit}
            min={1}
            required
          />
        </div>
        <div>
          <Label htmlFor="maxAttempts">Max Attempts</Label>
          <Input
            id="maxAttempts"
            name="maxAttempts"
            type="number"
            value={formData.maxAttempts}
            onChange={stableHandlers.maxAttempts}
            min={1}
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Switch
            id="allowLateSubmission"
            name="allowLateSubmission"
            checked={formData.allowLateSubmission}
            onCheckedChange={stableHandlers.allowLateSubmission}
          />
          <Label htmlFor="allowLateSubmission">Allow Late Submission</Label>
        </div>
        
        {/* Late Submission Grading Options - Only show when late submission is enabled */}
        {formData.allowLateSubmission && (
          <div className="ml-6 space-y-2 border-l-2 border-gray-200 pl-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="percentLostPerDay">Percentage Lost Per Day Late</Label>
                <Input
                  id="percentLostPerDay"
                  name="percentLostPerDay"
                  type="number"
                  value={formData.percentLostPerDay}
                  onChange={stableHandlers.percentLostPerDay}
                  min={0}
                  max={100}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="maxLateDays">Maximum Late Days Allowed</Label>
                <Input
                  id="maxLateDays"
                  name="maxLateDays"
                  type="number"
                  value={formData.maxLateDays}
                  onChange={stableHandlers.maxLateDays}
                  min={1}
                  placeholder="7"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Example: {formData.percentLostPerDay}% lost per day for up to {formData.maxLateDays} days (after {formData.maxLateDays} days, assignment cannot be submitted)
            </p>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Switch
            id="showCorrectAnswers"
            name="showCorrectAnswers"
            checked={formData.showCorrectAnswers}
            onCheckedChange={stableHandlers.showCorrectAnswers}
          />
          <Label htmlFor="showCorrectAnswers">Show Correct Answers After Submission</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="enableQuestionFeedback"
            name="enableQuestionFeedback"
            checked={formData.enableQuestionFeedback}
            onCheckedChange={stableHandlers.enableQuestionFeedback}
          />
          <Label htmlFor="enableQuestionFeedback">Show Feedback for Answers and Questions</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="requireProctoring"
            name="requireProctoring"
            checked={formData.requireProctoring}
            onCheckedChange={stableHandlers.requireProctoring}
          />
          <Label htmlFor="requireProctoring">Require Proctoring</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="allowCalculator"
            name="allowCalculator"
            checked={formData.allowCalculator}
            onCheckedChange={stableHandlers.allowCalculator}
          />
          <Label htmlFor="allowCalculator">Allow Calculator</Label>
        </div>
        
        {/* CAT (Computer Adaptive Testing) Options */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="catEnabled"
              name="catEnabled"
              checked={formData.catEnabled}
              onCheckedChange={stableHandlers.catEnabled}
            />
            <Label htmlFor="catEnabled">Enable Computer Adaptive Testing (CAT)</Label>
          </div>
          
          {/* CAT Settings - Only show when CAT is enabled */}
          {formData.catEnabled && (
            <div className="ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="catMinQuestions">Minimum Questions</Label>
                  <Input
                    id="catMinQuestions"
                    name="catMinQuestions"
                    type="number"
                    value={formData.catMinQuestions}
                    onChange={stableHandlers.catMinQuestions}
                    min={5}
                    max={50}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="catMaxQuestions">Maximum Questions</Label>
                  <Input
                    id="catMaxQuestions"
                    name="catMaxQuestions"
                    type="number"
                    value={formData.catMaxQuestions}
                    onChange={stableHandlers.catMaxQuestions}
                    min={10}
                    max={100}
                    placeholder="50"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="catDifficultyTarget">Target Difficulty (0.0 - 1.0)</Label>
                <Input
                  id="catDifficultyTarget"
                  name="catDifficultyTarget"
                  type="number"
                  step="0.1"
                  value={formData.catDifficultyTarget}
                  onChange={stableHandlers.catDifficultyTarget}
                  min={0.1}
                  max={1.0}
                  placeholder="0.5"
                />
              </div>
              <p className="text-xs text-gray-500">
                CAT will adapt question difficulty based on student performance, using between {formData.catMinQuestions} and {formData.catMaxQuestions} questions.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
        <Button type="button" variant="outline" onClick={() => {
          setShowCreateModal(false);
          setEditingAssignment(null);
        }}>
          Cancel
        </Button>
        <Button type="submit" disabled={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}>
          {assignment ? 'Update' : 'Create'} Assignment
        </Button>
      </div>
    </form>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="flex items-center hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">Assignments</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600">Create and manage quiz assignments for your students</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardCheck className="h-5 w-5 mr-2" />
            Assignments ({filteredAssignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading assignments...</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No assignments found. Create your first assignment to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment: Assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.title}</div>
                          <div className="text-sm text-gray-500">{assignment.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-1" />
                          {assignment.submissions || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignment.averageScore ? `${assignment.averageScore}%` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingAssignment(assignment)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          {assignment.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => publishAssignment(assignment.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {assignment.status === 'published' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => archiveAssignment(assignment.id)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this assignment?')) {
                                deleteAssignmentMutation.mutate(assignment.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Assignment Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
            <DialogDescription>
              Create a new assignment by selecting a quiz and configuring the assignment details.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-2">
            <AssignmentForm onSubmit={handleCreateAssignment} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Modal */}
      <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Edit the assignment details and update the configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-2">
            {editingAssignment && (
              <AssignmentForm
                assignment={editingAssignment}
                onSubmit={handleUpdateAssignment}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Section Modal */}
      <Dialog open={showCreateSection} onOpenChange={setShowCreateSection}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Section</DialogTitle>
            <DialogDescription>
              Create a new section to organize your students into groups.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const name = formData.get('name') as string;
            const description = formData.get('description') as string;
            
            if (name.trim()) {
              createSectionMutation.mutate({
                name: name.trim(),
                description: description.trim()
              });
            }
          }} className="space-y-4">
            <div>
              <Label htmlFor="sectionName">Section Name</Label>
              <Input
                id="sectionName"
                name="name"
                placeholder="Enter section name..."
                required
              />
            </div>
            <div>
              <Label htmlFor="sectionDescription">Description (Optional)</Label>
              <Textarea
                id="sectionDescription"
                name="description"
                placeholder="Enter section description..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateSection(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSectionMutation.isPending}>
                {createSectionMutation.isPending ? 'Creating...' : 'Create Section'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}