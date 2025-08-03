import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';

export interface TranslationRequest {
  text: string;
  fromLanguage: string;
  toLanguage: string;
}

export interface TranslatedContent {
  originalText: string;
  translatedText: string;
  fromLanguage: string;
  toLanguage: string;
  confidence?: number;
}

export interface QuestionTranslation {
  questionText: TranslatedContent;
  answers: TranslatedContent[];
  feedback?: TranslatedContent;
  instructions?: TranslatedContent;
}

export const useQuestionTranslation = () => {
  const { i18n } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState<Map<string, TranslatedContent>>(new Map());
  
  // Generate cache key for translation
  const getCacheKey = useCallback((text: string, fromLang: string, toLang: string) => {
    return `${fromLang}-${toLang}-${text.substring(0, 50)}`;
  }, []);

  // Translate text using AI service
  const translateText = useCallback(async (
    text: string, 
    fromLanguage: string, 
    toLanguage: string
  ): Promise<TranslatedContent> => {
    const cacheKey = getCacheKey(text, fromLanguage, toLanguage);
    
    // Check cache first
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    try {
      const response = await apiRequest('/api/ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          fromLanguage,
          toLanguage,
          context: 'educational_assessment'
        })
      }) as any;

      const data = await response.json();
      const translatedContent: TranslatedContent = {
        originalText: text,
        translatedText: data.translatedText,
        fromLanguage,
        toLanguage,
        confidence: data.confidence
      };

      // Cache the translation
      setTranslationCache(prev => new Map(prev).set(cacheKey, translatedContent));
      
      return translatedContent;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Failed to translate text');
    }
  }, [translationCache, getCacheKey]);

  // Translate entire question with all components
  const translateQuestion = useCallback(async (
    questionData: {
      questionText: string;
      answers: string[];
      feedback?: string;
      instructions?: string;
    },
    fromLanguage: string,
    toLanguage: string
  ): Promise<QuestionTranslation> => {
    setIsTranslating(true);
    
    try {
      // Translate question text
      const questionTranslation = await translateText(
        questionData.questionText, 
        fromLanguage, 
        toLanguage
      );

      // Translate answers
      const answerTranslations = await Promise.all(
        questionData.answers.map(answer => 
          translateText(answer, fromLanguage, toLanguage)
        )
      );

      // Translate feedback if provided
      let feedbackTranslation: TranslatedContent | undefined;
      if (questionData.feedback) {
        feedbackTranslation = await translateText(
          questionData.feedback, 
          fromLanguage, 
          toLanguage
        );
      }

      // Translate instructions if provided
      let instructionsTranslation: TranslatedContent | undefined;
      if (questionData.instructions) {
        instructionsTranslation = await translateText(
          questionData.instructions, 
          fromLanguage, 
          toLanguage
        );
      }

      const result: QuestionTranslation = {
        questionText: questionTranslation,
        answers: answerTranslations,
        feedback: feedbackTranslation,
        instructions: instructionsTranslation
      };

      return result;
    } finally {
      setIsTranslating(false);
    }
  }, [translateText]);

  // Translate to current UI language
  const translateToCurrentLanguage = useCallback(async (
    questionData: {
      questionText: string;
      answers: string[];
      feedback?: string;
      instructions?: string;
      originalLanguage?: string;
    }
  ) => {
    const currentLanguage = i18n.language;
    const fromLanguage = questionData.originalLanguage || 'en';
    
    if (fromLanguage === currentLanguage) {
      // No translation needed
      return null;
    }

    return translateQuestion(questionData, fromLanguage, currentLanguage);
  }, [i18n.language, translateQuestion]);

  // Batch translate multiple questions
  const translateQuestions = useCallback(async (
    questions: Array<{
      id: string;
      questionText: string;
      answers: string[];
      feedback?: string;
      instructions?: string;
    }>,
    fromLanguage: string,
    toLanguage: string
  ) => {
    setIsTranslating(true);
    
    try {
      const translations = await Promise.all(
        questions.map(async (question) => ({
          id: question.id,
          translation: await translateQuestion(question, fromLanguage, toLanguage)
        }))
      );
      
      return translations;
    } finally {
      setIsTranslating(false);
    }
  }, [translateQuestion]);

  // Get supported languages for translation
  const getSupportedLanguages = useCallback(() => {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'ja', name: '日本語' },
      { code: 'zh', name: '中文' },
      { code: 'ar', name: 'العربية' },
      { code: 'pt', name: 'Português' },
      { code: 'it', name: 'Italiano' },
      { code: 'ru', name: 'Русский' },
      { code: 'ko', name: '한국어' },
      { code: 'hi', name: 'हिन्दी' }
    ];
  }, []);

  // Clear translation cache
  const clearCache = useCallback(() => {
    setTranslationCache(new Map());
  }, []);

  return {
    isTranslating,
    translateText,
    translateQuestion,
    translateToCurrentLanguage,
    translateQuestions,
    getSupportedLanguages,
    clearCache,
    cacheSize: translationCache.size
  };
};