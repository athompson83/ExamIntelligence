import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Target, 
  Settings, 
  BookOpen, 
  Calculator, 
  Timer,
  Users,
  BarChart3,
  Save,
  Play,
  AlertCircle,
  Plus,
  Minus,
  Info
} from "lucide-react";

interface ItemBank {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  subject: string;
  difficulty: {
    min: number;
    max: number;
  };
}

interface CATExamConfig {
  title: string;
  description: string;
  instructions: string;
  itemBanks: {
    bankId: string;
    percentage: number;
    minQuestions: number;
    maxQuestions: number;
  }[];
  adaptiveSettings: {
    startingDifficulty: number;
    difficultyAdjustment: number;
    minQuestions: number;
    maxQuestions: number;
    terminationCriteria: {
      confidenceLevel: number;
      standardError: number;
      timeLimit: number;
    };
  };
  scoringSettings: {
    passingScore: number;
    scalingMethod: 'irt' | 'percent' | 'scaled';
    reportingScale: {
      min: number;
      max: number;
    };
  };
  securitySettings: {
    allowCalculator: boolean;
    calculatorType: 'basic' | 'scientific' | 'graphing';
    enableProctoring: boolean;
    preventCopyPaste: boolean;
    preventTabSwitching: boolean;
    requireWebcam: boolean;
  };
  accessSettings: {
    availableFrom: string;
    availableTo: string;
    timeLimit: number;
    allowedAttempts: number;
    assignedStudents: string[];
  };
}

