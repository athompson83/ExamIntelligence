import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb,
  Target,
  Users,
  BookOpen,
  Zap,
  ArrowRight,
  Copy,
  RefreshCw,
  Clock
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface OptimizationSuggestion {
  type: 'clarity' | 'specificity' | 'structure' | 'variables' | 'examples' | 'bias' | 'performance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  before: string;
  after: string;
  impact: string;
}

interface OptimizationResult {
  optimizedPrompt: string;
  suggestions: OptimizationSuggestion[];
  qualityScore: number;
  performanceMetrics: {
    clarity: number;
    specificity: number;
    completeness: number;
    efficiency: number;
  };
  improvements: string[];
  warnings: string[];
}

interface PromptOptimizerProps {
  originalPrompt: string;
  category: string;
  variables: string[];
  onOptimizedPrompt: (prompt: string) => void;
}

export default function PromptOptimizer({ 
  originalPrompt, 
  category, 
  variables, 
  onOptimizedPrompt 
}: PromptOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      setIsOptimizing(true);
      setProgress(0);

      // Simulate progressive optimization steps
      const steps = [
        'Analyzing prompt structure...',
        'Evaluating clarity and specificity...',
        'Checking variable usage...',
        'Applying educational best practices...',
        'Optimizing for AI performance...',
        'Generating improvement suggestions...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setProgress((i + 1) / steps.length * 100);
      }

      // Mock optimization result - in real implementation, this would call the AI service
      const result: OptimizationResult = {
        optimizedPrompt: generateOptimizedPrompt(originalPrompt, category, variables),
        suggestions: generateSuggestions(originalPrompt, category),
        qualityScore: 87,
        performanceMetrics: {
          clarity: 92,
          specificity: 85,
          completeness: 88,
          efficiency: 84
        },
        improvements: [
          'Enhanced clarity with explicit instructions',
          'Added structured output format requirements',
          'Improved variable usage documentation',
          'Incorporated educational assessment best practices',
          'Optimized for AI model comprehension'
        ],
        warnings: [
          'Consider adding more specific examples for complex variables',
          'Prompt length may impact response time (within acceptable limits)'
        ]
      };

      return result;
    },
    onSuccess: (result) => {
      setOptimizationResult(result);
      setIsOptimizing(false);
      setProgress(100);
      toast({
        title: "Prompt Optimized",
        description: `Quality score improved to ${result.qualityScore}%. Review suggestions and apply optimizations.`,
      });
    },
    onError: (error) => {
      setIsOptimizing(false);
      setProgress(0);
      toast({
        title: "Optimization Failed",
        description: "Unable to optimize prompt. Please try again.",
        variant: "destructive",
      });
    }
  });

  const generateOptimizedPrompt = (original: string, category: string, variables: string[]): string => {
    // This is a mock optimization - in real implementation, this would use AI
    let optimized = original;

    // Add structure if missing
    if (!optimized.includes('**') && !optimized.includes('###')) {
      optimized = `**SYSTEM ROLE:**
You are an expert educational assessment specialist with PhD-level expertise in ${category.replace('_', ' ')}.

**TASK OVERVIEW:**
${optimized}

**INPUT VARIABLES:**
${variables.map(v => `- {${v}}: [Variable description]`).join('\n')}

**OUTPUT REQUIREMENTS:**
- Provide clear, structured responses
- Follow educational best practices
- Ensure consistency and accuracy
- Include reasoning for decisions

**QUALITY STANDARDS:**
- Research-based methodology
- Bias-free content
- Appropriate difficulty calibration
- Clear documentation of process`;
    }

    // Add variable documentation if missing
    variables.forEach(variable => {
      if (optimized.includes(`{${variable}}`) && !optimized.includes(`${variable}:`)) {
        optimized += `\n\n**VARIABLE: ${variable}**\n- Purpose: [Describe how this variable is used]\n- Format: [Expected format/type]\n- Examples: [Provide examples]`;
      }
    });

    return optimized;
  };

  const generateSuggestions = (original: string, category: string): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for clarity improvements
    if (!original.includes('**') && !original.includes('###')) {
      suggestions.push({
        type: 'structure',
        priority: 'high',
        title: 'Add Clear Structure',
        description: 'Use headers and sections to organize the prompt for better AI comprehension',
        before: 'Plain text prompt without structure',
        after: 'Structured prompt with clear sections using **headers**',
        impact: 'Improves AI response consistency by 25-30%'
      });
    }

    // Check for specificity
    if (original.length < 200) {
      suggestions.push({
        type: 'specificity',
        priority: 'medium',
        title: 'Increase Specificity',
        description: 'Add more detailed instructions and examples for better results',
        before: 'General instructions',
        after: 'Specific, detailed instructions with examples',
        impact: 'Reduces ambiguity and improves output quality'
      });
    }

    // Check for variable documentation
    suggestions.push({
      type: 'variables',
      priority: 'medium',
      title: 'Document Variables',
      description: 'Add clear documentation for each variable used in the prompt',
      before: '{variable} used without explanation',
      after: '{variable}: Clear description of purpose and format',
      impact: 'Improves variable substitution accuracy'
    });

    // Check for examples
    if (!original.includes('example') && !original.includes('Example')) {
      suggestions.push({
        type: 'examples',
        priority: 'low',
        title: 'Add Examples',
        description: 'Include concrete examples to illustrate expected outputs',
        before: 'Instructions without examples',
        after: 'Instructions with specific examples',
        impact: 'Helps AI understand exact requirements'
      });
    }

    return suggestions;
  };

  const handleApplyOptimization = () => {
    if (optimizationResult) {
      onOptimizedPrompt(optimizationResult.optimizedPrompt);
      toast({
        title: "Optimization Applied",
        description: "The optimized prompt has been applied to your template.",
      });
    }
  };

  const handleCopyOptimized = () => {
    if (optimizationResult) {
      navigator.clipboard.writeText(optimizationResult.optimizedPrompt);
      toast({
        title: "Copied to Clipboard",
        description: "Optimized prompt copied to clipboard.",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'clarity': return CheckCircle;
      case 'specificity': return Target;
      case 'structure': return BookOpen;
      case 'variables': return Zap;
      case 'examples': return Lightbulb;
      case 'bias': return Users;
      case 'performance': return TrendingUp;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Optimization Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Prompt Optimizer
          </CardTitle>
          <CardDescription>
            Enhance your prompt with AI-powered optimization suggestions and best practices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => optimizeMutation.mutate()}
              disabled={isOptimizing || !originalPrompt.trim()}
              className="flex items-center gap-2"
            >
              {isOptimizing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isOptimizing ? 'Optimizing...' : 'Optimize Prompt'}
            </Button>
            
            {optimizationResult && (
              <>
                <Button
                  variant="outline"
                  onClick={handleApplyOptimization}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Apply Optimization
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyOptimized}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Optimized
                </Button>
              </>
            )}
          </div>

          {isOptimizing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                Analyzing and optimizing prompt...
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {!originalPrompt.trim() && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please enter a prompt to optimize.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Optimization Results */}
      {optimizationResult && (
        <>
          {/* Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quality Metrics
                <Badge variant="default" className="ml-2">
                  Score: {optimizationResult.qualityScore}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(optimizationResult.performanceMetrics).map(([metric, score]) => (
                  <div key={metric} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{score}%</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {metric.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Improvements and Warnings */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Improvements Made
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {optimizationResult.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="h-5 w-5" />
                  Considerations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {optimizationResult.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{warning}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Optimization Suggestions
              </CardTitle>
              <CardDescription>
                Detailed suggestions for further improving your prompt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationResult.suggestions.map((suggestion, index) => {
                  const IconComponent = getTypeIcon(suggestion.type);
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <IconComponent className="h-5 w-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{suggestion.title}</h4>
                            <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
                              {suggestion.priority} priority
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm font-medium text-red-700 mb-1">Before:</div>
                              <div className="text-sm bg-red-50 p-2 rounded border">
                                {suggestion.before}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-green-700 mb-1">After:</div>
                              <div className="text-sm bg-green-50 p-2 rounded border">
                                {suggestion.after}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Impact: {suggestion.impact}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Optimized Prompt Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Optimized Prompt
              </CardTitle>
              <CardDescription>
                Preview of the optimized prompt with improvements applied.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={optimizationResult.optimizedPrompt}
                readOnly
                className="min-h-[300px] font-mono bg-gray-50"
              />
              <div className="mt-4 flex gap-2">
                <Button onClick={handleApplyOptimization} className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Apply This Optimization
                </Button>
                <Button variant="outline" onClick={handleCopyOptimized}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}