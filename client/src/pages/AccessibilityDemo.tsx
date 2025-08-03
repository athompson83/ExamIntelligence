import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accessibility, Volume2, Languages, Type, Eye, Play, Pause, Square } from 'lucide-react';
import { AccessibilityPanel } from '@/components/AccessibilityPanel';
import { ExamAccessibilityControls } from '@/components/ExamAccessibilityControls';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useQuestionTranslation } from '@/hooks/useQuestionTranslation';

export default function AccessibilityDemo() {
  const { t, i18n } = useTranslation();
  const { speak, isPlaying, settings } = useTextToSpeech();
  const [sampleQuestion, setSampleQuestion] = useState({
    id: 'demo-q1',
    questionText: 'What is the primary function of the cardiovascular system in the human body?',
    answers: [
      'To regulate body temperature',
      'To transport blood, nutrients, and oxygen throughout the body',
      'To filter waste products from blood',
      'To produce digestive enzymes'
    ],
    feedback: 'The cardiovascular system\'s main function is to circulate blood throughout the body, delivering oxygen and nutrients to tissues while removing waste products.',
    instructions: 'Select the best answer from the options provided.',
    originalLanguage: 'en'
  });

  const handleQuestionChange = (updatedQuestion: any) => {
    setSampleQuestion(updatedQuestion);
  };

  const demoText = "This is a demonstration of the text-to-speech functionality. The system can read questions, answer options, and feedback aloud to assist students with accessibility needs.";

  const handleDemoSpeak = () => {
    speak(demoText);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Accessibility className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Accessibility Features Demo
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            ProficiencyAI includes comprehensive accessibility features to ensure all students can participate fully in assessments. 
            This demo showcases text-to-speech, translation, and visual accessibility tools.
          </p>
          
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              Text-to-Speech
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Languages className="h-3 w-3" />
              Multi-Language Translation
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Visual Accessibility
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Type className="h-3 w-3" />
              Font Size Controls
            </Badge>
          </div>
        </div>

        {/* Current Language Display */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Current Language:</span>
                <Badge variant="outline">{i18n.language.toUpperCase()}</Badge>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                All content will be translated to match your language preference
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Text-to-Speech Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-green-600" />
              Text-to-Speech Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-800 dark:text-gray-200 mb-4">
                {demoText}
              </p>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleDemoSpeak}
                  disabled={!settings.enabled}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Read Demo Text
                </Button>
                
                {!settings.enabled && (
                  <span className="text-sm text-gray-500">
                    Enable text-to-speech in the controls below to try this feature
                  </span>
                )}
                
                {isPlaying && (
                  <Badge variant="secondary" className="animate-pulse">
                    <Volume2 className="h-3 w-3 mr-1" />
                    Speaking...
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Accessibility Panel */}
        <AccessibilityPanel 
          questionData={sampleQuestion}
          onTranslationChange={handleQuestionChange}
          defaultOpen={true}
        />

        <Separator />

        {/* Sample Question with Accessibility Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Display */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Sample Question
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Text */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Question:</h3>
                  <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
                    {sampleQuestion.questionText}
                  </p>
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  <h4 className="font-medium">Answer Options:</h4>
                  <div className="space-y-2">
                    {sampleQuestion.answers.map((answer, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm font-medium min-w-[24px] text-center">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-gray-800 dark:text-gray-200">
                          {answer}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feedback */}
                <div className="space-y-2">
                  <h4 className="font-medium">Explanation:</h4>
                  <p className="text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border-l-4 border-green-400">
                    {sampleQuestion.feedback}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Accessibility Controls */}
          <div className="lg:col-span-1">
            <ExamAccessibilityControls
              question={sampleQuestion}
              onQuestionChange={handleQuestionChange}
            />
          </div>
        </div>

        {/* Feature Status */}
        <Card>
          <CardHeader>
            <CardTitle>Accessibility Features Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Text-to-Speech</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">AI Translation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Voice Selection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">High Contrast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Font Size Control</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Screen Reader Support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Keyboard Navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">8 Languages</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-amber-200">How to Use These Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-amber-700 dark:text-amber-300">
            <div className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Enable text-to-speech in the accessibility panel to have questions and answers read aloud</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Select your preferred language to automatically translate all content</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Adjust voice settings including speech rate, pitch, and volume for optimal listening</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Use the visual accessibility controls to increase text size or enable high contrast mode</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">5.</span>
              <span>All features work together - translation + text-to-speech will read translated content</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}