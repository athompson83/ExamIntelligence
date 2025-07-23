import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Brain, Zap, BookOpen, Settings, Clock, Users, Target, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import Layout from '@/components/Layout';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface GeneratedExamConfig {
  title: string;
  description: string;
  subject: string;
  difficulty: { min: number; max: number };
  estimatedDuration: number;
  targetAudience: string;
  learningObjectives: string[];
  itemBanks: Array<{
    id?: string;
    name: string;
    description: string;
    subject: string;
    questionCount: number;
    isNew: boolean;
    questions?: any[];
  }>;
  catSettings: {
    model: string;
    theta_start: number;
    theta_min: number;
    theta_max: number;
    se_target: number;
    min_items: number;
    max_items: number;
    exposure_control: boolean;
    content_balancing: boolean;
  };
  additionalSettings: {
    passingGrade: number;
    timeLimit: number;
    allowCalculator: boolean;
    calculatorType: string;
    proctoring: boolean;
    shuffleQuestions: boolean;
    showCorrectAnswers: boolean;
  };
}

export default function AICATExamGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [prompt, setPrompt] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedConfig, setGeneratedConfig] = useState<GeneratedExamConfig | null>(null);

  // Fetch existing testbanks for analysis
  const { data: existingTestbanks } = useQuery({
    queryKey: ['/api/testbanks'],
    enabled: !!user
  });

  const generateExamMutation = useMutation({
    mutationFn: async (data: { prompt: string; title: string }) => {
      setIsGenerating(true);
      setGenerationProgress(10);
      setCurrentStep('Analyzing requirements...');

      const response = await apiRequest('/api/ai/generate-cat-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: data.prompt,
          title: data.title,
          existingTestbanks: existingTestbanks || []
        })
      });

      return response as GeneratedExamConfig;
    },
    onSuccess: (data) => {
      // Add safety checks for the generated data
      if (!data || typeof data !== 'object') {
        console.error('Invalid data received:', data);
        toast({
          title: "Generation Error",
          description: "Received invalid data from AI service",
          variant: "destructive"
        });
        setIsGenerating(false);
        setGenerationProgress(0);
        setCurrentStep('');
        return;
      }

      // Ensure required properties exist with defaults
      const safeConfig: GeneratedExamConfig = {
        title: data.title || 'Generated CAT Exam',
        description: data.description || 'AI generated CAT exam configuration',
        subject: data.subject || 'General',
        difficulty: data.difficulty || { min: 3, max: 7 },
        estimatedDuration: data.estimatedDuration || 90,
        targetAudience: data.targetAudience || 'Students',
        learningObjectives: data.learningObjectives || [],
        itemBanks: data.itemBanks || [],
        catSettings: data.catSettings || {
          model: 'irt_2pl',
          theta_start: 0,
          theta_min: -4,
          theta_max: 4,
          se_target: 0.3,
          min_items: 10,
          max_items: 50,
          exposure_control: true,
          content_balancing: true
        },
        additionalSettings: data.additionalSettings || {
          passingGrade: 70,
          timeLimit: 90,
          allowCalculator: false,
          calculatorType: 'basic',
          proctoring: true,
          shuffleQuestions: true,
          showCorrectAnswers: false
        }
      };

      setGeneratedConfig(safeConfig);
      setGenerationProgress(100);
      setCurrentStep('Generation complete! Creating exam...');
      
      // Automatically create the exam after successful generation
      setTimeout(() => {
        createExamMutation.mutate(safeConfig);
      }, 1000);
      
      toast({
        title: "CAT Exam Generated Successfully",
        description: `Generated exam configuration with ${safeConfig.itemBanks.length} item banks. Creating exam...`
      });
    },
    onError: (error: any) => {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate CAT exam configuration",
        variant: "destructive"
      });
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentStep('');
    }
  });

  const createExamMutation = useMutation({
    mutationFn: async (config: GeneratedExamConfig) => {
      setCurrentStep('Creating item banks and questions...');
      setGenerationProgress(20);

      // Create new item banks and questions if needed
      const processedItemBanks = [];
      for (const itemBank of config.itemBanks) {
        if (itemBank.isNew) {
          setCurrentStep(`Creating item bank: ${itemBank.name}...`);
          
          // Create the testbank
          const newTestbank = await apiRequest('/api/testbanks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: itemBank.name,
              description: itemBank.description,
              subject: itemBank.subject,
              tags: [itemBank.subject]
            })
          });

          setCurrentStep(`Generating questions for ${itemBank.name}...`);
          
          // Generate questions for the new testbank
          if (itemBank.questions && itemBank.questions.length > 0) {
            for (let i = 0; i < itemBank.questions.length; i++) {
              const question = itemBank.questions[i];
              await apiRequest('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...question,
                  testbankId: newTestbank.id
                })
              });
              
              const progressPercent = 20 + ((i + 1) / itemBank.questions.length) * 30;
              setGenerationProgress(progressPercent);
            }
          }

          processedItemBanks.push({
            ...newTestbank,
            questionCount: itemBank.questions?.length || 0
          });
        } else {
          processedItemBanks.push(itemBank);
        }
      }

      setCurrentStep('Creating CAT exam configuration...');
      setGenerationProgress(80);

      // Create the CAT exam
      const catExam = await apiRequest('/api/cat-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: examTitle, // Use user's original title
          description: config.description || `Computer Adaptive Test: ${examTitle}`,
          subject: config.subject,
          difficulty: config.difficulty,
          estimatedDuration: config.estimatedDuration,
          targetAudience: config.targetAudience,
          learningObjectives: config.learningObjectives,
          itemBanks: processedItemBanks.map(bank => ({
            bankId: bank.id,
            testbankId: bank.id, // For backward compatibility
            weight: 1.0,
            percentage: bank.percentage || Math.floor(100 / processedItemBanks.length),
            minQuestions: Math.floor(bank.questionCount * 0.3),
            maxQuestions: Math.floor(bank.questionCount * 0.8)
          })),
          catSettings: config.catSettings,
          ...config.additionalSettings
        })
      });

      setCurrentStep('CAT exam created successfully!');
      setGenerationProgress(100);
      
      return catExam;
    },
    onSuccess: (exam) => {
      const examTitle = (exam && typeof exam === 'object' && 'title' in exam) ? exam.title : 'CAT Exam';
      
      toast({
        title: "CAT Exam Created",
        description: `Successfully created "${examTitle}" with all item banks and questions`,
        duration: 5000
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/cat-exams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/testbanks'] });
      
      // Navigate to CAT exams list
      setTimeout(() => {
        setLocation('/cat-exam-test');
      }, 2000);
      
      // Reset form
      setPrompt('');
      setExamTitle('');
      setGeneratedConfig(null);
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentStep('');
    },
    onError: (error: any) => {
      console.error('Creation error:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create CAT exam",
        variant: "destructive"
      });
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentStep('');
    }
  });

  const handleGenerate = () => {
    if (!prompt.trim() || !examTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both an exam title and detailed prompt",
        variant: "destructive"
      });
      return;
    }

    generateExamMutation.mutate({ prompt, title: examTitle });
  };

  const handleCreateExam = () => {
    if (!generatedConfig) return;
    createExamMutation.mutate(generatedConfig);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb 
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'CAT Exams', href: '/cat-exam-test' },
            { label: 'AI Generator', href: '/ai-cat-generator' }
          ]} 
        />

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              AI CAT Exam Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Automatically generate Computer Adaptive Testing exams with AI-selected content and optimized settings
            </p>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Exam Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="examTitle">Exam Title</Label>
                  <Input
                    id="examTitle"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="e.g., Advanced Biology Assessment"
                    disabled={isGenerating}
                  />
                </div>

                <div>
                  <Label htmlFor="prompt">Detailed Requirements</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your exam requirements in detail. Include:
