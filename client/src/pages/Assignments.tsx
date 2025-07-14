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

  // Track form values stably with refs for input preservation
  const formDataRef = useRef(formData);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const dateRefs = useRef<{
    availableFrom: HTMLInputElement | null;
    availableTo: HTMLInputElement | null;
    dueDate: HTMLInputElement | null;
    timeLimit: HTMLInputElement | null;
    maxAttempts: HTMLInputElement | null;
    percentLostPerDay: HTMLInputElement | null;
    maxLateDays: HTMLInputElement | null;
    catMinQuestions: HTMLInputElement | null;
    catMaxQuestions: HTMLInputElement | null;
    catDifficultyTarget: HTMLInputElement | null;
  }>({
    availableFrom: null,
    availableTo: null,
    dueDate: null,
    timeLimit: null,
    maxAttempts: null,
    percentLostPerDay: null,
    maxLateDays: null,
    catMinQuestions: null,
    catMaxQuestions: null,
    catDifficultyTarget: null
  });
  
  // Stable value preservation state - only used for restoration
  const [preservedValues, setPreservedValues] = useState({ 
    title: '', 
    description: '', 
    availableFrom: '', 
    availableTo: '', 
    dueDate: '',
    timeLimit: '',
    maxAttempts: '',
    percentLostPerDay: '',
    maxLateDays: '',
    catMinQuestions: '',
    catMaxQuestions: '',
    catDifficultyTarget: ''
  });

  // Initialize input values when form opens
  useEffect(() => {
    if (showCreateModal || editingAssignment) {
      const title = formData.title || '';
      const description = formData.description || '';
      const availableFrom = formData.availableFrom || '';
      const availableTo = formData.availableTo || '';
      const dueDate = formData.dueDate || '';
      const timeLimit = String(formData.timeLimit || 60);
      const maxAttempts = String(formData.maxAttempts || 1);
      const percentLostPerDay = String(formData.percentLostPerDay || 10);
      const maxLateDays = String(formData.maxLateDays || 7);
      const catMinQuestions = String(formData.catMinQuestions || 10);
      const catMaxQuestions = String(formData.catMaxQuestions || 50);
      const catDifficultyTarget = String(formData.catDifficultyTarget || 0.5);
      
      // Set preserved values
      setPreservedValues({ 
        title, description, availableFrom, availableTo, dueDate,
        timeLimit, maxAttempts, percentLostPerDay, maxLateDays,
        catMinQuestions, catMaxQuestions, catDifficultyTarget
      });
      
      // Set DOM values directly (uncontrolled)
      if (titleRef.current) titleRef.current.value = title;
      if (descriptionRef.current) descriptionRef.current.value = description;
      if (dateRefs.current.availableFrom) dateRefs.current.availableFrom.value = availableFrom;
      if (dateRefs.current.availableTo) dateRefs.current.availableTo.value = availableTo;
      if (dateRefs.current.dueDate) dateRefs.current.dueDate.value = dueDate;
      if (dateRefs.current.timeLimit) dateRefs.current.timeLimit.value = timeLimit;
      if (dateRefs.current.maxAttempts) dateRefs.current.maxAttempts.value = maxAttempts;
      if (dateRefs.current.percentLostPerDay) dateRefs.current.percentLostPerDay.value = percentLostPerDay;
      if (dateRefs.current.maxLateDays) dateRefs.current.maxLateDays.value = maxLateDays;
      if (dateRefs.current.catMinQuestions) dateRefs.current.catMinQuestions.value = catMinQuestions;
      if (dateRefs.current.catMaxQuestions) dateRefs.current.catMaxQuestions.value = catMaxQuestions;
      if (dateRefs.current.catDifficultyTarget) dateRefs.current.catDifficultyTarget.value = catDifficultyTarget;
    }
  }, [showCreateModal, editingAssignment, formData]);

  // Capture current input values before any state changes
  const captureInputValues = useCallback(() => {
    const currentValues = {
      title: titleRef.current?.value || '',
      description: descriptionRef.current?.value || '',
      availableFrom: dateRefs.current.availableFrom?.value || '',
      availableTo: dateRefs.current.availableTo?.value || '',
      dueDate: dateRefs.current.dueDate?.value || '',
      timeLimit: dateRefs.current.timeLimit?.value || '',
      maxAttempts: dateRefs.current.maxAttempts?.value || '',
      percentLostPerDay: dateRefs.current.percentLostPerDay?.value || '',
      maxLateDays: dateRefs.current.maxLateDays?.value || '',
      catMinQuestions: dateRefs.current.catMinQuestions?.value || '',
      catMaxQuestions: dateRefs.current.catMaxQuestions?.value || '',
      catDifficultyTarget: dateRefs.current.catDifficultyTarget?.value || ''
    };
    
    // Update preserved values and formDataRef
    setPreservedValues(currentValues);
    formDataRef.current = { ...formDataRef.current, ...currentValues };
    
    return currentValues;
  }, []);

  // Restore input values after state changes - only when preservedValues actually changes
  useEffect(() => {
    // Only restore if form is open and we have preserved values with actual content
    if ((showCreateModal || editingAssignment) && (preservedValues.title || preservedValues.description)) {
      console.log('Restoration effect triggered. Preserved values:', preservedValues);
      requestAnimationFrame(() => {
        if (titleRef.current && preservedValues.title && titleRef.current.value !== preservedValues.title) {
          console.log('Restoring title:', preservedValues.title);
          titleRef.current.value = preservedValues.title;
        }
        if (descriptionRef.current && preservedValues.description && descriptionRef.current.value !== preservedValues.description) {
          console.log('Restoring description:', preservedValues.description);
          descriptionRef.current.value = preservedValues.description;
        }
        if (dateRefs.current.availableFrom && preservedValues.availableFrom && dateRefs.current.availableFrom.value !== preservedValues.availableFrom) {
          dateRefs.current.availableFrom.value = preservedValues.availableFrom;
        }
        if (dateRefs.current.availableTo && preservedValues.availableTo && dateRefs.current.availableTo.value !== preservedValues.availableTo) {
          dateRefs.current.availableTo.value = preservedValues.availableTo;
        }
        if (dateRefs.current.dueDate && preservedValues.dueDate && dateRefs.current.dueDate.value !== preservedValues.dueDate) {
          dateRefs.current.dueDate.value = preservedValues.dueDate;
        }
        if (dateRefs.current.timeLimit && preservedValues.timeLimit && dateRefs.current.timeLimit.value !== preservedValues.timeLimit) {
          dateRefs.current.timeLimit.value = preservedValues.timeLimit;
        }
        if (dateRefs.current.maxAttempts && preservedValues.maxAttempts && dateRefs.current.maxAttempts.value !== preservedValues.maxAttempts) {
          dateRefs.current.maxAttempts.value = preservedValues.maxAttempts;
        }
        if (dateRefs.current.percentLostPerDay && preservedValues.percentLostPerDay && dateRefs.current.percentLostPerDay.value !== preservedValues.percentLostPerDay) {
          dateRefs.current.percentLostPerDay.value = preservedValues.percentLostPerDay;
        }
        if (dateRefs.current.maxLateDays && preservedValues.maxLateDays && dateRefs.current.maxLateDays.value !== preservedValues.maxLateDays) {
          dateRefs.current.maxLateDays.value = preservedValues.maxLateDays;
        }
        if (dateRefs.current.catMinQuestions && preservedValues.catMinQuestions && dateRefs.current.catMinQuestions.value !== preservedValues.catMinQuestions) {
          dateRefs.current.catMinQuestions.value = preservedValues.catMinQuestions;
        }
        if (dateRefs.current.catMaxQuestions && preservedValues.catMaxQuestions && dateRefs.current.catMaxQuestions.value !== preservedValues.catMaxQuestions) {
          dateRefs.current.catMaxQuestions.value = preservedValues.catMaxQuestions;
        }
        if (dateRefs.current.catDifficultyTarget && preservedValues.catDifficultyTarget && dateRefs.current.catDifficultyTarget.value !== preservedValues.catDifficultyTarget) {
          dateRefs.current.catDifficultyTarget.value = preservedValues.catDifficultyTarget;
        }
      });
    }
  }, [preservedValues, showCreateModal, editingAssignment]);

  // Native event listeners for input tracking (no re-renders)
  useEffect(() => {
    const titleInput = titleRef.current;
    const descriptionInput = descriptionRef.current;

    const handleTitleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      formDataRef.current = { ...formDataRef.current, title: target.value };
    };

    const handleDescriptionInput = (e: Event) => {
      const target = e.target as HTMLTextAreaElement;
      formDataRef.current = { ...formDataRef.current, description: target.value };
    };

    if (titleInput) {
      titleInput.addEventListener('input', handleTitleInput);
    }
    if (descriptionInput) {
      descriptionInput.addEventListener('input', handleDescriptionInput);
    }

    return () => {
      if (titleInput) {
        titleInput.removeEventListener('input', handleTitleInput);
      }
      if (descriptionInput) {
        descriptionInput.removeEventListener('input', handleDescriptionInput);
      }
    };
  }, [showCreateModal, editingAssignment]);

  // Direct form change handler that doesn't cause re-renders
  const handleFormChange = useCallback((field: string, value: any) => {
    // Capture input values before any form state change
    captureInputValues();
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [captureInputValues]);



  // Create stable handlers for all form fields
  const stableHandlers = useMemo(() => ({
    quizId: (value: string) => handleFormChange('quizId', value),
    availableFrom: (e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('availableFrom', e.target.value),
    availableTo: (e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('availableTo', e.target.value),
    dueDate: (e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('dueDate', e.target.value),
    timeLimit: (e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('timeLimit', parseInt(e.target.value) || 60),
    maxAttempts: (e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('maxAttempts', parseInt(e.target.value) || 1),
    allowLateSubmission: (checked: boolean) => handleFormChange('allowLateSubmission', checked),
    percentLostPerDay: (e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('percentLostPerDay', parseInt(e.target.value) || 10),
    maxLateDays: (e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('maxLateDays', parseInt(e.target.value) || 7),
    showCorrectAnswers: (checked: boolean) => handleFormChange('showCorrectAnswers', checked),
    enableQuestionFeedback: (checked: boolean) => handleFormChange('enableQuestionFeedback', checked),
    requireProctoring: (checked: boolean) => handleFormChange('requireProctoring', checked),
    allowCalculator: (checked: boolean) => handleFormChange('allowCalculator', checked),
    catEnabled: (checked: boolean) => handleFormChange('catEnabled', checked),
    catMinQuestions: (e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('catMinQuestions', parseInt(e.target.value) || 10),
    catMaxQuestions: (e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('catMaxQuestions', parseInt(e.target.value) || 50),
    catDifficultyTarget: (e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('catDifficultyTarget', parseFloat(e.target.value) || 0.5)
  }), [handleFormChange]);

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
        console.log('Creating assignment with data:', data);
        const response = await apiRequest('/api/quiz-assignments', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Assignment creation failed:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Assignment created successfully:', result);
        return result;
      } catch (error) {
        console.error('Assignment creation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Assignment creation success - invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-assignments'] });
    },
    onError: (error) => {
      console.error('Assignment creation mutation error:', error);
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
    console.log('handleCreateAssignment called');
    console.log('Form state:', formData);
    console.log('Selected students:', selectedStudents);
    console.log('Selected sections:', selectedSections);
    
    // Collect current values from form inputs and state
    const assignmentData = {
      ...formData,
      title: titleRef.current?.value || formData.title,
      description: descriptionRef.current?.value || formData.description,
      availableFrom: dateRefs.current.availableFrom?.value || formData.availableFrom,
      availableTo: dateRefs.current.availableTo?.value || formData.availableTo,
      dueDate: dateRefs.current.dueDate?.value || formData.dueDate,
      timeLimit: parseInt(dateRefs.current.timeLimit?.value || '') || formData.timeLimit,
      maxAttempts: parseInt(dateRefs.current.maxAttempts?.value || '') || formData.maxAttempts,
      percentLostPerDay: parseInt(dateRefs.current.percentLostPerDay?.value || '') || formData.percentLostPerDay,
      maxLateDays: parseInt(dateRefs.current.maxLateDays?.value || '') || formData.maxLateDays,
      catMinQuestions: parseInt(dateRefs.current.catMinQuestions?.value || '') || formData.catMinQuestions,
      catMaxQuestions: parseInt(dateRefs.current.catMaxQuestions?.value || '') || formData.catMaxQuestions,
      catDifficultyTarget: parseFloat(dateRefs.current.catDifficultyTarget?.value || '') || formData.catDifficultyTarget
    };
    
    console.log('Assignment data prepared:', assignmentData);
    
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
        
        // Close modal and reset form
        setShowCreateModal(false);
        setSelectedStudents([]);
        setSelectedSections([]);
        
        // Reset form data
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
          enableQuestionFeedback: false,
          requireProctoring: false,
          allowCalculator: false,
          catEnabled: false,
          catMinQuestions: 10,
          catMaxQuestions: 50,
          catDifficultyTarget: 0.5
        });
        
        // Reset preserved values
        setPreservedValues({ 
          title: '', description: '', availableFrom: '', availableTo: '', dueDate: '',
          timeLimit: '', maxAttempts: '', percentLostPerDay: '', maxLateDays: '',
          catMinQuestions: '', catMaxQuestions: '', catDifficultyTarget: ''
        });
        
        // Clear input fields
        if (titleRef.current) titleRef.current.value = '';
        if (descriptionRef.current) descriptionRef.current.value = '';
        if (dateRefs.current.availableFrom) dateRefs.current.availableFrom.value = '';
        if (dateRefs.current.availableTo) dateRefs.current.availableTo.value = '';
        if (dateRefs.current.dueDate) dateRefs.current.dueDate.value = '';
        if (dateRefs.current.timeLimit) dateRefs.current.timeLimit.value = '';
        if (dateRefs.current.maxAttempts) dateRefs.current.maxAttempts.value = '';
        if (dateRefs.current.percentLostPerDay) dateRefs.current.percentLostPerDay.value = '';
        if (dateRefs.current.maxLateDays) dateRefs.current.maxLateDays.value = '';
        if (dateRefs.current.catMinQuestions) dateRefs.current.catMinQuestions.value = '';
        if (dateRefs.current.catMaxQuestions) dateRefs.current.catMaxQuestions.value = '';
        if (dateRefs.current.catDifficultyTarget) dateRefs.current.catDifficultyTarget.value = '';
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
      
      // Collect values from refs and form data
      const currentFormData = {
        ...formData,
        title: titleRef.current?.value || formData.title,
        description: descriptionRef.current?.value || formData.description
      };
      
      // Add all form data
      Object.entries(currentFormData).forEach(([key, value]) => {
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
            defaultValue={formData.title}
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
                // Capture input values before state change
                console.log('Quiz selection - capturing input values...');
                const captured = captureInputValues();
                console.log('Captured values:', captured);
                
                // Update state
                setFormData(prev => ({ ...prev, quizId: value }));
                
                // Immediately restore values after state change
                requestAnimationFrame(() => {
                  if (titleRef.current && captured.title) {
                    titleRef.current.value = captured.title;
                  }
                  if (descriptionRef.current && captured.description) {
                    descriptionRef.current.value = captured.description;
                  }
                  if (dateRefs.current.availableFrom && captured.availableFrom) {
                    dateRefs.current.availableFrom.value = captured.availableFrom;
                  }
                  if (dateRefs.current.availableTo && captured.availableTo) {
                    dateRefs.current.availableTo.value = captured.availableTo;
                  }
                  if (dateRefs.current.dueDate && captured.dueDate) {
                    dateRefs.current.dueDate.value = captured.dueDate;
                  }
                  if (dateRefs.current.timeLimit && captured.timeLimit) {
                    dateRefs.current.timeLimit.value = captured.timeLimit;
                  }
                  if (dateRefs.current.maxAttempts && captured.maxAttempts) {
                    dateRefs.current.maxAttempts.value = captured.maxAttempts;
                  }
                  if (dateRefs.current.percentLostPerDay && captured.percentLostPerDay) {
                    dateRefs.current.percentLostPerDay.value = captured.percentLostPerDay;
                  }
                  if (dateRefs.current.maxLateDays && captured.maxLateDays) {
                    dateRefs.current.maxLateDays.value = captured.maxLateDays;
                  }
                  if (dateRefs.current.catMinQuestions && captured.catMinQuestions) {
                    dateRefs.current.catMinQuestions.value = captured.catMinQuestions;
                  }
                  if (dateRefs.current.catMaxQuestions && captured.catMaxQuestions) {
                    dateRefs.current.catMaxQuestions.value = captured.catMaxQuestions;
                  }
                  if (dateRefs.current.catDifficultyTarget && captured.catDifficultyTarget) {
                    dateRefs.current.catDifficultyTarget.value = captured.catDifficultyTarget;
                  }
                  console.log('Quiz selection - values restored immediately');
                });
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
          defaultValue={formData.description}
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
                  onClick={() => {
                    captureInputValues();
                    setSelectedStudents([]);
                  }}
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
                          // Capture input values before state change
                          captureInputValues();
                          
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
                    onClick={() => {
                      captureInputValues();
                      setSelectedSections([]);
                    }}
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
                          // Capture input values before state change
                          captureInputValues();
                          
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



      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="availableFrom">Available From</Label>
          <Input
            ref={(el) => {
              if (el) {
                dateRefs.current.availableFrom = el;
              }
            }}
            id="availableFrom"
            name="availableFrom"
            type="datetime-local"
            defaultValue={formData.availableFrom}
            onChange={(e) => {
              // Capture all input values before state change
              captureInputValues();
              // Update form data
              setFormData(prev => ({ ...prev, availableFrom: e.target.value }));
            }}
            onFocus={(e) => {
              // Prevent keyboard from triggering picker on mobile
              if (window.innerWidth <= 768) {
                e.target.blur();
                setTimeout(() => e.target.focus(), 100);
              }
            }}
            style={{ 
              // Ensure the date picker remains visible on mobile
              position: 'relative',
              zIndex: 10
            }}
          />
          <p className="text-xs text-gray-500 mt-1">When students can start</p>
        </div>
        <div>
          <Label htmlFor="availableTo">Available To</Label>
          <Input
            ref={(el) => {
              if (el) {
                dateRefs.current.availableTo = el;
              }
            }}
            id="availableTo"
            name="availableTo"
            type="datetime-local"
            defaultValue={formData.availableTo}
            onChange={(e) => {
              // Capture all input values before state change
              captureInputValues();
              // Update form data
              setFormData(prev => ({ ...prev, availableTo: e.target.value }));
            }}
            onFocus={(e) => {
              // Prevent keyboard from triggering picker on mobile
              if (window.innerWidth <= 768) {
                e.target.blur();
                setTimeout(() => e.target.focus(), 100);
              }
            }}
            style={{ 
              // Ensure the date picker remains visible on mobile
              position: 'relative',
              zIndex: 10
            }}
          />
          <p className="text-xs text-gray-500 mt-1">When access expires</p>
        </div>
        <div>
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            ref={(el) => {
              if (el) {
                dateRefs.current.dueDate = el;
              }
            }}
            id="dueDate"
            name="dueDate"
            type="datetime-local"
            defaultValue={formData.dueDate}
            onChange={(e) => {
              // Capture all input values before state change
              captureInputValues();
              // Update form data
              setFormData(prev => ({ ...prev, dueDate: e.target.value }));
            }}
            onFocus={(e) => {
              // Prevent keyboard from triggering picker on mobile
              if (window.innerWidth <= 768) {
                e.target.blur();
                setTimeout(() => e.target.focus(), 100);
              }
            }}
            style={{ 
              // Ensure the date picker remains visible on mobile
              position: 'relative',
              zIndex: 10
            }}
            required
          />
          <p className="text-xs text-gray-500 mt-1">Assignment deadline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
          <Input
            ref={(el) => {
              if (el) {
                dateRefs.current.timeLimit = el;
              }
            }}
            id="timeLimit"
            name="timeLimit"
            type="number"
            defaultValue={formData.timeLimit}
            onChange={(e) => {
              captureInputValues();
              setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 60 }));
            }}
            min={1}
            required
          />
        </div>
        <div>
          <Label htmlFor="maxAttempts">Max Attempts</Label>
          <Input
            ref={(el) => {
              if (el) {
                dateRefs.current.maxAttempts = el;
              }
            }}
            id="maxAttempts"
            name="maxAttempts"
            type="number"
            defaultValue={formData.maxAttempts}
            onChange={(e) => {
              captureInputValues();
              setFormData(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) || 1 }));
            }}
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
            onCheckedChange={(checked) => {
              captureInputValues();
              setFormData(prev => ({ ...prev, allowLateSubmission: checked }));
            }}
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
                  ref={(el) => {
                    if (el) {
                      dateRefs.current.percentLostPerDay = el;
                    }
                  }}
                  id="percentLostPerDay"
                  name="percentLostPerDay"
                  type="number"
                  defaultValue={formData.percentLostPerDay}
                  onChange={(e) => {
                    captureInputValues();
                    setFormData(prev => ({ ...prev, percentLostPerDay: parseInt(e.target.value) || 10 }));
                  }}
                  min={0}
                  max={100}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="maxLateDays">Maximum Late Days Allowed</Label>
                <Input
                  ref={(el) => {
                    if (el) {
                      dateRefs.current.maxLateDays = el;
                    }
                  }}
                  id="maxLateDays"
                  name="maxLateDays"
                  type="number"
                  defaultValue={formData.maxLateDays}
                  onChange={(e) => {
                    captureInputValues();
                    setFormData(prev => ({ ...prev, maxLateDays: parseInt(e.target.value) || 7 }));
                  }}
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
            onCheckedChange={(checked) => {
              captureInputValues();
              setFormData(prev => ({ ...prev, showCorrectAnswers: checked }));
            }}
          />
          <Label htmlFor="showCorrectAnswers">Show Correct Answers After Submission</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="enableQuestionFeedback"
            name="enableQuestionFeedback"
            checked={formData.enableQuestionFeedback}
            onCheckedChange={(checked) => {
              captureInputValues();
              setFormData(prev => ({ ...prev, enableQuestionFeedback: checked }));
            }}
          />
          <Label htmlFor="enableQuestionFeedback">Show Feedback for Answers and Questions</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="requireProctoring"
            name="requireProctoring"
            checked={formData.requireProctoring}
            onCheckedChange={(checked) => {
              captureInputValues();
              setFormData(prev => ({ ...prev, requireProctoring: checked }));
            }}
          />
          <Label htmlFor="requireProctoring">Require Proctoring</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="allowCalculator"
            name="allowCalculator"
            checked={formData.allowCalculator}
            onCheckedChange={(checked) => {
              captureInputValues();
              setFormData(prev => ({ ...prev, allowCalculator: checked }));
            }}
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
              onCheckedChange={(checked) => {
                captureInputValues();
                setFormData(prev => ({ ...prev, catEnabled: checked }));
              }}
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
                    ref={(el) => {
                      if (el) {
                        dateRefs.current.catMinQuestions = el;
                      }
                    }}
                    id="catMinQuestions"
                    name="catMinQuestions"
                    type="number"
                    defaultValue={formData.catMinQuestions}
                    onChange={(e) => {
                      captureInputValues();
                      setFormData(prev => ({ ...prev, catMinQuestions: parseInt(e.target.value) || 10 }));
                    }}
                    min={5}
                    max={50}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="catMaxQuestions">Maximum Questions</Label>
                  <Input
                    ref={(el) => {
                      if (el) {
                        dateRefs.current.catMaxQuestions = el;
                      }
                    }}
                    id="catMaxQuestions"
                    name="catMaxQuestions"
                    type="number"
                    defaultValue={formData.catMaxQuestions}
                    onChange={(e) => {
                      captureInputValues();
                      setFormData(prev => ({ ...prev, catMaxQuestions: parseInt(e.target.value) || 50 }));
                    }}
                    min={10}
                    max={100}
                    placeholder="50"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="catDifficultyTarget">Target Difficulty (0.0 - 1.0)</Label>
                <Input
                  ref={(el) => {
                    if (el) {
                      dateRefs.current.catDifficultyTarget = el;
                    }
                  }}
                  id="catDifficultyTarget"
                  name="catDifficultyTarget"
                  type="number"
                  step="0.1"
                  defaultValue={formData.catDifficultyTarget}
                  onChange={(e) => {
                    captureInputValues();
                    setFormData(prev => ({ ...prev, catDifficultyTarget: parseFloat(e.target.value) || 0.5 }));
                  }}
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