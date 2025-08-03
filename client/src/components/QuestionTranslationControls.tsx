import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Languages, Loader2, Eye, EyeOff } from 'lucide-react';
import { useQuestionTranslation } from '@/hooks/useQuestionTranslation';

interface QuestionTranslationControlsProps {
  questionData: {
    questionText: string;
    answers: string[];
    feedback?: string;
    instructions?: string;
    originalLanguage?: string;
  };
  onTranslationChange: (translation: any) => void;
  compact?: boolean;
}

export const QuestionTranslationControls: React.FC<QuestionTranslationControlsProps> = ({
  questionData,
  onTranslationChange,
  compact = false
}) => {
  const { t, i18n } = useTranslation();
  const [targetLanguage, setTargetLanguage] = useState(i18n.language);
  const [showOriginal, setShowOriginal] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState<any>(null);
  
  const {
    isTranslating,
    translateQuestion,
    getSupportedLanguages
  } = useQuestionTranslation();

  const supportedLanguages = getSupportedLanguages();
  const originalLanguage = questionData.originalLanguage || 'en';

  const handleTranslate = async () => {
    if (targetLanguage === originalLanguage) return;

    try {
      const translation = await translateQuestion(
        questionData,
        originalLanguage,
        targetLanguage
      );
      
      setCurrentTranslation(translation);
      onTranslationChange(translation);
    } catch (error) {
      console.error('Translation failed:', error);
    }
  };

  // Auto-translate when language changes if enabled
  React.useEffect(() => {
    if (autoTranslate && targetLanguage !== originalLanguage) {
      handleTranslate();
    }
  }, [targetLanguage, autoTranslate]);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Languages className="h-4 w-4 text-gray-500" />
        <Select value={targetLanguage} onValueChange={setTargetLanguage}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedLanguages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {targetLanguage !== originalLanguage && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleTranslate}
            disabled={isTranslating}
          >
            {isTranslating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {t('accessibility.languageTranslation.translateQuestions')}
          </Button>
        )}
        
        {currentTranslation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOriginal(!showOriginal)}
          >
            {showOriginal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          {t('accessibility.languageTranslation.translateQuestions')}
          {currentTranslation && (
            <Badge variant="secondary">
              {t('accessibility.languageTranslation.translationComplete')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original Language Display */}
        <div className="space-y-2">
          <Label>{t('accessibility.languageTranslation.originalLanguage')}</Label>
          <div className="text-sm font-medium">
            {supportedLanguages.find(lang => lang.code === originalLanguage)?.name || originalLanguage}
          </div>
        </div>

        {/* Target Language Selection */}
        <div className="space-y-2">
          <Label>{t('accessibility.languageTranslation.targetLanguage')}</Label>
          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Auto-translate Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-translate">
            {t('accessibility.languageTranslation.autoTranslate')}
          </Label>
          <Switch
            id="auto-translate"
            checked={autoTranslate}
            onCheckedChange={setAutoTranslate}
          />
        </div>

        {/* Translation Controls */}
        {targetLanguage !== originalLanguage && (
          <div className="space-y-2">
            <Button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="w-full"
            >
              {isTranslating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isTranslating 
                ? t('accessibility.languageTranslation.translating')
                : t('accessibility.languageTranslation.translateQuestions')
              }
            </Button>
            
            {currentTranslation && (
              <div className="flex gap-2">
                <Button
                  variant={showOriginal ? "default" : "outline"}
                  onClick={() => setShowOriginal(true)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {t('accessibility.languageTranslation.showOriginal')}
                </Button>
                <Button
                  variant={!showOriginal ? "default" : "outline"}
                  onClick={() => setShowOriginal(false)}
                  className="flex-1"
                >
                  <Languages className="h-4 w-4 mr-2" />
                  {t('accessibility.languageTranslation.showTranslation')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Translation Quality Indicator */}
        {currentTranslation && (
          <div className="space-y-2">
            <Label>Translation Quality</Label>
            <div className="flex items-center gap-2">
              {currentTranslation.questionText.confidence && (
                <Badge variant="outline">
                  {Math.round(currentTranslation.questionText.confidence * 100)}% Confidence
                </Badge>
              )}
              <span className="text-sm text-gray-600">
                {currentTranslation.answers.length} answer(s) translated
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionTranslationControls;