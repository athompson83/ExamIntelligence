import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  UsersIcon,
  Shield,
  Calculator,
  MessageCircle,
  Timer,
  Target,
  Lock,
  Key,
  TrendingDown,
  Separator as SeparatorIcon,
  FileText
} from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { WorkingDatePicker } from '@/components/ui/working-date-picker';
import { Separator } from '@/components/ui/separator';

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
  
  // Clean, simple form state
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
    showCorrectAnswersAt: 'after_submission',
    showQuestionsAfterAttempt: false,
    enableQuestionFeedback: false,
    requireProctoring: false,
    allowCalculator: false,
    calculatorType: 'basic',
    passwordProtected: false,
    accessCode: '',
    ipLocking: false,
    allowedIPs: '',
    // CAT Settings
    catEnabled: false,
    catMinQuestions: 10,
    catMaxQuestions: 50,
    catDifficultyTarget: 0.5,
    catTerminationCriteria: 'standard_error',
    catStandardError: 0.3
  });
  
  const [location] = useLocation();
  const queryClient = useQueryClient();

  // Refs for text inputs to prevent re-render issues
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const timeLimitRef = useRef<HTMLInputElement>(null);
  const maxAttemptsRef = useRef<HTMLInputElement>(null);
  const percentLostPerDayRef = useRef<HTMLInputElement>(null);
  const maxLateDaysRef = useRef<HTMLInputElement>(null);
  const accessCodeRef = useRef<HTMLInputElement>(null);
  const allowedIPsRef = useRef<HTMLTextAreaElement>(null);

  // Function to capture all current input values
  const captureInputValues = useCallback(() => {
    const currentValues = {
      title: titleRef.current?.value || '',
      description: descriptionRef.current?.value || '',
      timeLimit: parseInt(timeLimitRef.current?.value || '60'),
      maxAttempts: parseInt(maxAttemptsRef.current?.value || '1'),
      percentLostPerDay: parseInt(percentLostPerDayRef.current?.value || '10'),
      maxLateDays: parseInt(maxLateDaysRef.current?.value || '7'),
      accessCode: accessCodeRef.current?.value || '',
      allowedIPs: allowedIPsRef.current?.value || ''
    };
    
    // Update form data with captured values
    setFormData(prev => ({
      ...prev,
      ...currentValues
    }));
    
    return currentValues;
  }, []);

  // Enhanced form input handler that preserves all inputs
  const handleInputChange = useCallback((field: string, value: any) => {
    // Capture current input values before state change
    captureInputValues();
    
    // Update the specific field
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [captureInputValues]);

  // Function to get current form data including text inputs
  const getCurrentFormData = useCallback(() => {
    return {
      ...formData,
      title: titleRef.current?.value || '',
      description: descriptionRef.current?.value || '',
      timeLimit: parseInt(timeLimitRef.current?.value || '60'),
      maxAttempts: parseInt(maxAttemptsRef.current?.value || '1'),
      percentLostPerDay: parseInt(percentLostPerDayRef.current?.value || '10'),
      maxLateDays: parseInt(maxLateDaysRef.current?.value || '7'),
      accessCode: accessCodeRef.current?.value || '',
      allowedIPs: allowedIPsRef.current?.value || ''
    };
  }, [formData]);

  // Parse URL parameters for pre-selected quiz
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const preSelectedQuizId = urlParams.get('quizId');
  const preSelectedQuizTitle = urlParams.get('quizTitle');

  // Auto-open create modal if coming from quiz manager
  useEffect(() => {
    if (preSelectedQuizId && location.includes('/assignments')) {
      const assignmentTitle = preSelectedQuizTitle ? `Assignment: ${preSelectedQuizTitle}` : '';
      setShowCreateModal(true);
      setFormData(prev => ({
        ...prev,
        quizId: preSelectedQuizId,
        title: assignmentTitle,
      }));
      // Set text input values
      setTimeout(() => {
        if (titleRef.current) titleRef.current.value = assignmentTitle;
      }, 0);
    }
  }, [preSelectedQuizId, preSelectedQuizTitle, location]);

  // Reset form when modal closes
  useEffect(() => {
    if (!showCreateModal && !editingAssignment) {
      setSelectedStudents([]);
      setSelectedSections([]);
      setStudentSearchTerm('');
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
        showCorrectAnswersAt: 'after_submission',
        showQuestionsAfterAttempt: false,
        enableQuestionFeedback: false,
        requireProctoring: false,
        allowCalculator: false,
        calculatorType: 'basic',
        passwordProtected: false,
        accessCode: '',
        ipLocking: false,
        allowedIPs: '',
        catEnabled: false,
        catMinQuestions: 10,
        catMaxQuestions: 50,
        catDifficultyTarget: 0.5,
        catTerminationCriteria: 'standard_error',
        catStandardError: 0.3
      });
      // Reset all input refs
      if (titleRef.current) titleRef.current.value = '';
      if (descriptionRef.current) descriptionRef.current.value = '';
      if (timeLimitRef.current) timeLimitRef.current.value = '60';
      if (maxAttemptsRef.current) maxAttemptsRef.current.value = '1';
      if (percentLostPerDayRef.current) percentLostPerDayRef.current.value = '10';
      if (maxLateDaysRef.current) maxLateDaysRef.current.value = '7';
    }
  }, [showCreateModal, editingAssignment]);

  // Populate form when editing
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
      // Populate all input refs
      if (titleRef.current) titleRef.current.value = editingAssignment.title || '';
      if (descriptionRef.current) descriptionRef.current.value = editingAssignment.description || '';
      if (timeLimitRef.current) timeLimitRef.current.value = String(editingAssignment.timeLimit || 60);
      if (maxAttemptsRef.current) maxAttemptsRef.current.value = String(editingAssignment.maxAttempts || 1);
      if (percentLostPerDayRef.current) percentLostPerDayRef.current.value = String(editingAssignment.lateGradingOptions?.percentLostPerDay || 10);
      if (maxLateDaysRef.current) maxLateDaysRef.current.value = String(editingAssignment.lateGradingOptions?.maxLateDays || 7);
    }
  }, [editingAssignment]);

  // Effect to restore input values after form state changes
  useEffect(() => {
    const restoreInputValues = () => {
      if (titleRef.current && formData.title && titleRef.current.value !== formData.title) {
        titleRef.current.value = formData.title;
      }
      if (descriptionRef.current && formData.description && descriptionRef.current.value !== formData.description) {
        descriptionRef.current.value = formData.description;
      }
      if (timeLimitRef.current && formData.timeLimit && timeLimitRef.current.value !== String(formData.timeLimit)) {
        timeLimitRef.current.value = String(formData.timeLimit);
      }
      if (maxAttemptsRef.current && formData.maxAttempts && maxAttemptsRef.current.value !== String(formData.maxAttempts)) {
        maxAttemptsRef.current.value = String(formData.maxAttempts);
      }
      if (percentLostPerDayRef.current && formData.percentLostPerDay && percentLostPerDayRef.current.value !== String(formData.percentLostPerDay)) {
        percentLostPerDayRef.current.value = String(formData.percentLostPerDay);
      }
      if (maxLateDaysRef.current && formData.maxLateDays && maxLateDaysRef.current.value !== String(formData.maxLateDays)) {
        maxLateDaysRef.current.value = String(formData.maxLateDays);
      }
    };

    // Restore values after any form data change
    const timeoutId = setTimeout(restoreInputValues, 0);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Fetch data queries with proper error handling
  const { data: assignments = [], isLoading: assignmentsLoading, error: assignmentsError } = useQuery({
    queryKey: ['/api/quiz-assignments'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/quiz-assignments');
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching assignments:', error);
        return [];
      }
    },
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ['/api/quizzes'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/quizzes');
        console.log('Quizzes response:', response);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        return [];
      }
    },
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/users');
        console.log('Students response:', response);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching students:', error);
        return [];
      }
    },
  });

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['/api/sections'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/sections');
        console.log('Sections response:', response);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching sections:', error);
        return [];
      }
    },
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/quiz-assignments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-assignments'] });
    },
  });

  // Clean assignment creation handler
  const handleCreateAssignment = useCallback(() => {
    // Get current form data including text inputs from refs
    const assignmentData = getCurrentFormData();
    
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
    
    // Create assignments
    const assignments = [];
    
    // Individual student assignments
    for (const studentId of selectedStudents) {
      assignments.push({
        ...assignmentData,
        assignedToUserId: studentId,
        assignedToSectionId: null,
      });
    }
    
    // Section assignments
    for (const sectionId of selectedSections) {
      assignments.push({
        ...assignmentData,
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
        
        // Reset and close
        setShowCreateModal(false);
        setSelectedStudents([]);
        setSelectedSections([]);
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
        // Reset all input refs
        if (titleRef.current) titleRef.current.value = '';
        if (descriptionRef.current) descriptionRef.current.value = '';
        if (timeLimitRef.current) timeLimitRef.current.value = '60';
        if (maxAttemptsRef.current) maxAttemptsRef.current.value = '1';
        if (percentLostPerDayRef.current) percentLostPerDayRef.current.value = '10';
        if (maxLateDaysRef.current) maxLateDaysRef.current.value = '7';
      })
      .catch(error => {
        console.error('Error creating assignments:', error);
        toast({
          title: "Error",
          description: "Failed to create assignment. Please try again.",
          variant: "destructive",
        });
      });
  }, [getCurrentFormData, selectedStudents, selectedSections, createAssignmentMutation]);

  // Filter assignments with safety check
  const filteredAssignments = Array.isArray(assignments) ? assignments.filter((assignment: Assignment) => {
    const matchesSearch = assignment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  // Loading state
  const isLoading = assignmentsLoading || quizzesLoading || studentsLoading || sectionsLoading;

  // Assignment Form Component
  const AssignmentForm = () => {
    console.log('AssignmentForm rendering with quizzes:', quizzes, 'loading:', quizzesLoading);
    console.log('Students data:', students, 'loading:', studentsLoading);
    console.log('Sections data:', sections, 'loading:', sectionsLoading);
    
    // Convert students and sections to multiselect format with null checks
    const studentOptions = Array.isArray(students) ? students.map((student: any) => ({
      id: student.id,
      label: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email || 'Unknown User',
      value: student.id,
      description: student.email || ''
    })) : [];

    const sectionOptions = Array.isArray(sections) ? sections.map((section: any) => ({
      id: section.id,
      label: section.name || 'Unnamed Section',
      value: section.id,
      description: `${section.memberCount || 0} students`
    })) : [];

    console.log('Student options:', studentOptions);
    console.log('Section options:', sectionOptions);

    return (
      <div className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Assignment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  ref={titleRef}
                  id="title"
                  placeholder="Enter assignment title"
                  defaultValue={formData.title}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="quiz">Select Quiz *</Label>
                <Select 
                  value={formData.quizId} 
                  onValueChange={(value) => handleInputChange('quizId', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={quizzesLoading ? "Loading quizzes..." : "Select a quiz"} />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzesLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : quizzes.length === 0 ? (
                      <SelectItem value="no-quizzes" disabled>No quizzes available</SelectItem>
                    ) : (
                      quizzes.map((quiz: any) => (
                        <SelectItem key={quiz.id} value={quiz.id}>
                          {quiz.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                ref={descriptionRef}
                id="description"
                placeholder="Enter assignment description"
                defaultValue={formData.description}
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Date Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Availability & Due Date
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <WorkingDatePicker
                label="Available From"
                value={formData.availableFrom}
                onChange={(value) => handleInputChange('availableFrom', value)}
                showTime={true}
              />
              
              <WorkingDatePicker
                label="Available To"
                value={formData.availableTo}
                onChange={(value) => handleInputChange('availableTo', value)}
                showTime={true}
              />
              
              <WorkingDatePicker
                label="Due Date *"
                value={formData.dueDate}
                onChange={(value) => handleInputChange('dueDate', value)}
                showTime={true}
                required={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Assignment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Assignment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  ref={timeLimitRef}
                  id="timeLimit"
                  type="number"
                  min="1"
                  defaultValue={formData.timeLimit}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="maxAttempts">Max Attempts</Label>
                <Input
                  ref={maxAttemptsRef}
                  id="maxAttempts"
                  type="number"
                  min="1"
                  defaultValue={formData.maxAttempts}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowLateSubmission"
                    checked={formData.allowLateSubmission}
                    onCheckedChange={(checked) => handleInputChange('allowLateSubmission', checked)}
                  />
                  <Label htmlFor="allowLateSubmission" className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Allow Late Submission
                  </Label>
                </div>
              </div>

              {/* Late Submission Settings */}
              {formData.allowLateSubmission && (
                <div className="ml-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="percentLostPerDay">Grade Decrease per Day (%)</Label>
                      <Input
                        ref={percentLostPerDayRef}
                        id="percentLostPerDay"
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={formData.percentLostPerDay}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxLateDays">Maximum Late Days</Label>
                      <Input
                        ref={maxLateDaysRef}
                        id="maxLateDays"
                        type="number"
                        min="1"
                        defaultValue={formData.maxLateDays}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security & Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requireProctoring"
                    checked={formData.requireProctoring}
                    onCheckedChange={(checked) => handleInputChange('requireProctoring', checked)}
                  />
                  <Label htmlFor="requireProctoring" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Require Proctoring
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="passwordProtected"
                    checked={formData.passwordProtected}
                    onCheckedChange={(checked) => handleInputChange('passwordProtected', checked)}
                  />
                  <Label htmlFor="passwordProtected" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Password Protected
                  </Label>
                </div>

                {formData.passwordProtected && (
                  <div className="ml-6">
                    <Label htmlFor="accessCode">Access Code</Label>
                    <Input
                      ref={accessCodeRef}
                      id="accessCode"
                      type="text"
                      placeholder="Enter access code"
                      defaultValue={formData.accessCode}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ipLocking"
                    checked={formData.ipLocking}
                    onCheckedChange={(checked) => handleInputChange('ipLocking', checked)}
                  />
                  <Label htmlFor="ipLocking" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    IP Address Locking
                  </Label>
                </div>

                {formData.ipLocking && (
                  <div className="ml-6">
                    <Label htmlFor="allowedIPs">Allowed IP Addresses</Label>
                    <Textarea
                      ref={allowedIPsRef}
                      id="allowedIPs"
                      placeholder="Enter IP addresses (one per line)"
                      defaultValue={formData.allowedIPs}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Student Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showCorrectAnswers"
                    checked={formData.showCorrectAnswers}
                    onCheckedChange={(checked) => handleInputChange('showCorrectAnswers', checked)}
                  />
                  <Label htmlFor="showCorrectAnswers" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Show Correct Answers
                  </Label>
                </div>

                {formData.showCorrectAnswers && (
                  <div className="ml-6">
                    <Label htmlFor="showCorrectAnswersAt">Show Answers</Label>
                    <Select
                      value={formData.showCorrectAnswersAt}
                      onValueChange={(value) => handleInputChange('showCorrectAnswersAt', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediately">Immediately</SelectItem>
                        <SelectItem value="after_submission">After Submission</SelectItem>
                        <SelectItem value="after_due_date">After Due Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showQuestionsAfterAttempt"
                    checked={formData.showQuestionsAfterAttempt}
                    onCheckedChange={(checked) => handleInputChange('showQuestionsAfterAttempt', checked)}
                  />
                  <Label htmlFor="showQuestionsAfterAttempt">Show Questions After Attempt</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableQuestionFeedback"
                    checked={formData.enableQuestionFeedback}
                    onCheckedChange={(checked) => handleInputChange('enableQuestionFeedback', checked)}
                  />
                  <Label htmlFor="enableQuestionFeedback" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Enable Question Feedback
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowCalculator"
                    checked={formData.allowCalculator}
                    onCheckedChange={(checked) => handleInputChange('allowCalculator', checked)}
                  />
                  <Label htmlFor="allowCalculator" className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Allow Calculator
                  </Label>
                </div>

                {formData.allowCalculator && (
                  <div className="ml-6">
                    <Label htmlFor="calculatorType">Calculator Type</Label>
                    <Select
                      value={formData.calculatorType}
                      onValueChange={(value) => handleInputChange('calculatorType', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="scientific">Scientific</SelectItem>
                        <SelectItem value="graphing">Graphing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Computer Adaptive Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Computer Adaptive Testing (CAT)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="catEnabled"
                checked={formData.catEnabled}
                onCheckedChange={(checked) => handleInputChange('catEnabled', checked)}
              />
              <Label htmlFor="catEnabled" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Enable Computer Adaptive Testing
              </Label>
            </div>

            {formData.catEnabled && (
              <div className="ml-6 p-4 bg-blue-50 border border-blue-200 rounded-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="catMinQuestions">Minimum Questions</Label>
                    <Input
                      id="catMinQuestions"
                      type="number"
                      min="1"
                      value={formData.catMinQuestions}
                      onChange={(e) => handleInputChange('catMinQuestions', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="catMaxQuestions">Maximum Questions</Label>
                    <Input
                      id="catMaxQuestions"
                      type="number"
                      min="1"
                      value={formData.catMaxQuestions}
                      onChange={(e) => handleInputChange('catMaxQuestions', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="catDifficultyTarget">Difficulty Target</Label>
                    <Input
                      id="catDifficultyTarget"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.catDifficultyTarget}
                      onChange={(e) => handleInputChange('catDifficultyTarget', parseFloat(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="catTerminationCriteria">Termination Criteria</Label>
                    <Select
                      value={formData.catTerminationCriteria}
                      onValueChange={(value) => handleInputChange('catTerminationCriteria', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard_error">Standard Error</SelectItem>
                        <SelectItem value="max_questions">Maximum Questions</SelectItem>
                        <SelectItem value="confidence_interval">Confidence Interval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="catStandardError">Standard Error Threshold</Label>
                    <Input
                      id="catStandardError"
                      type="number"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={formData.catStandardError}
                      onChange={(e) => handleInputChange('catStandardError', parseFloat(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assignment Recipients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Students</Label>
                <MultiSelect
                  options={studentOptions}
                  selected={selectedStudents}
                  onSelectionChange={setSelectedStudents}
                  placeholder="Select students..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Sections</Label>
                <MultiSelect
                  options={sectionOptions}
                  selected={selectedSections}
                  onSelectionChange={setSelectedSections}
                  placeholder="Select sections..."
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setShowCreateModal(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateAssignment}
            disabled={createAssignmentMutation.isPending}
          >
            {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
          </Button>
        </div>
      </div>
    );
  };

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
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

          {/* Assignments List */}
          <div className="grid gap-4">
            {filteredAssignments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No assignments found.</p>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments.map((assignment: Assignment) => (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={assignment.status === 'published' ? 'default' : 'secondary'}>
                          {assignment.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{assignment.timeLimit} min</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{assignment.submissions} submissions</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span>Avg: {assignment.averageScore}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

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
                <AssignmentForm />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}