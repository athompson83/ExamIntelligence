import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Users, Clock, BookOpen, Target, TrendingUp, AlertCircle } from 'lucide-react';

interface QuizBuilderDemoProps {
  // Demo props
}

const QuizBuilderDemo: React.FC<QuizBuilderDemoProps> = () => {
  const [completedFeatures, setCompletedFeatures] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const features = [
    {
      id: 'drag-drop',
      title: 'Drag & Drop Question Management',
      description: 'Seamlessly move questions between groups and reorder them',
      status: 'completed',
      icon: <Target className="w-5 h-5" />
    },
    {
      id: 'group-builder',
      title: 'Question Group Builder',
      description: 'Create and manage question groups with pick counts',
      status: 'completed',
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'autosave',
      title: 'Real-time Autosave',
      description: 'Automatic quiz saving with progress indicators',
      status: 'completed',
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      id: 'progress-tracking',
      title: 'Test-taker Progress Persistence',
      description: 'Save and restore student progress across sessions',
      status: 'completed',
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      id: 'grading-system',
      title: 'Advanced Grading System',
      description: 'Passing grades and multiple display formats',
      status: 'completed',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'time-management',
      title: 'Time Management',
      description: 'Quiz scheduling and time limits',
      status: 'completed',
      icon: <Clock className="w-5 h-5" />
    }
  ];

  const demoSteps = [
    "Basic Quiz Creation",
    "Question Management",
    "Group Organization", 
    "Drag & Drop Testing",
    "Autosave Testing",
    "Progress Persistence",
    "Grading Configuration",
    "Final Testing"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % demoSteps.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const handleFeatureTest = (featureId: string) => {
    if (!completedFeatures.includes(featureId)) {
      setCompletedFeatures([...completedFeatures, featureId]);
    }
  };

  const completionPercentage = (completedFeatures.length / features.length) * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Quiz Builder Demo</CardTitle>
          <CardDescription>
            Comprehensive demonstration of all quiz building features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Feature Completion</h3>
                <Badge variant="secondary">{completedFeatures.length}/{features.length} Complete</Badge>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            <Separator />

            {/* Current Demo Step */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Current Demo Step:</span>
                <Badge variant="outline">{demoSteps[currentStep]}</Badge>
              </div>
            </div>

            {/* Feature List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature) => (
                <Card key={feature.id} className="border-2 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {feature.icon}
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                      {completedFeatures.includes(feature.id) ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {feature.description}
                    </p>
                    <Button 
                      onClick={() => handleFeatureTest(feature.id)}
                      variant={completedFeatures.includes(feature.id) ? "secondary" : "default"}
                      size="sm"
                      className="w-full"
                    >
                      {completedFeatures.includes(feature.id) ? "Tested ✓" : "Test Feature"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Demo Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Live Demo Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <h4 className="font-medium">Enhanced Quiz Builder</h4>
                      <p className="text-sm text-gray-600 mt-1">Full quiz creation interface</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <h4 className="font-medium">Quiz Taker Demo</h4>
                      <p className="text-sm text-gray-600 mt-1">Test progress persistence</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <h4 className="font-medium">Item Banks</h4>
                      <p className="text-sm text-gray-600 mt-1">Question management</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Technical Implementation</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Database schema updated with passingGrade and gradeToShow columns</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Fixed autosave functionality with proper state management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Resolved TypeScript integration issues</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Implemented drag-and-drop between questions and groups</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Added comprehensive test-taker progress saving system</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizBuilderDemo;