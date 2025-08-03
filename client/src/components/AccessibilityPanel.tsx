import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Accessibility, Volume2, Languages, Type, Eye } from 'lucide-react';
import TextToSpeechControls from './TextToSpeechControls';
import QuestionTranslationControls from './QuestionTranslationControls';

interface AccessibilityPanelProps {
  questionData?: {
    questionText: string;
    answers: string[];
    feedback?: string;
    instructions?: string;
    originalLanguage?: string;
  };
  onTranslationChange?: (translation: any) => void;
  compact?: boolean;
  defaultOpen?: boolean;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  questionData,
  onTranslationChange,
  compact = false,
  defaultOpen = false
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState('tts');

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
        <Accessibility className="h-4 w-4 text-blue-600" />
        <TextToSpeechControls compact />
        {questionData && (
          <QuestionTranslationControls
            questionData={questionData}
            onTranslationChange={onTranslationChange || (() => {})}
            compact
          />
        )}
      </div>
    );
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Accessibility className="h-5 w-5 text-blue-600" />
                Accessibility Options
                <Badge variant="secondary" className="ml-2">
                  Enhanced
                </Badge>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tts" className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Text-to-Speech</span>
                </TabsTrigger>
                <TabsTrigger value="translation" className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  <span className="hidden sm:inline">Translation</span>
                </TabsTrigger>
                <TabsTrigger value="visual" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Visual</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tts" className="mt-4">
                <TextToSpeechControls showSettings />
              </TabsContent>

              <TabsContent value="translation" className="mt-4">
                {questionData ? (
                  <QuestionTranslationControls
                    questionData={questionData}
                    onTranslationChange={onTranslationChange || (() => {})}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Languages className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No question data available for translation</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="visual" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5" />
                      Visual Accessibility
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          document.documentElement.style.fontSize = 
                            Math.min(parseInt(getComputedStyle(document.documentElement).fontSize) + 2, 24) + 'px';
                        }}
                      >
                        <Type className="h-4 w-4 mr-2" />
                        Increase Text Size
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          document.documentElement.style.fontSize = 
                            Math.max(parseInt(getComputedStyle(document.documentElement).fontSize) - 2, 12) + 'px';
                        }}
                      >
                        <Type className="h-4 w-4 mr-2" />
                        Decrease Text Size
                      </Button>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        document.documentElement.classList.toggle('high-contrast');
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Toggle High Contrast
                    </Button>
                    
                    <div className="text-sm text-gray-600">
                      <p>Visual accessibility features:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Adjustable text size</li>
                        <li>High contrast mode</li>
                        <li>Focus indicators</li>
                        <li>Screen reader support</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default AccessibilityPanel;