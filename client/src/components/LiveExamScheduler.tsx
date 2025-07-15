import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Settings, Eye, AlertTriangle } from 'lucide-react';

const liveExamSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  quizId: z.string().min(1, 'Quiz selection is required'),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  scheduledTime: z.string().min(1, 'Scheduled time is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  proctoringEnabled: z.boolean().default(true),
  recordingEnabled: z.boolean().default(false),
  allowCalculator: z.boolean().default(false),
  calculatorType: z.enum(['basic', 'scientific', 'graphing']).default('basic'),
  maxAttempts: z.number().min(1).default(1),
  instructions: z.string().optional(),
});

type LiveExamForm = z.infer<typeof liveExamSchema>;

interface LiveExamSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  examId?: string;
}

export function LiveExamScheduler({ isOpen, onClose, examId }: LiveExamSchedulerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const { data: quizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ['/api/quizzes'],
    enabled: isOpen,
  });

  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: ['/api/live-exams', examId],
    enabled: isOpen && !!examId,
  });

  const form = useForm<LiveExamForm>({
    resolver: zodResolver(liveExamSchema),
    defaultValues: {
      title: '',
      description: '',
      quizId: '',
      scheduledDate: '',
      scheduledTime: '',
      duration: 60,
      proctoringEnabled: true,
      recordingEnabled: false,
      allowCalculator: false,
      calculatorType: 'basic',
      maxAttempts: 1,
      instructions: '',
    },
  });

  const createExamMutation = useMutation({
    mutationFn: (data: LiveExamForm) => apiRequest('/api/live-exams', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Live exam scheduled successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/live-exams'] });
      onClose();
      form.reset();
      setStep(1);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule live exam',
        variant: 'destructive',
      });
    },
  });

  const updateExamMutation = useMutation({
    mutationFn: (data: LiveExamForm) => apiRequest(`/api/live-exams/${examId}`, {
      method: 'PUT',
      body: data,
    }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Live exam updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/live-exams'] });
      onClose();
      form.reset();
      setStep(1);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update live exam',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: LiveExamForm) => {
    if (examId) {
      updateExamMutation.mutate(data);
    } else {
      createExamMutation.mutate(data);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      const basicFields = ['title', 'quizId', 'scheduledDate', 'scheduledTime', 'duration'];
      const hasErrors = basicFields.some(field => form.getFieldState(field as keyof LiveExamForm).error);
      
      if (!hasErrors) {
        setStep(2);
      } else {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
      }
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Exam Title *</Label>
        <Input
          id="title"
          {...form.register('title')}
          placeholder="Enter exam title"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Enter exam description"
        />
      </div>

      <div>
        <Label htmlFor="quizId">Select Quiz *</Label>
        <Select onValueChange={(value) => form.setValue('quizId', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a quiz" />
          </SelectTrigger>
          <SelectContent>
            {quizzes?.map((quiz: any) => (
              <SelectItem key={quiz.id} value={quiz.id}>
                {quiz.title} ({quiz.questions?.length || 0} questions)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.quizId && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.quizId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="scheduledDate">Date *</Label>
          <Input
            id="scheduledDate"
            type="date"
            {...form.register('scheduledDate')}
          />
          {form.formState.errors.scheduledDate && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.scheduledDate.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="scheduledTime">Time *</Label>
          <Input
            id="scheduledTime"
            type="time"
            {...form.register('scheduledTime')}
          />
          {form.formState.errors.scheduledTime && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.scheduledTime.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="duration">Duration (minutes) *</Label>
        <Input
          id="duration"
          type="number"
          min="1"
          {...form.register('duration', { valueAsNumber: true })}
          placeholder="60"
        />
        {form.formState.errors.duration && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.duration.message}</p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="proctoringEnabled">Enable Proctoring</Label>
          <p className="text-sm text-gray-600">Monitor students during the exam</p>
        </div>
        <Switch
          id="proctoringEnabled"
          checked={form.watch('proctoringEnabled')}
          onCheckedChange={(checked) => form.setValue('proctoringEnabled', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="recordingEnabled">Enable Recording</Label>
          <p className="text-sm text-gray-600">Record student sessions</p>
        </div>
        <Switch
          id="recordingEnabled"
          checked={form.watch('recordingEnabled')}
          onCheckedChange={(checked) => form.setValue('recordingEnabled', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="allowCalculator">Allow Calculator</Label>
          <p className="text-sm text-gray-600">Provide on-screen calculator</p>
        </div>
        <Switch
          id="allowCalculator"
          checked={form.watch('allowCalculator')}
          onCheckedChange={(checked) => form.setValue('allowCalculator', checked)}
        />
      </div>

      {form.watch('allowCalculator') && (
        <div>
          <Label htmlFor="calculatorType">Calculator Type</Label>
          <Select 
            value={form.watch('calculatorType')} 
            onValueChange={(value) => form.setValue('calculatorType', value as any)}
          >
            <SelectTrigger>
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

      <div>
        <Label htmlFor="maxAttempts">Maximum Attempts</Label>
        <Input
          id="maxAttempts"
          type="number"
          min="1"
          {...form.register('maxAttempts', { valueAsNumber: true })}
          placeholder="1"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="instructions">Special Instructions</Label>
        <Textarea
          id="instructions"
          {...form.register('instructions')}
          placeholder="Enter any special instructions for students"
          rows={4}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exam Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">Title:</span>
              <span>{form.watch('title')}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Quiz:</span>
              <span>{quizzes?.find((q: any) => q.id === form.watch('quizId'))?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Date & Time:</span>
              <span>{form.watch('scheduledDate')} at {form.watch('scheduledTime')}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Duration:</span>
              <span>{form.watch('duration')} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Proctoring:</span>
              <Badge variant={form.watch('proctoringEnabled') ? 'default' : 'secondary'}>
                {form.watch('proctoringEnabled') ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Calculator:</span>
              <Badge variant={form.watch('allowCalculator') ? 'default' : 'secondary'}>
                {form.watch('allowCalculator') ? `${form.watch('calculatorType')} enabled` : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {examId ? 'Edit Live Exam' : 'Schedule Live Exam'}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((stepNumber) => (
            <div
              key={stepNumber}
              className={`flex items-center ${stepNumber < 3 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div
                  className={`h-1 flex-1 ml-2 ${
                    step > stepNumber ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <DialogFooter className="mt-6">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={createExamMutation.isPending || updateExamMutation.isPending}
              >
                {createExamMutation.isPending || updateExamMutation.isPending 
                  ? 'Saving...' 
                  : examId 
                    ? 'Update Exam' 
                    : 'Schedule Exam'
                }
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}