import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Quiz, QuizAttempt, QuizResponse, Question, ExamSession } from '@/types';

interface ExamState {
  currentQuiz: Quiz | null;
  currentAttempt: QuizAttempt | null;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  responses: QuizResponse[];
  examSession: ExamSession | null;
  timeRemaining: number;
  isExamActive: boolean;
  isLoading: boolean;
  error: string | null;
  flaggedEvents: string[];
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

const initialState: ExamState = {
  currentQuiz: null,
  currentAttempt: null,
  currentQuestion: null,
  currentQuestionIndex: 0,
  responses: [],
  examSession: null,
  timeRemaining: 0,
  isExamActive: false,
  isLoading: false,
  error: null,
  flaggedEvents: [],
  autoSaveStatus: 'idle',
};

// Async thunks for exam operations
export const startExam = createAsyncThunk(
  'exam/start',
  async (quizId: string, { rejectWithValue }) => {
    try {
      // API call to start exam
      const response = await fetch(`/api/quizzes/${quizId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to start exam');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Start exam failed');
    }
  }
);

export const submitResponse = createAsyncThunk(
  'exam/submitResponse',
  async ({ attemptId, questionId, response }: {
    attemptId: string;
    questionId: string;
    response: QuizResponse;
  }, { rejectWithValue }) => {
    try {
      const apiResponse = await fetch(`/api/attempts/${attemptId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, ...response }),
      });
      
      if (!apiResponse.ok) {
        throw new Error('Failed to submit response');
      }
      
      return await apiResponse.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Submit response failed');
    }
  }
);

export const flagEvent = createAsyncThunk(
  'exam/flagEvent',
  async ({ attemptId, eventType, details }: {
    attemptId: string;
    eventType: string;
    details?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/attempts/${attemptId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: eventType, details }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to flag event');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Flag event failed');
    }
  }
);

export const submitExam = createAsyncThunk(
  'exam/submit',
  async (attemptId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit exam');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Submit exam failed');
    }
  }
);

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    setCurrentQuestion: (state, action: PayloadAction<{ question: Question; index: number }>) => {
      state.currentQuestion = action.payload.question;
      state.currentQuestionIndex = action.payload.index;
    },
    
    updateResponse: (state, action: PayloadAction<QuizResponse>) => {
      const existingResponseIndex = state.responses.findIndex(
        r => r.questionId === action.payload.questionId
      );
      
      if (existingResponseIndex >= 0) {
        state.responses[existingResponseIndex] = action.payload;
      } else {
        state.responses.push(action.payload);
      }
    },
    
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
      
      // Auto-submit if time runs out
      if (action.payload <= 0) {
        state.isExamActive = false;
      }
    },
    
    addFlaggedEvent: (state, action: PayloadAction<string>) => {
      state.flaggedEvents.push(action.payload);
    },
    
    setAutoSaveStatus: (state, action: PayloadAction<ExamState['autoSaveStatus']>) => {
      state.autoSaveStatus = action.payload;
    },
    
    nextQuestion: (state) => {
      if (state.currentQuiz && state.currentQuestionIndex < state.currentQuiz.questions.length - 1) {
        state.currentQuestionIndex += 1;
        state.currentQuestion = state.currentQuiz.questions[state.currentQuestionIndex];
      }
    },
    
    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
        state.currentQuestion = state.currentQuiz?.questions[state.currentQuestionIndex] || null;
      }
    },
    
    goToQuestion: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (state.currentQuiz && index >= 0 && index < state.currentQuiz.questions.length) {
        state.currentQuestionIndex = index;
        state.currentQuestion = state.currentQuiz.questions[index];
      }
    },
    
    clearExam: (state) => {
      state.currentQuiz = null;
      state.currentAttempt = null;
      state.currentQuestion = null;
      state.currentQuestionIndex = 0;
      state.responses = [];
      state.examSession = null;
      state.timeRemaining = 0;
      state.isExamActive = false;
      state.flaggedEvents = [];
      state.autoSaveStatus = 'idle';
      state.error = null;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Start Exam
      .addCase(startExam.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startExam.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentQuiz = action.payload.quiz;
        state.currentAttempt = action.payload.attempt;
        state.examSession = action.payload.session;
        state.timeRemaining = action.payload.timeRemaining;
        state.isExamActive = true;
        
        if (state.currentQuiz?.questions.length > 0) {
          state.currentQuestion = state.currentQuiz.questions[0];
          state.currentQuestionIndex = 0;
        }
      })
      .addCase(startExam.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Submit Response
      .addCase(submitResponse.pending, (state) => {
        state.autoSaveStatus = 'saving';
      })
      .addCase(submitResponse.fulfilled, (state, action) => {
        state.autoSaveStatus = 'saved';
        // Update the response in local state
        const responseIndex = state.responses.findIndex(
          r => r.questionId === action.payload.questionId
        );
        if (responseIndex >= 0) {
          state.responses[responseIndex] = action.payload;
        }
      })
      .addCase(submitResponse.rejected, (state, action) => {
        state.autoSaveStatus = 'error';
        state.error = action.payload as string;
      })
      
      // Flag Event
      .addCase(flagEvent.fulfilled, (state, action) => {
        state.flaggedEvents.push(action.payload.type);
      })
      
      // Submit Exam
      .addCase(submitExam.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(submitExam.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isExamActive = false;
        state.currentAttempt = action.payload;
      })
      .addCase(submitExam.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentQuestion,
  updateResponse,
  updateTimeRemaining,
  addFlaggedEvent,
  setAutoSaveStatus,
  nextQuestion,
  previousQuestion,
  goToQuestion,
  clearExam,
  clearError,
} = examSlice.actions;

export default examSlice.reducer;