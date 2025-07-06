import { useEffect, useCallback } from 'react';
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
      apiRequest(`/api/quiz-progress/${attemptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-progress', attemptId] });
    }
  });

  // Load saved progress when it becomes available
  useEffect(() => {
    if (savedProgress && onProgressLoaded) {
      onProgressLoaded({
        currentQuestionIndex: savedProgress.currentQuestionIndex || 0,
        answeredQuestions: savedProgress.answeredQuestions || [],
        savedResponses: savedProgress.savedResponses || {},
        timeSpentPerQuestion: savedProgress.timeSpentPerQuestion || {}
      });
    }
  }, [savedProgress, onProgressLoaded]);

  // Auto-save progress whenever state changes
  const saveProgress = useCallback(() => {
    if (!attemptId) return;

    const progressData = {
      attemptId,
      currentQuestionIndex,
      answeredQuestions,
      savedResponses,
      timeSpentPerQuestion
    };

    saveProgressMutation.mutate(progressData);
  }, [attemptId, currentQuestionIndex, answeredQuestions, savedResponses, timeSpentPerQuestion, saveProgressMutation]);

  // Auto-save every 10 seconds or when state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveProgress();
    }, 2000); // Save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [saveProgress]);

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