• Subject area and specific topics
• Target difficulty level and audience
• Number of questions desired
• Time constraints
• Special requirements (calculator, proctoring, etc.)
• Learning objectives

Example: 'Create a 30-question adaptive biology exam covering cellular biology, genetics, and ecology for undergraduate students. Target difficulty should be moderate to challenging (6-8/10). Include calculator support and proctoring. Focus on application and analysis level questions.'"
                    className="min-h-[200px] resize-none"
                    disabled={isGenerating}
                  />
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim() || !examTitle.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate CAT Exam
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Progress/Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isGenerating && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary animate-spin" />
                    Generation Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{Math.round(generationProgress)}%</span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                  
                  {currentStep && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="animate-pulse h-2 w-2 bg-primary rounded-full" />
                      {currentStep}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {generatedConfig && !isGenerating && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Generated Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{generatedConfig.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {generatedConfig.description}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-gray-500">Subject</Label>
                      <Badge variant="secondary">{generatedConfig.subject}</Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Duration</Label>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {generatedConfig.estimatedDuration} min
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Difficulty</Label>
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {generatedConfig.difficulty.min}-{generatedConfig.difficulty.max}/10
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Item Banks</Label>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {generatedConfig.itemBanks.length} banks
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs text-gray-500 mb-2 block">Item Banks</Label>
                    <div className="space-y-2">
                      {generatedConfig.itemBanks.map((bank, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div>
                            <div className="font-medium text-sm">{bank.name}</div>
                            <div className="text-xs text-gray-500">{bank.questionCount} questions</div>
                          </div>
                          <Badge variant={bank.isNew ? "default" : "secondary"}>
                            {bank.isNew ? "New" : "Existing"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateExam}
                    disabled={createExamMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {createExamMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating Exam...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Create CAT Exam
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>

        {/* Features Info */}
        {!generatedConfig && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  AI Generator Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4">
                    <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold">Smart Analysis</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      AI analyzes your requirements and selects optimal settings
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Auto Item Banks</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Creates new item banks if existing content doesn't match
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <Settings className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Optimal Settings</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Automatically configures CAT parameters for best results
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Target Audience</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Tailors difficulty and content to your specific audience
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}