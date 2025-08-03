import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, Languages, Accessibility } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useQuestionTranslation } from '@/hooks/useQuestionTranslation';
import { TextToSpeechControls } from './TextToSpeechControls';
import { QuestionTranslationControls } from './QuestionTranslationControls';

interface ExamAccessibilityControlsProps {
  question: {
    id: string;
    questionText: string;
    answers: string[];
    feedback?: string;
    instructions?: string;
    originalLanguage?: string;
  };
  onQuestionChange?: (updatedQuestion: any) => void;
  showTranslation?: boolean;
  showTextToSpeech?: boolean;
}

export const ExamAccessibilityControls: React.FC<ExamAccessibilityControlsProps> = ({
  question,
  onQuestionChange,
  showTranslation = true,
  showTextToSpeech = true
}) => {
  const { t } = useTranslation();
  const { 
    settings: ttsSettings, 
    speakQuestion, 
    speakAnswers, 
    speakFeedback 
  } = useTextToSpeech();
  
  const { translateToCurrentLanguage } = useQuestionTranslation();

  // Auto-read question when TTS is enabled and auto-read is on
  useEffect(() => {
    if (ttsSettings.enabled && ttsSettings.autoRead && question.questionText) {
      speakQuestion(question.questionText);
    }
  }, [question.questionText, ttsSettings.enabled, ttsSettings.autoRead, speakQuestion]);

  const handleReadQuestion = () => {
    speakQuestion(question.questionText);
  };

  const handleReadAnswers = () => {
    speakAnswers(question.answers);
  };

  const handleReadFeedback = () => {
    if (question.feedback) {
      speakFeedback(question.feedback);
    }
  };

  const handleTranslationChange = (translation: any) => {
    if (onQuestionChange) {
      const updatedQuestion = {
        ...question,
        questionText: translation.questionText.translatedText,
        answers: translation.answers.map((ans: any) => ans.translatedText),
        feedback: translation.feedback?.translatedText || question.feedback,
        instructions: translation.instructions?.translatedText || question.instructions,
        originalData: {
          questionText: question.questionText,
          answers: question.answers,
          feedback: question.feedback,
          instructions: question.instructions
        },
        translationData: translation
      };
      onQuestionChange(updatedQuestion);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      <Card className="border border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Accessibility className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {t('exam.accessibility.quickActions', 'Quick Accessibility Actions')}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {showTextToSpeech && ttsSettings.enabled && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReadQuestion}
                  className="flex items-center gap-2"
                >
                  <Volume2 className="h-4 w-4" />
                  {t('accessibility.textToSpeech.readQuestion')}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReadAnswers}
                  className="flex items-center gap-2"
                >
                  <Volume2 className="h-4 w-4" />
                  {t('accessibility.textToSpeech.readAnswers')}
                </Button>
                
                {question.feedback && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReadFeedback}
                    className="flex items-center gap-2"
                  >
                    <Volume2 className="h-4 w-4" />
                    {t('accessibility.textToSpeech.readFeedback')}
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compact Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showTextToSpeech && (
          <Card>
            <CardContent className="p-4">
              <TextToSpeechControls compact showSettings={false} />
            </CardContent>
          </Card>
        )}
        
        {showTranslation && (
          <Card>
            <CardContent className="p-4">
              <QuestionTranslationControls
                questionData={question}
                onTranslationChange={handleTranslationChange}
                compact
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExamAccessibilityControls;