import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface QuizProgressSaverProps {
  attemptId: string;
  currentQuestionIndex: number;
  answeredQuestions: string[];
  savedResponses: Record<string, any>;
  timeSpentPerQuestion: Record<string, number>;
  onProgressLoaded?: (progress: {
    currentQuestionIndex: number;
    answeredQuestions: string[];
    savedResponses: Record<string, any>;
    timeSpentPerQuestion: Record<string, number>;
  }) => void;
}

export default function QuizProgressSaver({
  attemptId,
  currentQuestionIndex,
  answeredQuestions,
  savedResponses,
  timeSpentPerQuestion,
  onProgressLoaded
}: QuizProgressSaverProps) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>('');

  // Load existing progress on component mount
  const { data: savedProgress } = useQuery({
    queryKey: ['/api/quiz-progress', attemptId],
    enabled: !!attemptId,
    retry: false,
    staleTime: 0 // Always fetch fresh data
  });

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: (progressData: any) => 
      apiRequest(`/api/quiz-progress/${attemptId}`, 'PUT', progressData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-progress', attemptId] });
    }
  });

  // Load saved progress when it becomes available
  useEffect(() => {
    if (savedProgress && onProgressLoaded) {
      const progress = savedProgress as any;
      onProgressLoaded({
        currentQuestionIndex: progress.currentQuestionIndex || 0,
        answeredQuestions: progress.answeredQuestions || [],
        savedResponses: progress.savedResponses || {},
        timeSpentPerQuestion: progress.timeSpentPerQuestion || {}
      });
    }
  }, [savedProgress, onProgressLoaded]);

  // Auto-save progress whenever state changes with proper debouncing
  const saveProgress = useCallback(() => {
    if (!attemptId) return;

    const progressData = {
      attemptId,
      currentQuestionIndex,
      answeredQuestions,
      savedResponses,
      timeSpentPerQuestion
    };

    // Create a hash of the current state to compare with last save
    const currentStateHash = JSON.stringify(progressData);
    
    // Only save if state has actually changed
    if (currentStateHash !== lastSaveRef.current) {
      lastSaveRef.current = currentStateHash;
      saveProgressMutation.mutate(progressData);
    }
  }, [attemptId, currentQuestionIndex, answeredQuestions, savedResponses, timeSpentPerQuestion, saveProgressMutation]);

  // Debounced auto-save - only trigger when state changes
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for saving after inactivity
    timeoutRef.current = setTimeout(() => {
      saveProgress();
    }, 5000); // Save after 5 seconds of inactivity

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [attemptId, currentQuestionIndex, answeredQuestions, savedResponses, timeSpentPerQuestion, saveProgress]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for reliable saving on page unload
      if (navigator.sendBeacon && attemptId) {
        const progressData = {
          attemptId,
          currentQuestionIndex,
          answeredQuestions,
          savedResponses,
          timeSpentPerQuestion
        };
        
        navigator.sendBeacon(
          `/api/quiz-progress/${attemptId}`,
          JSON.stringify(progressData)
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [attemptId, currentQuestionIndex, answeredQuestions, savedResponses, timeSpentPerQuestion]);

  return null; // This is a utility component with no UI
}