export default function CATExamBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // Parse URL parameters for edit mode
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const editExamId = urlParams.get('examId');
  const isEditMode = !!editExamId;
  
  const [examConfig, setExamConfig] = useState<CATExamConfig>({
    title: '',
    description: '',
    instructions: '',
    itemBanks: [],
    adaptiveSettings: {
      startingDifficulty: 5,
      difficultyAdjustment: 0.5,
      minQuestions: 10,
      maxQuestions: 50,
      terminationCriteria: {
        confidenceLevel: 0.95,
        standardError: 0.3,
        timeLimit: 120
      }
    },
    scoringSettings: {
      passingScore: 70,
      scalingMethod: 'irt',
      reportingScale: {
        min: 200,
        max: 800
      }
    },
    securitySettings: {
      allowCalculator: false,
      calculatorType: 'basic',
      enableProctoring: false,
      preventCopyPaste: true,
      preventTabSwitching: true,
      requireWebcam: false
    },
    accessSettings: {
      availableFrom: '',
      availableTo: '',
      timeLimit: 120,
      allowedAttempts: 3,
      assignedStudents: []
    }
  });

  const [selectedBankId, setSelectedBankId] = useState('');
  const [bankPercentage, setBankPercentage] = useState(25);
  const [bankMinQuestions, setBankMinQuestions] = useState(5);
  const [bankMaxQuestions, setBankMaxQuestions] = useState(15);

  // Fetch available item banks (testbanks)
  const { data: testbanks, isLoading: banksLoading } = useQuery({
    queryKey: ['/api/testbanks'],
    enabled: !!user
  });

  // Transform testbanks into ItemBank format
  const itemBanks: ItemBank[] = (testbanks as any[])?.map((testbank: any) => ({
    id: testbank.id,
    name: testbank.title,
    description: testbank.description,
    questionCount: testbank.questionCount || 0,
    subject: testbank.tags?.[0] || 'General',
    difficulty: { min: 1, max: 10 } // Default difficulty range
  })) || [];

  // Fetch students for assignment
  const { data: students } = useQuery({
    queryKey: ['/api/students'],
    enabled: !!user
  });
  
  // Load existing exam data when in edit mode
  const { data: existingExam, isLoading: examLoading } = useQuery({
    queryKey: ['/api/cat-exams', editExamId],
    queryFn: () => editExamId ? apiRequest(`/api/cat-exams/${editExamId}`) : null,
    enabled: !!editExamId,
    staleTime: 2 * 60 * 1000,
  });

  // Debug logging for edit mode
  React.useEffect(() => {
    console.log('Edit mode state:', { isEditMode, editExamId, existingExam, examLoading });
  }, [isEditMode, editExamId, existingExam, examLoading]);
  
  // Initialize form with existing exam data in edit mode
  React.useEffect(() => {
    if (existingExam && isEditMode) {
      console.log('Loading existing exam data:', existingExam);
      console.log('Current examConfig before update:', examConfig);
      
      const newConfig = {
        ...examConfig,
        title: existingExam.title || '',
        description: existingExam.description || '',
        instructions: existingExam.instructions || existingExam.learningObjectives?.join('; ') || '',
        itemBanks: existingExam.itemBanks || [],
        // Map existing exam data to expected format
        adaptiveSettings: {
          ...examConfig.adaptiveSettings,
          ...(existingExam.adaptiveSettings || {}),
          ...(existingExam.catSettings && {
            minQuestions: existingExam.catSettings.min_items || examConfig.adaptiveSettings.minQuestions,
            maxQuestions: existingExam.catSettings.max_items || examConfig.adaptiveSettings.maxQuestions,
            startingDifficulty: existingExam.difficulty?.min || examConfig.adaptiveSettings.startingDifficulty
          })
        },
        scoringSettings: {
          ...examConfig.scoringSettings,
          ...(existingExam.scoringSettings || {}),
          ...(existingExam.additionalSettings && {
            passingScore: existingExam.additionalSettings.passingGrade || examConfig.scoringSettings.passingScore
          })
        },
        securitySettings: {
          ...examConfig.securitySettings,
          ...(existingExam.securitySettings || {}),
          ...(existingExam.additionalSettings && {
            allowCalculator: existingExam.additionalSettings.allowCalculator ?? examConfig.securitySettings.allowCalculator,
            calculatorType: existingExam.additionalSettings.calculatorType || examConfig.securitySettings.calculatorType,
            enableProctoring: existingExam.additionalSettings.proctoring ?? examConfig.securitySettings.enableProctoring
          })
        },
        accessSettings: {
          ...examConfig.accessSettings,
          ...(existingExam.accessSettings || {}),
          ...(existingExam.additionalSettings && {
            timeLimit: existingExam.additionalSettings.timeLimit || existingExam.estimatedDuration || examConfig.accessSettings.timeLimit
          })
        }
      };
      
      console.log('New config to set:', newConfig);
      setExamConfig(newConfig);
    }
  }, [existingExam, isEditMode]);

  const createCATExamMutation = useMutation({
    mutationFn: async (config: CATExamConfig) => {
      const url = isEditMode ? `/api/cat-exams/${editExamId}` : '/api/cat-exams';
      const method = isEditMode ? 'PUT' : 'POST';
      
      console.log(`${isEditMode ? 'Updating' : 'Creating'} CAT exam:`, config);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} CAT exam`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: isEditMode ? "CAT Exam Updated" : "CAT Exam Created",
        description: isEditMode 
          ? "Your Computer Adaptive Test has been updated successfully. Redirecting to exam list..."
          : "Your Computer Adaptive Test has been created successfully. Redirecting to exam list..."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cat-exams'] });
      if (editExamId) {
        queryClient.invalidateQueries({ queryKey: ['/api/cat-exams', editExamId] });
      }
      
      // Redirect to CAT Exam list after a brief delay
      setTimeout(() => {
        setLocation('/cat-exam-test');
      }, 1500);
    },
    onError: (error) => {
      console.error('CAT exam mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} CAT exam`,
        variant: "destructive"
      });
    }
  });

  const addItemBank = () => {
    if (!selectedBankId || bankPercentage <= 0) return;
    
    const totalPercentage = examConfig.itemBanks.reduce((sum, bank) => sum + bank.percentage, 0);
    if (totalPercentage + bankPercentage > 100) {
      toast({
        title: "Invalid Percentage",
        description: "Total percentage cannot exceed 100%",
        variant: "destructive"
      });
      return;
    }

    const newBank = {
      bankId: selectedBankId,
      percentage: bankPercentage,
      minQuestions: bankMinQuestions,
      maxQuestions: bankMaxQuestions
    };

    setExamConfig(prev => ({
      ...prev,
      itemBanks: [...prev.itemBanks, newBank]
    }));

    setSelectedBankId('');
    setBankPercentage(25);
    setBankMinQuestions(5);
    setBankMaxQuestions(15);
  };

  const removeItemBank = (index: number) => {
    setExamConfig(prev => ({
      ...prev,
      itemBanks: prev.itemBanks.filter((_, i) => i !== index)
    }));
  };

  const getTotalPercentage = () => {
    return examConfig.itemBanks.reduce((sum, bank) => sum + bank.percentage, 0);
  };

  const canSave = () => {
    return examConfig.title && 
           examConfig.itemBanks.length > 0 && 
           getTotalPercentage() === 100;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isEditMode ? 'Edit CAT Exam' : 'CAT Exam Builder'}
            </h1>
            <p className="text-gray-600">
              {isEditMode ? 'Modify your existing Computer Adaptive Test configuration' : 'Create Computer Adaptive Tests using item banks'}
            </p>
          </div>
          <Button
            onClick={() => setLocation('/ai-cat-generator')}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Brain className="h-4 w-4" />
            AI Generator
          </Button>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="itembanks">Item Banks</TabsTrigger>
            <TabsTrigger value="adaptive">Adaptive Logic</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Exam Title</Label>
                  <Input
                    id="title"
                    value={examConfig.title}
                    onChange={(e) => setExamConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter exam title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={examConfig.description}
                    onChange={(e) => setExamConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the exam purpose and content"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="instructions">Student Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={examConfig.instructions}
                    onChange={(e) => setExamConfig(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Instructions for students taking the exam"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="itembanks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Item Bank
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Item Bank</Label>
                    <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an item bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {itemBanks?.map(bank => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.name} ({bank.questionCount} questions)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Percentage of Questions ({bankPercentage}%)</Label>
                    <Slider
                      value={[bankPercentage]}
                      onValueChange={(value) => setBankPercentage(value[0])}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Min Questions</Label>
                      <Input
                        type="number"
                        value={bankMinQuestions}
                        onChange={(e) => setBankMinQuestions(Number(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div>
                      <Label>Max Questions</Label>
                      <Input
                        type="number"
                        value={bankMaxQuestions}
                        onChange={(e) => setBankMaxQuestions(Number(e.target.value))}
                        min={bankMinQuestions}
                      />
                    </div>
                  </div>

                  <Button onClick={addItemBank} disabled={!selectedBankId} className="w-full">
                    Add Item Bank
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Selected Item Banks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {examConfig.itemBanks.map((bank, index) => {
                      const bankInfo = itemBanks?.find(b => b.id === bank.bankId);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{bankInfo?.name}</p>
                            <p className="text-sm text-gray-600">
                              {bank.percentage}% • {bank.minQuestions}-{bank.maxQuestions} questions
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemBank(index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Total Coverage</span>
                      <span className="text-sm">{getTotalPercentage()}%</span>
                    </div>
                    <Progress value={getTotalPercentage()} className="h-2" />
                    {getTotalPercentage() !== 100 && (
                      <p className="text-xs text-orange-600 mt-1">
                        Must equal 100% to save exam
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="adaptive" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Adaptive Algorithm Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Starting Difficulty Level ({examConfig.adaptiveSettings.startingDifficulty})</Label>
                  <Slider
                    value={[examConfig.adaptiveSettings.startingDifficulty]}
                    onValueChange={(value) => setExamConfig(prev => ({
                      ...prev,
                      adaptiveSettings: { ...prev.adaptiveSettings, startingDifficulty: value[0] }
                    }))}
                    min={1}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Initial difficulty for first question (1=easiest, 10=hardest)
                  </p>
                </div>

                <div>
                  <Label>Difficulty Adjustment Rate ({examConfig.adaptiveSettings.difficultyAdjustment})</Label>
                  <Slider
                    value={[examConfig.adaptiveSettings.difficultyAdjustment]}
                    onValueChange={(value) => setExamConfig(prev => ({
                      ...prev,
                      adaptiveSettings: { ...prev.adaptiveSettings, difficultyAdjustment: value[0] }
                    }))}
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    How quickly difficulty adjusts based on responses
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Questions</Label>
                    <Input
                      type="number"
                      value={examConfig.adaptiveSettings.minQuestions}
                      onChange={(e) => setExamConfig(prev => ({
                        ...prev,
                        adaptiveSettings: { ...prev.adaptiveSettings, minQuestions: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Maximum Questions</Label>
                    <Input
                      type="number"
                      value={examConfig.adaptiveSettings.maxQuestions}
                      onChange={(e) => setExamConfig(prev => ({
                        ...prev,
                        adaptiveSettings: { ...prev.adaptiveSettings, maxQuestions: Number(e.target.value) }
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Termination Criteria</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Confidence Level ({examConfig.adaptiveSettings.terminationCriteria.confidenceLevel})</Label>
                      <Slider
                        value={[examConfig.adaptiveSettings.terminationCriteria.confidenceLevel]}
                        onValueChange={(value) => setExamConfig(prev => ({
                          ...prev,
                          adaptiveSettings: {
                            ...prev.adaptiveSettings,
                            terminationCriteria: { ...prev.adaptiveSettings.terminationCriteria, confidenceLevel: value[0] }
                          }
                        }))}
                        min={0.8}
                        max={0.99}
                        step={0.01}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Standard Error Threshold ({examConfig.adaptiveSettings.terminationCriteria.standardError})</Label>
                      <Slider
                        value={[examConfig.adaptiveSettings.terminationCriteria.standardError]}
                        onValueChange={(value) => setExamConfig(prev => ({
                          ...prev,
                          adaptiveSettings: {
                            ...prev.adaptiveSettings,
                            terminationCriteria: { ...prev.adaptiveSettings.terminationCriteria, standardError: value[0] }
                          }
                        }))}
                        min={0.1}
                        max={1.0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Security & Proctoring Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allowCalculator"
                      checked={examConfig.securitySettings.allowCalculator}
                      onCheckedChange={(checked) => setExamConfig(prev => ({
                        ...prev,
                        securitySettings: { ...prev.securitySettings, allowCalculator: Boolean(checked) }
                      }))}
                    />
                    <Label htmlFor="allowCalculator" className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Allow Calculator
                    </Label>
                  </div>

                  {examConfig.securitySettings.allowCalculator && (
                    <div className="ml-6">
                      <Label>Calculator Type</Label>
                      <Select 
                        value={examConfig.securitySettings.calculatorType}
                        onValueChange={(value: 'basic' | 'scientific' | 'graphing') => setExamConfig(prev => ({
                          ...prev,
                          securitySettings: { ...prev.securitySettings, calculatorType: value }
                        }))}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic Calculator</SelectItem>
                          <SelectItem value="scientific">Scientific Calculator</SelectItem>
                          <SelectItem value="graphing">Graphing Calculator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableProctoring"
                      checked={examConfig.securitySettings.enableProctoring}
                      onCheckedChange={(checked) => setExamConfig(prev => ({
                        ...prev,
                        securitySettings: { ...prev.securitySettings, enableProctoring: Boolean(checked) }
                      }))}
                    />
                    <Label htmlFor="enableProctoring">Enable Live Proctoring</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="preventCopyPaste"
                      checked={examConfig.securitySettings.preventCopyPaste}
                      onCheckedChange={(checked) => setExamConfig(prev => ({
                        ...prev,
                        securitySettings: { ...prev.securitySettings, preventCopyPaste: Boolean(checked) }
                      }))}
                    />
                    <Label htmlFor="preventCopyPaste">Prevent Copy/Paste</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="preventTabSwitching"
                      checked={examConfig.securitySettings.preventTabSwitching}
                      onCheckedChange={(checked) => setExamConfig(prev => ({
                        ...prev,
                        securitySettings: { ...prev.securitySettings, preventTabSwitching: Boolean(checked) }
                      }))}
                    />
                    <Label htmlFor="preventTabSwitching">Prevent Tab Switching</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requireWebcam"
                      checked={examConfig.securitySettings.requireWebcam}
                      onCheckedChange={(checked) => setExamConfig(prev => ({
                        ...prev,
                        securitySettings: { ...prev.securitySettings, requireWebcam: Boolean(checked) }
                      }))}
                    />
                    <Label htmlFor="requireWebcam">Require Webcam</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Access Control & Scheduling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Available From</Label>
                    <Input
                      type="datetime-local"
                      value={examConfig.accessSettings.availableFrom}
                      onChange={(e) => setExamConfig(prev => ({
                        ...prev,
                        accessSettings: { ...prev.accessSettings, availableFrom: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Available To</Label>
                    <Input
                      type="datetime-local"
                      value={examConfig.accessSettings.availableTo}
                      onChange={(e) => setExamConfig(prev => ({
                        ...prev,
                        accessSettings: { ...prev.accessSettings, availableTo: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Time Limit (minutes)</Label>
                    <Input
                      type="number"
                      value={examConfig.accessSettings.timeLimit}
                      onChange={(e) => setExamConfig(prev => ({
                        ...prev,
                        accessSettings: { ...prev.accessSettings, timeLimit: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Allowed Attempts</Label>
                    <Input
                      type="number"
                      value={examConfig.accessSettings.allowedAttempts}
                      onChange={(e) => setExamConfig(prev => ({
                        ...prev,
                        accessSettings: { ...prev.accessSettings, allowedAttempts: Number(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-600">
              {canSave() ? "Ready to save" : "Complete all required fields"}
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button 
              onClick={() => createCATExamMutation.mutate(examConfig)}
              disabled={!canSave() || createCATExamMutation.isPending}
            >
              {createCATExamMutation.isPending ? (isEditMode ? "Updating..." : "Creating...") : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {isEditMode ? "Update CAT Exam" : "Create CAT Exam"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}